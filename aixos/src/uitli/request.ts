import axios from 'axios';
const Cache = new Map();
const request  =axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 5000,
})
request.interceptors.request.use((config) => {
    return config;
}, (error) => {
    return Promise.reject(error);
})
request.interceptors.response.use((response) => {
        const data ={
            ...response,
            timestamp: Date.now()*1000*60,
        }
       Cache.set(response.config.url,data);
    return response;
}, (error) => {
    return Promise.reject(error);
})
const isCash = (url:string)=>{
    if(Cache.has(url)){
       const timer = Cache.get(url).timestamp;
       if(timer>Date.now()){
       return Cache.get(url);
       }
       else {
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