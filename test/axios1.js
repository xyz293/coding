class axios{
    constructor(config){
      this.config ={...config}
      this.inter={
        request:{
            headler:[],
            use:(fulfilled,rejected)=>{
                this.inter.request.headler.push({fulfilled,rejected})
            }
        },
        response:{
             headler:[],
            use:(ful,reject)=>{
                this.inter.response.headler.push({ful,reject})
            }
        }
      }
    }
    request(config){
       finalconfig ={...this.config,...config}
       let promiseChain =Promise.resolve(finalconfig)
       this.inter.request.headler.forEach((item)=>{
        promiseChain =promiseChain.then(item.ful,item.reject)
       })
       promiseChain =promiseChain.then((finalconfig)=>{
           return new Promise((resolve,reject)=>{
             try{
                  const xhr =new XMLHttpRequest()
            xhr.open(finalconfig.method,finalconfig.url)
            xhr.ontimeout = () => {
    reject(new Error(`Timeout of ${finalconfig.timeout}ms exceeded`));
};
            xhr.onload(()=>{
                  try{
                        const response={
                        data:JSON.parse(xhr.responseText),
                        status:xhr.status,
                        statusText:xhr.statusText
                    }
                    if(response.status>=200&&response.status<300){
                        resolve(response)
                    }
                    else {
                        reject(response)
                    }
                    }
                    catch(err){
                        reject(err)
                    }
            })
            if(finalconfig.method==='get'){
                xhr.send()
            }
            else {
                xhr.send(JSON.stringify(finalconfig.data))
            }
             }
             catch(err){
                reject(err)
             }
           })
       })

        this.inter.response.headler.forEach((item)=>{
        promiseChain =promiseChain.then(item.ful,item.reject)
       })

       return promiseChain
    }
}
const myaxios   = new axios({
    baseurl:'',
    timeout:1000
})
myaixos.inter.request.use((config)=>{
    return config
},(err)=>{
    return Promise.reject(err)
})

myaixos.inter.response.use((res)=>{
    return res
},(err)=>{
    return Promise.reject(err)
})