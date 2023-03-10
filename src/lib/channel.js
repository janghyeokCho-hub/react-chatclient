// lib\room.js
import { chatsvr, managesvr } from '@/lib/api';

export const getChannelList = params => {
  return managesvr('get', `/channel/joinList/${params.userId}`);
};

export const getChannelUpdateList = params => {
  let url = '/channels';
  if (params && params.updateList) {
    url = `${url}/${params.updateList.join(',')}`;
  }
  return chatsvr('get', url, params);
};

export const getChannelCategoryList = param => {
  if (param && param.companyCode)
    return managesvr('get', `/channel/categoryList/${param.companyCode}`);
  else return managesvr('get', `/channel/categoryList`);
};

export const searchChannel = params => {
  const requestParam = params.reqDatas;
  if (requestParam) {
    if (requestParam.companyCode) {
      return managesvr(
        'get',
        `/channel/search/${requestParam.type}?companyCode=${requestParam.companyCode}&value=${requestParam.value}`,
      );
    } else {
      return managesvr(
        'get',
        `/channel/search/${requestParam.type}?value=${requestParam.value}`,
      );
    }
  }
};

export const getChannelInfo = params => {
  return chatsvr('post', `/channel/${params.roomId}`, params);
};

export const getChannelNotice = params => {
  return managesvr(
    'get',
    `/channel/messages/notice/${params.roomId}/${params.method}?`,
    params,
  );
};

export const createChannel = params => {
  return chatsvr('post', '/channel/room', params);
};

export const uploadChannelIcon = params => {
  return chatsvr('post', `/channel/room/icon`, params, {
    'Content-Type': 'multipart/form-data',
  });
};

export const joinChannel = params => {
  return chatsvr('post', `/channel/join/${params.roomId}`, params);
};

export const leaveChannel = params => {
  return chatsvr(
    'delete',
    `/channel/room/${params.roomId}/${params.userId}`,
    params,
  );
};

export const inviteMember = params => {
  return chatsvr('put', `/channel/room/${params.roomId}`, params);
};

export const modifyChannelName = params => {
  return chatsvr('put', `/channel/${params.roomId}/roomName`, params);
};

export const modifyChannelInfo = params => {
  return managesvr('put', `/channel/${params.roomId}/roomInfo`, params);
};

export const modifyMemberAuth = params => {
  // auth api ??????.
  return chatsvr('put', `/channel/roomMember/auth/${params.roomId}`, params);
};

// ??????
export const setChannelNotice = params => {
  return chatsvr('post', `/channel/notice/message`, params);
};

// redux ?????? ???????????? ?????? ????????? ?????? ?????? ( mention )
export const getChannelMemberInfos = params => {
  return managesvr('post', `/channel/mention/members`, params);
};

// ??????????????? ?????? ???????????? ??????
export const checkSecretCode = params => {
  return managesvr('post', `/na/nf/channel/extuser/check`, params);
};

// ?????? ????????? ??????????????? ??????
export const getExternalUser = params => {
  return managesvr('get', `/channel/room/${params}/extuser`);
};

// ?????? ????????? ??????????????? ??????
export const delExternalUser = params => {
  return managesvr('delete', `/channel/room/${params.roomId}/extuser`, params);
};

// ??????????????? ????????? ?????? ??? ?????? ??????
export const checkExternalUser = params => {
  return managesvr(
    'post',
    `/channel/room/${params.roomId}/extuser/check`,
    params,
  );
};

// ??????????????? ?????? ?????? ??????
export const sendExternalUser = params => {
  return managesvr(
    'post',
    `/channel/room/${params.roomId}/extuser/send`,
    params,
  );
};

// ??????????????? ??????
export const joinExternalUser = params => {
  return managesvr('post', `/na/nf/channel/extuser/join`, params);
};

// ?????? ??????
export const closureChannel = params => {
  return chatsvr(
    'delete',
    `/na/channel/closure/USER/${params.roomId}?TargetRoomName=${params.roomName}`,
    params,
  );
};
