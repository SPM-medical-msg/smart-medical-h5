import request from '../utils/request';


/**
 * 获取所有类型,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getSortList = query =>{
    return request({
        url:'/common/sort/getSortList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个类型
 * @param query
 * @returns {AxiosPromise}
 */
export const getSortInfo = query =>{
    return request({
        url:'/common/sort/getSortInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存类型接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveSortInfo = data =>{
    return request({
        url:'/common/sort/saveSortInfo',
        method:'post',
        data
    })
};
/**
 * 更新类型接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateSortInfo = data =>{
    return request({
        url:'/common/sort/updateSortInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除类型接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delSortInfo = id =>{
    return request({
        url:'/common/sort/delSortInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除类型接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchSortInfo = id =>{
    return request({
        url:'/common/sort/delBatchSortInfo',
        method:'delete',
        params:{idList:id}
    })
};




