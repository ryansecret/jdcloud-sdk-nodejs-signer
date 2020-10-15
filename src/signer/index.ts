import Credentials,{CredentialInfo} from "./Credentials";
import {VERSION,HEADERDATE,HEADERNOUNCE,HEADERHOST,BLACKLIST} from "./const";
import debugLog from 'debug'
const debug=debugLog('signer')
import Util from "../Util";
import {Header} from "../RequestContext";
import {Context} from "../Context";

export default class Signer {
   private ctx:Context
   private credentials:Credentials
   private logger:(message?: any, ...optionalParams: any[])=>void

   private algorithm:string=`${VERSION}-HMAC-SHA256`
   private headers:Header
   private signableHeaders:string[]=[]

   constructor(ctx:Context,credentialsInfo:CredentialInfo,logger=console.log) {
      this.ctx=ctx
      this.credentials=this.getCredentials(ctx,credentialsInfo)
      this.logger=logger
      this.headers=ctx.headers
      this.setSignableHeaders()
   }

   private getCredentials(ctx:Context,credentialInfo:CredentialInfo)
   {
     let {regionId,serviceName,}=ctx
     return new Credentials(credentialInfo,regionId,serviceName,false)
   }
  private setSignableHeaders()
  {
    let headers=[HEADERNOUNCE]
    let securityToken='x-jdcloud-security-token'
    let sessionToken ='x-jdcloud-session-token'

    if(this.headers.has(securityToken))
      headers.push(securityToken)
    if(this.headers.has(sessionToken))
      headers.push(sessionToken)

    for(let header of  this.headers.keys())
    {
      header=header.toLowerCase()
      if(!BLACKLIST.find(d=>d===header))
      {
        headers.push(header)
      }
    }
    this.signableHeaders=[...new Set(headers)]
  }

  sign(date:Date)
  {
    this.ctx.check()
    var datetime = Util.iso8601(date).replace(/[:-]|\.\d{3}/g, '')

    this.addHeaders(datetime)

    return this.authorization(datetime)
  }

  private addAuthorization (date:Date) {

    this.ctx.check()
    var datetime = Util.iso8601(date).replace(/[:-]|\.\d{3}/g, '')
    this.addHeaders(datetime)

    if (!this.headers.has('x-jdcloud-oauth2-token')) {
      this.headers.set('Authorization',this.authorization(datetime))
    }
  }
  private authorization ( datetime:string) {
    var parts = []
    var credString = this.credentials.createScope(datetime)
    parts.push(
      this.algorithm +
      ' Credential=' +
      this.credentials.credentialInfo.accessKeyId +
      '/' +
      credString
    )
    parts.push('SignedHeaders=' + this.signedHeaders())
    parts.push('Signature=' + this.signature(datetime))
    this.log('Signature',parts)
    return parts.join(', ')
  }

  private  signature (datetime:string) {
    var signingKey = this.credentials.getSigningKey(datetime.substr(0, 8))
    let signResult= Util.hmac(signingKey, this.stringToSign(datetime), 'hex')
    debug('signResult',signResult)
    return signResult
  }

  private credentialString (datetime:string) {
     return this.credentials.createScope(datetime.substring(0,8))
  }

  private canonicalString () {
    var parts = []
    let pathname =Util.uriEscapePath(this.ctx.pathName)
    parts.push(this.ctx.method)
    parts.push(pathname)
    parts.push(this.ctx.query||'')
    parts.push(this.canonicalHeaders() + '\n')
    parts.push(this.signedHeaders())
    parts.push( this.headers.get('x-jdcloud-content-sha256') || Util.sha256(this.ctx.body || ''))
    this.log('canonicalString--step1',parts)
    return parts.join('\n')
  }

  private canonicalHeaders () {
    let headers = []

    for(let key of this.headers.keys())
    {
      headers.push([key,this.headers.get(key)])
    }

    headers.sort(function (a, b) {
      return a[0]!.toLowerCase() < b[0]!.toLowerCase() ? -1 : 1
    })

    let parts=[]
    for(let item of headers)
    {
      let key = item[0]!.toLowerCase()
      if (this.isSignableHeader(key)) {
        let value = item[1]
        if (
          typeof value === 'undefined' ||
          value === null ||
          typeof value.toString !== 'function'
        ) {
          let error=new Error('Header ' + key + ' contains invalid value')
          throw error
        }
        parts.push(`${key}:${this.canonicalHeaderValues(value)}`)
      }
    }

    return  parts.join("\n")

  }
  private log(title:string,parts:string[])
  {
    this.logger(`-----------${title}------------`)
    for(let item of parts)
    {
      this.logger(item)
    }
    this.logger('--------------------------------')
  }
  private canonicalHeaderValues (values:string|string[]) {
    let trim=(val:string)=>val.replace(/^\s+|\s+$/g, '')
    if(Array.isArray(values))
    {
      return  values.map(d=>trim(d)).toString()
    }
    return values.replace(/^\s+|\s+$/g, '')
  }

  private stringToSign (datetime:string) {
    var parts = []
    parts.push(this.algorithm)
    parts.push(datetime)
    parts.push(this.credentialString(datetime))
    parts.push(Util.sha256(this.canonicalString()))

    this.log('StringToSign--step2',parts)

    return parts.join('\n')
  }

  private  signedHeaders () {
    let keys = new Set()
    for(let key of this.headers.keys())
    {
      key = key.toLowerCase()
      if (this.isSignableHeader(key)) {
        keys.add(key)
      }
    }
    return [...keys].sort().join(';')
  }

  private isSignableHeader (key:string) {
    return this.signableHeaders.includes(key.toLowerCase())
  }

  private addHeaders (datetime:string) {
    if(!this.headers.has(HEADERDATE))
    {
      this.headers.set(HEADERDATE,datetime)
    }
    if(!this.headers.has(HEADERHOST))
    {
      this.headers.set(HEADERHOST,this.ctx.host)
    }
  }

}
