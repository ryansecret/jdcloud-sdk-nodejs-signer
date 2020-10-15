"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const buffer_1 = require("buffer");
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
            string = buffer_1.Buffer.from(string);
        return crypto_1.default
            .createHmac(fn, key)
            .update(string)
            .digest(digest);
    }
    static sha256(data, digest = 'hex') {
        return crypto_1.default.createHash('sha256').update(data).digest(digest);
    }
    static iso8601(date) {
        if (!date)
            date = new Date();
        return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
}
exports.default = Util;
//# sourceMappingURL=Util.js.map