import request from '../utils/request';


/**
 * 获取所有药品订单,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getExchangeList = query =>{
    return request({
        url:'/common/exchange/getExchangeList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个药品订单
 * @param query
 * @returns {AxiosPromise}
 */
export const getExchangeInfo = query =>{
    return request({
        url:'/common/exchange/getExchangeInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存药品订单接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveExchangeInfo = data =>{
    return request({
        url:'/common/exchange/saveExchangeInfo',
        method:'post',
        data
    })
};

export const payExchangeInfo = data =>{
    return request({
        url:'/common/exchange/payExchangeInfo',
        method:'post',
        data
    })
};



/**
 * 更新药品订单接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateExchangeInfo = data =>{
    return request({
        url:'/common/exchange/updateExchangeInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除药品订单接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delExchangeInfo = id =>{
    return request({
        url:'/common/exchange/delExchangeInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除药品订单接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchExchangeInfo = id =>{
    return request({
        url:'/common/exchange/delBatchExchangeInfo',
        method:'delete',
        params:{idList:id}
    })
};



