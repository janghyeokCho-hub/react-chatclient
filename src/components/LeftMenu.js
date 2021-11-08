import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';
import IconConxtMenu from '@COMMON/popup/IconConxtMenu';
import * as common from '@/lib/common';
import { logoutRequest } from '@/modules/login';
import {
  quit,
  openSubPop,
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
  isUse: true,
};

// const extensionList = [
//   {
//     title: 'Groupware',
//     description: 'Groupware In Messenger',
//     iconPath: '/gw/icon/path',
//     version: 1,
//     createDate: new Date(),
//     updateDate: new Date(),
//     category: 'app',
//   },
//   {
//     title: 'Memo',
//     description: 'Memo In Messenger',
//     iconPath: '/gw/icon/path',
//     version: 1,
//     createDate: new Date(),
//     updateDate: new Date(),
//     category: 'app',
//   },
//   {
//     title: 'Memo',
//     description: 'Memo In Messenger',
//     iconPath: '/gw/icon/path',
//     version: 1,
//     createDate: new Date(),
//     updateDate: new Date(),
//     category: 'app',
//   },
//   {
//     title: 'Memo',
//     description: 'Memo In Messenger',
//     iconPath: '/gw/icon/path',
//     version: 1,
//     createDate: new Date(),
//     updateDate: new Date(),
//     category: 'app',
//   },
//   {
//     title: 'Memo',
//     description: 'Memo In Messenger',
//     iconPath: '/gw/icon/path',
//     version: 1,
//     createDate: new Date(),
//     updateDate: new Date(),
//     category: 'app',
//   },
//   {
//     title: 'Memo',
//     description: 'Memo In Messenger',
//     iconPath: '/gw/icon/path',
//     version: 1,
//     createDate: new Date(),
//     updateDate: new Date(),
//     category: 'app',
//   },
//   {
//     title: 'Memo',
//     description: 'Memo In Messenger',
//     iconPath: '/gw/icon/path',
//     version: 1,
//     createDate: new Date(),
//     updateDate: new Date(),
//     category: 'app',
//   },
//   {
//     title: 'Memo',
//     description: 'Memo In Messenger',
//     iconPath: '/gw/icon/path',
//     version: 1,
//     createDate: new Date(),
//     updateDate: new Date(),
//     category: 'app',
//   },
//   {
//     title: 'Memo',
//     description: 'Memo In Messenger',
//     iconPath: '/gw/icon/path',
//     version: 1,
//     createDate: new Date(),
//     updateDate: new Date(),
//     category: 'app',
//   },
// ];

const LeftMenu = ({ history }) => {
  const id = useSelector(({ login }) => login.id);
  const userInfo = useSelector(({ login }) => login.userInfo);
  const token = useSelector(({ login }) => login.token);
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);

  const extensionList = useSelector(({ extension }) => extension.extensions);

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
      <div
        style={{
          width: '80%',
          borderTop: 'solid 2.5px #fff',
          margin: 'auto',
          marginBottom: 5,
        }}
      ></div>
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
                      handleClickMenu('/client/main/extension');
                    }}
                  >
                    <svg
                      height="28px"
                      viewBox="0 0 48 48"
                      width="28px"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#fff"
                    >
                      <g id="Expanded">
                        <g>
                          <g>
                            <path d="M42,48H28V35h-8v13H6V27c0-0.552,0.447-1,1-1s1,0.448,1,1v19h10V33h12v13h10V28c0-0.552,0.447-1,1-1s1,0.448,1,1V48z" />
                          </g>
                          <g>
                            <path d="M47,27c-0.249,0-0.497-0.092-0.691-0.277L24,5.384L1.691,26.723c-0.399,0.381-1.032,0.368-1.414-0.031     c-0.382-0.399-0.367-1.032,0.031-1.414L24,2.616l23.691,22.661c0.398,0.382,0.413,1.015,0.031,1.414     C47.526,26.896,47.264,27,47,27z" />
                          </g>
                          <g>
                            <path d="M39,15c-0.553,0-1-0.448-1-1V8h-6c-0.553,0-1-0.448-1-1s0.447-1,1-1h8v8C40,14.552,39.553,15,39,15z" />
                          </g>
                        </g>
                      </g>
                    </svg>
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
