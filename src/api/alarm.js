import request from '../utils/request';


/**
 * 获取所有报警,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getAlarmList = query =>{
    return request({
        url:'/common/alarm/getAlarmList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个报警
 * @param query
 * @returns {AxiosPromise}
 */
export const getAlarmInfo = query =>{
    return request({
        url:'/common/alarm/getAlarmInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存报警接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveAlarmInfo = data =>{
    return request({
        url:'/common/alarm/saveAlarmInfo',
        method:'post',
        data
    })
};
/**
 * 更新报警接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateAlarmInfo = data =>{
    return request({
        url:'/common/alarm/updateAlarmInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除报警接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delAlarmInfo = id =>{
    return request({
        url:'/common/alarm/delAlarmInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除报警接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchAlarmInfo = id =>{
    return request({
        url:'/common/alarm/delBatchAlarmInfo',
        method:'delete',
        params:{idList:id}
    })
};



