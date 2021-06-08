import { chatsvr, managesvr } from '@/lib/api';

export const getContactList = params => {
  return managesvr('get', `/user/contact?deptCode=${params}`);
};

export const addContactList = params => {
  return managesvr('post', `/user/contact`, params);
};

export const deleteContactList = params => {
  return managesvr('delete', `/user/contact`, params);
};

export const getItemGroupOneDepth = params => {
  return managesvr(
    'get',
    `/user/contact/${params.folderID}/${params.folderType}`,
  );
};

/* 사용자 그룹 명 변경 */
export const modiftyCustomGroupName = params => {
  return managesvr('put', `/user/contact/name`, params);
};

export const deleteCustomGroup = params => {
  //managesvr('delete', `/user/contact/`, params);
  return null;
};

export const addGroupMember = params => {
  return null;
};

export const deleteGroupMember = params => {
  return null;
};