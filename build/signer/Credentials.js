"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const const_1 = require("./const");
const Util_1 = __importDefault(require("../Util"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('signer');
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
        let credsIdentifier = Util_1.default.hmac(secretAccessKey, accessKeyId, 'base64');
        var cacheKey = [credsIdentifier, date, this.region, this.service].join('_');
        if (this.shouldCache && cacheKey in cachedSecret) {
            return cachedSecret[cacheKey];
        }
        let digest = 'buffer';
        let kDate = Util_1.default.hmac(const_1.VERSION + secretAccessKey, date, digest);
        var kRegion = Util_1.default.hmac(kDate, this.region, digest);
        var kService = Util_1.default.hmac(kRegion, this.service, digest);
        var signingKey = Util_1.default.hmac(kService, IDENTIFIER, digest);
        if (this.shouldCache) {
            cachedSecret[cacheKey] = signingKey;
            cacheQueue.push(cacheKey);
            if (cacheQueue.length > maxCacheEntries) {
                delete cachedSecret[cacheQueue.shift()];
            }
        }
        debug('date', date);
        debug('key', const_1.VERSION + secretAccessKey);
        debug('kDate', kDate.toString());
        debug('kRegion', kRegion.toString('hex'));
        debug('kService', kService.toString('hex'));
        debug('kSigning', signingKey.toString('hex'));
        return signingKey;
    }
}
exports.default = Credentials;
//# sourceMappingURL=Credentials.js.map