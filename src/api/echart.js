import request from '../utils/request';

/**
 * 获取一种统计数据的柱状图或者折线图
 * @returns {AxiosPromise}
 * @param query
 */
export const getOneHistogramOrLineData = query =>{
    return request({
        url:'/common/echart/getOneHistogramOrLineData',
        method:'get',
        params:query
    })
};
/**
 * 获取饼图的数据
 * @returns {AxiosPromise}
 * @param query
 */
export const getPieData = query =>{
    return request({
        url:'/common/echart/getPieData',
        method:'get',
        params:query
    })
};
/**
 * 获取两种统计数据的柱状图或者折线图
 * @returns {AxiosPromise}
 * @param query
 */
export const getTwoHistogramOrLineData = query =>{
    return request({
        url:'/common/echart/getTwoHistogramOrLineData',
        method:'get',
        params:query
    })
};

/**
 * 获取三种统计数据的柱状图或者折线图
 * @returns {AxiosPromise}
 * @param query
 */
export const getThreeHistogramOrLineData = query =>{
    return request({
        url:'/common/echart/getThreeHistogramOrLineData',
        method:'get',
        params:query
    })
};
