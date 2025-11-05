import request from '../utils/request';


/**
 * 获取所有评论,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getEvaluateList = query =>{
    return request({
        url:'/common/evaluate/getEvaluateList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个评论
 * @param query
 * @returns {AxiosPromise}
 */
export const getEvaluateInfo = query =>{
    return request({
        url:'/common/evaluate/getEvaluateInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存评论接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveEvaluateInfo = data =>{
    return request({
        url:'/common/evaluate/saveEvaluateInfo',
        method:'post',
        data
    })
};
/**
 * 更新评论接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateEvaluateInfo = data =>{
    return request({
        url:'/common/evaluate/updateEvaluateInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除评论接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delEvaluateInfo = id =>{
    return request({
        url:'/common/evaluate/delEvaluateInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除评论接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchEvaluateInfo = id =>{
    return request({
        url:'/common/evaluate/delBatchEvaluateInfo',
        method:'delete',
        params:{idList:id}
    })
};



