import request from '../utils/request';


/**
 * 获取所有采购,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getPurchaseList = query =>{
    return request({
        url:'/common/purchase/getPurchaseList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个采购
 * @param query
 * @returns {AxiosPromise}
 */
export const getPurchaseInfo = query =>{
    return request({
        url:'/common/purchase/getPurchaseInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存采购接口
 * @param data
 * @returns {AxiosPromise}
 */
export const savePurchaseInfo = data =>{
    return request({
        url:'/common/purchase/savePurchaseInfo',
        method:'post',
        data
    })
};
/**
 * 更新采购接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updatePurchaseInfo = data =>{
    return request({
        url:'/common/purchase/updatePurchaseInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除采购接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delPurchaseInfo = id =>{
    return request({
        url:'/common/purchase/delPurchaseInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除采购接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchPurchaseInfo = id =>{
    return request({
        url:'/common/purchase/delBatchPurchaseInfo',
        method:'delete',
        params:{idList:id}
    })
};



