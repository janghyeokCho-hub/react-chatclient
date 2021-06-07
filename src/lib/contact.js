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

export const addCustomGroup = params => {
  return null;
};

export const addGroupMember = params => {
  return null;
};

export const deleteGroupMember = params => {
  return null;
};