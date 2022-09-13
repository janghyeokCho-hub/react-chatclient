import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';

import {
  evalConnector,
  openLink,
  newChatRoom,
  newChannel,
  closeWindow,
  getWindowAlwaysTop,
  setWindowAlwaysTop,
  isMainWindow,
  setWindowOpacity,
} from '@/lib/deviceConnector';
import { changeTheme, changeFontSize, changeMychatColor } from '@/modules/menu';
import { openRoom, newWinRoom } from '@/modules/room';
import { openChannel, newWinChannel } from '@/modules/channel';
import { openPopup } from '@/lib/common';
import Range from '@COMMON/buttons/Range';
import {
  useChatFontSize,
  useChatFontType,
  useMyChatFontColor,
} from '../hooks/useChat';

const Titlebar = () => {
  const [alwaysTop, setAlwaysTop] = useState(getWindowAlwaysTop());
  const [titleText, setTitleText] = useState(
    `v${APP_VERSION}${DEF_MODE == 'development' ? ' ::: DEV ::: ' : ''}`,
  );
  const isNewWin = !isMainWindow();

  const tempMessage = useSelector(({ message }) => message.tempMessage);
  const [_, setFontType] = useChatFontType();
  const [__, setFontSize] = useChatFontSize();
  const [___, setMyChatColor] = useMyChatFontColor();
  const dispatch = useDispatch();

  // window객체에 global로 세팅해야하는 함수들을 미리 loading ( titlebar draw 시점 및 사용시점 파악 필요 )
  useEffect(() => {
    const appConfig = evalConnector({
      method: 'getGlobal',
      name: 'APP_SECURITY_SETTING',
    });
    if (isNewWin) setWindowOpacity(appConfig.get('opacityRange') / 100 || 1);

    if (typeof window.openExternalPopup !== 'function') {
      // Link를 OS Default Browser로 실행 ( 미처리시 Electron에서 직접 열게됨 )
      window.openExternalPopup = openLink;
    }

    if (typeof window.changeCustomTitle !== 'function') {
      window.changeCustomTitle = text => {
        setTitleText(text);
      };
    }

    evalConnector({
      method: 'on',
      channel: 'onThemeChange',
      callback: (event, theme) => {
        dispatch(changeTheme(theme));
      },
    });

    evalConnector({
      method: 'on',
      channel: 'onFontSizeChange',
      callback: (_, _fontSize) => {
        setFontSize(_fontSize);
      },
    });

    evalConnector({
      method: 'on',
      channel: 'onFontColorChange',
      callback: (_, _fontColor) => {
        setMyChatColor(_fontColor);
      },
    });

    evalConnector({
      method: 'on',
      channel: 'onFontTypeChange',
      callback(_, data) {
        setFontType(data);
      },
    });

    evalConnector({
      method: 'on',
      channel: 'onAlarmClick',
      callback: (_, args) => {
        if (window.innerWidth <= 1000) {
          const winName = `wrf${args.roomID}`;
          const openURL = `${DEVICE_TYPE == 'd' ? '#' : ''}/client/nw/${
            !args.isChannel ? 'chatroom' : 'channel'
          }/${args.roomID}`;

          const roomObj =
            (!args.isChannel && newChatRoom(winName, args.roomID, openURL)) ||
            newChannel(winName, args.roomID, openURL);

          (!args.isChannel &&
            dispatch(
              newWinRoom({ id: args.roomID, obj: roomObj, name: winName }),
            )) ||
            dispatch(
              newWinChannel({
                id: args.roomID,
                obj: roomObj,
                name: winName,
              }),
            );
        } else {
          if (args.isChannel) {
            dispatch(openChannel({ roomId: args.roomID }));
          } else {
            dispatch(openRoom({ roomID: args.roomID }));
          }
        }
      },
    });

    return () => {
      evalConnector({
        method: 'removeListener',
        channel: 'onThemeChange',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onFontSizeChange',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onFontColorChange',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onFontTypeChange',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onAlarmClick',
      });
    };
  }, []);

  return (
    <>
      <div className="TopBar" style={{ WebkitAppRegion: 'drag' }}>
        <div
          style={{
            position: 'absolute',
            top: '0px',
            width: '100%',
            height: '3px',
            WebkitAppRegion: 'no-drag',
            zIndex: 999,
          }}
        ></div>
        <div></div>
        <p
          className="topbar-name"
          style={{
            maxWidth: 'calc(100% - 195px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >{`eumtalk - ${titleText}`}</p>
        <div className="rightCont">
          {isNewWin && (
            <>
              <Range
                min={10}
                max={100}
                onChange={val => {
                  const opacity = val / 100;
                  setWindowOpacity(opacity);
                }}
                init={100}
                size={50}
                style={{
                  WebkitAppRegion: 'no-drag',
                  float: 'left',
                  height: '29px',
                  padding: '0px 5px',
                }}
              ></Range>
            </>
          )}
          <button
            className={`alwaysontop ${alwaysTop ? 'active' : ''}`}
            style={{
              WebkitAppRegion: 'no-drag',
            }}
            onClick={e => {
              setWindowAlwaysTop(!alwaysTop);
              setAlwaysTop(!alwaysTop);
            }}
          ></button>
          <button
            className="minisize"
            style={{ WebkitAppRegion: 'no-drag' }}
            alt={covi.getDic('Minimize', '최소화')}
            title={covi.getDic('Minimize', '최소화')}
            onClick={e => {
              evalConnector({
                method: 'window-minimize',
                type: 'parent',
              });
            }}
            onContextMenu={e => {
              evalConnector({
                method: 'send',
                channel: 'open-devtools',
                message: '',
              });
              e.preventDefault();
              e.stopPropagation();
            }}
          ></button>
          <button
            className="close"
            alt={covi.getDic('Close', '닫기')}
            title={covi.getDic('Close', '닫기')}
            style={{ WebkitAppRegion: 'no-drag' }}
            onClick={e => {
              let closeAlertMessageFlag = false;

              if (tempMessage?.length > 0) {
                tempMessage.map(data => {
                  if (data.messageType != 'A') {
                    closeAlertMessageFlag = true;
                  }
                });
              }

              if (closeAlertMessageFlag) {
                openPopup(
                  {
                    type: 'Confirm',
                    message: covi.getDic(
                      'Msg_FileSendingClose',
                      '파일이 업로드 중입니다. \r\n창을 종료시 파일 전송이 취소 됩니다.',
                    ),
                    callback: result => {
                      if (result) {
                        closeWindow();
                      }
                    },
                  },
                  dispatch,
                );
              } else closeWindow();
            }}
          ></button>
        </div>
      </div>
    </>
  );
};

export default Titlebar;
