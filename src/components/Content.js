import React from 'react';
import { Route } from 'react-router-dom';

import {
  ContactList,
  ChatList,
  OrgChart,
  ChannelList,
  NoteList,
  ExternalUserList,
  UserSetting,
  ExtensionLayer,
  ZoomOAuthSuccess,
  NoticeTalk
} from '@C/route/contents/index.async';

const Content = () => {
  return (
    <>
      <Route path="/client/main/contactlist" component={ContactList} />
      <Route path="/client/main/chatlist" component={ChatList} />
      <Route path="/client/main/orgchart" component={OrgChart} />
      <Route path="/client/main/channellist" component={ChannelList} />
      <Route path="/client/main/notelist" component={NoteList} />
      <Route
        path="/client/main/oauth2/zoom/success"
        component={ZoomOAuthSuccess}
      />
      <Route path="/client/main/extension" component={ExtensionLayer} />
      <Route
        path="/client/main/externaluserlist"
        component={ExternalUserList}
      />
      <Route path="/client/main/usersetting" component={UserSetting} />
      <Route path="/client/main/noticeTalk" component={NoticeTalk} />
    </>
  );
};

export default React.memo(Content);
