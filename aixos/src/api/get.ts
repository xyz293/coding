import axios from '../uitli/request';
export const getapi =()=>{
    if(axios.isCash("/api1")){
        return Promise.resolve(axios.isCash("/api1"));
    }
    else {
        return axios.request({
            url:'/api1',
            method:'get',
        });
    }
}
