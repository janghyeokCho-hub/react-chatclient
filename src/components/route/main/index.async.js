import asyncRoute from '@/lib/asyncRoute';

/*
export { default as JoinForm } from '@C/login/JoinForm';
export const Channel = asyncRoute(() => import('@C/channels/channel/Channel'));
export { default as AppTemplate } from '@C/AppTemplate';
export { default as ChatRoom } from '@C/chat/chatroom/ChatRoom';
export { default as Channel } from '@C/channels/channel/Channel';
export const IndexMain = asyncRoute(() => import('@C/login/IndexMain'));
export const LoginMain = asyncRoute(() => import('@C/login/LoginMain'));
export const AutoLogin = asyncRoute(() => import('@C/login/AutoLogin'));
*/

export { default as IndexMain } from '@C/login/IndexMain';
export { default as LoginMain } from '@C/login/LoginMain';
export { default as AutoLogin } from '@C/login/AutoLogin';
export { default as Offline } from '@COMMON/Offline';
export const AppTemplate = asyncRoute(() => import('@C/AppTemplate'));

export const JoinForm = asyncRoute(() => import('@C/login/JoinForm'));
export const JoinSuccess = asyncRoute(() => import('@C/login/JoinSuccess'));

// 바로 load 고려 필요
export const MakeRoom = asyncRoute(() =>
  import('@C/chat/chatroom/normal/MakeRoom'),
);
export const UserSetting = asyncRoute(() =>
  import('@C/usersetting/UserSetting'),
);
export const FileLayer = asyncRoute(() => import('@COMMON/layer/FileLayer'));

export const Snipper = asyncRoute(() =>
  DEVICE_TYPE == 'd' ? import('@C/snipper/Snipper') : null,
);

export const Extension = asyncRoute(() => import('@C/extension/Extension'));
export const ChatRoom = asyncRoute(() => import('@C/chat/chatroom/ChatRoom'));
export const Channel = asyncRoute(() => import('@C/channels/channel/Channel'));
export const Versions = asyncRoute(() => import('@COMMON/layer/Versions'));
