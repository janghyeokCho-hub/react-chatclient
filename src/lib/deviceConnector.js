import path from 'path';
import url from 'url';
import { insert } from '@/lib/util/storageUtil';
import { createTakeLatestTimer } from '@/lib/util/asyncUtil';
import { getConfig } from '@/lib/util/configUtil';
const {
  getEmitter,
  getRemote,
  existsSync,
  writeFile,
  getInitialBounds,
} = require(`@/lib/${DEVICE_TYPE}/connector`);

// 2020.12.21
// for '@C/chat/chatroom/normal/MessagePostBox' Component
// 스크린캡쳐 구현시 ${DEVICE_TYPE}/connector를 사용하기 위해 export
export { getEmitter, getRemote, existsSync, writeFile };

export const evalConnector = options => {
  if (DEVICE_TYPE == 'd') {
    const emitter = getEmitter();
    const remote = getRemote();

    if (options.method == 'on') {
      emitter.on(options.channel, options.callback);
    } else if (options.method == 'once') {
      emitter.once(options.channel, options.callback);
    } else if (options.method == 'send') {
      emitter.send(options.channel, options.message);
    } else if (options.method == 'sendSync') {
      return emitter.sendSync(options.channel, options.message);
    } else if (options.method == 'window-minimize') {
      const currentWindow = remote.getCurrentWindow();
      currentWindow.minimize();
    } else if (options.method == 'window-close') {
      const currentWindow = remote.getCurrentWindow();
      currentWindow.close();
    } else if (options.method == 'getGlobal') {
      return remote.getGlobal(options.name);
    } else if (options.method == 'removeListener') {
      emitter.removeAllListeners(options.channel);
    } else if (options.method == 'invoke') {
      return emitter.invoke(options.channel, options.message);
    }
  }

  return null;
};

export const socketConnect = ({ token, accessid }, events) => {
  const emitter = getEmitter();
  const remote = getRemote();
  const socket = remote.getGlobal('CONN_SOCKET');

  const eventsList = Object.keys(events);

  if (socket == null || socket.connected == false) {
    // 연결 필요
    emitter.send('req-socket-connect', {
      token: token,
      accessid: accessid,
      events: eventsList,
    });
  }

  // TODO: hasListener 존재여부 ?
  emitter.removeAllListeners('socket-event');
  // event 연결
  emitter.on('socket-event', (event, args) => {
    const func = events[args.channel];
    func(args.payload);
  });
};

export const closeSocket = logout => {
  const emitter = getEmitter();
  const remote = getRemote();
  const socket = remote.getGlobal('CONN_SOCKET');

  if (socket != null && !socket.disconnected) {
    if (logout) {
      // logout시 disconnect option 해제
      if (socket.hasListeners('disconnect')) socket.off('disconnect');
      socket.on('disconnect', () => {
        console.log('socket disconnected success');
      });
    }
    socket.close();
  }

  emitter.removeAllListeners('socket-event');
};

export const newExtensionWindow = (winName, id, openURL) => {
  let roomObj = null;
  if (DEVICE_TYPE == 'b') {
    roomObj = window.open(
      openURL,
      winName,
      'toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=500,height=700',
    );
  } else if (DEVICE_TYPE == 'd') {
    const remote = getRemote();
    const emitter = getEmitter();
    const openWinID = emitter.sendSync('check-room-win-map', { roomID: id });

    console.log('openWinID, ', openWinID);
    if (openWinID === null) {
      const dirName = remote.getGlobal('RESOURCE_PATH');
      let initial = null;
      const currentWindow = remote.getCurrentWindow();
      const bounds = currentWindow.getBounds();
      const display = remote.screen.getDisplayNearestPoint({
        x: bounds.x,
        y: bounds.y,
      });

      initial = {
        width: 500,
        height: 700,
        x: display.workArea.x + (display.workArea.width / 2 - 250),
        y: display.workArea.y + (display.workArea.height / 2 - 350),
        minWidth: 400,
        minHeight: 600,
      };

      roomObj = new remote.BrowserWindow({
        ...initial,
        frame: false,
        webPreferences: { nodeIntegration: true },
      });

      const loadURL = `${url.format({
        pathname: path.join(dirName, 'renderer', 'index.html'),
        protocol: 'file:',
        slashes: true,
      })}${openURL}`;

      console.log(roomObj);
      console.log(loadURL);
      roomObj.loadURL(loadURL);

      //bindChatRoomDefaultEvent(id, roomObj, false);

      // roomObj.on('closed', () => {
      //   emitter.sendSync('check-room-win-closed', { roomID: id });
      //   roomObj = null;
      // });

      roomObj.once('ready-to-show', () => {
        roomObj.show();
      });
    } else {
      roomObj = remote.BrowserWindow.fromId(openWinID);
      if (roomObj.isMinimized()) {
        roomObj.restore();
      }
      roomObj.focus();
    }
  }
  return roomObj;
};

export const newChatRoom = (winName, id, openURL) => {
  const maxWindow = getConfig('maxWindow', null);
  let roomObj = null;
  if (DEVICE_TYPE == 'b') {
    roomObj = window.open(
      openURL,
      winName,
      'toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=500,height=700',
    );
  } else if (DEVICE_TYPE == 'd') {
    const remote = getRemote();
    const emitter = getEmitter();

    const roomLength = emitter.sendSync('check-room-win-len');
    const newRoomLength = emitter.sendSync('check-make-room-win-len');
    const len = roomLength + newRoomLength;

    if (maxWindow !== null) {
      if (maxWindow !== 0) {
        if (len > maxWindow - 1) {
          return null;
        }
      }
    }

    const openWinID = emitter.sendSync('check-room-win-map', { roomID: id });
    if (openWinID === null) {
      const dirName = remote.getGlobal('RESOURCE_PATH');
      const roomInfo = /(chatroom)\/([0-9]*)/g.exec(openURL);
      let initial = null;

      if (roomInfo && roomInfo[0]) {
        const bounds = getInitialBounds(roomInfo[0]);
        // APP_SETTING에 저장된 bounds가 있는 경우
        if (!!bounds) {
          initial = {
            ...bounds,
            // x: display.workArea.x + (display.workArea.width / 2 - 250),
            // y: display.workArea.y + (display.workArea.height / 2 - 350),
            minWidth: 400,
            minHeight: 600,
          };
        } else {
          //
        }
      }

      if (initial === null) {
        const currentWindow = remote.getCurrentWindow();
        const bounds = currentWindow.getBounds();
        // The Display object represents a physical display connected to the system.
        // A fake Display may exist on a headless system, or a Display may correspond to a remote, virtual display.
        const display = remote.screen.getDisplayNearestPoint({
          x: bounds.x,
          y: bounds.y,
        });

        initial = {
          width: 500,
          height: 700,
          x: display.workArea.x + (display.workArea.width / 2 - 250),
          y: display.workArea.y + (display.workArea.height / 2 - 350),
          minWidth: 400,
          minHeight: 600,
        };
      }

      roomObj = new remote.BrowserWindow({
        ...initial,
        frame: false,
        webPreferences: { nodeIntegration: true },
        // show: false,
      });

      const loadURL = `${url.format({
        pathname: path.join(dirName, 'renderer', 'index.html'),
        protocol: 'file:',
        slashes: true,
      })}${openURL}`;

      roomObj.loadURL(loadURL);

      bindChatRoomDefaultEvent(id, roomObj, false);

      roomObj.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        emitter.sendSync('check-room-win-closed', { roomID: id });
        roomObj = null;
      });

      roomObj.once('ready-to-show', () => {
        roomObj.show();
      });
    } else {
      roomObj = remote.BrowserWindow.fromId(openWinID);

      // 기존에 있는창이면 store에 세팅하고 포커스는 직접 부여
      if (roomObj.isMinimized()) {
        roomObj.restore();
      }

      roomObj.focus();
    }
  }

  return roomObj;
};

const bindChatRoomDefaultEvent = (id, roomObj, isChannel) => {
  const remote = getRemote();
  const emitter = getEmitter();
  const parentWin = remote.BrowserWindow.fromId(1);

  emitter.send('set-room-win-map', { roomID: id, winID: roomObj.id });
  const APP_SETTING = remote.getGlobal('APP_SETTING');

  // 이벤트 핸들러에 debounce 적용
  const debounceTimer = createTakeLatestTimer(100);
  let latestBounds = null;
  let latestDisplay = null;

  // 이벤트 핸들러에서 bounds 업데이트
  const handleWindowState = () =>
    debounceTimer.takeLatest(() => {
      latestBounds = roomObj.getBounds();
      const display = remote.screen.getDisplayNearestPoint(latestBounds);
      latestDisplay = display;
    });

  // resize, move에 bounds 업데이트 핸들러 등록
  roomObj.on('resize', handleWindowState);
  roomObj.on('move', handleWindowState);

  roomObj.on(
    'close',
    (roomId => {
      const rId = roomId;
      return async () => {
        /**
         * 2021.01.22
         *
         * 채널방의 bounds 저장키       channel/방번호
         * 일반 채팅방의 bounds 저장키  chatroom/방번호
         */
        if (latestBounds) {
          const settingKey = isChannel ? `channel/${rId}` : `chatroom/${rId}`;
          APP_SETTING.set(settingKey, {
            ...latestBounds,
            display: latestDisplay,
          });
        }
        parentWin.send('onNewWinClose', { roomID: rId, isChannel: isChannel });
      };
    })(id),
  );

  /*
  roomObj.on(
    'focus',
    (roomId => {
      const rId = roomId;
      return () => {
        parentWin.send('onNewWinFocus', rId);
      };
    })(id),
  );
  */

  /*
  roomObj.on(
    'blur',
    (roomId => {
      const rId = roomId;
      return () => {
        parentWin.send('onNewWinBlur', rId);
      };
    })(id),
  );
  */
};

export const bindLeaveChatRoom = (room, userId) => {
  const remote = getRemote();
  const parentWin = remote.BrowserWindow.fromId(1);

  const roomObj = remote.getCurrentWindow();

  roomObj.removeAllListeners('close');
  parentWin.send('onNewWinLeave', room, userId);
  roomObj.close();
};

// 채널
export const bindLeaveChannel = (channel, userId) => {
  const remote = getRemote();
  const parentWin = remote.BrowserWindow.fromId(1);

  const roomObj = remote.getCurrentWindow();

  roomObj.removeAllListeners('close');
  parentWin.send('onNewWinChannelLeave', channel, userId);
  roomObj.close();
};

export const sendMain = (channel, data) => {
  if (DEVICE_TYPE == 'd') {
    const remote = getRemote();
    const parentWin = remote.BrowserWindow.fromId(1);
    parentWin.send(channel, data);
  }
};

export const makeChatRoom = (winName, makeData, openURL) => {
  const maxWindow = getConfig('maxWindow', null);
  if (DEVICE_TYPE == 'b') {
    window.open(
      openURL,
      winName,
      'toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=500,height=700',
    );

    window[winName] = {
      getRoomInfo: (makeData => () => makeData)(makeData),
    };
  } else if (DEVICE_TYPE == 'd') {
    // makeRoom의 경우 전달되어야 하는 창에 데이터 세팅이 되어야 하므로
    // main -> renderer 구조로 창 생성
    const emitter = getEmitter();
    const remote = getRemote();

    const roomLength = emitter.sendSync('check-room-win-len');
    const newRoomLength = emitter.sendSync('check-make-room-win-len');
    const len = roomLength + newRoomLength;

    if (maxWindow !== null) {
      if (maxWindow !== 0) {
        if (len > maxWindow - 1) {
          return null;
        }
      }
    }

    const openWinID = emitter.sendSync('check-make-win-map', {
      winName: winName,
    });

    if (openWinID == null) {
      emitter.send('req-make-room', {
        path: openURL,
        makeData: makeData,
        winName: winName,
      });
    } else {
      const roomObj = remote.BrowserWindow.fromId(openWinID);

      // 기존에 있는창이면 store에 세팅하고 포커스는 직접 부여
      if (roomObj.isMinimized()) {
        roomObj.restore();
      }

      roomObj.focus();
    }
  }
};

export const getMakeData = () => {
  const remote = getRemote();
  const id = remote.getCurrentWindow().id;
  return remote.getGlobal('MAKE_DATA')[id];
};

export const mappingChatRoomEvent = roomID => {
  const remote = getRemote();
  bindChatRoomDefaultEvent(roomID, remote.getCurrentWindow(), false);
};

/*
sub popup 호출
openURL : 새창 URL,
data : 새창에 전달할 data,
width : 새창 width,
height : 새창 height,
position : 새창 position ( sticky, center )
isChange : 한개의 key로 창이 전환되는 형태 (reload 됨)
options : 새창에 전달할 event listener 들
*/
export const openSubPop = (
  winName,
  openURL,
  data,
  width,
  height,
  position,
  isChange,
  options,
) => {
  if (DEVICE_TYPE == 'd') {
    // makeRoom의 경우 전달되어야 하는 창에 데이터 세팅이 되어야 하므로
    // main -> renderer 구조로 창 생성
    const emitter = getEmitter();
    const parentId = getRemote().getCurrentWindow().id;
    emitter.send('req-sub-pop', {
      path: openURL,
      winName,
      data,
      width,
      height,
      position,
      isChange,
      options,
      parentId,
    });
  }
};

export const sendParent = (channel, winName, data) => {
  const remote = getRemote();
  const parentId = remote.getGlobal('SUB_POP_DATA')[winName].parentId;

  const parentWin = remote.BrowserWindow.fromId(parentId);
  if (parentWin) {
    parentWin.webContents.send(channel, data);
  } else {
    // 이미 부모창이 닫힌경우 최상위 부모창에 전달
    const main = remote.BrowserWindow.fromId(1);
    main.webContents.send(channel, data);
  }
};

export const sendAllChatWindows = (channel, data) => {
  const remote = getRemote();
  const arrChatRooms = remote.getGlobal('ROOM_WIN_MAP');

  const arrWinIds = [1, ...arrChatRooms];

  for (const winId in arrWinIds) {
    const win = remote.BrowserWindow.fromId(winId);
    if (win) win.webContents.send(channel, data);
  }
};

export const moveContentView = (roomID, data) => {
  const remote = getRemote();
  const roomWinId = remote.getGlobal('ROOM_WIN_MAP')[roomID];

  let sendWin = null;

  if (roomWinId) {
    const parentWin = remote.BrowserWindow.fromId(roomWinId);
    if (parentWin) {
      sendWin = parentWin;
      data.isMain = false;
    }
  }

  if (sendWin == null) {
    // 이미 부모창이 닫힌경우 최상위 부모창에 전달
    sendWin = remote.BrowserWindow.fromId(1);
    data.isMain = true;
  }

  sendWin.webContents.send('onMoveView', data);
};

export const sendSubPop = (channel, winName, data) => {
  const remote = getRemote();
  const subPopData = remote.getGlobal('SUB_POP_DATA')[winName];
  const subPopId = subPopData && subPopData.id;
  if (subPopId) {
    const subPopWin = remote.BrowserWindow.fromId(subPopId);

    if (subPopWin) {
      subPopWin.webContents.send(channel, data);
    }
  }
};

export const getSubPopData = winName => {
  const remote = getRemote();
  return remote.getGlobal('SUB_POP_DATA')[winName].data;
};

export const openLink = link => {
  const shell = getRemote().shell;

  shell.openExternal(link);
};

export const openLinkNative = link => {
  const remote = getRemote();
  const currentWindow = remote.getCurrentWindow();
  const bounds = currentWindow.getBounds();

  // The Display object represents a physical display connected to the system.
  // A fake Display may exist on a headless system, or a Display may correspond to a remote, virtual display.
  const display = remote.screen.getDisplayNearestPoint({
    x: bounds.x,
    y: bounds.y,
  });

  const initial = {
    width: 1000,
    height: 600,
    x: display.workArea.x + (display.workArea.width / 2 - 250),
    y: display.workArea.y + (display.workArea.height / 2 - 350),
    minWidth: 600,
    minHeight: 400,
  };

  const subWin = new remote.BrowserWindow({
    ...initial,
    frame: true,
    webPreferences: { nodeIntegration: true },
    show: false,
  });

  subWin.setMenu(null);

  subWin.loadURL(link);

  subWin.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    subWin = null;
  });

  subWin.once('ready-to-show', () => {
    subWin.show();
  });
};

export const openFile = path => {
  if (existsSync(path)) {
    const shell = getRemote().shell;
    shell.openItem(path);
  } else {
    throw new Error('FILE NOT EXIST');
  }
};

export const openPath = path => {
  if (existsSync(path)) {
    const shell = getRemote().shell;
    shell.showItemInFolder(path);
  } else {
    throw new Error('FILE NOT EXIST');
  }
};

export const saveFile = (path, name, data, options) => {
  // 중복되지 않는 파일명 생성
  const savePath = makeFileName(path, name);

  writeFile(savePath, Buffer.from(data), err => {
    if (err) {
      // error 처리 ?
    } else {
      insert('files', { token: options.token, path: savePath }, () => {
        console.log('file info save');
      });

      if (options.execute) {
        getRemote().shell.openItem(savePath);
      }
    }
  });
};

export const getDownloadDefaultPath = () => {
  const remote = getRemote();
  if (remote) {
    const osDownloadPath = remote.app.getPath('downloads');
    const appSetting = remote.getGlobal('APP_SETTING');
    const appDownloadPath = appSetting.get('defaultDownloadPath');

    if (appDownloadPath) {
      if (existsSync(appDownloadPath)) {
        return appDownloadPath;
      } else {
        // 기존 설정 삭제
        appSetting.delete('defaultDownloadPath');
      }
    }

    return osDownloadPath;
  } else {
    return null;
  }
};

export const getDownloadPath = async () => {
  const remote = getRemote();
  if (remote) {
    const downloadPathCheck = remote
      .getGlobal('APP_SETTING')
      .get('downloadPathCheck');
    const defaultDownloadPath = getDownloadDefaultPath();
    if (downloadPathCheck) {
      const path = await new Promise((resolve, reject) => {
        openDirectoryDialog(defaultDownloadPath, filePaths => {
          if (filePaths && filePaths.length > 0) {
            const selectedFilePath = filePaths[0];
            resolve(selectedFilePath);
          }

          resolve(null);
        });
      });
      return path;
    } else {
      return defaultDownloadPath;
    }
  } else {
    return null;
  }
};

export const openDirectoryDialog = (defaultPath, callback) => {
  const remote = getRemote();
  remote.dialog.showOpenDialog(
    {
      defaultPath: defaultPath,
      properties: [
        'openDirectory',
        'createDirectory',
        'promptToCreate',
        'noResolveAliases',
      ],
    },
    callback,
  );
};

const makeFileName = (basePath, name) => {
  const fileName = name.substring(0, name.lastIndexOf('.'));
  let saveFileName = fileName;
  const ext = name.substring(name.lastIndexOf('.'));

  let existIdx = 0;
  let savePath = path.join(basePath, `${saveFileName}${ext}`);

  // 중복 파일 처리
  while (existsSync(savePath)) {
    saveFileName = `${fileName}(${++existIdx})`;
    savePath = path.join(basePath, `${saveFileName}${ext}`);
  }

  return savePath;
};

// AppData 동기화
export const syncAppData = data => {
  const emitter = getEmitter();

  let returnVal = false;
  // 로그인 정보 불러오기
  returnVal = emitter.sendSync('req-login', {
    token: data.token,
    id: data.result.id,
    accessid: data.result.id,
    createDate: data.createDate,
    userInfo: data.result,
  });

  // 채팅방 마지막 메시지 동기화 (async)
  //emitter.send('req-sync-room-message');

  // 내 부서 하위 사용자 불러오기
  //returnVal = emitter.sendSync('req-sync-mydept-member');

  // 연락처 정보 불러오기
  //returnVal = emitter.sendSync('req-sync-contact');

  // 채팅방 정보 불러오기
  returnVal = emitter.sendSync('req-sync-room');

  // 사용자 정보 불러오기
  returnVal = emitter.sendSync('req-sync-users');

  // 모든 대화 정보 불러오기
  returnVal = emitter.sendSync('req-sync-all-rooms-messages');

  return returnVal;
};

export const restoreMainWindow = () => {
  try {
    const mainWindow = getRemote().BrowserWindow.fromId(1);

    if (!mainWindow.isVisible()) {
      // tray
      mainWindow.showInactive();
    }
  } catch (e) {}
};

export const closeAllChildWindow = () => {
  try {
    const allWindows = getRemote().BrowserWindow.getAllWindows();
    allWindows.forEach(win => {
      if (win.id != 1) {
        win.close();
      }
    });
  } catch (e) {
    // console.log('Windows has already closed');
  }
};

export const quit = () => {
  getRemote().app.quit();
  getRemote().app.exit();
};

export const relaunch = autoLogin => {
  getRemote().app.relaunch({
    args: process.argv
      .slice(1)
      .concat([
        DEF_MODE == 'development' ? '--dev' : '--prod',
        '--relaunch',
        autoLogin ? '--login' : '',
      ]),
  });
};

export const isMainWindow = () => {
  const remote = getRemote();
  if (remote) {
    return remote.getCurrentWindow().id == 1;
  } else {
    return false;
  }
};

export const closeWindow = () => {
  getRemote().getCurrentWindow().close();
};

export const themeChange = theme => {
  try {
    const remote = getRemote();
    const allWindows = remote.BrowserWindow.getAllWindows();
    const currentWindowId = remote.getCurrentWindow().id;
    allWindows.forEach(win => {
      if (win.id != currentWindowId) {
        win.webContents.send('onThemeChange', theme);
      }
    });
  } catch (e) {
    // console.log('Windows has already closed');
  }
};

export const fontSizeChange = fontSize => {
  try {
    const remote = getRemote();
    const allWindows = remote.BrowserWindow.getAllWindows();
    const currentWindowId = remote.getCurrentWindow().id;
    allWindows.forEach(win => {
      if (win.id != currentWindowId) {
        win.webContents.send('onFontSizeChange', fontSize);
      }
    });
  } catch (e) {
    // console.log('Windows has already closed');
  }
};

export const resetParentUnreadCount = args => {
  const remote = getRemote();

  remote.BrowserWindow.fromId(1).webContents.send('onNewWinReadMessage', args);
};

export const checkNetworkStatus = (resolve, reject) => {
  const emitter = getEmitter();
  console.log('check network...');
  emitter.once('onNetworkStatus', (event, result) => {
    console.log(result);
    if (result) {
      resolve();
    } else {
      reject();
    }
  });

  emitter.send('check-network-status', '');
};

export const focusWin = () => {
  const remote = getRemote();
  const currWin = remote.getCurrentWindow();

  if (!currWin.isVisible()) {
    // tray
    currWin.showInactive();
  }

  if (currWin.isMinimized()) {
    currWin.restore();
  }

  currWin.focus();
  // currWin.flashFrame(true);
};

// 채널
export const newChannel = (winName, id, openURL) => {
  let channelObj = null;
  if (DEVICE_TYPE == 'b') {
    channelObj = window.open(
      openURL,
      winName,
      'toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=500,height=700',
    );
  } else if (DEVICE_TYPE == 'd') {
    const remote = getRemote();
    const emitter = getEmitter();
    const openWinID = emitter.sendSync('check-room-win-map', { roomID: id });

    if (openWinID == null) {
      const dirName = remote.getGlobal('RESOURCE_PATH');
      const roomInfo = /(channel)\/([0-9]*)/g.exec(openURL);
      let initial = null;

      if (roomInfo && roomInfo[0]) {
        const bounds = getInitialBounds(roomInfo[0]);
        // APP_SETTING에 저장된 bounds가 있는 경우
        if (!!bounds) {
          initial = {
            ...bounds,
            // x: display.workArea.x + (display.workArea.width / 2 - 250),
            // y: display.workArea.y + (display.workArea.height / 2 - 350),
            minWidth: 400,
            minHeight: 600,
          };
        } else {
          //
        }
      }

      if (initial === null) {
        const currentWindow = remote.getCurrentWindow();
        const bounds = currentWindow.getBounds();
        // The Display object represents a physical display connected to the system.
        // A fake Display may exist on a headless system, or a Display may correspond to a remote, virtual display.
        const display = remote.screen.getDisplayNearestPoint({
          x: bounds.x,
          y: bounds.y,
        });

        initial = {
          width: 500,
          height: 700,
          x: display.workArea.x + (display.workArea.width / 2 - 250),
          y: display.workArea.y + (display.workArea.height / 2 - 350),
          minWidth: 400,
          minHeight: 600,
        };
      }

      channelObj = new remote.BrowserWindow({
        ...initial,
        frame: false,
      });

      const loadURL = `${url.format({
        pathname: path.join(dirName, 'renderer', 'index.html'),
        protocol: 'file:',
        slashes: true,
      })}${openURL}`;

      channelObj.loadURL(loadURL);

      bindChatRoomDefaultEvent(id, channelObj, true);

      channelObj.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        channelObj = null;
      });

      channelObj.once('ready-to-show', () => {
        channelObj.show();
      });
    } else {
      channelObj = remote.BrowserWindow.fromId(openWinID);

      // 기존에 있는창이면 store에 세팅하고 포커스는 직접 부여
      if (channelObj.isMinimized()) {
        channelObj.restore();
      }

      channelObj.focus();
    }
  }
  return channelObj;
};

export const setWindowTitle = title => {
  const win = getRemote().getCurrentWindow();
  win.setTitle(title);

  // 화면내 custom title 변경
  if (typeof window.changeCustomTitle === 'function') {
    window.changeCustomTitle(title);
  }
};

export const getWindowAlwaysTop = () => {
  try {
    const win = getRemote().getCurrentWindow();
    return win.isAlwaysOnTop();
  } catch (e) {}
  return false;
};

export const setWindowAlwaysTop = flag => {
  try {
    const win = getRemote().getCurrentWindow();
    win.setAlwaysOnTop(flag);
  } catch (e) {}
};

export const setWindowOpacity = deg => {
  try {
    const win = getRemote().getCurrentWindow();
    win.setOpacity(deg);
  } catch (e) {
    console.log(e);
  }
};
