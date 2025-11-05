import request from '../utils/request';


export const batchUploadFile = data =>{
    return request({
        url:'/common/file/batchUploadFile',
        header: { 'Content-Type': 'multipart/form-data' },
        method:'post',
        data
    })
};

export const singleUploadFile = data =>{
    return request({
        url:'/common/file/singleUploadFile',
        header: { 'Content-Type': 'multipart/form-data' },
        method:'post',
        data
    })
};


export function policy() {
    return  new Promise((resolve,reject)=>{
        request({
            url: "/api/oss/policy",
            method: "get",
            params: {}
        }).then(({ data }) => {
            resolve(data);
        })
    });
}


export function getUUID () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        return (c === 'x' ? (Math.random() * 16 | 0) : ('r&0x3' | '0x8')).toString(16)
    })
}
