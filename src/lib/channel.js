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
  // auth api 변경.
  return chatsvr('put', `/channel/roomMember/auth/${params.roomId}`, params);
};

// 공지
export const setChannelNotice = params => {
  return chatsvr('post', `/channel/notice/message`, params);
};

// redux 에서 조회되지 않는 사용자 정보 조회 ( mention )
export const getChannelMemberInfos = params => {
  return managesvr('post', `/channel/mention/members`, params);
};

// 외부사용자 가입 인증코드 체크
export const checkSecretCode = params => {
  return managesvr('post', `/na/nf/channel/extuser/check`, params);
};

// 이미 초대된 외부사용자 목록
export const getExternalUser = params => {
  return managesvr('get', `/channel/room/${params}/extuser`);
};

// 이미 초대된 외부사용자 삭제
export const delExternalUser = params => {
  return managesvr('delete', `/channel/room/${params.roomId}/extuser`, params);
};

// 외부사용자 이메일 추가 시 중복 체크
export const checkExternalUser = params => {
  return managesvr(
    'post',
    `/channel/room/${params.roomId}/extuser/check`,
    params,
  );
};

// 외부사용자 초대 메일 전송
export const sendExternalUser = params => {
  return managesvr(
    'post',
    `/channel/room/${params.roomId}/extuser/send`,
    params,
  );
};

// 외부사용자 가입
export const joinExternalUser = params => {
  return managesvr('post', `/na/nf/channel/extuser/join`, params);
};

// 채널 폐쇄
export const closureChannel = params => {
  return chatsvr(
    'delete',
    `/na/channel/closure/USER/${params.roomId}?TargetRoomName=${params.roomName}`,
    params,
  );
};
