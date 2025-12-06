import request from "../utils/request";

/**
 * 获取所有知识库,包括条件查询接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getNoticeList = (query) => {
  return request({
    url: "/common/notice/getNoticeList",
    method: "get",
    params: query,
  });
};

/**
 * 获取单个知识库
 * @param query
 * @returns {AxiosPromise}
 */
export const getNoticeInfo = (query) => {
  return request({
    url: "/common/notice/getNoticeInfo",
    method: "get",
    params: query,
  });
};

/**
 * 保存知识库接口
 * @param data
 * @returns {AxiosPromise}
 */
export const saveNoticeInfo = (data) => {
  return request({
    url: "/common/notice/saveNoticeInfo",
    method: "post",
    data,
  });
};
/**
 * 更新知识库接口
 * @param data
 * @returns {AxiosPromise}
 */
export const updateNoticeInfo = (data) => {
  return request({
    url: "/common/notice/updateNoticeInfo",
    method: "put",
    data,
  });
};
/**
 *根据id删除知识库接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delNoticeInfo = (id) => {
  return request({
    url: "/common/notice/delNoticeInfo",
    method: "delete",
    params: { id: id },
  });
};
/**
 * 根据id集合批量删除知识库接口
 * @param id
 * @returns {AxiosPromise}
 */
export const delBatchNoticeInfo = (id) => {
  return request({
    url: "/common/notice/delBatchNoticeInfo",
    method: "delete",
    params: { idList: id },
  });
};

/**
 * 获取公告列表（包含科室信息）- 新接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getNoticeListWithDept = (query) => {
  return request({
    url: "/common/notice/getNoticeListWithDept",
    method: "get",
    params: query,
  });
};

/**
 * 获取单个公告详情（包含科室名称）- 新接口
 * @param query
 * @returns {AxiosPromise}
 */
export const getNoticeInfoWithDept = (query) => {
  return request({
    url: "/common/notice/getNoticeInfoWithDept",
    method: "get",
    params: query,
  });
};

/**
 * 根据科室ID查询公告列表 - 新接口
 * @param deptId
 * @returns {AxiosPromise}
 */
export const getNoticeListByDeptId = (deptId) => {
  return request({
    url: "/common/notice/getNoticeListByDeptId",
    method: "get",
    params: { deptId },
  });
};
