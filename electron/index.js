import { app, BrowserWindow, Menu, ipcMain, powerMonitor } from 'electron';
import path from 'path';
import os from 'os';
import url from 'url';
import exportProps from './config/exportProps';
import * as socketEvt from './event/socket';
import * as commonEvt from './event/common';
import * as appDataEvt from './event/appData';
import * as fileUtil from './utils/fileUtils';
import logger from './utils/logger';
import { getTray, setHot, setContextMenu } from './utils/trayUtils';
import { chatsvr, managesvr } from './utils/api';
import * as loginInfo from './utils/loginInfo';
import * as openRoomList from './utils/openRoomList';
import * as notReadList from './utils/notReadList';
import { getUpdater } from './utils/updater';
import { setConfig } from './config/config';
import { getConfig } from './config/configLoader';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import {
  clearCache,
  reloadApp,
  makeCustomAlarmPop,
  getMacAddr,
} from './utils/commonUtils';
import { getInitialBounds } from '../src/lib/d/bound';

import AutoLaunch from 'auto-launch';
import * as window from './utils/window';
import {
  connectRemoteHost,
  connectRemoteViewer,
} from './utils/remoteAssistanceUtil';

/********** GLOBAL VARIABLE **********/
// dirName
global.DIR_NAME = __dirname;
global.RESOURCE_PATH = exportProps.resourcePath;
global.POWER = 'ACTIVE';
global.CONN_SOCKET = null;
global.MAKE_DATA = {};
global.DOMAIN = null;

// SUB POPUP DATA
global.SUB_POP_DATA = {};

// 선택된 PRESENCE DATA
global.BEFORE_PRESENCE = '';
global.ROOM_WIN_MAP = {};
global.MAKE_WIN_MAP = {};

// global config
global.SERVER_SETTING = null;
global.APP_SETTING = null;
global.USER_SETTING = null;

global.CUSTOM_ALARM = false;
/********** GLOBAL VARIABLE **********/

/********** SERVER VARIABLE *********/

// main window와 tary mode 시 garbage collector로 부터 gc 당하지 않도록 global 변수로 선언
let win;
let tray;

let idleChecker = null;
let activeChecker = null;

let appIdleTime = 900; // idle check 관련 시간 (second) (default : 15분)
/********** SERVER VARIABLE *********/

// AUMID SETTING ( window alarm )
app.setAppUserModelId(exportProps.appId);

// electron redux dev tools setting
app.whenReady().then(() => {
  if (exportProps.isDev) {
    installExtension(REDUX_DEVTOOLS)
      .then(name => console.log(`Added Extension: ${name}`))
      .catch(error => console.log(`An error ocurred: ${error}`));
  }
});

const appReady = async () => {
  logger.info(JSON.stringify(exportProps, null, 2));

  APP_SETTING = getConfig('app.setting.json');

  if (APP_SETTING.initFile) {
    // nsis 설치할때 생성할 수 있을지 확인 필요

    APP_SETTING.setBulk({
      // COVISION 운영 전용 하드코딩 START
      // domain: 'http://192.168.11.231',
      // COVISION 운영 전용 하드코딩 END
    });

    logger.info('create app setting file');
  } else {
    // COVISION 운영 전용 하드코딩 START
    // APP_SETTING.set('domain', 'http://192.168.11.231');
    // COVISION 운영 전용 하드코딩 END

    // update 이후 clearLocalData 호출 시
    if (APP_SETTING.get('clearLocalData')) {
      await fileUtil.removeLocalDatabaseDir();
      APP_SETTING.delete('clearLocalData');
    }
  }

  const domainInfo = APP_SETTING.get('domain');
  // 설정된 도메인이 존재하는 경우
  if (domainInfo) {
    // window 생성
    let isCreated = createWindow(true);

    const setConfigAfter = count => {
      SERVER_SETTING = getConfig('server.setting.json');

      let lang = APP_SETTING.get('lang');
      lang = lang ? lang : '';
      // if (SERVER_SETTING.initFile || SERVER_SETTING.config == {}) {
      // APP 재실행 시 무조건 새로 load
      managesvr(
        'get',
        `/na/nf/config?lang=${lang}`,
        {},
        {
          'Cache-Control': 'public, max-age=86400',
        },
        false,
      )
        .then(({ data }) => {
          if (data.status == 'SUCCESS') {
            logger.info('server config load success');
            SERVER_SETTING.setBulk(data.result);
            // app_setting에 설정되지 않은 내용들 server_config의 default config로 초기화
            if (data.result.config) initializeDefaultConfig(data.result.config);
            isCreated.then(() => {
              loadMainWindow();
            });
          } else {
            logger.info('server config load failure');
            SERVER_SETTING.purge();
            isCreated.then(() => {
              loadMainWindow();
            });
          }
        })
        .catch(() => {
          logger.info('server config load error');

          setTimeout(() => {
            if (count !== 60) {
              setConfigAfter(count + 1);
            } else {
              SERVER_SETTING.purge();
              loadMainWindow();
            }
          }, 10000);
        });

      powerMonitor.on('lock-screen', lockScreenEvt);
      powerMonitor.on('unlock-screen', unlockScreenEvt);

      powerMonitor.on('shutdown', e => {
        if (process.platform === 'darwin') {
          // macOS shutdown cancle prevent (uncaughtException: Maximum call stack size exceeded 발생이슈 확인 필요)
          e.preventDefault();
          app.quit();
          app.exit();
        }
      });
    };

    // index.html 파일 재생성
    fileUtil.checkIndexFile(domainInfo, () => {
      setConfig(domainInfo);
      setConfigAfter(0);
    });
  } else {
    createDomainRegistWindow();
  }

  // Create the Application's main menu
  if (process.platform === 'darwin') {
    const template = [
      {
        label: 'Application',
        submenu: [
          {
            label: 'About Application',
            selector: 'orderFrontStandardAboutPanel:',
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function () {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
          {
            label: 'Redo',
            accelerator: 'Shift+CmdOrCtrl+Z',
            selector: 'redo:',
          },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            selector: 'selectAll:',
          },
        ],
      },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }
};

const lockScreenEvt = () => {
  logger.info('lock screen event capture');
  POWER = 'SUSPEND';

  CONN_SOCKET && logger.info(`socket connected : ${CONN_SOCKET.connected}`);

  if (
    win &&
    !loginInfo.isNull() &&
    CONN_SOCKET != null &&
    CONN_SOCKET.connected
  ) {
    clearInterval(idleChecker); // 기존 event 취소
    clearInterval(activeChecker);
    // win.webContents.send('onSystemIdleTime', ''); // idle 전파

    logger.info('call presence change');

    // 직접 서버 호출 ( disconnect 되지 않은 경우에만 server 호출 )
    chatsvr('put', '/presence', {
      userId: loginInfo.getData().id,
      state: 'away',
      type: 'A',
    }).then(response => {
      logger.info('presence change success');
    });
  }
};

const unlockScreenEvt = () => {
  POWER = 'ACTIVE';

  if (win && !loginInfo.isNull() && CONN_SOCKET != null) {
    if (CONN_SOCKET.connected) {
      logger.info('unlock screen :: change presence status');
      // connection이 살아있는 경우
      win.webContents.send(
        'onSystemIdleTimeInit',
        BEFORE_PRESENCE ? BEFORE_PRESENCE : 'online',
      ); // idle init 전파

      // 기존 idle checker 시작
      setIdleChecker(); // idle check 시작

      // re-sync
      Promise.all([
        appDataEvt.reqRoomForSync(),
        appDataEvt.reqUsersForSync(),
        appDataEvt.syncAllRoomsMessages(),
      ]).then(() => {
        logger.info('resync success');
        win.webContents.send('onReSync', null);

        // 활성창 message sync 유도
        openRoomList.clearData();
        notReadList.clearData();
        win.webContents.send('onReSyncMessage', null);
        Object.keys(ROOM_WIN_MAP).forEach(key => {
          const openWindowID = ROOM_WIN_MAP[key];
          const openWin = BrowserWindow.fromId(openWindowID);
          if (openWin) {
            openWin.webContents.send('onReSyncMessage', null);
          }
        });

        logger.info('resync message call success');
      });
    } else {
      logger.info(
        'unlock screen :: disconnected socket :: check network & redirect auto login',
      );
    }
  }

  // 절전모드 복귀 시 Update 체크
  if (!exportProps.isDev) {
    const updater = getUpdater(win);
    updater.check(true);
  }
};

const createWindow = async isLoading => {
  // redux 개발자 도구 세팅
  // if (exportProps.isDev) {
  //   const reduxExt = 'lmhkpmbekcpmknklioeibfkpmmfibljd';
  //   let pathExtension = '';
  //   if (process.platform == 'win32') {
  //     pathExtension = path.join(
  //       os.homedir(),
  //       'AppData',
  //       'Local',
  //       'Google',
  //       'Chrome',
  //       'User Data',
  //       'Default',
  //       'Extensions',
  //       reduxExt,
  //       '2.17.0_0',
  //     );
  //   }

  //   if (pathExtension != '') BrowserWindow.addDevToolsExtension(pathExtension);
  // }

  //NOTE: electron-window-state 대체 검토 필요
  const bounds = getInitialBounds('latestAppBounds');

  // Create the browser window.
  win = new BrowserWindow({
    ...bounds,
    minWidth: 400,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    frame: false,
    show: false,
  });

  if (isLoading) {
    win.loadFile(path.join(DIR_NAME, 'templates', 'appLoading.html'));
    await win.webContents.executeJavaScript(
      `localStorage.removeItem("covi_user_access_token");
      localStorage.removeItem("covi_user_access_id");
      `,
      true,
    );
    // electron 5.x 부터 loadFile의 Promise 지원.
    //Session token remove의 순서 보장을 위해, onLoad에서 분리.
  } else {
    loadMainWindow();
  }

  win.once('ready-to-show', () => {
    win.show();
    // idle checker
  });

  win.on('close', e => {
    APP_SETTING.set('latestAppBounds', win.getBounds());
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null;
  });

  // appLoading에서 수행
  // win.webContents.session.clearStorageData({ storages: ['localstorage'] });
  // logger.info('old storage data remove');

  CUSTOM_ALARM = APP_SETTING.get('customAlarm');

  // win8 이하 버전은 강제로 customAlarm 세팅
  if (exportProps.platform === 'win32') {
    try {
      // 8.1버전 미만 체크 ( NT 6.2 : 8.0 // NT 6.1 : 7 )
      if (
        /^6.2.*/.test(exportProps.osversion) ||
        /^6.1.*/.test(exportProps.osversion)
      ) {
        logger.info('windows7 :: use custom alarm');
        APP_SETTING.set('customAlarm', true);
        CUSTOM_ALARM = true;
      }
    } catch (e) {
      logger.info('win32 os version check failure');
    }
  }

  logger.info(`ALARM TYPE :: ${CUSTOM_ALARM ? 'custom' : 'os'}`);
  if (CUSTOM_ALARM) {
    makeCustomAlarmPop();
  }

  exportProps.isDev && win.webContents.openDevTools();
};

const loadMainWindow = () => {
  tray = getTray(win);

  // win.webContents.openDevTools();
  let firstPage = '';

  // 자동로그인 여부가 true고 자동로그인 관련 데이터가 모두 있을경우에만 자동로그인 실행
  if (
    (APP_SETTING.config.autoLogin || exportProps.isAutoLogin) &&
    APP_SETTING.config.tk &&
    APP_SETTING.config.autoLoginId &&
    APP_SETTING.config.autoLoginPw
  ) {
    firstPage = '#/client/autoLogin';
  }

  let loadURL = '';

  loadURL = url.format({
    pathname: path.join(exportProps.resourcePath, 'renderer', 'index.html'),
    protocol: 'file:',
    slashes: true,
  });

  logger.info(`load URL : ${loadURL}${firstPage}`);
  win.loadURL(`${loadURL}${firstPage}`);

  if (!exportProps.isDev) {
    const updater = getUpdater(win);
    updater.check(true);
  }
};

const createDomainRegistWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({
    width: 500,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    frame: false,
    show: false,
  });

  win.once('ready-to-show', () => {
    ipcMain.once('req-regist-domain', (event, args) => {
      APP_SETTING.set('domain', args);
      fileUtil.makeIndexFile(args, () => {
        setConfig(args);
        // 기존 LocalDatabase 파일이 존재할경우 삭제
        // fileUtil.removeLocalDatabaseDir();
        // app 재실행
        app.relaunch();
        app.exit();
      });
    });

    win.show();
    // idle checker

    exportProps.isDev && win.webContents.openDevTools();
  });

  const loadURL = url.format({
    pathname: path.join(DIR_NAME, 'templates', 'domainRegist.html'),
    protocol: 'file:',
    slashes: true,
  });

  win.loadURL(loadURL);

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null;
  });
};

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow(false);
  } else {
    if (!win.isVisible()) {
      win.show();
    }
  }
});

/*
app.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    console.log(url);
    if (url === 'https://eum.covision.co.kr') {
      event.preventDefault();
      callback(true);
    } else {
      callback(false);
    }
  },
);
*/

app.on('before-quit', event => {
  // alarmWin 제거
  console.log('before-quit');
  alarmWin = null;
});

app.on('will-throw-error', event => {
  event.preventDefault();
});

// APP RUNNING CHECK ( 앱 중복실행 방지 ) ---- START
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  app.exit();
} else {
  //두번째 앱실행시 이벤트 발생
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      } else if (!win.isVisible()) {
        win.show();
      }
      win.focus();
    }
  });

  app.on('ready', appReady);
}
// APP RUNNING CHECK ( 앱 중복실행 방지 ) ---- END

// presence idle checker start
const setActiveChecker = () => {
  if (activeChecker != null) clearInterval(activeChecker);

  activeChecker = setInterval(() => {
    powerMonitor.querySystemIdleTime(idleTime => {
      if (
        idleTime == 0 &&
        win &&
        CONN_SOCKET != null &&
        CONN_SOCKET.connected
      ) {
        clearInterval(activeChecker); // activeChecker 종료
        win.webContents.send(
          'onSystemIdleTimeInit',
          BEFORE_PRESENCE ? BEFORE_PRESENCE : 'online',
        );

        BEFORE_PRESENCE = '';
        setIdleChecker(); // idle checker 시작
      }
    });
  }, 1000);
};

const setIdleChecker = () => {
  if (idleChecker != null) clearInterval(idleChecker);

  idleChecker = setInterval(() => {
    powerMonitor.querySystemIdleTime(idleTime => {
      if (
        appIdleTime < idleTime &&
        win &&
        CONN_SOCKET != null &&
        CONN_SOCKET.connected
      ) {
        clearInterval(idleChecker); // idle checker 종료
        win.webContents.send('onSystemIdleTime', ''); // idle 전파
        setActiveChecker(); // active checker 시작
      }
    });
  }, 1000 * 60);
};
// presence idle checker end

// ipcMain Event Listener
// 로그인 요청
ipcMain.on('req-login', async (event, args) => {
  loginInfo.setData(args.id, args.token, args.userInfo);
  openRoomList.clearData();
  notReadList.clearData();

  // userConfig load
  const settingFile = `setting.${args.id}.json`;

  USER_SETTING = getConfig(settingFile, DOMAIN);
  if (USER_SETTING.initFile) {
    // 빈 Object인 경우 Default setting 세팅
    USER_SETTING.setBulk({
      idleTime: 900,
      desktopNoti: true,
      showNotiContent: true,
      notiExRooms: {},
    });

    appIdleTime = 900;
  } else {
    appIdleTime = USER_SETTING.get('idleTime');
  }

  setIdleChecker(); // idle checker
  event.returnValue = await appDataEvt.reqLogin(event, args);
});

// 로그아웃 요청
ipcMain.on('req-logout', (event, args) => {
  loginInfo.clearData();

  setHot(false);

  APP_SETTING.delete('tk');
  APP_SETTING.delete('autoLoginId');
  APP_SETTING.delete('autoLoginPw');

  USER_SETTING = null;

  // logout 시 모든 checker 해제
  clearInterval(idleChecker);
  clearInterval(activeChecker);
  appDataEvt.reqLogout(event, args);
});

// 방 - BW 매핑정보
ipcMain.on('set-room-win-map', commonEvt.setRoomWinMap);

ipcMain.on('check-room-win-map', commonEvt.checkRoomWinMap);

ipcMain.on('check-room-win-len', commonEvt.checkRoomWinLength);

ipcMain.on('check-room-win-closed', commonEvt.RoomWinClosed);

// 새창으로 방생성 요청
ipcMain.on('req-make-room', commonEvt.reqMakeRoom);

ipcMain.on('check-make-win-map', commonEvt.checkMakeWinMap);

ipcMain.on('check-make-room-win-len', commonEvt.checkMakeRoomWinLength);

// 소켓연결 요청
ipcMain.on('req-socket-connect', socketEvt.reqSocketConnect);

// 서브창 요청
ipcMain.on('req-sub-pop', commonEvt.reqSubPop);

// presence 정보 세팅
ipcMain.on('set-before-presence', commonEvt.setBeforePresence);

ipcMain.on('get-url-graph-data', commonEvt.getUrlGraphData);

ipcMain.on('req-save-error', (event, args) =>
  commonEvt.reqSaveError(event, args, logger),
);

ipcMain.on('open-devtools', e => {
  e.sender.openDevTools();
});

ipcMain.on('clear-cache', clearCache);

ipcMain.on('change-tray', (e, args) => {
  setHot(args.mode);
});

ipcMain.on('modify-roomname-list', (event, args) => {
  const mainMin = BrowserWindow.fromId(1);
  mainMin.send('onModifyRoomName', args);
});

// 동기화 이벤트 등록
ipcMain.on('req-sync-mydept-member', async (event, args) => {
  event.returnValue = await appDataEvt.reqMyDeptMemberForSync(event, args);
});
ipcMain.on('req-sync-contact', async (event, args) => {
  event.returnValue = await appDataEvt.reqContactForSync(event, args);
});
ipcMain.on('req-sync-room', async (event, args) => {
  event.returnValue = await appDataEvt.reqRoomForSync(event, args);
});
ipcMain.on('req-sync-users', async (event, args) => {
  event.returnValue = await appDataEvt.reqUsersForSync(event, args);
});
ipcMain.on('req-sync-all-rooms-messages', async (event, args) => {
  event.returnValue = await appDataEvt.syncAllRoomsMessages(event, args);
});

ipcMain.on('req-sync-room-message', appDataEvt.reqRoomMessageForSync);
ipcMain.on('req-sync-messages', async (event, args) => {
  const returnValue = await appDataEvt.checkSyncMessages(event, args);
  event.returnValue = returnValue;
  if (returnValue) appDataEvt.reqMessagesForSync(event, args);
});
ipcMain.on('req-init-room', appDataEvt.reqInitRoom);

// 안읽음 카운트 초기화
ipcMain.on('req-sync-unread-message', async (event, args) => {
  const returnValue = await appDataEvt.checkUnreadCntMessages(event, args);
  event.returnValue = returnValue;
  if (returnValue) appDataEvt.reqMessagesForSync(event, args);
});

// AppData 조회
ipcMain.on('req-get-room', async (event, args) => {
  event.returnValue = await appDataEvt.reqGetRoom(event, args);
});
ipcMain.on('req-get-roomInfo', async (event, args) => {
  const returnValue = await appDataEvt.reqGetRoomInfo(event, args);
  event.returnValue = returnValue;

  const messages = returnValue.messages;
  if (messages && messages.length > 0) {
    const param = {
      roomId: args.roomId,
      startId: messages[0].messageID,
      endId: messages[messages.length - 1].messageID,
      isNotice: returnValue.room.roomType == 'A',
      type: returnValue.room.roomType,
    };
    appDataEvt.reqUnreadCountForMessagesSync(event, param);
    //appDataEvt.reqUnreadCountForSync(event, param);
  }
});
ipcMain.on('req-get-messages', async (event, args) => {
  const returnValue = await appDataEvt.reqGetMessages(event, args);
  event.returnValue = returnValue;

  const messages = returnValue.data.result;
  if (messages && messages.length > 0) {
    const param = {
      roomId: args.roomID,
      startId: messages[0].messageID,
      endId: messages[messages.length - 1].messageID,
      isNotice: Boolean(args.isNotice),
      isSync: args.dist == 'SYNC',
    };
    appDataEvt.reqUnreadCountForMessagesSync(event, param);
    appDataEvt.reqUnreadCountForSync(event, param);
  }
});
ipcMain.on('req-get-messages-between', async (event, args) => {
  const returnValue = await appDataEvt.selectBetweenMessagesByIDs(event, args);
  event.returnValue = returnValue;
});
ipcMain.on('req-get-search-messages', async (event, args) => {
  event.returnValue = await appDataEvt.reqGetSearchMessages(event, args);
});
// AppData 세팅
ipcMain.on('req-save-rooms', appDataEvt.reqSaveRooms);
ipcMain.on('req-save-message', appDataEvt.reqSaveMessage);
ipcMain.on('req-delete-room', appDataEvt.reqDeleteRoom);
ipcMain.on('req-modify-roomname', appDataEvt.reqModifyRoomName);
ipcMain.on('req-modify-roomsetting', appDataEvt.reqModifyRoomSetting);
ipcMain.on('req-rematch-member', appDataEvt.reqRematchMember);
ipcMain.on('req-read-message', (event, args) => {
  appDataEvt.reqSetUnreadCnt(args);
  // 자기자신이 읽은 메시지 Count 본창에 초기화
});
ipcMain.on('req-save-presence', (event, args) => {
  appDataEvt.reqSetPresence(args);
});
// AppData 삭제
ipcMain.on('remove-localdata-dir', (event, args) => {
  event.returnValue = fileUtil.removeLocalDatabaseDir();
});

ipcMain.on('save-static-config', (event, data) => {
  // global 변수값도 변경
  Object.keys(data).forEach(key => {
    APP_SETTING.set(key, data[key]);
  });

  if (data['autoLaunch'] !== undefined && data['autoLaunch'] !== null) {
    const autoLaunchSetting = new AutoLaunch({
      name: app.getName(),
      path: app.getPath('exe'),
    });

    if (data.autoLaunch) {
      autoLaunchSetting.enable();
    } else {
      autoLaunchSetting.disable();
    }
  }

  event.returnValue = true;
});

ipcMain.on('save-user-config', (event, data) => {
  Object.keys(data).forEach(key => {
    USER_SETTING.set(key, data[key]);
  });

  if (data['idleTime'] !== undefined && data['idleTime'] !== null) {
    // TODO: idleTime이 숫자가 아니거나 30분 이상 지정 시 강제로 30분으로 초기화하는 기능

    appIdleTime = data['idleTime'];
    // interval 재시작
    clearInterval(idleChecker);
    clearInterval(activeChecker);

    setIdleChecker(); // idle checker
  }

  event.returnValue = true;
});

ipcMain.on('room-noti-setting', (event, data) => {
  if (data.type == 'noti') {
    if (data.noti) {
      // delete
      USER_SETTING.delete(`notiExRooms.${data.roomID}`);
    } else {
      // insert
      USER_SETTING.set(`notiExRooms.${data.roomID}`, true);
    }
  } else if (data.type == 'fix') {
    USER_SETTING.set(`notiFixRooms.${data.roomID}`, data.fix);
  }

  console.log('USER_SETTING : ', USER_SETTING);

  event.returnValue = true;
});

ipcMain.on('check-network-status', socketEvt.checkNetwork);

ipcMain.on('clear-domain', e => {
  const ses = win.webContents.session;

  window.showModalDialog(win, {
    type: 'confirm',
    width: 310,
    height: 130,
    message: SERVER_SETTING.getDic('Msg_InitDomain'), //'설정된 도메인 정보를 초기화합니다.<br/>확인 시 앱 데이터가 초기화 됩니다.'
    confirm: () => {
      // 저장된 캐시데이터 삭제
      ses.clearCache(() => {
        // Domain 정보 제거 후 앱 재시작
        APP_SETTING.purge();
        app.relaunch();
        app.exit();
      });
    },
    cancel: () => {},
  });
});

ipcMain.on('get-server-configs', async (event, args) => {
  try {
    let lang = APP_SETTING.get('lang');
    lang = lang ? lang : '';

    const response = await managesvr(
      'get',
      `/na/config?lang=${lang}`,
      {},
      {
        'Cache-Control': 'public, max-age=86400',
      },
      false,
    );

    const data = response.data;
    if (data.status == 'SUCCESS') {
      logger.info('server config load success');
      SERVER_SETTING.setBulk(data.result);
    } else {
      logger.info('server config load failure');
      SERVER_SETTING.purge();
    }
  } catch (e) {
    logger.info('server config load failure');
  }

  event.returnValue = SERVER_SETTING;
});

ipcMain.on('reload-app', (e, args) => {
  // lang값이 변경된 경우 contextMenu 초기화
  args.isLangChange && setContextMenu(win);
  (args.clearConfigs && reloadApp(args.clearConfigs)) || reloadApp(false);
});

ipcMain.on('relaunch-app', (e, args) => {
  app.relaunch();
  app.exit();
});

ipcMain.on('log-info', (_, args) => {
  logger.info(args.message);
});

ipcMain.on('log-error', (_, args) => {
  logger.info(args.message);
});

const initializeDefaultConfig = config => {
  // lang 값이 없는경우
  const lang = APP_SETTING.get('lang');
  const theme = APP_SETTING.get('theme');
  const jobInfo = APP_SETTING.get('jobInfo');

  if (!lang) {
    const defaultLang = config.DefaultClientLang;
    const languageList = config.ClientLangList;

    if (languageList && languageList[defaultLang]) {
      APP_SETTING.set('lang', defaultLang);
    } else {
      APP_SETTING.set('lang', 'ko'); // default "ko"
    }
  }

  if (!theme) {
    const defaultTheme = config.DefaultTheme;

    if (defaultTheme) {
      APP_SETTING.set('theme', defaultTheme);
    } else {
      APP_SETTING.set('theme', 'blue');
    }
  }

  if (!jobInfo) {
    const defaultJobInfo = config.DefaultClientJobInfo;

    if (defaultJobInfo) {
      APP_SETTING.set('jobInfo', defaultJobInfo);
    } else {
      APP_SETTING.set('jobInfo', 'PN');
    }
  }
};

ipcMain.on('check-connect', async (event, type) => {
  let connect = null;
  try {
    if (type == 'chat') {
      connect = await chatsvr(
        'POST',
        '/na/test',
        {},
        {
          'Cache-Control': 'public, max-age=86400',
        },
      );
    } else {
      connect = await managesvr(
        'GET',
        '/na/test',
        {},
        {
          'Cache-Control': 'public, max-age=86400',
        },
      );
    }
  } catch (ex) {
    event.returnValue = false;
  }

  event.returnValue = connect != null;
});

ipcMain.on('req-get-macaddr', async (event, type) => {
  let macAddr = '';
  try {
    macAddr = await getMacAddr();
  } catch (e) {
    console.log(e);
    macAddr = '';
  }

  event.returnValue = macAddr;
});

// renderer process의 logging 채널.
ipcMain.on('req-log-info', async (event, args) => {
  if (typeof args == 'object') {
    logger.info(JSON.stringify(args));
  } else {
    logger.info(args);
  }
  event.returnValue = true;
});

ipcMain.on('onRemoteAssistance', (event, args) => {
  if (args.isViewer == 'Y') {
    connectRemoteViewer(args.sessionKey);
  } else {
    console.log(args.isViewer);
    connectRemoteHost(args.sessionKey);
  }
});
