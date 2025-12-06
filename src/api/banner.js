import request from '../utils/request';


/**
 * 获取所有轮播图,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getBannerList = query =>{
    return request({
        url:'/common/banner/getBannerList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个轮播图
 * @param query
 * @returns {AxiosPromise}
 */
export const getBannerInfo = query =>{
    return request({
        url:'/common/banner/getBannerInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存轮播图接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveBannerInfo = data =>{
    return request({
        url:'/common/banner/saveBannerInfo',
        method:'post',
        data
    })
};
/**
 * 更新轮播图接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateBannerInfo = data =>{
    return request({
        url:'/common/banner/updateBannerInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除轮播图接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBannerInfo = id =>{
    return request({
        url:'/common/banner/delBannerInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除轮播图接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchBannerInfo = id =>{
    return request({
        url:'/common/banner/delBatchBannerInfo',
        method:'delete',
        params:{idList:id}
    })
};



