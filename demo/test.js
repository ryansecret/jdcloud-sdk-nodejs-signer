

 const {Context,RequestContext,Signer}=require('../build')
//


let ctx=new RequestContext('192.168.180.18','/v1/regions/cn-north-1/buckets','GET',new Map(),'oss')
ctx.regionId='cn-north-1'
ctx.query=ctx.buildQuery({a:1})
ctx.headers.set('content-type','application/json')
ctx.buildNonce()

