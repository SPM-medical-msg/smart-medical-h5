import request from '../utils/request';

/**
 * 登录接口
 * @param query
 * @returns {AxiosPromise}
 */
export const Login = query =>{
    return request({
        url:'/common/user/login',
        method:'post',
        data:query
    })
};
/**
 * 修改密码接口
 * @param query
 * @returns {AxiosPromise}
 */
export const updatePassword = query =>{
    return request({
        url:'/common/user/updatePassword',
        method:'post',
        data:query
    })
};


/**
 * 获取所有用户,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getUserList = query =>{
    return request({
        url:'/common/user/getUserList',
        method:'get',
        params:query
    })
};
/**
 * 根据电话号获取单个用户
 * @param query
 * @returns {AxiosPromise}
 */
export const getUserByPhone = query =>{
    return request({
        url:'/common/user/getUserByPhone',
        method:'get',
        params:query
    })
};

export const getRecommendList = query =>{
    return request({
        url:'/common/user/getRecommendList',
        method:'get',
        params:query
    })
};
export const userRecharge = data =>{
    return request({
        url:'/common/user/userRecharge',
        method:'put',
        data
    })
};

/**
 * 获取单个用户
 * @param query
 * @returns {AxiosPromise}
 */
export const getUserInfo = query =>{
    return request({
        url:'/common/user/getUserInfo',
        method:'get',
        params:query
    })
};

/**
 * 保存用户接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveUserInfo = data =>{
    return request({
        url:'/common/user/saveUserInfo',
        method:'post',
        data
    })
};
/**
 * 更新用户接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateUserInfo = data =>{
    return request({
        url:'/common/user/updateUserInfo',
        method:'put',
        data
    })
};
/**
 *根据id删除用户接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delUserInfo = id =>{
    return request({
        url:'/common/user/delUserInfo',
        method:'delete',
        params:{id:id}
    })
};
/**
 * 根据id集合批量删除用户接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchUserInfo = id =>{
    return request({
        url:'/common/user/delBatchUserInfo',
        method:'delete',
        params:{idList:id}
    })
};



