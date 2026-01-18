import axios from '../uitli/request';
export const getapi =()=>{
    if(axios.isCash("/api1","get")){
        return Promise.resolve(axios.isCash("/api1","get"));
    }
    else {
        return axios.request({
            url:'/api1',
            method:'get',
        });
    }
}
