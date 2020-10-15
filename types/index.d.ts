declare module 'Util' {
	/// <reference types="node" />
	import { HexBase64Latin1Encoding } from 'crypto';
	export interface KeyValue {
	    [key: string]: any;
	}
	export default class Util {
	    static queryParamsToString(params: KeyValue): string;
	    static uriEscape(str: string): string;
	    static uriEscapePath(path: string): string;
	    static hmac(key: string | Buffer, string: string | Buffer, digest: any, fn?: string): Buffer | string;
	    static sha256(data: string, digest?: HexBase64Latin1Encoding): string;
	    static iso8601(date?: Date): string;
	}

}
declare module 'RequestContext' {
	import { KeyValue } from 'Util';
	export type Header = Map<string, string>;
	export class RequestContext {
	    host: string;
	    headers: Header;
	    method: string;
	    path: string;
	    serviceName: string;
	    regionId: string;
	    query: string;
	    constructor(host: string, path: string, method: string, headers: Header, serviceName?: string, regionId?: string);
	    get pathName(): string;
	    buildNonce(): void;
	    setNonce(nonce: string): void;
	    check(): void;
	    buildQuery(queryParams: KeyValue): string;
	}

}
declare module 'Context' {
	import { Header, RequestContext } from 'RequestContext';
	export class Context extends RequestContext {
	    body: string;
	    constructor(url: string, method: string, headers: Header, body: string, serviceName?: string, regionId?: string);
	}

}
declare module 'signer/const' {
	 const VERSION = "JDCLOUD3"; const HEADERDATE = "x-jdcloud-date"; const HEADERNOUNCE = "x-jdcloud-nonce"; const HEADERHOST = "host"; const BLACKLIST: string[];
	export { VERSION, HEADERDATE, HEADERNOUNCE, HEADERHOST, BLACKLIST };

}
declare module 'signer/Credentials' {
	/// <reference types="node" />
	export interface CredentialInfo {
	    secretAccessKey: string;
	    accessKeyId: string;
	}
	export default class Credentials {
	    credentialInfo: CredentialInfo;
	    private region;
	    private service;
	    private shouldCache;
	    constructor(credentialInfo: CredentialInfo, region: string, service: string, shouldCache: boolean);
	    createScope(date: string): string;
	    getSigningKey(date: string): string | Buffer;
	}

}
declare module 'signer/index' {
	import { CredentialInfo } from 'signer/Credentials';
	import { Context } from 'Context';
	export default class Signer {
	    private ctx;
	    private credentials;
	    private logger;
	    private algorithm;
	    private headers;
	    private signableHeaders;
	    constructor(ctx: Context, credentialsInfo: CredentialInfo, logger?: {
	        (...data: any[]): void;
	        (message?: any, ...optionalParams: any[]): void;
	    });
	    private getCredentials;
	    private setSignableHeaders;
	    sign(date: Date): string;
	    private addAuthorization;
	    private authorization;
	    private signature;
	    private credentialString;
	    private canonicalString;
	    private canonicalHeaders;
	    private log;
	    private canonicalHeaderValues;
	    private stringToSign;
	    private signedHeaders;
	    private isSignableHeader;
	    private addHeaders;
	}

}
declare module 'index' {
	export { Context } from 'Context';
	export { RequestContext } from 'RequestContext';
	export * as Signer from 'signer/index';

}
