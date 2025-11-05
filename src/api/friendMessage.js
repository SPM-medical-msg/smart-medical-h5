import request from '../utils/request';


/**
 * 获取所有好友消息,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getFriendMessageList = query =>{
    return request({
        url:'/common/friendMessage/getFriendMessageList',
        method:'get',
        params:query
    })
};

/**
 * 获取单个好友消息
 * @param query
 * @returns {AxiosPromise}
 */
export const getFriendMessageInfo = query =>{
    return request({
        url:'/common/friendMessage/getFriendMessageInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存好友消息接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveFriendMessageInfo = data =>{
    return request({
        url:'/common/friendMessage/saveFriendMessageInfo',
        method:'post',
        data
    })
};
/**
 * 更新好友消息接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateFriendMessageInfo = data =>{
    return request({
        url:'/common/friendMessage/updateFriendMessageInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除好友消息接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delFriendMessageInfo = id =>{
    return request({
        url:'/common/friendMessage/delFriendMessageInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除好友消息接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchFriendMessageInfo = id =>{
    return request({
        url:'/common/friendMessage/delBatchFriendMessageInfo',
        method:'delete',
        params:{idList:id}
    })
};

/**
 * 导出excel
 */
export const exportFriendMessageExcel = query => {
    return request({
        url: '/common/friendMessage/exportFriendMessageExcel',
        method: 'post',
        params: query,
        responseType: 'blob',
        header: {}
    });
};

/**
 * 导入excel
 */
export const uploadFriendMessageInfo = query => {
    return request({
        url: '/common/friendMessage/importFriendMessageExcel',
        method: 'post',
        data: query,
        header: { 'Content-Type': 'multipart/form-data' }
    });
};



