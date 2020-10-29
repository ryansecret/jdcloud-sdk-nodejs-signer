'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var UrlParse = require('url');
var uuid = require('uuid');
var crypto = require('crypto');
var buffer = require('buffer');
var debugLog = require('debug');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var UrlParse__default = /*#__PURE__*/_interopDefaultLegacy(UrlParse);
var uuid__default = /*#__PURE__*/_interopDefaultLegacy(uuid);
var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
var debugLog__default = /*#__PURE__*/_interopDefaultLegacy(debugLog);

class Util {
    static queryParamsToString(params) {
        let escape = Util.uriEscape;
        let escapKeyValues = {};
        let unescape = (item) => {
            item = global.unescape(item);
            return item;
        };
        for (let key in params) {
            let value = params[key];
            if (Array.isArray(value)) {
                value = value.map(d => {
                    return unescape(d);
                });
            }
            else
                value = unescape(value);
            key = unescape(key);
            let escapeKey = escape(key);
            let escapeWithArray = (value) => {
                if (Array.isArray(value)) {
                    return value.map(d => escape(d));
                }
                return escape(value);
            };
            escapKeyValues[escapeKey] = escapeWithArray(value);
        }
        var sortedKeys = Object.keys(escapKeyValues).sort();
        let items = sortedKeys.map(name => {
            let value = escapKeyValues[name];
            let ename = name;
            let result = ename + '=';
            if (Array.isArray(value)) {
                result = ename + '=' + value.sort().join('&' + ename + '=');
            }
            else if (value !== undefined && value !== null) {
                result = ename + '=' + value;
            }
            return result;
        });
        return items.join('&');
    }
    static uriEscape(str) {
        var output = encodeURIComponent(str);
        output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);
        // AWS percent-encodes some extra non-standard characters in a URI
        output = output.replace(/[*]/g, function (ch) {
            return ('%' +
                ch
                    .charCodeAt(0)
                    .toString(16)
                    .toUpperCase());
        });
        return output;
    }
    static uriEscapePath(path) {
        return path.split("/").map(part => Util.uriEscape(part)).join("/");
    }
    static hmac(key, string, digest, fn) {
        if (digest === 'buffer') {
            digest = undefined;
        }
        if (!fn)
            fn = 'sha256';
        if (typeof string === 'string')
            string = buffer.Buffer.from(string);
        return crypto__default['default']
            .createHmac(fn, key)
            .update(string)
            .digest(digest);
    }
    static sha256(data, digest = 'hex') {
        return crypto__default['default'].createHash('sha256').update(data).digest(digest);
    }
    static iso8601(date) {
        if (!date)
            date = new Date();
        return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
}

const NOUNCEHEADER = 'x-jdcloud-nonce';
class RequestContext {
    constructor(host, path, method, headers, serviceName = '', regionId = '') {
        this.query = '';
        if (!host)
            throw new Error("host is required");
        if (!path)
            throw new Error("path is required");
        if (!method)
            throw new Error("method is required");
        if (!path.startsWith('/'))
            path = '/' + path;
        this.host = host;
        this.headers = headers;
        this.method = method.toUpperCase();
        this.path = path;
        this.serviceName = serviceName;
        this.regionId = regionId;
    }
    get pathName() {
        let path = this.path.replace(/\+/g, " ");
        path = unescape(path);
        return path.replace(/(\/{2,})/g, '/');
    }
    buildNonce() {
        this.headers.set(NOUNCEHEADER, uuid__default['default'].v4());
    }
    setNonce(nonce) {
        this.headers.set(NOUNCEHEADER, nonce);
    }
    check() {
        if (![...this.headers.keys()].find(d => d.toLowerCase() === NOUNCEHEADER))
            throw new Error("header['x-jdcloud-nonce'] is required");
        if (!this.regionId)
            throw new Error("regionId is required");
    }
    buildQuery(queryParams) {
        var queryParamsWithoutEmptyItem = {};
        var keys = Object.keys(queryParams);
        for (let key of keys) {
            if (key !== undefined && key !== '') {
                queryParamsWithoutEmptyItem[key] = queryParams[key];
            }
        }
        return Util.queryParamsToString(queryParamsWithoutEmptyItem);
    }
}

class Context extends RequestContext {
    constructor(url, method, headers, body, serviceName = '', regionId = '') {
        let urlResult = UrlParse__default['default'].parse(url, true);
        super(urlResult.host, urlResult.pathname, method, headers, serviceName, regionId);
        this.body = body;
        this.query = super.buildQuery(urlResult.query);
    }
}

const VERSION = 'JDCLOUD3';
const HEADERDATE = 'x-jdcloud-date';
const HEADERNOUNCE = 'x-jdcloud-nonce';
const HEADERHOST = 'host';
const BLACKLIST = [
    'cache-control',
    'content-type',
    'content-length',
    'host',
    'expect',
    'max-forwards',
    'pragma',
    'range',
    'te',
    'if-match',
    'if-none-match',
    'if-modified-since',
    'if-unmodified-since',
    'if-range',
    'accept',
    'authorization',
    'proxy-authorization',
    'from',
    'referer',
    'user-agent',
    'x-jdcloud-request-id'
];

const debug = debugLog__default['default']('signer');
const IDENTIFIER = 'jdcloud3_request';
const maxCacheEntries = 50;
const cachedSecret = {};
const cacheQueue = [];
class Credentials {
    constructor(credentialInfo, region, service, shouldCache) {
        this.credentialInfo = credentialInfo;
        this.region = region;
        this.service = service;
        this.shouldCache = shouldCache;
    }
    createScope(date) {
        return [date.substr(0, 8), this.region, this.service, IDENTIFIER].join('/');
    }
    getSigningKey(date) {
        let { secretAccessKey, accessKeyId } = this.credentialInfo;
        let credsIdentifier = Util.hmac(secretAccessKey, accessKeyId, 'base64');
        var cacheKey = [credsIdentifier, date, this.region, this.service].join('_');
        if (this.shouldCache && cacheKey in cachedSecret) {
            return cachedSecret[cacheKey];
        }
        let digest = 'buffer';
        let kDate = Util.hmac(VERSION + secretAccessKey, date, digest);
        var kRegion = Util.hmac(kDate, this.region, digest);
        var kService = Util.hmac(kRegion, this.service, digest);
        var signingKey = Util.hmac(kService, IDENTIFIER, digest);
        if (this.shouldCache) {
            cachedSecret[cacheKey] = signingKey;
            cacheQueue.push(cacheKey);
            if (cacheQueue.length > maxCacheEntries) {
                delete cachedSecret[cacheQueue.shift()];
            }
        }
        debug('date', date);
        debug('key', VERSION + secretAccessKey);
        debug('kDate', kDate.toString());
        debug('kRegion', kRegion.toString('hex'));
        debug('kService', kService.toString('hex'));
        debug('kSigning', signingKey.toString('hex'));
        return signingKey;
    }
}

const debug$1 = debugLog__default['default']('signer');
class Signer {
    constructor(ctx, credentialsInfo, logger = console.log) {
        this.algorithm = `${VERSION}-HMAC-SHA256`;
        this.signableHeaders = [];
        this.ctx = ctx;
        this.credentials = this.getCredentials(ctx, credentialsInfo);
        this.logger = logger;
        this.headers = ctx.headers;
        this.setSignableHeaders();
    }
    getCredentials(ctx, credentialInfo) {
        let { regionId, serviceName, } = ctx;
        return new Credentials(credentialInfo, regionId, serviceName, false);
    }
    setSignableHeaders() {
        let headers = [HEADERNOUNCE];
        let securityToken = 'x-jdcloud-security-token';
        let sessionToken = 'x-jdcloud-session-token';
        if (this.headers.has(securityToken))
            headers.push(securityToken);
        if (this.headers.has(sessionToken))
            headers.push(sessionToken);
        for (let header of this.headers.keys()) {
            header = header.toLowerCase();
            if (!BLACKLIST.find(d => d === header)) {
                headers.push(header);
            }
        }
        this.signableHeaders = [...new Set(headers)];
    }
    sign(date) {
        this.ctx.check();
        var datetime = Util.iso8601(date).replace(/[:-]|\.\d{3}/g, '');
        this.addHeaders(datetime);
        return this.authorization(datetime);
    }
    addAuthorization(date) {
        this.ctx.check();
        var datetime = Util.iso8601(date).replace(/[:-]|\.\d{3}/g, '');
        this.addHeaders(datetime);
        if (!this.headers.has('x-jdcloud-oauth2-token')) {
            this.headers.set('Authorization', this.authorization(datetime));
        }
    }
    authorization(datetime) {
        var parts = [];
        var credString = this.credentials.createScope(datetime);
        parts.push(this.algorithm +
            ' Credential=' +
            this.credentials.credentialInfo.accessKeyId +
            '/' +
            credString);
        parts.push('SignedHeaders=' + this.signedHeaders());
        parts.push('Signature=' + this.signature(datetime));
        this.log('Signature', parts);
        return parts.join(', ');
    }
    signature(datetime) {
        var signingKey = this.credentials.getSigningKey(datetime.substr(0, 8));
        let signResult = Util.hmac(signingKey, this.stringToSign(datetime), 'hex');
        debug$1('signResult', signResult);
        return signResult;
    }
    credentialString(datetime) {
        return this.credentials.createScope(datetime.substring(0, 8));
    }
    canonicalString() {
        var parts = [];
        let pathname = Util.uriEscapePath(this.ctx.pathName);
        parts.push(this.ctx.method);
        parts.push(pathname);
        parts.push(this.ctx.query || '');
        parts.push(this.canonicalHeaders() + '\n');
        parts.push(this.signedHeaders());
        parts.push(this.headers.get('x-jdcloud-content-sha256') || Util.sha256(this.ctx.body || ''));
        this.log('canonicalString--step1', parts);
        return parts.join('\n');
    }
    canonicalHeaders() {
        let headers = [];
        for (let key of this.headers.keys()) {
            headers.push([key, this.headers.get(key)]);
        }
        headers.sort(function (a, b) {
            return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1;
        });
        let parts = [];
        for (let item of headers) {
            let key = item[0].toLowerCase();
            if (this.isSignableHeader(key)) {
                let value = item[1];
                if (typeof value === 'undefined' ||
                    value === null ||
                    typeof value.toString !== 'function') {
                    let error = new Error('Header ' + key + ' contains invalid value');
                    throw error;
                }
                parts.push(`${key}:${this.canonicalHeaderValues(value)}`);
            }
        }
        return parts.join("\n");
    }
    log(title, parts) {
        this.logger(`-----------${title}------------`);
        for (let item of parts) {
            this.logger(item);
        }
        this.logger('--------------------------------');
    }
    canonicalHeaderValues(values) {
        let trim = (val) => val.replace(/^\s+|\s+$/g, '');
        if (Array.isArray(values)) {
            return values.map(d => trim(d)).toString();
        }
        return values.replace(/^\s+|\s+$/g, '');
    }
    stringToSign(datetime) {
        var parts = [];
        parts.push(this.algorithm);
        parts.push(datetime);
        parts.push(this.credentialString(datetime));
        parts.push(Util.sha256(this.canonicalString()));
        this.log('StringToSign--step2', parts);
        return parts.join('\n');
    }
    signedHeaders() {
        let keys = new Set();
        for (let key of this.headers.keys()) {
            key = key.toLowerCase();
            if (this.isSignableHeader(key)) {
                keys.add(key);
            }
        }
        return [...keys].sort().join(';');
    }
    isSignableHeader(key) {
        return this.signableHeaders.includes(key.toLowerCase());
    }
    addHeaders(datetime) {
        if (!this.headers.has(HEADERDATE)) {
            this.headers.set(HEADERDATE, datetime);
        }
        if (!this.headers.has(HEADERHOST)) {
            this.headers.set(HEADERHOST, this.ctx.host);
        }
    }
}

exports.Context = Context;
exports.RequestContext = RequestContext;
exports.Signer = Signer;
//# sourceMappingURL=index.js.map
