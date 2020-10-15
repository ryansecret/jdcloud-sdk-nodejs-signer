"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Credentials_1 = __importDefault(require("./Credentials"));
const const_1 = require("./const");
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('signer');
const Util_1 = __importDefault(require("../Util"));
class Signer {
    constructor(ctx, credentialsInfo, logger = console.log) {
        this.algorithm = `${const_1.VERSION}-HMAC-SHA256`;
        this.signableHeaders = [];
        this.ctx = ctx;
        this.credentials = this.getCredentials(ctx, credentialsInfo);
        this.logger = logger;
        this.headers = ctx.headers;
        this.setSignableHeaders();
    }
    getCredentials(ctx, credentialInfo) {
        let { regionId, serviceName, } = ctx;
        return new Credentials_1.default(credentialInfo, regionId, serviceName, false);
    }
    setSignableHeaders() {
        let headers = [const_1.HEADERNOUNCE];
        let securityToken = 'x-jdcloud-security-token';
        let sessionToken = 'x-jdcloud-session-token';
        if (this.headers.has(securityToken))
            headers.push(securityToken);
        if (this.headers.has(sessionToken))
            headers.push(sessionToken);
        for (let header of this.headers.keys()) {
            header = header.toLowerCase();
            if (!const_1.BLACKLIST.find(d => d === header)) {
                headers.push(header);
            }
        }
        this.signableHeaders = [...new Set(headers)];
    }
    sign(date) {
        this.ctx.check();
        var datetime = Util_1.default.iso8601(date).replace(/[:-]|\.\d{3}/g, '');
        this.addHeaders(datetime);
        return this.authorization(datetime);
    }
    addAuthorization(date) {
        this.ctx.check();
        var datetime = Util_1.default.iso8601(date).replace(/[:-]|\.\d{3}/g, '');
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
        let signResult = Util_1.default.hmac(signingKey, this.stringToSign(datetime), 'hex');
        debug('signResult', signResult);
        return signResult;
    }
    credentialString(datetime) {
        return this.credentials.createScope(datetime.substring(0, 8));
    }
    canonicalString() {
        var parts = [];
        let pathname = Util_1.default.uriEscapePath(this.ctx.pathName);
        parts.push(this.ctx.method);
        parts.push(pathname);
        parts.push(this.ctx.query || '');
        parts.push(this.canonicalHeaders() + '\n');
        parts.push(this.signedHeaders());
        parts.push(this.headers.get('x-jdcloud-content-sha256') || Util_1.default.sha256(this.ctx.body || ''));
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
        parts.push(Util_1.default.sha256(this.canonicalString()));
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
        if (!this.headers.has(const_1.HEADERDATE)) {
            this.headers.set(const_1.HEADERDATE, datetime);
        }
        if (!this.headers.has(const_1.HEADERHOST)) {
            this.headers.set(const_1.HEADERHOST, this.ctx.host);
        }
    }
}
exports.default = Signer;
//# sourceMappingURL=index.js.map