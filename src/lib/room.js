import { chatsvr, managesvr } from '@/lib/api';

export const getRoomList = params => {
  let url = '/rooms';
  if (params?.updateList) {
    url = `${url}/${params.updateList.join(',')}`;
  }
  return chatsvr('get', url, params);
};

export const getRoomInfo = params => {
  return chatsvr('get', `/room/${params.roomID}`);
};

export const createRoom = params => {
  return chatsvr('post', '/room', params);
};

export const rematchMember = params => {
  return chatsvr('put', `/room/${params.roomID}`, params);
};

export const inviteMember = params => {
  return chatsvr('post', `/room/${params.roomID}`, params);
};

export const leaveRoom = params => {
  return chatsvr('delete', `/room/${params.roomID}/${params.userID}`, params);
};

export const modifyRoomName = params => {
  return chatsvr('post', `/room/${params.roomId}/roomName`, params);
};

export const getMessageDataFile = params => {
  return managesvr('get', `/room/message/file/export/${params}`);
};

export const getAllUserWithGroup = params => {
  return managesvr('get', `/org/${params}/all`);
};

export const getAllUserWithGroupList = params => {
  return managesvr('post', `/org/all`, params);
};

export const getAllUserWithCustomGroup = params => {
  return managesvr('get', `/org/user/contact/all/${params.folderId}`);
};

export const modifyRoomSetting = params => {
  return managesvr('post', `/room/setting/${params.roomID}`, params);
};
