import request from '../utils/request';


/**
 * 获取所有排班,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getPlanList = query =>{
    return request({
        url:'/common/plan/getPlanList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个排班
 * @param query
 * @returns {AxiosPromise}
 */
export const getPlanInfo = query =>{
    return request({
        url:'/common/plan/getPlanInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存排班接口
 * @param data
 * @returns {AxiosPromise}
 */
export const savePlanInfo = data =>{
    return request({
        url:'/common/plan/savePlanInfo',
        method:'post',
        data
    })
};
/**
 * 更新排班接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updatePlanInfo = data =>{
    return request({
        url:'/common/plan/updatePlanInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除排班接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delPlanInfo = id =>{
    return request({
        url:'/common/plan/delPlanInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除排班接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchPlanInfo = id =>{
    return request({
        url:'/common/plan/delBatchPlanInfo',
        method:'delete',
        params:{idList:id}
    })
};

/**
 * 导出excel
 */
export const exportPlanExcel = query => {
    return request({
        url: '/common/plan/exportPlanExcel',
        method: 'post',
        params: query,
        responseType: 'blob',
        header: {}
    });
};

/**
 * 导入excel
 */
export const uploadPlanInfo = query => {
    return request({
        url: '/common/plan/importPlanExcel',
        method: 'post',
        data: query,
        header: { 'Content-Type': 'multipart/form-data' }
    });
};


