"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const url_1 = __importDefault(require("url"));
const RequestContext_1 = require("./RequestContext");
class Context extends RequestContext_1.RequestContext {
    constructor(url, method, headers, body, serviceName = '', regionId = '') {
        let urlResult = url_1.default.parse(url, true);
        super(urlResult.host, urlResult.pathname, method, headers, serviceName, regionId);
        this.body = body;
        this.query = super.buildQuery(urlResult.query);
    }
}
exports.Context = Context;
//# sourceMappingURL=Context.js.map