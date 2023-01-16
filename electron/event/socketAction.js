import { BrowserWindow } from 'electron';
import * as common from '../utils/commonUtils';
import * as appData from '../event/appData';
import { setHot } from '../utils/trayUtils';
import * as loginInfo from '../utils/loginInfo';
import logger from '../utils/logger';
import exportProps from '../config/exportProps';

//앱 자동 동기화
export const onAppUpdateConfig = payload => {
  // console.log('onAppUpdateConfig payload check >> ',payload)
  if (payload.platform == 'PC') {
    const parentWin = BrowserWindow.fromId(1);
    parentWin.webContents.send('sync-alert', {
      payload,
    });
  }
};

export const onChannelExit = payload => {
  console.log('onChannelExit payload check >> ', payload);
};

export const onChannelInvitation = payload => {
  console.log('onChannelInvitation payload check >>', payload);
};

export const onNewMessage = payload => {
  // 자기자신 메세지 확인
  if (payload.sender == loginInfo.getData().id) {
    payload.isMine = 'Y';
  } else {
    payload.isMine = 'N';
  }
  // flashFrame evt 발생 ( 자기자신에게 발생한 메세지 처리 안함 )
  if (payload.isMine != 'Y' && payload.roomID) {
    // 선택된 id가 없으면 무조건 부모창
    if (USER_SETTING.config.desktopNoti) {
      const id = ROOM_WIN_MAP[payload.roomID];
      let focusWin = null;

      if (id) {
        const findWin = BrowserWindow.fromId(id);
        if (findWin) {
          focusWin = findWin;
        } else {
          focusWin = BrowserWindow.fromId(1);
        }
      } else {
        focusWin = BrowserWindow.fromId(1);
      }

      if (!focusWin.isVisible() && !focusWin.isMinimized()) {
        // tray
        focusWin.setOpacity(0);
        focusWin.showInactive();
        focusWin.minimize();
        focusWin.setOpacity(1);
      }

      if (!focusWin.isFocused()) {
        payload.isChannel = false;
        common.notifyMessage(payload, focusWin, loginInfo.getData());
      }
    }
    // Tray Change
    setHot(true);
  }

  appData.reqSaveMessage(payload);
};

export const onPresenceChanged = payload => {
  // TODO: AppData 저장 여부값 조건 추가 필요
  const useAccessTokenExpire =
    SERVER_SECURITY_SETTING?.config?.config?.UseAccessTokenExpire === 'Y';

  if (useAccessTokenExpire) {
    if (
      APP_SECURITY_SETTING?.config?.loginId === payload?.userId &&
      payload?.state === 'offline' &&
      payload?.beforeState !== 'away'
    ) {
      const parentWin = BrowserWindow.fromId(1);
      if (APP_SECURITY_SETTING.config?.autoLogin || exportProps.isAutoLogin) {
        // Force Auto Login
        logger.info('onPresenceChanged - Force Auto Login');
        parentWin.webContents.send('force-auto-login');
      } else {
        // Force Logout
        logger.info('onPresenceChanged - Force Logout');
        appData.reqSetPresence({ params: [payload] });
        const { loginId, tk } = APP_SECURITY_SETTING?.config;
        parentWin.webContents.send('force-logout', { id: loginId, token: tk });
      }
    }
  } else {
    appData.reqSetPresence({ params: [payload] });
  }
};

export const onChatRoomInvitation = payload => {
  // TODO: AppData 저장 여부값 조건 추가 필요
  appData.reqAddMember(payload);

  const messageParam = {
    messageID: payload.messageID,
    context: payload.context,
    sender: payload.sender,
    sendDate: payload.sendDate,
    roomID: payload.roomID,
    receiver: payload.receiver,
    messageType: payload.messageType,
    unreadCnt: 0,
    isMine: 'N',
    isSyncUnRead: 'Y',
    tempId: 0,
  };
  appData.reqSaveMessage(messageParam);
};

export const onChatRoomExit = payload => {
  // TODO: AppData 저장 여부값 조건 추가 필요
  const currentUser = loginInfo.getData().id;

  if (currentUser == payload.leaveMember) {
    // 다른기기에서 자기자신이 퇴장한 경우 방 데이터 삭제
    appData.reqDeleteRoom(null, { roomId: payload.roomID });
  } else {
    if (payload.roomType != 'M') {
      // 다른 사용자가 퇴장한 경우 Member 제거
      appData.reqDeleteMember(payload);

      const messageParam = {
        messageID: payload.messageID,
        context: payload.context,
        sender: payload.sender,
        sendDate: payload.sendDate,
        roomID: payload.roomID,
        receiver: payload.receiver,
        messageType: payload.messageType,
        unreadCnt: 0,
        isSyncUnRead: 'Y',
        isMine: 'N',
        tempId: 0,
      };
      appData.reqSaveMessage(messageParam);
    } else {
      // 개인채팅방에서 target 사용자가 퇴장한 경우 store 업데이트
      appData.reqDeleteTargetUser(payload);
    }
  }
};

export const onForceToLogout = payload => {
  logger.info('socket forceToLogout event :: close socket (onForceToLogout)');
  // socket 연결 제거 및 disconnect event 해제
  if (CONN_SOCKET) {
    CONN_SOCKET.hasListeners('disconnect') && CONN_SOCKET.off('disconnect');
    CONN_SOCKET.close();
  }

  const parentWin = BrowserWindow.fromId(1);

  if (!parentWin.isVisible()) {
    // tray
    parentWin.showInactive();
  }
};

export const onDisconnected = payload => {
  logger.info('socket disconnect event :: close socket (onDisconnected)');

  // socket 연결 제거 및 disconnect event 해제
  if (CONN_SOCKET) {
    CONN_SOCKET.hasListeners('disconnect') && CONN_SOCKET.off('disconnect');
    CONN_SOCKET.close();
  }

  const parentWin = BrowserWindow.fromId(1);

  if (parentWin.isMinimized() || !parentWin.isVisible()) {
    // tray
    parentWin.showInactive();
  }
};

export const onReadCountChanged = payload => {
  // TODO: AppData 저장 여부값 조건 추가 필요
  appData.reqSetUnreadCnt(payload);
};

export const onNewNotice = payload => {
  // 자기자신 메세지 확인
  payload.isMine = 'N';

  // flashFrame evt 발생 ( 자기자신에게 발생한 메세지 처리 안함 )
  if (payload.roomID) {
    // 선택된 id가 없으면 무조건 부모창
    if (USER_SETTING.config.desktopNoti) {
      const id = ROOM_WIN_MAP[payload.roomID];
      let focusWin = null;

      if (id) {
        const findWin = BrowserWindow.fromId(id);
        if (findWin) {
          focusWin = findWin;
        } else {
          focusWin = BrowserWindow.fromId(1);
        }
      } else {
        focusWin = BrowserWindow.fromId(1);
      }

      if (!focusWin.isVisible() && !focusWin.isMinimized()) {
        // tray
        focusWin.setOpacity(0);
        focusWin.showInactive();
        focusWin.minimize();
        focusWin.setOpacity(1);
      }

      if (!focusWin.isFocused()) {
        payload.isChannel = false;
        common.notifyMessage(payload, focusWin, loginInfo.getData());
      }
    }
    // Tray Change
    setHot(true);
  }

  appData.reqSaveMessage(payload);
};

export const onNewChannelMessage = payload => {
  try {
    const context = JSON.parse(payload?.context);
    // '채널공지 내림' 이벤트는 notification 띄우지 않음
    if (context?.templateKey === 'Tmp_noticeOff') {
      return;
    }
  } catch (err) {}
  // 자기자신 메세지 확인
  if (payload.sender == loginInfo.getData().id) {
    payload.isMine = 'Y';
  } else {
    payload.isMine = 'N';
  }

  // flashFrame evt 발생 ( 자기자신에게 발생한 메세지 처리 안함 )
  if (payload.isMine != 'Y' && payload.roomID) {
    // 선택된 id가 없으면 무조건 부모창
    if (USER_SETTING.config.desktopNoti) {
      const id = ROOM_WIN_MAP[payload.roomID];
      let focusWin = null;

      if (id) {
        const findWin = BrowserWindow.fromId(id);
        if (findWin) {
          focusWin = findWin;
        } else {
          focusWin = BrowserWindow.fromId(1);
        }
      } else {
        focusWin = BrowserWindow.fromId(1);
      }

      if (!focusWin.isVisible() && !focusWin.isMinimized()) {
        // tray
        focusWin.setOpacity(0);
        focusWin.showInactive();
        focusWin.minimize();
        focusWin.setOpacity(1);
      }

      if (!focusWin.isFocused()) {
        payload.isChannel = true;
        common.notifyMessage(payload, focusWin, loginInfo.getData());
      }
    }
    // Tray Change
    setHot(true);
  }
};

export const onNewNoteMessage = payload => {
  try {
    const title = common.getDictionary(payload.multiDisplayName);
    const message =
      payload?.subject ||
      common.getDictionary('새 쪽지;New note;新笔记;新しいメモ');
    const noteId = parseInt(payload.noteId);
    const isEmergency = payload.emergency === 'Y';

    common.notifyNoteMessage({
      noteId,
      title,
      message,
      isEmergency,
      photoPath: payload?.photoPath,
    });
    setHot(true);
  } catch (err) {
    console.log('onNewNoteMessage Err : ', err);
    // log error
  }
};
export const onDelMessage = payload => {
  appData.deleteChatroomMessage(payload);
  return;
};
export const onDelChannelMessage = payload => {
  return;
};
