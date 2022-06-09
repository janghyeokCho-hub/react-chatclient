import './injectGlobal';
import {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  powerMonitor,
  protocol,
  desktopCapturer,
  nativeImage,
  screen,
  clipboard,
  globalShortcut,
} from 'electron';
import address from 'macaddress';
import path from 'path';
import url from 'url';
const fs = require('fs');

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
import {
  getSecureConfig,
  getSecureConfigUsingExsistFile,
  removeExistFile,
} from './config/secureConfigLoader';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import {
  clearCache,
  reloadApp,
  lockApp,
  makeCustomAlarmPop,
  getMacAddr,
  getPublicIPAddr,
} from './utils/commonUtils';
import { getInitialBounds } from '../src/lib/d/bound';

import AutoLaunch from 'auto-launch';
import * as window from './utils/window';
import {
  connectRemoteHost,
  connectRemoteViewer,
  createRemoteVNC,
  createRemoteVNCHost,
} from './utils/remoteAssistanceUtil';

import { openNoteWindow } from './utils/note';
import axios from 'axios';
import Jimp from 'jimp';

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

// Note Window
global.NOTE_WIN_MAP = {};

// global config
global.APP_SECURITY_SETTING = null;
global.SERVER_SECURITY_SETTING = null;
global.USER_SETTING = null;
global.CUSTOM_ALARM = false;

/********** GLOBAL VARIABLE **********/
global.EXTENSION_INFO = null;

/********** SERVER VARIABLE *********/

// main window와 tary mode 시 garbage collector로 부터 gc 당하지 않도록 global 변수로 선언
let win;
let tray;

let idleChecker = null;
let activeChecker = null;

let appIdleTime = 900; // idle check 관련 시간 (second) (default : 15분)
/********** SERVER VARIABLE *********/

const autoLaunchSetting = new AutoLaunch({
  name: app.getName(),
  path: app.getPath('exe'),
});

/*********CAPTURE**********/

let cropWin;
const SOURCE_WIDTH = 10240;
const SOURCE_HEIGHT = 6400;
let folderName = '';
let combineFolderName = '';

// AUMID SETTING ( window alarm )
app.setAppUserModelId(exportProps.appId);

// electron redux dev tools setting
app.whenReady().then(() => {
  if (exportProps.isDev) {
    // BrowserWindow.addDevToolsExtension(
    //   '/Users/ldh/Library/Application Support/Google/Chrome/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.2_6',
    // );
    installExtension(REDUX_DEVTOOLS)
      .then(name => console.log(`Added Extension: ${name}`))
      .catch(error => console.log(`An error ocurred: ${error}`));
  }

});

const appReady = async () => {
  let showInfo = `
  ============================== EUMTALK INFORMATION ==============================
  platform: ${exportProps.platform}
  archiecture: ${exportProps.arch}
  os_version: ${exportProps.osversion}
  application_name: ${exportProps.appName}
  application_id: ${exportProps.appId}
  application_version: ${exportProps.version}
  =================================================================================
  `;
  logger.info(showInfo);

  // if app.setting.json 이나 server.setting.json 파일이 있다면 파일을 읽어서 eumsecure로 변환해서 저장
  const appsetting = getConfig('app.setting.json');
  const serversetting = getConfig('server.setting.json');

  // eumsecure 생성
  await getSecureConfigUsingExsistFile(
    'app.setting.eumsecure',
    appsetting.all(),
  );

  await getSecureConfigUsingExsistFile(
    'server.setting.eumsecure',
    serversetting.all(),
  );

  // 기존 데이터 삭제
  removeExistFile('app.setting.json');
  removeExistFile('server.setting.json');

  // 익스텐션 정보 생성 또는 로드
  EXTENSION_INFO = getSecureConfig('extension.eumsecure');

  // example extension info
  EXTENSION_INFO.set('installList', [
    {
      extensionId: 1,
      title: '그룹웨어',
      description: '메신저에서 그룹웨어를 사용해보세요',
      type: 'I',
      downloadURL: 'http://192.168.11.126:8080',
      photoPath: 'http://192.168.11.80/storage/no_image.jpg',
      createDate: new Date(),
      updateDate: new Date(),
      owner: 'ldh',
      version: '1.0.0',
      iconPath: 'http://192.168.11.80/storage/extension/3.svg',
    },
  ]);

  // 암호화 세팅 파일 생성 (또는 읽어 오기)
  APP_SECURITY_SETTING = getSecureConfig('app.setting.eumsecure');

  if (APP_SECURITY_SETTING.initFile) {
    APP_SECURITY_SETTING.setBulk({
      // 초기 값 설정
      isScreenLock: false,
    });
  } else {
    // update 이후 clearLocalData 호출 시
    if (APP_SECURITY_SETTING.get('clearLocalData')) {
      await fileUtil.removeLocalDatabaseDir();
      APP_SECURITY_SETTING.delete('clearLocalData');
    }
  }

  const domainInfo = APP_SECURITY_SETTING.get('domain');

  // 설정된 도메인이 존재하는 경우
  if (domainInfo) {
    const setConfigAfter = count => {
      SERVER_SECURITY_SETTING = getSecureConfig('server.setting.eumsecure');

      let lang = APP_SECURITY_SETTING.get('lang');
      lang = lang ? lang : '';

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
            SERVER_SECURITY_SETTING.setBulk(data.result);
            if (data.result.config) initializeDefaultConfig(data.result.config);
          } else {
            logger.info('server config load failure');
            SERVER_SECURITY_SETTING.purge();
          }
          createWindow(true, domainInfo).then(loadMainWindow);
        })
        .catch(err => {
          logger.info('server config load error: ' + JSON.stringify(err));
          console.log(err);
          setTimeout(() => {
            if (count !== 60) {
              setConfigAfter(count + 1);
            } else {
              SERVER_SECURITY_SETTING.purge();
              loadMainWindow();
            }
          }, 10000);
        });

      powerMonitor.on('lock-screen', lockScreenEvt);
      powerMonitor.on('unlock-screen', unlockScreenEvt);

      powerMonitor.on('shutdown', async e => {
        if (process.platform === 'darwin') {
          // macOS shutdown cancle prevent (uncaughtException: Maximum call stack size exceeded 발생이슈 확인 필요)
          e.preventDefault();
          try {
            const data = loginInfo.getData();
            if (data && data.id) {
              const response = await chatsvr('put', '/presence', {
                userId: data.id,
                state: 'offline',
                type: 'A',
              });
              logger.info('[1] Exit program. update presence offline ');
              APP_SECURITY_SETTING.set('latestAppBounds', win.getBounds());
              console.log(response.data);
            }
          } catch (err) {
            logger.info('Error when updating presnce offline', err);
          }
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
            click: async function () {
              try {
                const data = loginInfo.getData();
                if (data && data.id) {
                  const response = await chatsvr('put', '/presence', {
                    userId: data.id,
                    state: 'offline',
                    type: 'A',
                  });

                  logger.info('[2] Exit program. update presence offline ');
                  APP_SECURITY_SETTING.set('latestAppBounds', win.getBounds());
                  console.log(response.data);
                }
              } catch (err) {
                logger.info('Error when updating presnce offline', err);
              }
              app.quit();
              app.exit();
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

  const lock = USER_SETTING.get('useSecondPassword');

  // 화면 잠금 체크
  if (lock) {
    lockApp();
  } else {
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
  }

  // 절전모드 복귀 시 Update 체크
  if (!exportProps.isDev) {
    const updater = getUpdater(win);
    updater.check(true);
  }
};

const createWindow = async (isLoading, domainInfo) => {
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

  let defaultSize = {
    width: 450,
    height: 600,
    offset: {
      width: {
        min: 100,
        max: 100,
      },
      height: {
        min: 50,
        max: 100,
      },
    },
  };

  if (domainInfo) {
    const lang = APP_SECURITY_SETTING.get('lang');
    const reqOptions = {
      method: 'get',
      url: `${domainInfo}/restful/na/nf/config?lang=${lang}`,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    };

    const res = await axios(reqOptions);

    if (res?.data?.result?.config) {
      const config = res.data.result.config;

      if (config.clientDefaultSize) {
        defaultSize = {
          width: config.clientDefaultSize.width,
          height: config.clientDefaultSize.height,
          offset: config.clientDefaultSize.offset,
        };
      }
    }
  }

  //NOTE: electron-window-state 대체 검토 필요
  const bounds = getInitialBounds('latestAppBounds', defaultSize);

  console.log(bounds);

  // Create the browser window.
  win = new BrowserWindow({
    width: defaultSize.width,
    height: defaultSize.height,
    minWidth: defaultSize.width - defaultSize.offset.width.min,
    minHeight: defaultSize.height - defaultSize.offset.height.min,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInSubFrames: true,
      webviewTag: true,
    },
    frame: false,
    show: false,
    ...bounds,
  });

  protocol.registerHttpProtocol('eumtalk', (req, cb) => {
    const fullURL = 'eumtalk://' + req.url;
    console.log('open to ' + fullURL);
  });

  if (isLoading) {
    win.loadFile(path.join(DIR_NAME, 'templates', 'appLoading.html'));
    await win.webContents.executeJavaScript(
      `localStorage.removeItem("covi_user_access_token");
      localStorage.removeItem("covi_user_access_id");
      `,
      true,
    );
    win.webContents.userAgent =
      'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36';
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
    APP_SECURITY_SETTING.set('latestAppBounds', win.getBounds());
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null;
  });

  // appLoading에서 수행
  // win.webContents.session.clearStorageData({ storages: ['localstorage'] });
  // logger.info('old storage data remove');

  CUSTOM_ALARM = APP_SECURITY_SETTING.get('customAlarm');

  // win8 이하 버전은 강제로 customAlarm 세팅
  if (exportProps.platform === 'win32') {
    try {
      // 8.1버전 미만 체크 ( NT 6.2 : 8.0 // NT 6.1 : 7 )
      if (
        /^6.2.*/.test(exportProps.osversion) ||
        /^6.1.*/.test(exportProps.osversion)
      ) {
        logger.info('windows7 :: use custom alarm');
        APP_SECURITY_SETTING.set('customAlarm', true);
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
    (APP_SECURITY_SETTING.config.autoLogin || exportProps.isAutoLogin) &&
    APP_SECURITY_SETTING.config.tk &&
    APP_SECURITY_SETTING.config.autoLoginId &&
    APP_SECURITY_SETTING.config.autoLoginPw
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
    width: 450,
    height: 600,
    minWidth: 350,
    minHeight: 550,
    maxHeight: 650,
    maxWidth: 550,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInSubFrames: true,
    },
    frame: false,
    show: false,
  });

  win.once('ready-to-show', () => {
    ipcMain.once('req-regist-domain', (event, args) => {
      APP_SECURITY_SETTING.set('domain', args);
      fileUtil.makeIndexFile(args, () => {
        setConfig(args);
        app.relaunch();
        app.exit();
      });
    });

    win.show();

    exportProps.isDev && win.webContents.openDevTools();
  });

  const loadURL = url.format({
    pathname: path.join(DIR_NAME, 'templates', 'domainRegist.html'),
    protocol: 'file:',
    slashes: true,
  });

  win.loadURL(loadURL);

  win.on('closed', () => {
    win = null;
  });
};

// Quit when all windows are closed.
app.on('window-all-closed', async () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    try {
      const data = loginInfo.getData();

      if (data && data.id) {
        const response = await chatsvr('put', '/presence', {
          userId: data.id,
          state: 'offline',
          type: 'A',
        });
        logger.info('[3] Exit program. update presence offline ');
        APP_SECURITY_SETTING.set('latestAppBounds', win.getBounds());
        console.log(response.data);
      }
    } catch (err) {
      logger.info('Error when updating presnce offline', err);
    }
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
  APP_SECURITY_SETTING.set('latestAppBounds', win.getBounds());
  // alarmWin = null;
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
    const idleTime = powerMonitor.getSystemIdleTime();
    if (idleTime == 0 && win && CONN_SOCKET != null && CONN_SOCKET.connected) {
      clearInterval(activeChecker); // activeChecker 종료
      win.webContents.send(
        'onSystemIdleTimeInit',
        BEFORE_PRESENCE ? BEFORE_PRESENCE : 'online',
      );

      BEFORE_PRESENCE = '';
      setIdleChecker(); // idle checker 시작
    }
  }, 1000);
};

const setIdleChecker = () => {
  if (idleChecker != null) clearInterval(idleChecker);

  idleChecker = setInterval(() => {
    const idleTime = powerMonitor.getSystemIdleTime();
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
  }, 1000 * 60);
};
// presence idle checker end

// ipcMain Event Listener
// 로그인 요청
ipcMain.on('req-login', async (event, args) => {
  loginInfo.setData(args.id, args.token, args.userInfo, args.chineseWall);
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
      useSecondPassword: false,
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

  APP_SECURITY_SETTING.delete('tk');
  APP_SECURITY_SETTING.delete('autoLoginId');
  APP_SECURITY_SETTING.delete('autoLoginPw');

  USER_SETTING = null;

  // logout 시 모든 checker 해제
  clearInterval(idleChecker);
  clearInterval(activeChecker);
  appDataEvt.reqLogout(event, args);
});

// 메인창 - 정보 변경
ipcMain.on('change-mainwin-info', commonEvt.changeMainWindowSize);

// 방 - BW 매핑정보
ipcMain.on('set-room-win-map', commonEvt.setRoomWinMap);

ipcMain.on('check-room-win-map', commonEvt.checkRoomWinMap);

ipcMain.on('check-room-win-len', commonEvt.checkRoomWinLength);

ipcMain.on('check-room-win-closed', commonEvt.RoomWinClosed);

// 새창으로 방생성 요청
ipcMain.on('req-make-room', commonEvt.reqMakeRoom);

ipcMain.on('check-make-win-map', commonEvt.checkMakeWinMap);

ipcMain.on('check-make-room-win-len', commonEvt.checkMakeRoomWinLength);

ipcMain.on('check-note-win-len', commonEvt.checkNoteWinLength);

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
  const isSync = args?.dist === 'SYNC';
  if (isSync) {
    // 삭제된 메시지 동기화
    await appDataEvt.syncChatroomDeletedMessages(args);
  }

  const returnValue = await appDataEvt.reqGetMessages(event, args);
  event.returnValue = returnValue;

  const messages = returnValue.data.result;
  if (messages && messages.length > 0) {
    const param = {
      roomId: args.roomID,
      startId: messages[0].messageID,
      endId: messages[messages.length - 1].messageID,
      isNotice: Boolean(args.isNotice),
      isSync,
    };
    appDataEvt.reqUnreadCountForMessagesSync(event, param);
    appDataEvt.reqUnreadCountForSync(event, param);
  }
});
ipcMain.on('req-get-messages-between', async (event, args) => {
  const returnValue = await appDataEvt.selectBetweenMessagesByIDs(event, args);
  event.returnValue = returnValue;
});
ipcMain.handle('req-get-search-messages', async (event, args) => {
  return appDataEvt.reqGetSearchMessages(event, args);
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
    APP_SECURITY_SETTING.set(key, data[key]);
  });

  if (data['autoLaunch'] !== undefined && data['autoLaunch'] !== null) {
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
    message: SERVER_SECURITY_SETTING.getDic('Msg_InitDomain'), //'설정된 도메인 정보를 초기화합니다.<br/>확인 시 앱 데이터가 초기화 됩니다.'
    confirm: () => {
      // 저장된 캐시데이터 삭제
      ses.clearCache().then(() => {
        // Domain 정보 제거 후 앱 재시작
        APP_SECURITY_SETTING.purge();
        app.relaunch();
        app.exit();
      });
    },
    cancel: () => {},
  });
});

ipcMain.on('get-server-configs', async (event, args) => {
  try {
    let lang = APP_SECURITY_SETTING.get('lang');
    lang = lang ? lang : '';

    const response = await managesvr(
      'get',
      `/na/nf/config?lang=${lang}`,
      {},
      {
        'Cache-Control': 'public, max-age=86400',
      },
      false,
    );

    const data = response.data;
    if (data.status == 'SUCCESS') {
      logger.info('server config load success');
      SERVER_SECURITY_SETTING.setBulk(data.result);
    } else {
      logger.info('server config load failure');
      SERVER_SECURITY_SETTING.purge();
    }
  } catch (e) {
    logger.info('server config load failure');
  }

  event.returnValue = SERVER_SECURITY_SETTING;
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

ipcMain.on('log-info', (event, args) => {
  logger.info(args.message);
  event.returnValue = '';
});

ipcMain.on('log-error', (_, args) => {
  logger.info(args.message);
});

const initializeDefaultConfig = config => {
  // lang 값이 없는경우
  const lang = APP_SECURITY_SETTING.get('lang');
  const theme = APP_SECURITY_SETTING.get('theme');
  const jobInfo = APP_SECURITY_SETTING.get('jobInfo');

  if (!lang) {
    const defaultLang = config.DefaultClientLang;
    const languageList = config.ClientLangList;

    if (languageList && languageList[defaultLang]) {
      APP_SECURITY_SETTING.set('lang', defaultLang);
    } else {
      APP_SECURITY_SETTING.set('lang', 'ko'); // default "ko"
    }
  }

  if (!theme) {
    const defaultTheme = config.DefaultTheme;

    if (defaultTheme) {
      APP_SECURITY_SETTING.set('theme', defaultTheme);
    } else {
      APP_SECURITY_SETTING.set('theme', 'blue');
    }
  }

  if (!jobInfo) {
    const defaultJobInfo = config.DefaultClientJobInfo;

    if (defaultJobInfo) {
      APP_SECURITY_SETTING.set('jobInfo', defaultJobInfo);
    } else {
      APP_SECURITY_SETTING.set('jobInfo', 'PN');
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

// 쪽지용 BrowserWindow 핸들러
ipcMain.on('open-note-window', (event, args) => {
  openNoteWindow(args);
});

ipcMain.on('req-get-remote-info', async (event, args) => {
  const ipAddr = await getPublicIPAddr();
  event.returnValue = ipAddr;
});

ipcMain.on('onVNCRemote', (event, args) => {
  createRemoteVNC(args.roomId);
});

ipcMain.on('onVNCRemoteHost', (event, args) => {
  createRemoteVNCHost(args.roomId);
});

ipcMain.on('req-del-chatroom-message', (_, args) => {
  // Validate data
  if (!args?.roomID) {
    logger.info(
      `Delete Chatroom Message Error: Empty args.roomID ${JSON.stringify(
        args,
      )}`,
    );
    return;
  } else if (Array.isArray(args?.messageIds) === false) {
    logger.info(
      `Delete Chatroom Message Error: args.messageIds is not array ${JSON.stringify(
        args,
      )}`,
    );
    return;
  }
  appDataEvt.deleteChatroomMessage(args);
});


ipcMain.on('create-crop-window', (_, args) => {
  cropWin = new BrowserWindow({
    width: 600,
    height: 500,
    title: 'cropWindow',
    transparent: true,
    // frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  cropWin.moveTop();
  cropWin.loadFile(path.join(DIR_NAME, 'templates', 'crop.html'));

  cropWin.on('close', () => {
    cropWin = null;
  });
});

ipcMain.on('close-crop-window', (_, args) => {
  cropWin.close();
});

function createImg(cropBuffer, fileName, folderName) {
  fs.mkdirSync(`./${folderName}`, { recursive: true });
  setTimeout(() => {
    fs.writeFile(`${folderName}/${fileName}c.png`, cropBuffer, err => {
      if (err) throw err;
      console.log('cropBuffer Saved');
    });
  }, 400);
}

function combineCaptureImage(folderName, combineFolderName) {
  let imageNameList = [];
  const files = fs.readdirSync(`./${folderName}`, { withFileTypes: true });
  imageNameList = files.map(file => `./${folderName}/${file.name}`);
  console.log('imageNameLlist', imageNameList);

  const combineImage = require('combine-image');

  setTimeout(() => {
    combineImage(imageNameList).then(img => {
      fs.mkdirSync(`./${combineFolderName}`, { recursive: true });
      setTimeout(() => {
        img.write(`./${combineFolderName}/out.png`, () => {
          console.log('out.png created');
          fs.readFile(`./${combineFolderName}/out.png`, function (err, buff) {
            if (err) throw err;

            const resultFullScreenBuffer = buff;
            Jimp.read(resultFullScreenBuffer, (err, image) => {
              if (err) throw err;
              image.getBase64Async(Jimp.MIME_PNG).then(base64data => {
                clipboard.writeImage(nativeImage.createFromDataURL(base64data));
                BrowserWindow.getAllWindows().map(item => {
                  item.webContents.send('imageData', base64data);
                  item.webContents.send('imageDataSnipper', base64data);
                });
              });
            });
          });
        });
      }, 500);
    });
  }, 500);
}

ipcMain.on('crop-capture', (event) => {
  const CropPosition = cropWin.getPosition();
  const CropSize = cropWin.getSize();
  folderName = 'cropCapture';
  combineFolderName = 'cropCaptureCombine';

  cropWin.close();

  desktopCapturer
    .getSources({
      types: ['screen'],
      thumbnailSize: {
        width: SOURCE_WIDTH,
        height: SOURCE_HEIGHT,
      },
    })
    .then(async sources => {
      const cropPositionX = CropPosition[0];
      const cropPositionY = CropPosition[1];
      const cropSizeWidth = CropSize[0];
      const cropSizeHeight = CropSize[1];

      const mainScreenWidth = screen.getPrimaryDisplay().bounds.width;
      const mainScreenHeight = screen.getPrimaryDisplay().bounds.height;

      const mainRect = {
        x: cropPositionX,
        y: cropPositionY,
        width: cropSizeWidth,
        height: cropSizeHeight,
      };

      const matchScreen = screen.getDisplayMatching(mainRect);
      const mainScreen = screen.getPrimaryDisplay(mainRect);

      const matchScreenWidth = matchScreen.size.width;
      const matchScreenHeight = matchScreen.size.height;

      const mainScreenSize = {
        width: mainScreenWidth,
        height: mainScreenHeight,
      };

      const matchScreenSize = {
        width: matchScreenWidth,
        height: matchScreenHeight,
      };

      const matchRectY = cropPositionY - matchScreen.bounds.y;
      const matchRectX = cropPositionX - matchScreen.bounds.x;

      const isLeftMonitor = cropPositionX < 0;
      const isRightMonitor = cropPositionX >= mainScreenWidth;
      const isTopMonitor = cropPositionY < 0;
      const isBottomMonitor = cropPositionY >= mainScreenHeight;

      // 크롭할 화면 아이디
      const cropTargetScreenArr = [];
      const isCropTargetScreenId = [];

      if (sources.length > 1) {
        if (matchScreen.id === mainScreen.id) {
          isCropTargetScreenId.push(mainScreen.id);
          cropTargetScreenArr.push({
            id: mainScreen.id,
            resize: mainScreenSize,
            rect: mainRect,
          });
        } else {
          // 크롭할 디스플레이 입력

          let isAlreadyInCondition = false;
          // //왼쪽 위에 캡쳐 / 왼쪽 아래
          if (
            (isLeftMonitor && isTopMonitor) ||
            (isLeftMonitor && isBottomMonitor && !isAlreadyInCondition)
          ) {
            isAlreadyInCondition = true;
            isCropTargetScreenId.push(matchScreen.id);
            cropTargetScreenArr.push({
              id: matchScreen.id,
              resize: matchScreenSize,
              rect: {
                x:
                  matchScreenWidth + matchScreen.bounds.x > 0
                    ? cropPositionX + Math.abs(matchScreen.bounds.x)
                    : matchScreenWidth + cropPositionX,
                y: matchRectY,
                width: cropSizeWidth,
                height: cropSizeHeight,
              },
            });
          }

          // 오른쪽 위에 캡쳐하는 경우// 오른쪽 아래
          if (
            (isRightMonitor && isTopMonitor) ||
            (isRightMonitor && isBottomMonitor && !isAlreadyInCondition)
          ) {
            isAlreadyInCondition = true;
            isCropTargetScreenId.push(matchScreen.id);
            cropTargetScreenArr.push({
              id: matchScreen.id,
              resize: matchScreenSize,
              rect: {
                x:
                  matchScreen.bounds.x < mainScreenWidth
                    ? cropPositionX -
                      mainScreenWidth +
                      (mainScreenWidth - matchScreen.bounds.x)
                    : cropPositionX - mainScreenWidth,
                y: matchRectY,
                width: cropSizeWidth,
                height: cropSizeHeight,
              },
            });
          }

          // 왼쪽 모니터
          if (
            isLeftMonitor &&
            !isAlreadyInCondition &&
            Math.abs(cropPositionX) >= cropSizeWidth
          ) {
            isAlreadyInCondition = true;
            // 크롭할 사이즈보다 cropPosition X축이 큰 경우 <-- 크롭영역이 왼쪽 화면으로 아예 넘어간 경우(겹치지 않음)
            isCropTargetScreenId.push(matchScreen.id);
            cropTargetScreenArr.push({
              id: matchScreen.id,
              resize: matchScreenSize,
              rect: {
                x: matchScreen.size.width + cropPositionX,
                y: matchRectY,
                width: cropSizeWidth,
                height: cropSizeHeight,
              },
            });
          }
          // 위쪽 모니터
          // 크롭할 사이즈보다 cropPosition Y축이 큰 경우
          if (
            isTopMonitor &&
            !isAlreadyInCondition &&
            Math.abs(cropPositionY) >= cropSizeHeight
          ) {
            isAlreadyInCondition = true;
            isCropTargetScreenId.push(matchScreen.id);
            cropTargetScreenArr.push({
              id: matchScreen.id,
              resize: matchScreenSize,
              rect: {
                x: matchRectX,
                y: matchScreenHeight + cropPositionY,
                width: cropSizeWidth,
                height: cropSizeHeight,
              },
            });
          }
          // 오른쪽 모니터
          if (
            cropPositionX + cropSizeWidth >= mainScreenWidth &&
            !isAlreadyInCondition &&
            isRightMonitor
          ) {
            isAlreadyInCondition = true;
            isCropTargetScreenId.push(matchScreen.id);
            cropTargetScreenArr.push({
              id: matchScreen.id,
              resize: matchScreenSize,
              rect: {
                x: cropPositionX - mainScreenWidth,
                y: matchRectY,
                width: cropSizeWidth,
                height: cropSizeHeight,
              },
            });
          }
        }
      } else {
        isCropTargetScreenId.push(mainScreen.id);
        cropTargetScreenArr.push({
          id: mainScreen.id,
          resize: mainScreenSize,
          rect: mainRect,
        });
      }

      for (const [idx, source] of sources.entries()) {
        let fileName = `crop_${idx}`;
        if (isCropTargetScreenId.includes(Number(source.display_id))) {
          const targetScreen = cropTargetScreenArr.filter(
            targetScreen => targetScreen.id === Number(source.display_id),
          )?.[0];
          if (targetScreen) {
            const cropImg = source.thumbnail
              .resize(targetScreen.resize)
              .crop(targetScreen.rect);
            const cropBuffer = cropImg.toPNG();
            const isExists = fs.existsSync(`./${folderName}`);
            if (!isExists) {
              createImg(cropBuffer, fileName, folderName);
            } else {
              fs.rm(`./${folderName}`, { recursive: true }, err => {
                if (err) {
                  throw err;
                }
                createImg(cropBuffer, fileName, folderName);
              });
            }
          }
        }
      }
      setTimeout(() => {
        combineCaptureImage(folderName, combineFolderName);
        BrowserWindow.getAllWindows().map(item => {
          item.webContents.send('openSnipWin');
        });
      }, 500);

    });
});

ipcMain.on('full-screen-capture', (_, args) => {
  folderName = 'capture';
  combineFolderName = 'captureFullscreen';

  desktopCapturer
    .getSources({
      types: ['screen'],
      thumbnailSize: {
        width: 1280,
        height: 720,
      },
    })
    .then(async sources => {
      for (const [idx, source] of sources.entries()) {
        let fileName = `screen_${idx}d`;
        const cropBuffer = source.thumbnail.toPNG();
        const isExists = fs.existsSync(`./${folderName}`);
        if (!isExists) {
          createImg(cropBuffer, fileName, folderName);
        } else {
          fs.rm(`./${folderName}`, { recursive: true }, err => {
            if (err) {
              throw err;
            }
            createImg(cropBuffer, fileName, folderName);
          });
        }
      }
      setTimeout(() => {
        combineCaptureImage(folderName, combineFolderName);
      }, 500);
    });
});

ipcMain.handle('req-mac-address', async () => {
  try {
    const addr = await address.one();
    const addrString = addr.split(':').join('');
    return addrString;
  } catch (err) {
    logger.info('Get mac-address occured an error: ' + JSON.stringify(err));
    return null;
  }
});
