import request from '../utils/request';

/**
 * 获取一种统计数据的柱状图或者折线图
 * @returns {AxiosPromise}
 * @param query
 */
export const getMajorScore = query =>{
    return request({
        url:'/common/sta/getMajorScore',
        method:'get',
        params:query
    })
};

export const getPaperSta = query =>{
    return request({
        url:'/common/sta/getPaperSta',
        method:'get',
        params:query
    })
};
export const getDataSta = query =>{
    return request({
        url:'/common/sta/getDataSta',
        method:'get',
        params:query
    })
};