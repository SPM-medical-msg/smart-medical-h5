import request from "@/utils/request";

export const getAiAnswer = query =>{
    return request({
        url:'/common/ai/getAiAnswer',
        method:'get',
        params:query
    })
};