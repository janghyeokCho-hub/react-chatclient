import { BrowserWindow, screen } from 'electron';
import url from 'url';
import path from 'path';
import { getSubPopupBound } from '../utils/commonUtils';
import axios from 'axios';
import cheerio from 'cheerio';
import { updateLinkInfo } from './appData';
import logger from '../utils/logger';

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

export const checkRoomWinLength = (event, args) => {
  event.returnValue = Object.keys(ROOM_WIN_MAP).length;
}

export const checkMakeRoomWinLength = (event, args) => {
  event.returnValue = Object.keys(MAKE_WIN_MAP).length;
}

export const RoomWinClosed = (event, args) => {
  ROOM_WIN_MAP[args.roomID] && delete ROOM_WIN_MAP[args.roomID];
  event.returnValue = true;
}

export const reqMakeRoom = (event, args) => {
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

  const initial = {
    width: 500,
    height: 700,
    x: display.workArea.x + (display.workArea.width / 2 - 250),
    y: display.workArea.y + (display.workArea.height / 2 - 350),
    minWidth: 400,
    minHeight: 600,
  };

  let makeWin = new BrowserWindow({
    ...initial,
    frame: false,
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

  const parentBounds = BrowserWindow.fromId(1).getBounds();
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

      // 창의 크기는 변경하지 않음 ( 기존 창과 용도가 같다고 판단)
      subWin.setBounds(bounds);

      subWin.focus();
    }
  }
};

export const setBeforePresence = (event, args) => {
  BEFORE_PRESENCE = args;
};

export const getUrlGraphData = (event, args) => {
  //args : messageId, url
  const saveLinkInfo = async (messageId, linkInfo) => {
    await updateLinkInfo(messageId, linkInfo);
  };

  axios
    .head(args.url)
    .then(({ headers }) => {
      // response type 이 html 일 경우에만 link 해석
      if (headers['content-type'].indexOf('text/html') > -1) {
        axios
          .get(args.url)
          .then(response => {
            const $ = cheerio.load(response.data);
            const hostPattern = /^((http[s]?):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/i;
            const graphData = $('head>meta[property^="og:"]');
            let returnObj = null;
            let graphObj = {};

            if (graphData != null && graphData.length > 0) {
              graphData.each((i, elm) => {
                let key = $(elm).attr('property').replace('og:', '');
                let content = $(elm).attr('content');
                graphObj[key] = content;
              });
            }

            graphObj.domain = args.url.replace(hostPattern, '$2://$3');

            if (!Object.prototype.hasOwnProperty.call(graphObj, 'title')) {
              // title이 없을 시 페이지의 title 입력
              graphObj.title = $('title').text();
            }

            if (
              !Object.prototype.hasOwnProperty.call(graphObj, 'description')
            ) {
              // description 없을 시 페이지의 description 입력
              const desc = $('[name="description"]');
              if (desc != null && desc.length > 0) {
                graphObj.description = desc.first().attr('content');
              } else {
                graphObj.description = '여기를 눌러 링크를 확인하세요';
              }
            }

            if (Object.prototype.hasOwnProperty.call(graphObj, 'title')) {
              returnObj = {
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
          })
          .catch(e => {
            // 아무 처리 없음
            event.sender.send(args.returnChannel, {
              messageId: args.messageId,
              roomId: args.roomId,
              linkInfo: null,
            });

            // link data local db 저장 ( 링크 데이터 없음 )
            saveLinkInfo(args.messageId, {});
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
    })
    .catch(e => {
      // 아무 처리 없음
      event.sender.send(args.returnChannel, {
        messageId: args.messageId,
        roomId: args.roomId,
        linkInfo: null,
      });

      // link data local db 저장 ( 링크 데이터 없음 )
      saveLinkInfo(args.messageId, {});
    });
};

export const reqSaveError = (event, args, logger) => {
  logger.info(`::: client side error ::: ${args}`);
};
