

 const {Context,RequestContext,Signer}=require('../build')
//


let ctx=new RequestContext('192.168.180.18','/v1/regions/cn-north-1/buckets','GET',new Map(),'oss')

ctx.regionId='cn-north-1'
ctx.query=ctx.buildQuery({a:1})
ctx.headers.set('content-type','application/json')
ctx.buildNonce()

 let context=ctx
 let credentialsInfo={
   accessKeyId : '0449DD5411F3EAED92335DC5EDAFEAFF',
   secretAccessKey: '7989C15CB8705962B860A2BB5BA3FC40'}
 let signer=new Signer(context,credentialsInfo)

 let auth= signer.sign(new Date())
 ctx.headers.set('Authorization',auth)
 console.log("GET签名为：",auth)
