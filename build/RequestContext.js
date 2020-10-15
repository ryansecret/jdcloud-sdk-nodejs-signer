"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContext = void 0;
const uuid_1 = __importDefault(require("uuid"));
const Util_1 = __importDefault(require("./Util"));
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
        this.headers.set(NOUNCEHEADER, uuid_1.default.v4());
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
        return Util_1.default.queryParamsToString(queryParamsWithoutEmptyItem);
    }
}
exports.RequestContext = RequestContext;
//# sourceMappingURL=RequestContext.js.map