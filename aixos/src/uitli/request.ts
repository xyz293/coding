import axios from 'axios';
const Cache = new Map();
const ab =new Map();
const request  =axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 5000,
})
request.interceptors.request.use((config) => {
    if(!config.url || !config.method){
        return config;
    }
    const key = config.url+config.method
    const abs =new AbortController();
    config.signal = abs.signal;
    if(ab.has(key)){
        ab.get(key).abort();
        ab.delete(key);
    }
    ab.set(key,abs);
    return config;
}, (error) => {
    return Promise.reject(error);
})
request.interceptors.response.use((response) => {
    if(!response.config.url || !response.config.method){
        return response;
    }
    const key = response.config.url+response.config.method;
       if(response.config.method==='get'){
        const data ={
            ...response,
            timestamp: Date.now()+(1*60*1000),
        }
       Cache.set(response.config.url+response.config.method,data);
       }
       ab.delete(key);
    return response;
}, (error) => {
    return Promise.reject(error);
})
const isCash = (url:string,method:string)=>{
    if(Cache.has(url+method)){
       const timer = Cache.get(url+method).timestamp;
       if(timer>Date.now()){
       return Cache.get(url+method);
       }
       else {
        Cache.delete(url+method);
        return false;
       }
    }
   else {
     return false;
   }

}
export default {
   isCash,
   request,
}