"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLACKLIST = exports.HEADERHOST = exports.HEADERNOUNCE = exports.HEADERDATE = exports.VERSION = void 0;
const VERSION = 'JDCLOUD3';
exports.VERSION = VERSION;
const HEADERDATE = 'x-jdcloud-date';
exports.HEADERDATE = HEADERDATE;
const HEADERNOUNCE = 'x-jdcloud-nonce';
exports.HEADERNOUNCE = HEADERNOUNCE;
const HEADERHOST = 'host';
exports.HEADERHOST = HEADERHOST;
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
exports.BLACKLIST = BLACKLIST;
//# sourceMappingURL=const.js.map