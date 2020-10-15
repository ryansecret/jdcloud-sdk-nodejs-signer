import uuid from 'uuid'
import Util ,{KeyValue} from "./Util";


  const NOUNCEHEADER='x-jdcloud-nonce'

  export type Header=Map<string,string>

  export  class RequestContext {
    host:string
    headers:Header
    method:string
    path:string
    serviceName:string
    regionId:string
    query:string=''
    constructor(host:string,path:string,method:string,headers:Header,serviceName:string='',regionId:string='') {
      if(!host)
        throw new Error("host is required")
      if(!path)
        throw new Error("path is required")
      if(!method)
        throw new Error("method is required")

      if(!path.startsWith('/'))
        path='/'+path
      this.host=host
      this.headers=headers
      this.method=method.toUpperCase()
      this.path=path
      this.serviceName=serviceName
      this.regionId=regionId
    }

    get pathName():string
    {
      let path=this.path.replace(/\+/g," ")
      path=unescape(path)
      return path.replace(/(\/{2,})/g,'/')
    }

    buildNonce():void
    {
      this.headers.set(NOUNCEHEADER,uuid.v4())
    }

    setNonce(nonce:string)
    {
      this.headers.set(NOUNCEHEADER,nonce)
    }

    check()
    {
      if(![...this.headers.keys()].find(d=>d.toLowerCase()===NOUNCEHEADER))
        throw new Error("header['x-jdcloud-nonce'] is required")
      if(!this.regionId)
        throw new Error("regionId is required")
    }

    buildQuery (queryParams:KeyValue):string {
      var queryParamsWithoutEmptyItem:KeyValue = {}
      var keys = Object.keys(queryParams)
      for (let key of keys) {
        if (key !== undefined&&key!=='') {
          queryParamsWithoutEmptyItem[key] = queryParams[key]
        }
      }
      return Util.queryParamsToString(queryParamsWithoutEmptyItem)
    }
  }



