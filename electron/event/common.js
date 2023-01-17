import { BrowserWindow, screen } from 'electron';
import url from 'url';
import path from 'path';
import LRU from 'lru-cache';
import axios from 'axios';
import cheerio from 'cheerio';
import { detect as detectCharset } from 'jschardet';
import iconv from 'iconv-lite';
import { updateLinkInfo } from './appData';
import { getSubPopupBound } from '../utils/commonUtils';
import logger from '../utils/logger';

const cache = new LRU({
  max: 15,
  ttl: 1000 * 60 * 60, // 1 hour
});

export const setRoomWinMap = (event, args) => {
  ROOM_WIN_MAP[args.roomID] = args.winID;
};

export const checkRoomWinMap = (event, args) => {
  const winID = ROOM_WIN_MAP[args.roomID];
  if (winID) {
    const findWin = BrowserWindow.fromId(winID);
    if (findWin) {
      // mapping 된 winID가 존재하고 창도 존재하는 경우 새창을 열지 않음
      event.returnValue = winID;
    } else {
      event.returnValue = null;
    }
  } else {
    event.returnValue = null;
  }
};

export const changeMainWindowSize = (event, args) => {
  const mainWin = BrowserWindow.fromId(1);

  if (mainWin) {
    mainWin.width = args.width;
    if (args.minWidth) mainWin.minWidth = args.minWidth;
    if (args.maxWidth) mainWin.maxWidth = args.maxWidth;

    mainWin.height = args.height;
    if (args.minHeight) mainWin.minHeight = args.minHeight;
    if (args.maxHeight) mainWin.maxHeight = args.maxHeight;

    mainWin.resizable = args.resizable;
  }

  event.returnValue = true;
};

export const checkRoomWinLength = (event, args) => {
  event.returnValue = Object.keys(ROOM_WIN_MAP).length;
};

export const checkMakeRoomWinLength = (event, args) => {
  event.returnValue = Object.keys(MAKE_WIN_MAP).length;
};

export const checkNoteWinLength = (event, args) => {
  event.returnValue = Object.keys(NOTE_WIN_MAP).length;
};

export const RoomWinClosed = (event, args) => {
  ROOM_WIN_MAP[args.roomID] && delete ROOM_WIN_MAP[args.roomID];
  event.returnValue = true;
};

export const reqMakeRoom = (_, args) => {
  // 새창 생성
  // 새창 id를 key값으로 makedata 세팅
  // makedata 세팅 후 화면 show
  const loadURL = `${url.format({
    pathname: path.join(RESOURCE_PATH, 'renderer', 'index.html'),
    protocol: 'file:',
    slashes: true,
  })}${args.path}`;

  const mainWindow = BrowserWindow.fromId(1);
  const bounds = mainWindow.getBounds();

  // The Display object represents a physical display connected to the system.
  // A fake Display may exist on a headless system, or a Display may correspond to a remote, virtual display.
  const display = screen.getDisplayNearestPoint({
    x: bounds.x,
    y: bounds.y,
  });

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

  const config = SERVER_SECURITY_SETTING.get('config');

  if (config?.clientDefaultSize) {
    defaultSize = {
      width: config.clientDefaultSize.width,
      height: config.clientDefaultSize.height,
      offset: config.clientDefaultSize.offset,
    };
  }

  const initial = {
    width: defaultSize.width,
    height: defaultSize.height,
    x: display.workArea.x + (display.workArea.width / 2 - 250),
    y: display.workArea.y + (display.workArea.height / 2 - 350),
    minWidth: defaultSize.width - defaultSize.offset.width.min,
    minHeight: defaultSize.height - defaultSize.offset.height.min,
    maxWidth: defaultSize.width + defaultSize.offset.width.max,
    maxHeight: defaultSize.height + defaultSize.offset.height.max,
  };

  let makeWin = new BrowserWindow({
    ...initial,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInSubFrames: true,
    },
  });

  MAKE_DATA[makeWin.id] = args.makeData;

  // 1:1 채팅방의 경우 Mapping Data Setting
  if (args.makeData.makeInfo.roomType == 'M') {
    MAKE_WIN_MAP[args.winName] = makeWin.id;
  }

  makeWin.loadURL(loadURL);

  makeWin.on('closed', () => {
    MAKE_WIN_MAP[args.winName] && delete MAKE_WIN_MAP[args.winName];
    makeWin = null;
  });

  makeWin.on('close', () => {
    MAKE_WIN_MAP[args.winName] && delete MAKE_WIN_MAP[args.winName];
    MAKE_DATA[makeWin.id] = null;
  });

  makeWin.once('ready-to-show', () => {
    makeWin.show();
  });
};

export const checkMakeWinMap = (event, args) => {
  const winID = MAKE_WIN_MAP[args.winName];
  if (winID) {
    const findWin = BrowserWindow.fromId(winID);
    if (findWin) {
      // mapping 된 winID가 존재하고 창도 존재하는 경우 새창을 열지 않음
      event.returnValue = winID;
    } else {
      event.returnValue = null;
    }
  } else {
    event.returnValue = null;
  }
};

export const reqSubPop = (event, args) => {
  // 새창 생성
  // 새창 id를 key값으로 makedata 세팅
  // makedata 세팅 후 화면 show

  // 창전환 설정인경우 기존창이 세팅되어있을경우 창 제거
  if (args.isChange) {
    if (SUB_POP_DATA[args.winName]) {
      SUB_POP_DATA[args.winName].isReload = true;
    }
  }

  const loadURL = `${url.format({
    pathname: path.join(RESOURCE_PATH, 'renderer', 'index.html'),
    protocol: 'file:',
    slashes: true,
  })}${args.path}`;

  const parentId = args.parentId || 1;
  const parentBounds = BrowserWindow.fromId(parentId).getBounds();
  const bounds = getSubPopupBound(
    parentBounds,
    { width: args.width, height: args.height },
    args.position ? args.position : 'center',
  );

  if (
    SUB_POP_DATA[args.winName] == undefined ||
    SUB_POP_DATA[args.winName] == null
  ) {
    // 창 위치를 확인하여 sub 창을 부모창의 왼쪽, 오른쪽에 붙어서 보이도록 설정
    // default 는 cneter

    let pop = new BrowserWindow({
      width: bounds.width,
      height: bounds.height,
      minWidth: args.options.minWidth ? args.options.minWidth : bounds.width,
      // minWidth:400,
      minHeight: args.options.minHeight
        ? args.options.minHeight
        : bounds.height,
      x: bounds.x,
      y: bounds.y,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        nodeIntegrationInSubFrames: true,
        webviewTag: true,
      },
    });

    pop.setResizable(args.options.resize ? true : false);

    SUB_POP_DATA[args.winName] = {
      id: pop.id,
      data: args.data,
      isReload: false,
      parentId: args.parentId,
    };

    pop.loadURL(loadURL);

    pop.on('closed', () => {
      pop = null;
    });

    pop.on('close', () => {
      SUB_POP_DATA[args.winName] = null;
    });

    pop.once('ready-to-show', () => {
      pop.show();
    });
  } else {
    const winId = SUB_POP_DATA[args.winName].id;
    const subWin = BrowserWindow.fromId(winId);
    if (subWin) {
      // reload 모드이며 URL 이 변경된것으로 판단하여 다시 load 후 창 focus
      if (SUB_POP_DATA[args.winName].isReload) {
        SUB_POP_DATA[args.winName].data = args.data;
        SUB_POP_DATA[args.winName].isReload = false;
        SUB_POP_DATA[args.winName].parentId = args.parentId;
        subWin.loadURL(loadURL);
      }

      if (subWin.isMinimized()) {
        subWin.restore();
      } else if (!subWin.isVisible()) {
        subWin.show();
      }

      // 이미 윈도우가 떠 있는 경우에는 bounds 재설정하지 않도록 함
      // subWin.setBounds(bounds);

      subWin.focus();
    }
  }
};

export const setBeforePresence = (_, args) => {
  BEFORE_PRESENCE = args === 'away' ? 'online' : args;
};

function requestHead(url) {
  if (cache.get(`Head_${url}`)) {
    return cache.get(`Head_${url}`);
  }
  return axios.head(url);
}

async function requestPage(url) {
  if (cache.get(`Page_${url}`)) {
    return cache.get(`Page_${url}`);
  }
  const { headers } = await requestHead(url);
  if (headers['content-type'].indexOf('text/html') > -1) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    // 원본 데이터의 charset 확인
    const responseCharset = detectCharset(response.data);

    /**
     * charset이 없거나 / utf-8인 경우에 Decoding 생략
     * charset이 확인 가능한 경우 decoding 수행
     */
    const needToDecode =
      responseCharset &&
      responseCharset.encoding &&
      responseCharset.encoding.toLowerCase() !== 'utf-8';
    const decoded = needToDecode
      ? iconv.decode(response.data, responseCharset.encoding)
      : response.data.toString();
    const data = iconv.encode(decoded, 'utf-8');

    // 파싱(크롤링) 시작
    const $ = cheerio.load(data);
    const hostPattern =
      /^((http[s]?):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/i;
    const graphData = $('head>meta[property^="og:"]');
    let graphObj = {};

    if (graphData != null && graphData.length > 0) {
      graphData.each((i, elm) => {
        let key = $(elm).attr('property').replace('og:', '');
        let content = $(elm).attr('content');
        graphObj[key] = content;
      });
    }
    graphObj.domain = url.replace(hostPattern, '$2://$3');

    if (!Object.prototype.hasOwnProperty.call(graphObj, 'title')) {
      // title이 없을 시 페이지의 title 입력
      graphObj.title = $('title').text();
    }

    if (!Object.prototype.hasOwnProperty.call(graphObj, 'description')) {
      // description 없을 시 페이지의 description 입력
      const desc = $('[name="description"]');
      if (desc != null && desc.length > 0) {
        graphObj.description = desc.first().attr('content');
      } else {
        graphObj.description = '여기를 눌러 링크를 확인하세요';
      }
    }

    cache.set(`Page_${url}`, graphObj);
    return graphObj;
  }
}

export const getUrlGraphData = async (event, args) => {
  //args : messageId, url
  const saveLinkInfo = async (messageId, linkInfo) => {
    await updateLinkInfo(messageId, linkInfo);
  };

  try {
    const graphObj = await requestPage(args.url);
    console.log('graphObj', args, graphObj);
    if (Object.prototype.hasOwnProperty.call(graphObj, 'title')) {
      const returnObj = {
        link: args.url,
        thumbNailInfo: graphObj,
      };

      // link info

      // link data send renderer
      event.sender.send(args.returnChannel, {
        messageId: args.messageId,
        roomId: args.roomId,
        linkInfo: returnObj,
      });

      // link data local db 저장

      saveLinkInfo(args.messageId, returnObj);
      event.sender.send(args.returnChannel, {
        messageId: args.messageId,
        roomId: args.roomId,
        linkInfo: returnObj,
      });
    } else {
      // 아무 처리 없음
      event.sender.send(args.returnChannel, {
        messageId: args.messageId,
        roomId: args.roomId,
        linkInfo: null,
      });

      // link data local db 저장 ( 링크 데이터 없음 )
      saveLinkInfo(args.messageId, {});
    }
  } catch (err) {
    // 아무 처리 없음
    event.sender.send(args.returnChannel, {
      messageId: args.messageId,
      roomId: args.roomId,
      linkInfo: null,
    });

    // link data local db 저장 ( 링크 데이터 없음 )
    saveLinkInfo(args.messageId, {});

    logger.info('[GetUrlGraphData] Error: ' + JSON.stringify(err));
  }
};

export const reqSaveError = (event, args, logger) => {
  logger.info(`::: client side error ::: ${args}`);
};
