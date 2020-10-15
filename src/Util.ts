
import crypto, {HexBase64Latin1Encoding} from 'crypto'
import {Buffer} from "buffer";
export interface KeyValue {
  [key:string]:any
}
export default class Util {
   static queryParamsToString(params:KeyValue):string
   {
     let escape = Util.uriEscape
     let escapKeyValues:KeyValue={}

     let unescape=(item:string)=>{
       item=global.unescape(item)
       return item
     }
     for(let key in params)
     {
       let value=params[key]
       if(Array.isArray(value))
       {
         value=value.map(d=>{
           return unescape(d)
         })
       }
       else
         value=unescape(value)
       key=unescape(key)

       let escapeKey=escape(key)
       let escapeWithArray=(value:string|string[])=>{
         if(Array.isArray(value))
         {
           return value.map(d=>escape(d))
         }
         return escape(value)
       }
       escapKeyValues[escapeKey]=escapeWithArray(value)
     }

     var sortedKeys = Object.keys(escapKeyValues).sort()

     let items:string[] =sortedKeys.map(name=>{
       let value = escapKeyValues[name]
       let  ename = name
       let  result = ename + '='
       if (Array.isArray(value)) {
         result = ename + '=' + value.sort().join('&' + ename + '=')
       } else if (value !== undefined && value !== null) {
         result = ename + '=' + value
       }
       return result
     })

     return items.join('&')
   }

   static uriEscape (str:string) {
     var output = encodeURIComponent(str)
     output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape)

     // AWS percent-encodes some extra non-standard characters in a URI
     output = output.replace(/[*]/g, function (ch) {
       return (
         '%' +
         ch
           .charCodeAt(0)
           .toString(16)
           .toUpperCase()
       )
     })

     return output
   }

   static  uriEscapePath (path:string) {
    return path.split("/").map(part=>Util.uriEscape(part)).join("/")
   }

   static hmac (key:string|Buffer, string:string|Buffer, digest:any, fn?:string):Buffer|string {

    if (digest === 'buffer') {
      digest = undefined
    }
    if (!fn) fn = 'sha256'
    if (typeof string === 'string') string =  Buffer.from(string)
    return  crypto
      .createHmac(fn, key)
      .update(string)
      .digest(digest)
  }

  static sha256(data:string,digest:HexBase64Latin1Encoding='hex')
  {
     return  crypto.createHash('sha256').update(data).digest(digest)
  }



  static  iso8601 (date?:Date) {
    if(!date)
      date=new Date()
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  }


}
