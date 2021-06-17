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
            <svg
              className="menu-li-svg"
              xmlns="http://www.w3.org/2000/svg"
              width="19.467"
              height="22.074"
              viewBox="0 0 19.467 22.074"
            >
              <g transform="translate(-716.092 -354.799)">
                <path
                  d="M716.092,375.979a.9.9,0,0,0,.894.894h17.679a.9.9,0,0,0,.894-.894,13.161,13.161,0,0,0-6.635-10.89,5.607,5.607,0,1,0-6.182,0A13.144,13.144,0,0,0,716.092,375.979Zm9.733-19.381a3.814,3.814,0,1,1-3.813,3.815v0A3.821,3.821,0,0,1,725.825,356.6Zm0,9.46c3.486,0,7.6,3.978,7.916,9.028H717.909c.313-5.051,4.43-9.029,7.916-9.029Z"
                  fill="#fff"
                ></path>
              </g>
            </svg>
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
          <svg
            className="menu-li-svg"
            xmlns="http://www.w3.org/2000/svg"
            width="23.598"
            height="22.354"
            viewBox="0 0 23.598 22.354"
          >
            <g transform="translate(-714.35 -413.248)">
              <path
                d="M726.15,413.248c-6.51,0-11.8,4.242-11.8,9.448a8.728,8.728,0,0,0,3.867,7l-.844,4.9a.853.853,0,0,0,.337.848.781.781,0,0,0,.492.158.733.733,0,0,0,.394-.1l6.229-3.423c.45.043.886.058,1.322.058,6.51,0,11.8-4.242,11.8-9.448S732.658,413.248,726.15,413.248Zm0,17.156c-.45,0-.928-.029-1.406-.072a.852.852,0,0,0-.492.1l-4.921,2.7.633-3.7a.862.862,0,0,0-.38-.877,7.134,7.134,0,0,1-3.557-5.867c0-4.257,4.542-7.723,10.11-7.723s10.11,3.466,10.11,7.723S731.716,430.4,726.15,430.4Z"
                fill="#fff"
              ></path>
            </g>
          </svg>
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
              <svg
                className="menu-li-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="21"
                viewBox="0 0 22 21"
              >
                <g transform="translate(-714.797 -466.091)">
                  <rect
                    width="8"
                    height="7"
                    transform="translate(721.797 466.091)"
                    fill="none"
                  ></rect>
                  <path
                    d="M729.8,473.091h-8v-7h8Zm-6.5-1.5h5v-4h-5Z"
                    fill="#fff"
                  ></path>
                  <rect
                    width="8"
                    height="7"
                    transform="translate(714.797 480.091)"
                    fill="none"
                  ></rect>
                  <path
                    d="M722.8,487.091h-8v-7h8Zm-6.5-1.5h5v-4h-5Z"
                    fill="#fff"
                  ></path>
                  <rect
                    width="8"
                    height="7"
                    transform="translate(728.797 480.091)"
                    fill="none"
                  ></rect>
                  <path
                    d="M736.8,487.091h-8v-7h8Zm-6.5-1.5h5v-4h-5Z"
                    fill="#fff"
                  ></path>
                  <rect
                    width="1.5"
                    height="4"
                    transform="translate(718.047 476.512)"
                    fill="#fff"
                  ></rect>
                  <rect
                    width="1.5"
                    height="4"
                    transform="translate(732.047 476.512)"
                    fill="#fff"
                  ></rect>
                  <rect
                    width="1.5"
                    height="4"
                    transform="translate(725.047 472.091)"
                    fill="#fff"
                  ></rect>
                  <rect
                    width="15.5"
                    height="1.5"
                    transform="translate(718.047 475.341)"
                    fill="#fff"
                  ></rect>
                </g>
              </svg>
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
            <svg
              className="menu-li-svg"
              xmlns="http://www.w3.org/2000/svg"
              width="25.876"
              height="26.236"
              viewBox="0 0 25.876 26.236"
            >
              <g transform="translate(9685 -3413)">
                <g transform="translate(-10346.991 2999.506)">
                  <path
                    d="M671.209,431.706h-8.518a.7.7,0,0,1-.7-.7h0V414.194a.7.7,0,0,1,.7-.7h8.3a.717.717,0,0,1,.476.185l5.382,5a.7.7,0,0,1,.22.511v4.857a9.216,9.216,0,0,0-1.392.313v-3.442h-5.45a.7.7,0,0,1-.7-.7v-5.332h-6.144v15.428h7.479a5.229,5.229,0,0,0,.347,1.391Zm-.286-16.634v4.454h4.756v-.032Z"
                    fill="#fff"
                  ></path>
                  <path
                    d="M678.837,422.747c-4.9,0-8.879,3.193-8.879,7.111a6.567,6.567,0,0,0,2.91,5.271l-.635,3.693a.639.639,0,0,0,.254.639.591.591,0,0,0,.37.119.555.555,0,0,0,.3-.076l4.686-2.582c.339.032.667.043.995.043,4.9,0,8.879-3.193,8.879-7.111S683.737,422.747,678.837,422.747Zm0,12.913c-.339,0-.7-.022-1.058-.054a.636.636,0,0,0-.37.076l-3.7,2.035.476-2.782a.65.65,0,0,0-.286-.66,5.367,5.367,0,0,1-2.678-4.416c0-3.2,3.418-5.812,7.609-5.812s7.609,2.609,7.609,5.812S683.028,435.66,678.837,435.66Z"
                    fill="#fff"
                  ></path>
                  <path
                    d="M672.877,439.73h-.046a.733.733,0,0,1-.436-.15.791.791,0,0,1-.31-.785l.619-3.6a6.725,6.725,0,0,1-2.9-5.336c0-4.008,4.05-7.265,9.029-7.265s9.03,3.255,9.03,7.257-4.051,7.261-9.029,7.261c-.358,0-.665-.013-.963-.04l-4.646,2.56A.688.688,0,0,1,672.877,439.73Zm-.025-.3a.347.347,0,0,0,.229-.054l4.73-2.607.046,0c.3.029.615.042.981.042,4.813,0,8.728-3.122,8.728-6.96s-3.916-6.957-8.729-6.957-8.729,3.122-8.729,6.961A6.428,6.428,0,0,0,672.951,435l.081.054-.652,3.789a.5.5,0,0,0,.194.492.435.435,0,0,0,.266.091Zm.657-1.431.528-3.088a.5.5,0,0,0-.22-.509,5.49,5.49,0,0,1-2.746-4.535c0-3.295,3.481-5.97,7.759-5.97s7.759,2.675,7.759,5.963-3.478,5.951-7.752,5.951c-.3,0-.652-.018-1.071-.055a.487.487,0,0,0-.285.058Zm5.321-13.8c-4.113,0-7.459,2.54-7.459,5.662a5.19,5.19,0,0,0,2.6,4.286.8.8,0,0,1,.358.817l-.423,2.473,3.428-1.886a.757.757,0,0,1,.456-.092c.408.036.751.052,1.044.052,4.108,0,7.451-2.534,7.451-5.65S682.942,424.2,678.83,424.2Z"
                    fill="#fff"
                  ></path>
                  <path
                    d="M681.162,428.254l-2.846,3.168-1.5-1.44a.334.334,0,1,0-.461.484h0l1.745,1.679a.332.332,0,0,0,.233.094h.011a.341.341,0,0,0,.233-.111l3.079-3.424a.335.335,0,0,0-.027-.472h0a.324.324,0,0,0-.457.011Z"
                    fill="#fff"
                  ></path>
                  <path
                    d="M678.351,432.539a.645.645,0,0,1-.462-.181l-1.742-1.677a.635.635,0,0,1,.423-1.092.735.735,0,0,1,.453.176l1.278,1.226,2.649-2.949a.629.629,0,0,1,.44-.2.661.661,0,0,1,.445.172.633.633,0,0,1,.046.888l-3.081,3.425a.634.634,0,0,1-.44.211Zm-1.743-2.34,1.7,1.729,3.126-3.424-.051-.047-3.051,3.395Z"
                    fill="#fff"
                  ></path>
                </g>
              </g>
            </svg>
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
