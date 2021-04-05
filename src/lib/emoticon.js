import { chatsvr, managesvr } from '@/lib/api';

export const getGroups = () => {
  return managesvr('get', `/emoticon/groups`);
};

export const getGroupsWithSaaS = params => {
  return managesvr('get', `/emoticon/${params.companyCode}/groups`);
};

export const getEmoticons = params => {
  return managesvr('get', `/emoticon/${params.groupId}`);
};

export const getEmoticonsWithSaaS = params => {
  return managesvr('get', `/emoticon/${params.companyCode}/${params.groupId}`);
};
