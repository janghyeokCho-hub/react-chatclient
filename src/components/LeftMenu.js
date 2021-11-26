import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { withRouter } from 'react-router-dom';
import IconConxtMenu from '@COMMON/popup/IconConxtMenu';
import * as common from '@/lib/common';
import { logoutRequest } from '@/modules/login';
import {
  quit,
  openSubPop,
  chageMainWinInfo,
  evalConnector,
  sendSubPop,
} from '@/lib/deviceConnector';
import UnreadCntButton from '@COMMON/buttons/UnreadCntButton';
import ExternalLeft from '@C/ExternalLeft';
import { getConfig } from '@/lib/util/configUtil';

/* Note API */
import { useNoteUnreadCount } from '@/lib/note';

/* svg icons */
import ContactIcon from '@/icons/svg/ContactList';
import ExtensionIcon from '@/icons/svg/ExtensionIcon';
import ChatIcon from '@/icons/svg/ChatList';
import ChannelIcon from '@/icons/svg/ChannelList';
import OrgchartIcon from '@/icons/svg/Orgchart';
import NoteIcon from '@/icons/svg/note/Note';

import { extensionAdd, setCurrentExtension } from '@/modules/extension';

const handleUserConfig = data => {
  evalConnector({
    method: 'send',
    channel: 'save-user-config',
    message: data,
  });

  // desktopNoti가 포함된경우 부모창에 전달
  if (data.desktopNoti !== undefined && data.desktopNoti !== null) {
    sendSubPop('onNotiConfigChange', 'usersetting', {
      desktopNoti: data.desktopNoti,
    });
  }
};

const exntension = {
  isUse: false,
};

const LeftMenu = ({ history }) => {
  const id = useSelector(({ login }) => login.id);
  const userInfo = useSelector(({ login }) => login.userInfo);
  const token = useSelector(({ login }) => login.token);
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);

  const extensionList = useSelector(
    ({ extension }) => extension.extensions,
    shallowEqual,
  );

  const unreadNoteCnt = useNoteUnreadCount();
  const forceDisableNoti = getConfig('ForceDisableNoti', 'N') === 'Y';

  const [isExtensionUse, setIsExtensionUse] = useState(false);

  const active = useSelector(
    ({ menu }) => menu.activeType,
    (left, right) => left == right,
  );

  const unreadCnt = useSelector(
    ({ room }) => {
      const rooms = room.rooms;
      let cnt = 0;
      if (rooms) {
        rooms.forEach(item => {
          cnt += item.unreadCnt;
        });
      }
      return cnt;
    },
    (left, right) => left == right,
  );

  const unreadChannelCnt = useSelector(
    ({ channel }) => {
      const channels = channel.channels;
      let cnt = 0;
      if (channels) {
        channels.forEach(item => {
          if (item.unreadCnt) cnt += item.unreadCnt;
        });
      }
      return cnt;
    },
    (left, right) => left == right,
  );

  const dispatch = useDispatch();

  const [isNoti, setIsNoti] = useState(false);

  useEffect(() => {
    if (DEVICE_TYPE == 'b') {
      const notification = localStorage.getItem('check_notification');
      if (notification === undefined) {
        localStorage.setItem('check_notification', false);
      } else {
        setIsNoti(notification);
      }
    } else {
      const userConfig = evalConnector({
        method: 'getGlobal',
        name: 'USER_SETTING',
      });

      if (userConfig && userConfig.config)
        setIsNoti(userConfig.config.desktopNoti);

      evalConnector({
        method: 'on',
        channel: 'onExtensionEvent',
        callback: (event, data) => {
          dispatch(extensionAdd(data));
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onNotiConfigChange',
        callback: (event, data) => {
          setIsNoti(data.desktopNoti);
        },
      });
    }

    return () => {
      if (DEVICE_TYPE == 'd') {
        evalConnector({
          method: 'removeListener',
          channel: 'onExtensionEvent',
        });
        evalConnector({
          method: 'removeListener',
          channel: 'onNotiConfigChange',
        });
      }
    };
  }, []);

  const handleClickMenu = useCallback(
    goto => {
      history.push(goto);
    },
    [history],
  );

  const handleLogout = useCallback(() => {
    common.openPopup(
      {
        type: 'Confirm',
        message: covi.getDic('Msg_logout'),
        callback: result => {
          if (result) {
            const data = {
              id,
              token,
            };
            dispatch(logoutRequest(data));
            // 전체 store init
            history.push('/client');
          }
        },
      },
      dispatch,
    );
  }, [id, token, dispatch, history]);

  const menus = useMemo(() => {
    const setMenus = [
      {
        code: 'setting',
        isline: false,
        onClick: () => {
          if (DEVICE_TYPE == 'b') {
            history.push('/client/main/usersetting');
          } else {
            openSubPop(
              'usersetting',
              '#/client/nw/usersetting',
              {},
              500,
              600,
              'sticky',
              false,
              { resize: false },
            );
          }
        },
        name: covi.getDic('UserSetting'),
      },
      {
        code: 'line',
        isline: true,
        onClick: () => {},
        name: '',
      },
      {
        code: 'logout',
        isline: false,
        onClick: () => {
          handleLogout();
        },
        name: covi.getDic('Logout'),
      },
    ];

    if (DEVICE_TYPE != 'b')
      setMenus.push({
        code: 'exit',
        isline: false,
        onClick: async () => {
          quit(id);
        },
        name: covi.getDic('Quit'),
      });

    return setMenus;
  }, [dispatch, history]);

  return (
    <>
      <ul className="menu-ul">
        {(!isExtUser || isExtUser == 'N') && (
          <li
            className={[
              'menu-li',
              active == 'contactlist' ? 'active' : '',
            ].join(' ')}
            onClick={e => {
              if (DEVICE_TYPE == 'd')
                chageMainWinInfo({
                  width: 450,
                  height: 650,
                  resizable: true,
                });
              handleClickMenu('/client/main/contactlist');
            }}
            style={{ WebkitAppRegion: 'no-drag', cursor: 'pointer' }}
          >
            {/* <ContactIcon /> */}
            <ContactIcon className="menu-li-svg" />
          </li>
        )}
        <li
          className={['menu-li', active == 'chatlist' ? 'active' : ''].join(
            ' ',
          )}
          onClick={e => {
            if (DEVICE_TYPE == 'd')
              chageMainWinInfo({
                width: 450,
                height: 650,
                resizable: true,
              });
            handleClickMenu('/client/main/chatlist');
          }}
          style={{ position: 'relative', cursor: 'pointer' }}
        >
          <UnreadCntButton unreadCnt={unreadCnt}></UnreadCntButton>
          <ChatIcon className="menu-li-svg" />
        </li>
        {(!isExtUser || isExtUser == 'N') &&
          (!covi.config.UseOrgChart || covi.config.UseOrgChart === 'Y') && (
            <li
              className={['menu-li', active == 'orgchart' ? 'active' : ''].join(
                ' ',
              )}
              onClick={e => {
                if (DEVICE_TYPE == 'd')
                  chageMainWinInfo({
                    width: 450,
                    height: 650,
                    resizable: true,
                  });
                handleClickMenu('/client/main/orgchart');
              }}
              style={{ cursor: 'pointer' }}
            >
              <OrgchartIcon className="menu-li-svg" />
            </li>
          )}
        {(covi.config.UseChannel == undefined
          ? 'Y'
          : covi.config.UseChannel) === 'Y' && (
          <li
            className={[
              'menu-li',
              active == 'channellist' ? 'active' : '',
            ].join(' ')}
            onClick={e => {
              if (DEVICE_TYPE == 'd')
                chageMainWinInfo({
                  width: 450,
                  height: 650,
                  resizable: true,
                });
              handleClickMenu('/client/main/channellist');
            }}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <UnreadCntButton unreadCnt={unreadChannelCnt}></UnreadCntButton>
            <ChannelIcon className="menu-li-svg" />
          </li>
        )}

        {/* 외부사용자 or 쪽지기능 비활성화일 경우 메뉴 노출 X */}
        {(!isExtUser || isExtUser == 'N') &&
          covi?.config?.UseNote?.use === 'Y' && (
            <li
              className={['menu-li', active == 'notelist' ? 'active' : ''].join(
                ' ',
              )}
              onClick={() => {
                if (DEVICE_TYPE == 'd')
                  chageMainWinInfo({
                    width: 450,
                    height: 650,
                    resizable: true,
                  });
                handleClickMenu('/client/main/notelist');
              }}
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              <UnreadCntButton unreadCnt={unreadNoteCnt}></UnreadCntButton>
              <NoteIcon className="menu-li-svg" />
            </li>
          )}

        {(!isExtUser || isExtUser == 'N') && (
          <ExternalLeft paramObj={userInfo}></ExternalLeft>
        )}
      </ul>
      {DEVICE_TYPE == 'd' && isExtensionUse && (
        <div
          style={{
            width: '80%',
            borderTop: 'solid 2.5px #fff',
            margin: 'auto',
            marginBottom: 5,
          }}
        ></div>
      )}
      {DEVICE_TYPE == 'd' && isExtensionUse && (
        <div style={{ overflow: 'hidden scroll' }}>
          <ul className="menu-ul" style={{ height: 130 }}>
            {extensionList.map(extensionItem => {
              return (
                <li
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 8,
                  }}
                >
                  <button
                    onClick={e => {
                      if (extensionItem.type == 'V') {
                        chageMainWinInfo({
                          width: 450,
                          height: 650,
                          resizable: false,
                        });
                      } else {
                        chageMainWinInfo({
                          width: 450,
                          height: 650,
                          resizable: true,
                        });
                      }
                      dispatch(setCurrentExtension(extensionItem));
                      handleClickMenu('/client/main/extension');
                    }}
                  >
                    <img
                      src={extensionItem.iconPath}
                      style={{ width: 28, height: 28 }}
                    ></img>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="menu-bottom-box">
        {exntension.isUse && DEVICE_TYPE == 'd' && (
          <ExtensionIcon
            onClickEvent={() => {
              //setIsExtensionUse(!isExtensionUse);
              if (DEVICE_TYPE == 'd') {
                openSubPop(
                  'extension',
                  '#/client/nw/extension',
                  {},
                  400,
                  550,
                  'sticky',
                  false,
                  { resize: false },
                );
              }
            }}
          />
        )}
        {forceDisableNoti === false && (
          <button
            className={['bell', isNoti ? 'active' : ''].join(' ')}
            onClick={() => {
              setIsNoti(!isNoti);
              if (DEVICE_TYPE == 'b') {
                localStorage.setItem('check_notification', !isNoti);
              } else {
                handleUserConfig({ desktopNoti: !isNoti });
              }
            }}
          ></button>
        )}
        <IconConxtMenu menuId="menu_bottom" menus={menus}>
          <button className="more"></button>
        </IconConxtMenu>
      </div>
    </>
  );
};

export default withRouter(LeftMenu);
