import { managesvr } from '@/lib/api';
export const modifyUserPassword = params => {
  return managesvr('put', '/login/change/password', params);
};
export const modifyUserProfileImage = params => {
  return managesvr('post', '/user/profile/img', params, {
    'Content-Type': 'multipart/form-data',
  });
};
export const modifyUserInfo = params => {
  return managesvr('post', '/user/preferences', params);
};
export const getVersions = params => {
  return managesvr('get', `/na/versions/${params.platform}/${params.arch}`);
};
export const changeNotificationBlockOption = params => {
  return managesvr('post', '/nf/office/overtime/option', params);
};
