import request from '../utils/request';


/**
 * 获取所有好友,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getFriendList = query =>{
    return request({
        url:'/common/friend/getFriendList',
        method:'get',
        params:query
    })
};

export const getApplyFriendList = query =>{
    return request({
        url:'/common/friend/getApplyFriendList',
        method:'get',
        params:query
    })
};


/**
 * 获取单个好友
 * @param query
 * @returns {AxiosPromise}
 */
export const getFriendInfo = query =>{
    return request({
        url:'/common/friend/getFriendInfo',
        method:'get',
        params:query
    })
};

export const getFriendInfoById = query =>{
    return request({
        url:'/common/friend/getFriendInfoById',
        method:'get',
        params:query
    })
};

/**
 * 保存好友接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveFriendInfo = data =>{
    return request({
        url:'/common/friend/saveFriendInfo',
        method:'post',
        data
    })
};
/**
 * 更新好友接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateFriendInfo = data =>{
    return request({
        url:'/common/friend/updateFriendInfo',
        method:'put',
        data
    })
};

export const updateFriendInfo2 = data =>{
    return request({
        url:'/common/friend/updateFriendInfo2',
        method:'put',
        data
    })
};
/**
 *根据id删除好友接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delFriendInfo = id =>{
    return request({
        url:'/common/friend/delFriendInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除好友接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchFriendInfo = id =>{
    return request({
        url:'/common/friend/delBatchFriendInfo',
        method:'delete',
        params:{idList:id}
    })
};



export const createFriendData = data =>{
    return request({
        url:'/common/friend/createFriendData',
        method:'post',
    })
};

