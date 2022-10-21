import { BrowserWindow } from 'electron';
import socketio from 'socket.io-client';
import * as socketAction from './socketAction';
import Config from '../config/config';
import logger from '../utils/logger';

export const reqSocketConnect = (event, args) => {
  logger.info('socket connection : ' + args.token);
  const preFuncs = {
    onNewMessage: socketAction.onNewMessage,
    onDelMessage: socketAction.onDelMessage,
    onDelChannelMessage: socketAction.onDelChannelMessage,
    onNewNoteMessage: socketAction.onNewNoteMessage,
    onPresenceChanged: socketAction.onPresenceChanged,
    onChatRoomInvitation: socketAction.onChatRoomInvitation,
    onChatRoomExit: socketAction.onChatRoomExit,
    onForceToLogout: socketAction.onForceToLogout,
    onReadCountChanged: socketAction.onReadCountChanged,
    onReadChannel: () => {},
    onNewNotice: socketAction.onNewNotice,
    onNewChannelMessage: socketAction.onNewChannelMessage,
    onNewChannelNotice: socketAction.onNewChannelMessage,
    onAppUpdateConfig: socketAction.onAppUpdateConfig,
    onChannelExit: socketAction.onChannelExit,
    onChannelInvitation: socketAction.onChannelInvitation,
    onRoomSettingChanged: payload => {},
  };

  if (CONN_SOCKET == null || CONN_SOCKET.disconnect) {
    CONN_SOCKET = socketio(Config().ServerURL.EVENT, {
      forceNew: true,
      transports: ['websocket'],
      reconnection: false,
      // rejectUnauthorized: false,
    });

    CONN_SOCKET.on('message', data => {
      if (data.result === 'success') {
        logger.info('token auth :: success');

        // 모든창에 메세지 전송
        BrowserWindow.getAllWindows().forEach(win => {
          if (win)
            win.webContents.send('socket-event', {
              channel: 'onConnected',
              payload: '',
            });
        });

        Object.keys(preFuncs).forEach(key => {
          if (CONN_SOCKET.hasListeners(key)) CONN_SOCKET.off(key);

          CONN_SOCKET.on(
            key,
            (method => {
              const preFunc = method;
              return payload => {
                logger.info('event receive :: ' + key);
                if (typeof preFunc == 'function') {
                  logger.info('pre porc method exec');
                  const parseData = JSON.parse(payload);
                  preFunc(parseData);
                }

                // 모든창에 메세지 전송
                BrowserWindow.getAllWindows().forEach(win => {
                  if (win)
                    win.webContents.send('socket-event', {
                      channel: key,
                      payload,
                    });
                });
              };
            })(preFuncs[key]),
          );
        });
      } else {
        logger.info('token auth :: fail');
        // token 인증 실패
        // TODO: 처리 필요
      }
    });

    CONN_SOCKET.on('connect', () => {
      // event server subscribe
      logger.info('token auth :: send');
      CONN_SOCKET.emit('message', {
        token: args.token,
        // accessid : Covi-User-Access-ID
        accessid: args.accessid,
      });
    });

    CONN_SOCKET.on('connect_error', evt => {
      console.dir(evt);
      logger.info('socket connect_error event :: force new connect');
    });

    CONN_SOCKET.on('connect_timeout', () => {
      logger.info('socket connect_error event :: force new connect');
    });

    CONN_SOCKET.on('error', evt => {
      console.dir(evt);
      logger.info('socket error event :: force new connect');
    });

    CONN_SOCKET.on('disconnect', () => {
      socketAction.onDisconnected();
      // 모든창에 메세지 전송
      BrowserWindow.getAllWindows().forEach(win => {
        if (win)
          win.webContents.send('socket-event', {
            channel: 'onDisconnected',
            payload: '',
          });
      });
    });
  }
};

export const checkNetwork = (event, args) => {
  // 절전모드의 경우 연결 체크 미수행
  if (POWER == 'ACTIVE') {
    let check = socketio(Config().ServerURL.EVENT, {
      forceNew: true,
      transports: ['websocket'],
      reconnection: false,
      rejectUnauthorized: false,
      timeout: 3000,
    });

    check.on('connect', () => {
      // event server subscribe
      check.close();
      check = null;
      BrowserWindow.fromId(1).flashFrame(false);
      event.sender.send('onNetworkStatus', true);
    });

    check.on('connect_error', evt => {
      event.sender.send('onNetworkStatus', false);
    });

    check.on('connect_timeout', () => {
      event.sender.send('onNetworkStatus', false);
    });

    check.on('error', evt => {
      event.sender.send('onNetworkStatus', false);
    });
  } else {
    event.sender.send('onNetworkStatus', false);
  }
};
