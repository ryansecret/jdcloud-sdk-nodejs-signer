import {VERSION} from "./const";
import Util from "../Util";
import debugLog from 'debug'

const debug=debugLog('signer')

export interface CredentialInfo {
  secretAccessKey:string
  accessKeyId:string
}
const IDENTIFIER = 'jdcloud3_request'
const maxCacheEntries = 50

const cachedSecret:{[key:string]:string|Buffer} = {}
const cacheQueue:string[] = []

export default class Credentials {
   credentialInfo:CredentialInfo
   private region:string
   private service:string
   private shouldCache:boolean
   constructor(credentialInfo:CredentialInfo,region:string,service:string,shouldCache:boolean) {
     this.credentialInfo=credentialInfo
     this.region=region
     this.service=service
     this.shouldCache=shouldCache
   }

  createScope(date:string)
  {
    return [date.substr(0, 8), this.region,this.service, IDENTIFIER].join('/')
  }

  getSigningKey(date:string)
  {
    let {secretAccessKey,accessKeyId}=this.credentialInfo
    let credsIdentifier = Util.hmac(
      secretAccessKey,
      accessKeyId,
      'base64'
    )
    var cacheKey = [credsIdentifier, date, this.region, this.service].join('_')

    if (this.shouldCache && cacheKey in cachedSecret) {
      return cachedSecret[cacheKey]
    }
    let digest='buffer'

    let kDate = Util.hmac(
      VERSION + secretAccessKey,
       date,digest
    )
    var kRegion = Util.hmac(kDate, this.region,digest)
    var kService = Util.hmac(kRegion, this.service,digest)
    var signingKey = Util.hmac(kService, IDENTIFIER,digest)
    if (this.shouldCache) {
      cachedSecret[cacheKey] = signingKey
      cacheQueue.push(cacheKey)
      if (cacheQueue.length > maxCacheEntries) {
        delete cachedSecret[cacheQueue.shift()!]
      }
    }
    debug('date',date)
    debug('key', VERSION + secretAccessKey)
    debug('kDate',kDate.toString())
    debug('kRegion',kRegion.toString('hex'))
    debug('kService',kService.toString('hex'))
    debug('kSigning',signingKey.toString('hex'))
    return signingKey
  }
}
