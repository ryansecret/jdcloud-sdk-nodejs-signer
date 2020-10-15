
  import UrlParse from 'url'
  import {Header,RequestContext} from "./RequestContext";

  export  class Context extends RequestContext{
    body:string

    constructor(url:string,method:string,headers:Header,body:string,serviceName:string='',regionId:string='') {
      let urlResult=UrlParse.parse(url,true)
      super(urlResult.host!,urlResult.pathname!,method,headers,serviceName,regionId)
      this.body=body
      this.query=super.buildQuery(urlResult.query)
    }
  }



