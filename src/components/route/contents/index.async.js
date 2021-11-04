import asyncRoute from '@/lib/asyncRoute';

export { default as ContactList } from '@C/contact/ContactList';
export { default as ChatList } from '@C/chat/ChatList';
export { default as OrgChart } from '@C/orgchart/OrgChart';
export { default as NoteList } from '@/pages/note';
export { default as ZoomOAuthSuccess } from '@/pages/oauth2/zoom/ZoomOAuthSuccess';

export { default as ExtensionLayer } from '@/containers/extension/ExtensionLayer';

export const ChannelList = asyncRoute(() => import('@C/channels/ChannelList'));
export const ExternalUserList = asyncRoute(() =>
  import('@C/externaluserlist/ExternalUserList'),
);
export const UserSetting = asyncRoute(() =>
  import('@C/usersetting/UserSetting'),
);
