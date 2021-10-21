import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { parse } from 'qs';
import * as socketUtil from '@/lib/socket/socketUtil';
import * as socketActions from '@/lib/socket/socketActions';
import * as deviceConnector from '@/lib/deviceConnector';
import { openPopup } from '@/lib/common';
import { withRouter } from 'react-router-dom';
import { logout } from '@/modules/login';
import { evalConnector } from '@/lib/deviceConnector';
import { clearUserData } from '@/lib/util/localStorageUtil';
import useSWR from 'swr';

const socketConnector = require(`@/lib/socket/socketConnect.${DEVICE_TYPE}`);

const SocketContainer = ({ history, location }) => {
  const token = useSelector(({ login }) => login.token);
  const userid = useSelector(({ login }) => login.id);
  const userInfo = useSelector(({ login }) => login.userInfo);
  const connected = useSelector(({ login }) => login.socketConnect);
  const { mutate: setNoteList } = useSWR('/note/list/receive', null);
  const query = parse(location?.search, { ignoreQueryPrefix: true });
  const dispatch = useDispatch();

  if (query?.refresh === true || query?.refresh === 'true') {
    deviceConnector.closeSocket(true);
  }

  useEffect(() => {
    if (token && !!userid) {
      // SocketContainer ComponentDidMount 시점에 한번 호출
      // 이 시점에 생성 및 Token 연결 시도
      if (DEVICE_TYPE == 'b') {
        const socket = socketConnector.socketConnect(
          {
            token,
            accessid: userid,
          },
          {
            onNewMessage: socketActions.handleNewMessage(dispatch, userInfo),
            onNewNoteMessage: socketActions.handleNewNoteMessage(
              dispatch,
              userInfo,
              setNoteList,
            ),
            onChatRoomInvitation: socketActions.handleChatRoomInvite(dispatch),
            onChatRoomExit: socketActions.handleChatRoomExit(
              dispatch,
              userInfo,
            ),
            onReadCountChanged: socketActions.handleReadCountChanged(
              dispatch,
              userInfo,
            ),
            onReadChannel: socketActions.handleReadChannel(dispatch),
            onPresenceChanged: socketActions.handlePresenceChanged(dispatch),
            onNewLinkThumbnail: socketActions.handleNewLinkThumbnail(dispatch),
            onForceToLogout: socketActions.handleForceToLogout(dispatch),
            onNewNotice: socketActions.handleNewNotice(dispatch),
            onChannelClosure: socketActions.handleChannelClosure(dispatch), //channel closure
            onNewChannelMessage: socketActions.handleNewChannelMessage(
              dispatch,
              userInfo,
            ),
            onChannelInvitation: socketActions.handleChannelInvite(dispatch),
            onChannelExit: socketActions.handleChannelExit(dispatch, userInfo),
            onDelChannelMessage: socketActions.handleDelChannelMessageInBrowser(dispatch),
            onNewChannelNotice: socketActions.handleNewChannelNotice(
              dispatch,
              userInfo,
            ),
            pongtest: () => {
              alert('pong');
            },
            onDelChannelNotice: socketActions.handleDelChannelNotice(dispatch),
            onAuthChanged: socketActions.handleAuthChanged(dispatch),
          },
          socketActions.handleConnect(dispatch), // connect callback
          socketActions.handleDisconnect(dispatch), // disconnect callback
        );
      } else if (DEVICE_TYPE == 'd') {
        deviceConnector.socketConnect(
          {
            token,
            accessid: userid,
          },
          {
            onNewMessage: socketActions.handleNewMessage(dispatch, userInfo),
            onNewNoteMessage: socketActions.handleNewNoteMessage(
              dispatch,
              userInfo,
              setNoteList,
            ),
            onChatRoomInvitation: socketActions.handleChatRoomInvite(dispatch),
            onChatRoomExit: socketActions.handleChatRoomExit(
              dispatch,
              userInfo,
            ),
            onReadCountChanged: socketActions.handleReadCountChanged(
              dispatch,
              userInfo,
            ),
            onReadChannel: socketActions.handleReadChannel(dispatch),
            onPresenceChanged: socketActions.handlePresenceChanged(dispatch),
            // onNewLinkThumbnail: socketActions.handleNewLinkThumbnail(dispatch),
            onForceToLogout: socketActions.handleForceToLogout(dispatch),
            onConnected: socketActions.handleConnect(dispatch), // connect callback
            onDisconnected: socketActions.handleDisconnect(dispatch), // disconnect callback
            onNewNotice: socketActions.handleNewNotice(dispatch),

            onNewChannelMessage: socketActions.handleNewChannelMessage(
              dispatch,
              userInfo,
            ),
            onChannelInvitation: socketActions.handleChannelInvite(dispatch),
            onChannelExit: socketActions.handleChannelExit(dispatch, userInfo),
            onDelChannelMessage: socketActions.handleDelChannelMessageInDesktop(dispatch),
            onChannelClosure: socketActions.handleChannelClosure(dispatch), //channel closure
            onNewChannelNotice: socketActions.handleNewChannelNotice(
              dispatch,
              userInfo,
            ),
            onDelChannelNotice: socketActions.handleDelChannelNotice(dispatch),
            onAuthChanged: socketActions.handleAuthChanged(dispatch),
          },
        );
      }
    } else {
      console.log('token disabled');
      if (DEVICE_TYPE == 'b') {
        socketConnector.closeSocket(true);
      }
    }
  }, [token]);

  useEffect(() => {
    if (connected === 'DC') {
      clearUserData();

      if (DEVICE_TYPE == 'd' && deviceConnector.isMainWindow()) {
        deviceConnector.closeAllChildWindow();
        socketUtil.checkNetwork(() => {
          dispatch(logout());
          history.push('/client/autoLogin');
        }, 1000);
      }

      if (DEVICE_TYPE == 'b') {
        socketConnector.closeSocket(true);
      }

      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_NetworkConnect'),
          callback: () => {
            // disconnected
            dispatch(logout());

            if (DEVICE_TYPE == 'd') {
              // history.push('/client/autoLogin');
              if (deviceConnector.isMainWindow()) {
                socketUtil.clearCheck();
                history.push('/client/autoLogin');
              } else deviceConnector.closeWindow();
            } else {
              history.push('/client');
            }
          },
        },
        dispatch,
      );
    }
  }, [connected]);

  return null;
};

export default withRouter(SocketContainer);
