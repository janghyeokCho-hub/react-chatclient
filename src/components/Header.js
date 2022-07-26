import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProfileBox from '@COMMON/ProfileBox';
import { updateMyPresence } from '@/lib/presenceUtil';
import IconConxtMenu from './common/popup/IconConxtMenu';
import Config from '@/config/config';
import { openLayer, getDictionary } from '@/lib/common';
import InviteMember from './chat/chatroom/layer/InviteMember';
import { evalConnector } from '@/lib/deviceConnector';
import { getConfig } from '@/lib/util/configUtil';

const Header = () => {
  const userId = useSelector(({ login }) => login.userInfo.id);
  const userName = useSelector(({ login }) => login.userInfo.name);
  const presence = useSelector(({ login }) => login.userInfo.presence);
  const photoPath = useSelector(({ login }) => login.userInfo.photoPath);
  const menu = useSelector(({ menu }) => menu.menu);
  const topButton = useSelector(({ menu }) => menu.topButton);

  const dispatch = useDispatch();

  const getPresenseColor = code => {
    let mStyle = {};

    if (typeof code == 'string') {
      mStyle = JSON.parse(code);
    } else {
      mStyle = code;
    }
    return mStyle.backgroundColor;
  };

  const setMenus = useCallback(() => {
    return getConfig('Presence', []).map(item => {
      return {
        code: item.code,
        isline: false,
        onClick: () => {
          updateMyPresence(dispatch, userId, item.code, 'H');
        },
        name: (
          <>
            <span
              style={{ backgroundColor: getPresenseColor(item.mobileStyle) }}
              className="status"
            ></span>
            {getDictionary(item.name)}
          </>
        ),
      };
    });
  }, [dispatch, userId]);

  useEffect(() => {
    if (DEVICE_TYPE == 'd') {
      evalConnector({
        method: 'on',
        channel: 'onSystemIdleTime',
        callback: (event, id) => {
          updateMyPresence(dispatch, userId, 'away', 'A');
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onSystemIdleTimeInit',
        callback: (event, args) => {
          updateMyPresence(dispatch, userId, args, 'A');
        },
      });
    }

    return () => {
      evalConnector({
        method: 'removeListener',
        channel: 'onSystemIdleTime',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onSystemIdleTimeInit',
      });
    };
  }, []);

  const profileBox = useMemo(() => {
    if (DEVICE_TYPE == 'd') {
      return (
        <IconConxtMenu menuId="header_presence" menus={setMenus()}>
          <ProfileBox
            userId={userId}
            userName={userName}
            presence={presence}
            handleClick={false}
            isInherit={false}
            img={photoPath}
          />
        </IconConxtMenu>
      );
    } else {
      return (
        <ProfileBox
          userId={userId}
          userName={userName}
          presence={presence}
          handleClick={false}
          isInherit={false}
          img={photoPath}
        />
      );
    }
  }, [userId, userName, presence, photoPath]);

  const drawTopButton = useMemo(() => {
    return (
      (topButton && (
        <div className="headerBtnBox">
          {topButton.map(item => (
            <button
              key={item.code}
              onClick={item.onClick}
              alt={item.alt}
              title={item.alt}
            >
              {item.svg}
            </button>
          ))}
        </div>
      )) || <></>
    );
  }, [topButton]);

  return (
    <>
      {menu && menu != 'Extension' && (
        <div className="Topheader">
          {profileBox}
          <span className="TopTitle">{menu}</span>
          {drawTopButton}
        </div>
      )}
    </>
  );
};

export default Header;
