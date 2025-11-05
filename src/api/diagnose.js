import request from '../utils/request';


/**
 * 获取所有诊断,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getDiagnoseList = query =>{
    return request({
        url:'/common/diagnose/getDiagnoseList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个诊断
 * @param query
 * @returns {AxiosPromise}
 */
export const getDiagnoseInfo = query =>{
    return request({
        url:'/common/diagnose/getDiagnoseInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存诊断接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveDiagnoseInfo = data =>{
    return request({
        url:'/common/diagnose/saveDiagnoseInfo',
        method:'post',
        data
    })
};
/**
 * 更新诊断接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateDiagnoseInfo = data =>{
    return request({
        url:'/common/diagnose/updateDiagnoseInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除诊断接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delDiagnoseInfo = id =>{
    return request({
        url:'/common/diagnose/delDiagnoseInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除诊断接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchDiagnoseInfo = id =>{
    return request({
        url:'/common/diagnose/delBatchDiagnoseInfo',
        method:'delete',
        params:{idList:id}
    })
};



