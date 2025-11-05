import request from '../utils/request';


/**
 * 获取所有挂号,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getOrderList = query =>{
    return request({
        url:'/common/order/getOrderList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个挂号
 * @param query
 * @returns {AxiosPromise}
 */
export const getOrderInfo = query =>{
    return request({
        url:'/common/order/getOrderInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存挂号接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveOrderInfo = data =>{
    return request({
        url:'/common/order/saveOrderInfo',
        method:'post',
        data
    })
};
/**
 * 更新挂号接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateOrderInfo = data =>{
    return request({
        url:'/common/order/updateOrderInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除挂号接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delOrderInfo = id =>{
    return request({
        url:'/common/order/delOrderInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除挂号接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchOrderInfo = id =>{
    return request({
        url:'/common/order/delBatchOrderInfo',
        method:'delete',
        params:{idList:id}
    })
};

/**
 * 导出excel
 */
export const exportOrderExcel = query => {
    return request({
        url: '/common/order/exportOrderExcel',
        method: 'post',
        params: query,
        responseType: 'blob',
        header: {}
    });
};

/**
 * 导入excel
 */
export const uploadOrderInfo = query => {
    return request({
        url: '/common/order/importOrderExcel',
        method: 'post',
        data: query,
        header: { 'Content-Type': 'multipart/form-data' }
    });
};


export const payOrderInfo = data =>{
    return request({
        url:'/common/order/payOrderInfo',
        method:'post',
        data
    })
};
