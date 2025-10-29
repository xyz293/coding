class axios{
    constructor(config){
        this.default ={...config}
     this.interceptors={
        request:{
            handlers:[],
            use(fulfilled,rejected){
                this.handlers.push({fulfilled,rejected})
            }
        }
        ,
        response:{
            handlers:[],
            use(fulfilled,rejected){
                this.handlers.push({fulfilled,rejected})
            }
        }
     }
    }
    reuqest(config){
        const finalConfig={...this.default,...config}
        let promiseChain=Promise.resolve(finalConfig)
         if (config.method === 'get' && config.params) {
        // 将 params 转换为查询字符串
        const paramsString = this.formatParams(config.params);
        // 拼接查询字符串到 URL
        config.url = config.url + (config.url.includes('?') ? '&' : '?') + paramsString;
      }
        //进行遍历拦截器
        this.interceptors.request.handlers.forEach(({fulfilled,rejected})=>{
            promiseChain=promiseChain.then(fulfilled,rejected)
        })
        promsieChain =promiseChain.then((config)=>{
            return new Promise((resolve,reject)=>{
                const xhr =new XMLHttpRequest()
                xhr.open(config.method,config.url)
                xhr.setRequestHeader("Content-Type","application/json")
                xhr.onload(()=>{
                    try{
                        const response={
                        data:JSON.parse(xhr.responseText),
                        status:xhr.status,
                        statusText:xhr.statusText
                    }
                    resolve(response)
                    }
                    catch(err){
                        reject(err)
                    }
                })
            if(config.method=='get'){
                xhr.send()
            }
            else {
                xhr.send(JSON.stringify(config.data))
            }
            })
        })
        // 遍历响应拦截器
        this.interceptors.response.handlers.forEach(({ fulfilled, rejected }) => {
            promiseChain = promiseChain.then(fulfilled, rejected);
          });
    }
}
const myaxios =new axios({baseURL:'https://api.example.com',timeout:1000})
myaxios.interceptors.request.use((config)=>{
    const token =localStorage.getItem('token')
    if(token){
        config.headers.Authorization=`Bearer ${token}`
    }
    return config
},(err)=>{
    return Promise.reject(err)
})
myaxios.interceptors.response.use((response)=>{
    if(response.status>=200&&response.status<300){
        return response
    }
    return Promise.reject(new Error('请求失败'))
},(err)=>{
    if(err.response&&err.response.status===401){
        window.location.href='/login'
    }
    return Promise.reject(err)
})