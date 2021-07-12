import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';
import IconConxtMenu from '@COMMON/popup/IconConxtMenu';
import * as common from '@/lib/common';
import { logoutRequest } from '@/modules/login';
import {
  quit,
  openSubPop,
  newExtensionWindow,
  evalConnector,
  sendSubPop,
} from '@/lib/deviceConnector';
import UnreadCntButton from '@COMMON/buttons/UnreadCntButton';
import ExternalLeft from '@C/ExternalLeft';

/* Note API */
import { useNoteUnreadCount } from '@/lib/note';
/* Note API */

/* svg icons */
import ContactIcon from '@/icons/svg/ContactList';
import ChatIcon from '@/icons/svg/ChatList';
import ChannelIcon from '@/icons/svg/ChannelList';
import OrgchartIcon from '@/icons/svg/Orgchart';
import NoteIcon from '@/icons/svg/note/Note';
/* svg icons */

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

const LeftMenu = ({ history }) => {
  const id = useSelector(({ login }) => login.id);
  const userInfo = useSelector(({ login }) => login.userInfo);
  const token = useSelector(({ login }) => login.token);
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);
  const unreadNoteCnt = useNoteUnreadCount();

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
        {(!isExtUser || isExtUser == 'N') && (covi?.config?.UseNote?.use === 'Y') && (
            <li
              className={[
                'menu-li',
                active == 'notelist' ? 'active' : '',
              ].join(' ')}
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

        {/*
        TODO: 아래 기능 구현되면 표시
        <li
          className={[
            'menu-li',
            active == 'externaluserlist' ? 'active' : '',
          ].join(' ')}
          onClick={e => {
            handleClickMenu('/client/main/externaluserlist');
          }}
        >
          <svg
            className="menu-li-svg"
            xmlns="http://www.w3.org/2000/svg"
            width="35.127"
            height="39.812"
            viewBox="0 0 141 157"
          >
            <g fill="none" stroke="#fff" strokeWidth="10">
              <rect width="141" height="157" rx="17" stroke="none" />
              <rect x="5" y="5" width="131" height="147" rx="12" />
            </g>
            <path
              d="M32 114a6 6 0 001 1l3 2h1a37 37 0 0015 3c9 0 17-3 22-9l29-29c9-9 11-24 6-37a2 2 0 00-1-1l-2-3-5-5a9 9 0 00-6-3 8 8 0 00-6 2L74 51a8 8 0 000 11l6 6-20 20-6-6a8 8 0 00-6-2 8 8 0 00-5 2L27 97a9 9 0 00-2 6 8 8 0 002 6zm0-12l15-15a1 1 0 012 0l9 8a3 3 0 004 0l25-24a3 3 0 001-3 3 3 0 00-1-2l-8-9a2 2 0 010-2l15-15a1 1 0 011 0 2 2 0 011 0l5 5 2 3c5 12 1 24-5 29l-29 30c-4 4-10 6-17 6a30 30 0 01-12-2l-3-2-5-5a1 1 0 010-1 3 3 0 010-1z"
              fill="#fff"
            />
          </svg>
        </li>*/}
      </ul>
      <div className="menu-bottom-box">
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
        <IconConxtMenu menuId="menu_bottom" menus={menus}>
          <button className="more"></button>
        </IconConxtMenu>
      </div>
    </>
  );
};

export default withRouter(LeftMenu);
