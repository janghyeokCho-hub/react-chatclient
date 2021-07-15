import { app, BrowserWindow, Notification, screen } from 'electron';
import path from 'path';
import logger from './logger';
import exportProps from '../config/exportProps';
import { ToastNotification, history } from 'electron-windows-notifications';
import * as window from './window';
import { managesvr } from '../utils/api';
import { removeLocalDatabaseDir } from '../utils/fileUtils';
import * as netUtils from 'node-macaddress';
import { openNoteWindow } from './note';
import ip from 'ip';
import { networkInterfaces } from 'os';

/*
const appId =
  DEF_MODE == 'development'
    ? process.execPath
    : `com.covision.${app.getName()}`;
*/

let alarmWin = null;
let loadingAlarmWin = false;
let fixWin = null;

// Message 도착 알림 처리
export const notifyMessage = (payload, focusWin) => {
  // 자기자신에게 온 메세지는 알림처리 안함 (socketAction에서 미리 검사)
  // if (payload.isMine != 'Y') {
  // TODO: notify 설정상태, payload에 따른 notify 설정정보 처리, os에 따른 notify 처리 추가 등등 개발 필요
  try {
    const senderInfo = JSON.parse(payload.senderInfo);

    // let iconImage = path.join(exportProps.resourcePath, 'icons', 'alarm.png'); // full path여야함
    let iconImage = senderInfo.photoPath;
    let localIconImage = path.join(
      exportProps.resourcePath,
      'icons',
      'alarm.png',
    );
    let title = getDictionary(senderInfo.name);
    let message = '';
    let jObjMessage = null;

    // 전체 공지일 경우.
    if (payload.messageType == 'A') {
      // JSON type의 Notification일 경우.
      try {
        jObjMessage = JSON.parse(payload.context);
        const { datas } = JSON.parse(jObjMessage.context);
        const fromMessage = !!datas.length ? datas[0].data : '시스템';
        jObjMessage.context = `${fromMessage}에서 메시지 도착`;
      } catch (e) {
        console.log('e', e);
      }
    }

    if (USER_SETTING.config.showNotiContent) {
      if (payload.context) {
        message = payload.context;
        if (/eumtalk:\/\//.test(message)) {
          console.log('message::::::::::::::', message);
          const arrMsgData = message.replace(/eumtalk:\/\//, '').split('.');
          if (arrMsgData) {
            console.log('arrMsgData::::::::::::::', arrMsgData);
            if (arrMsgData[0] == 'emoticon') {
              // emoticon 처리
              message = SERVER_SECURITY_SETTING.getDic('Emoticon', '이모티콘');
            } else {
              message = SERVER_SECURITY_SETTING.getDic(
                'Msg_ReceiveMsg1',
                `멘션메시지 도착`, // 추가 수정 필요
              );
            }
          }
        } else if (jObjMessage != null) {
          // JSON type의 Notification일 경우.
          if (jObjMessage.hasOwnProperty('context')) {
            message = jObjMessage.context;
          } else if (jObjMessage.hasOwnProperty('title')) {
            message = title;
          } else {
            message = SERVER_SECURITY_SETTING.getDic(
              'Msg_ReceiveMsg',
              '새로운 메시지가 도착했습니다.',
            );
          }
        } else {
          message = message.replace(/\n/gi, ' ');
          message = message.replace(/&nbsp;/gi, ' ');
          message = message.replace(/&gt;/gi, '>');
          message = message.replace(/&lt;/gi, '<');
          message = message.replace(/&quot;/gi, '"');
          message = message.replace(/&#39;/gi, "'");

          if (!message)
            message = SERVER_SECURITY_SETTING.getDic(
              'Msg_ReceiveMsg',
              '새로운 메시지가 도착했습니다.',
            );
          else {
            if (message.length > 30) {
              message = `${message.substr(0, 30)}...`;
            }
          }
        }
      } else {
        // 파일, 이미지 등 메시지 내용없이 파일만 전송한 경우
        message = SERVER_SECURITY_SETTING.getDic('AttachFile', '첨부파일');
      }
    } else {
      message = SERVER_SECURITY_SETTING.getDic(
        'Msg_ReceiveMsg',
        '새로운 메시지가 도착했습니다.',
      );
    }

    const roomID = String(payload.roomID);

    const isNoti = !USER_SETTING.config.notiExRooms[roomID];

    if (isNoti) {
      if (exportProps.isWin) {
        if (global.CUSTOM_ALARM) {
          // custom toast 사용
          showCustomAlarm({
            title: title,
            message: message,
            photoPath: iconImage,
            // iconPath: `file://${iconImage}`,
            iconPath: iconImage,
            clickData: {
              roomID: roomID,
              isChannel: payload.isChannel,
            },
          });
        } else {
          // windows OS toast 사용
          // console.log('iconImage ::', iconImage);
          const noti = new ToastNotification({
            appId: exportProps.appId,
            template: `<toast><visual><binding template="ToastGeneric"><image placement="appLogoOverride" hint-crop="circle" id="1" src="%s"/><text id="1" hint-maxLines="1">%s</text><text id="2">%s</text></binding></visual></toast>`,
            strings: [localIconImage, title, message],
            group: roomID,
          });

          noti.on('activated', t => {
            history.removeGroup({
              group: t.group,
              appId: exportProps.appId,
            });

            const room = t.group;
            openFocusRoom(room, payload.isChannel);
          });

          noti.show();
        }
      } else {
        if (Notification.isSupported()) {
          const noti = new Notification({
            title: title,
            icon: localIconImage,
            body: message,
          });

          // click evt 정의
          noti.on('click', e => {
            openFocusRoom(roomID, payload.isChannel);
          });

          noti.show();
        }
      }

      focusWin.flashFrame(true);
    }
  } catch (e) {
    logger.info('failed send notification');
  }
};

const openFocusRoom = (roomID, isChannel) => {
  logger.info(`click roomID : ${roomID}`);

  const id = ROOM_WIN_MAP[roomID];
  let focusWin = null;

  if (id) {
    const findWin = BrowserWindow.fromId(id);
    if (findWin) {
      focusWin = findWin;
    } else {
      focusWin = BrowserWindow.fromId(1);
      focusWin.webContents.send('onAlarmClick', { roomID, isChannel });
    }
  } else {
    focusWin = BrowserWindow.fromId(1);
    focusWin.webContents.send('onAlarmClick', { roomID, isChannel });
  }

  if (focusWin.isMinimized()) {
    focusWin.restore();
  } else if (!focusWin.isVisible()) {
    focusWin.show();
  }

  focusWin.flashFrame(false);
  focusWin.focus();
};

/** 쪽지 push알림 */
export const notifyNoteMessage = ({
  noteId,
  senderInfo,
  isEmergency = false,
  title = '',
  message = '',
}) => {
  const localIconImage = path.join(
    exportProps.resourcePath,
    'icons',
    'alarm.png',
  );

  if (exportProps.isWin) {
    // Windows Noti
    if (global.CUSTOM_ALARM) {
      // Custon Noti
      showCustomAlarm({
        title,
        message,
        photoPath: senderInfo.photoPath,
        iconPath: senderInfo.photoPath,
      });
      return;
    }
    // WIndow Native Noti
    const noti = new ToastNotification({
      appId: exportProps.appId,
      template: `<toast><visual><binding template="ToastGeneric"><image placement="appLogoOverride" hint-crop="circle" id="1" src="%s"/><text id="1" hint-maxLines="1">%s</text><text id="2">%s</text></binding></visual></toast>`,
      strings: [localIconImage, title, message],
      group: 'Note',
      noteId: noteId,
    });
    const windowParams = {
      type: 'receive',
      viewType: 'receive',
      noteId: noteId,
      isEmergency,
    };
    noti.on('activated', t => {
      history.removeGroup({
        group: t.group,
        appId: exportProps.appId,
      });
      openNoteWindow(windowParams);
    });
    noti.show();
    if (isEmergency === true) {
      openNoteWindow(windowParams);
    }
  } else {
    const noti = new Notification({
      title: title,
      icon: localIconImage,
      body: message,
    });
    const windowParams = {
      type: 'receive',
      viewType: 'receive',
      noteId: noteId,
      isEmergency,
    };

    noti.on('click', e => {
      openNoteWindow(windowParams);
    });
    noti.show();
    if (isEmergency === true) {
      openNoteWindow(windowParams);
    }
  }
};

/*
부모창 기준 창 위치 지정 
option : 
  sticky (부모창 좌, 우에 붙어서 나옴 (화면위치 계산))
  center (현재 창이 위치한 모니터 정가운데 표시)
*/
export const getSubPopupBound = (parentBounds, subSize, option) => {
  const {
    x: parentOffsetX,
    y: parentOffsetY,
    width: parentWidth,
    height: parentHeight,
  } = parentBounds;

  // 창 위치를 확인하여 sub 창을 부모창의 왼쪽, 오른쪽에 붙어서 보이도록 설정
  const subWidth = subSize.width ? subSize.width : 500;
  const subHeight = subSize.height ? subSize.height : 700;

  let retPos = {
    width: subWidth,
    height: subHeight,
    x: parentOffsetX,
    y: parentOffsetY,
  };
  const { x: screenOffsetX, width: screenWidth } =
    screen.getDisplayNearestPoint({
      x: parentOffsetX,
      y: parentOffsetY,
    }).workArea;

  if (option == 'sticky') {
    retPos.x =
      screenOffsetX + subWidth + 10 > parentOffsetX
        ? parentOffsetX + parentWidth + 5 > screenWidth
          ? screenWidth - subWidth
          : parentOffsetX + parentWidth + 5
        : parentOffsetX - subWidth - 5;
    retPos.y = parentOffsetY;
  } else if (option == 'center') {
    retPos.x = parentOffsetX + (parentWidth / 2 - subWidth / 2);
    retPos.y = parentOffsetY + (parentHeight / 2 - subHeight / 2);
  }

  retPos = {
    x: parseInt(retPos.x),
    y: parseInt(retPos.y),
    width: parseInt(retPos.width),
    height: parseInt(retPos.height),
  };

  return retPos;
};

export const clearCache = () => {
  const win = BrowserWindow.fromId(1);

  window.showModalDialog(win, {
    type: 'confirm',
    width: 300,
    height: 120,
    message: SERVER_SECURITY_SETTING.getDic(
      'Msg_ApplyAndRefresh',
      '사용자 임시 데이터를 삭제합니다.<br/>확인 시 열려있는 모든 창이 닫힙니다.',
    ),
    confirm: () => {
      const ses = win.webContents.session;
      ses.clearCache(() => {
        reloadApp(true);
      });
    },
    cancel: () => {},
  });
};

export const initApp = () => {
  const win = BrowserWindow.fromId(1);
  window.showModalDialog(win, {
    type: 'confirm',
    width: 300,
    height: 120,
    message: SERVER_SECURITY_SETTING.getDic(
      'Msg_InitApp',
      '앱 내 모든 설정 및 데이터가 초기화 됩니다.<br/>앱을 초기화 하시겠습니까?',
    ),
    confirm: async () => {
      const ses = win.webContents.session;
      ses.clearCache(async () => {
        const allWindows = BrowserWindow.getAllWindows();

        allWindows.forEach(child => {
          if (child.id != 1) {
            child.close();
          }
        });

        // 로컬 데이터 삭제
        await removeLocalDatabaseDir();

        // app data 삭제
        APP_SECURITY_SETTING.purge();
        SERVER_SECURITY_SETTING.purge();

        app.relaunch();
        app.exit();
      });
    },
    cancel: () => {},
  });
};

export const showVersionInfo = () => {
  window.showVersionInformation();
};

export const showConnectInfo = () => {
  window.showConnectInformation();
};

export const reloadApp = clearConfig => {
  const win = BrowserWindow.fromId(1);

  // 자식창 모두 닫기
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach(child => {
    if (child.id != 1) {
      child.close();
    }
  });

  if (clearConfig) {
    let lang = APP_SECURITY_SETTING.get('lang');

    lang = lang ? lang : '';

    // SERVER SETTING 삭제
    SERVER_SECURITY_SETTING.purge();

    managesvr(
      'get',
      `/na/config?lang=${lang}`,
      {},
      {
        'Cache-Control': 'public, max-age=86400',
      },
      false,
    )
      .then(({ data }) => {
        if (data.status == 'SUCCESS') {
          logger.info('server config load success');
          SERVER_SECURITY_SETTING.setBulk(data.result);
        }

        win.webContents.reloadIgnoringCache();
      })
      .catch(() => {
        logger.info('server config load error');
        // Alert 팝업 open
        win.webContents.reloadIgnoringCache();
      });
  } else {
    win.webContents.reloadIgnoringCache();
  }
};

// TODO: 알림 팝업 커스텀용 ( window alarm 사용 못할 시 사용 )
export const makeCustomAlarmPop = () => {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

  alarmWin = new BrowserWindow({
    x: x + width - 305,
    y: y + height - 85,
    width: 300,
    height: 80,
    webPreferences: {
      nodeIntegration: true,
    },
    transparent: true,
    frame: false,
    show: false,
    movable: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    opacity: 0,
  });

  alarmWin.loadFile(path.join(DIR_NAME, 'templates', 'toastNotification.html'));

  loadingAlarmWin = true;

  alarmWin.once('ready-to-show', () => {
    loadingAlarmWin = false;
  });

  alarmWin.on('closed', () => {
    alarmWin = null;
  });
};

export const showCustomAlarm = obj => {
  if (alarmWin && !loadingAlarmWin) {
    alarmWin && alarmWin.webContents.send('show-toastNotification', obj);
  } else {
    // 창 다시 생성
    makeCustomAlarmPop();
  }
};

export const hideCustomAlarm = () => {
  alarmWin && alarmWin.webContents.send('hide-toastNotification', null);
};

// TODO: 뱃지형 알림 ( 고정알림 표시 )
export const makeFixAlarmPop = () => {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

  fixWin = new BrowserWindow({
    x: x + width - 305,
    y: y + height - 85,
    width: 300,
    height: 80,
    webPreferences: {
      nodeIntegration: true,
    },
    transparent: true,
    frame: false,
    show: false,
    movable: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    opacity: 1,
  });

  fixWin.loadFile(path.join(DIR_NAME, 'templates', 'fixNotification.html'));

  fixWin.webContents.openDevTools();

  /*
  alarmWin.on('ready-to-show', () => {
    alarmWin.show();
  });
  */
};

export const getDictionary = (multiDic, lang) => {
  let dictionary = '';
  if (typeof multiDic === 'string') dictionary = multiDic;

  let returnDic = dictionary;
  let findIdx = 0;
  let defaultIdx = 0;
  const arrDics = dictionary.split(';');

  // let findLang = lang ? lang : APP_SETTING.get('lang') || 'ko';
  let findLang = lang ? lang : APP_SECURITY_SETTING.get('lang') || 'ko';

  let defaultLang =
    SERVER_SECURITY_SETTING.get('config.DefaultClientLang') || 'ko';

  try {
    if (arrDics.length > 0) {
      findIdx = getLanguageIndex(findLang);
      defaultIdx = getLanguageIndex(defaultLang);
    }

    returnDic = arrDics[findIdx];
    // returnDic == '' || returnDic == undefined || returnDic == null
    if (!returnDic) {
      returnDic = arrDics[defaultIdx];

      if (!returnDic) {
        returnDic = arrDics[0];
      }
    }
  } catch (e) {
    returnDic = arrDics[0];
  }

  return returnDic;
};

const getLanguageIndex = lang => {
  let findIdx = 0;
  lang = lang.toLowerCase();
  switch (lang) {
    case 'ko':
      findIdx = 0;
      break;
    case 'en':
      findIdx = 1;
      break;
    case 'ja':
      findIdx = 2;
      break;
    case 'zh':
      findIdx = 3;
      break;
    case 'reserved1':
      findIdx = 4;
      break;
    case 'reserved2':
      findIdx = 5;
      break;
    case 'reserved3':
      findIdx = 6;
      break;
    case 'reserved4':
      findIdx = 7;
      break;
    case 'reserved5':
      findIdx = 8;
      break;
  }

  return findIdx;
};

export const showFixAlarm = obj => {
  fixWin.webContents.send('show-fixNotification', obj);
};

export const hideFixAlarm = () => {
  fixWin.webContents.send('hide-fixNotification', null);
};

export const getMacAddr = () => {
  return new Promise((resolve, reject) => {
    netUtils.all((error, mac) => (error ? reject(error) : resolve(mac)));
  });
};

export const getPublicIPAddr = () => {
  const nets = networkInterfaces();
  let addressList = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addressList.push(net.address);
      }
    }
  }

  return addressList;
};
