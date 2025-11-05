import request from '../utils/request';


/**
 * 获取所有药品,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getDrugList = query =>{
    return request({
        url:'/common/drug/getDrugList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个药品
 * @param query
 * @returns {AxiosPromise}
 */
export const getDrugInfo = query =>{
    return request({
        url:'/common/drug/getDrugInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存药品接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveDrugInfo = data =>{
    return request({
        url:'/common/drug/saveDrugInfo',
        method:'post',
        data
    })
};
/**
 * 更新药品接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateDrugInfo = data =>{
    return request({
        url:'/common/drug/updateDrugInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除药品接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delDrugInfo = id =>{
    return request({
        url:'/common/drug/delDrugInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除药品接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchDrugInfo = id =>{
    return request({
        url:'/common/drug/delBatchDrugInfo',
        method:'delete',
        params:{idList:id}
    })
};



