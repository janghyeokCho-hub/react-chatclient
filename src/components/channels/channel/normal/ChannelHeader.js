// components\chat\chatroom\ChatRoomHeader.js

import React, { useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChannelMenuBox from '@/components/channels/channel/layer/ChannelMenuBox';
import { openLayer, openPopup } from '@/lib/common';
import Config from '@/config/config';
import LoadingWrap from '@COMMON/LoadingWrap';
import { initOpenChannel } from '@/modules/channel';
import { messageCurrentTyping } from '@/modules/room';
import { setWindowTitle, isMainWindow } from '@/lib/deviceConnector';
import useTyping from '@/hooks/useTyping';

const useTitle = room => {
  const roomName = useRef();
  useEffect(() => {
    try {
      if (!isMainWindow()) {
        // 새창만 title 변경
        if (room.roomName && room.roomName !== '') {
          roomName.current = room.roomName;
        } else if (filterMember.length == 0) {
          roomName.current = covi.getDic('NoChatMembers', '대화상대없음');
        }

        roomName.current && setWindowTitle(roomName.current);
      }
    } catch (e) {}
  }, [room]);

  return roomName.current;
};

const isHexColor = background => {
  const hex = background.replace('#', '');
  return (
    typeof hex === 'string' && hex.length === 6 && !isNaN(Number('0x' + hex))
  );
};

const getBackgroundColor = background => {
  if (isHexColor(background)) {
    const hex = background.replace('#', '');
    // 10% 어두운 색상 선택
    let r = Math.floor(new Number('0x' + hex.substr(0, 2)) * 0.9);
    let g = Math.floor(new Number('0x' + hex.substr(2, 2)) * 0.9);
    let b = Math.floor(new Number('0x' + hex.substr(4, 2)) * 0.9);

    return `rgb(${r > 0 ? r : 0}, ${g > 0 ? g : 0}, ${b > 0 ? b : 0})`;
  }

  return '';
};

const ChannelHeader = ({ channelInfo, onSearchBox, onNewWin, isNewWin }) => {
  const id = useSelector(({ login }) => login.id);
  const title = (DEVICE_TYPE === 'd' && useTitle(channelInfo)) || null;
  const dispatch = useDispatch();
  const { needAlert, confirm } = useTyping();

  const handleLayerBox = useCallback(() => {
    openLayer(
      {
        component: (
          <ChannelMenuBox
            key={`channelmember_${channelInfo.id}`}
            channelInfo={channelInfo}
            isNewWin={isNewWin}
          />
        ),
      },
      dispatch,
    );
  }, [channelInfo, isNewWin, id, dispatch]);

  const viewSearchBox = useCallback(() => {
    onSearchBox(true);
  }, [onSearchBox]);

  // 2020.12.22
  // 입력중 채팅방 이동시 경고창 출력
  const handleClose = useCallback(() => {
    confirm(dispatch, initOpenChannel, {}, true);
  }, [dispatch]);

  return (
    <>
      {!channelInfo && <LoadingWrap />}
      {channelInfo && (
        <div
          className="top"
          style={{
            paddingLeft: SCREEN_OPTION == 'G' ? '30px' : '',
            backgroundColor: channelInfo.background
              ? getBackgroundColor(channelInfo.background)
              : '',
          }}
        >
          <>
            {SCREEN_OPTION == 'G' && (
              <div
                style={{
                  transform: 'translate(0, -50%)',
                  height: '60px',
                  position: 'absolute',
                  top: '50%',
                  left: '0px',
                }}
              >
                <button
                  style={{ lineHeight: '60px' }}
                  title={covi.getDic('Back', '뒤로')}
                  alt={covi.getDic('Back', '뒤로')}
                  onClick={handleClose}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="7.131"
                    height="12.78"
                    viewBox="0 0 7.131 12.78"
                  >
                    <path
                      id="패스_2901"
                      data-name="패스 2901"
                      d="M698.2,291.6a.524.524,0,0,0-.742.741l5.579,5.592-5.579,5.4a.524.524,0,0,0,.742.742l6.236-6.139Z"
                      transform="translate(704.432 304.223) rotate(180)"
                      fill="#fff"
                    />
                  </svg>
                </button>
              </div>
            )}
            <div className="profile-photo">
              {(channelInfo.iconPath && (
                <img
                  src={`${Config.ServerURL.HOST}${channelInfo.iconPath}`}
                  onError={e => {
                    e.target.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
                    e.target.onerror = null;
                  }}
                ></img>
              )) || (
                <div className="spare-text">
                  {(channelInfo.roomName && channelInfo.roomName[0]) || 'N'}
                </div>
              )}
            </div>

            <span className="name">
              {channelInfo.roomName}({channelInfo.categoryName}){' '}
              <span className="usernumber">
                {channelInfo.members
                  ? channelInfo.members.length
                  : channelInfo.realMemberCnt}
              </span>
            </span>
            <div className="LeftMenuBox">
              <button type="button" onClick={viewSearchBox}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13.364"
                  height="13.364"
                  viewBox="0 0 13.364 13.364"
                >
                  <path
                    d="M304.2,2011.439l-3.432-3.432a5.208,5.208,0,0,0,.792-2.728,5.279,5.279,0,1,0-5.28,5.279,5.208,5.208,0,0,0,2.728-.792l3.432,3.432a.669.669,0,0,0,.88,0l.88-.88A.669.669,0,0,0,304.2,2011.439Zm-7.919-2.64a3.52,3.52,0,1,1,3.52-3.52A3.53,3.53,0,0,1,296.279,2008.8Z"
                    transform="translate(-291 -2000)"
                    fill="#fff"
                  ></path>
                </svg>
              </button>
              {onNewWin && SCREEN_OPTION != 'G' && (
                <button
                  type="button"
                  alt={covi.getDic('ShowNewWindow', '새창보기')}
                  title={covi.getDic('ShowNewWindow', '새창보기')}
                  onClick={e => {
                    onNewWin();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12.427"
                    height="12.427"
                    viewBox="0 0 12.427 12.427"
                  >
                    <g transform="translate(3120 -672.573)">
                      <path
                        d="M10,12H2a2,2,0,0,1-2-2V2A2,2,0,0,1,2,0H5.539V1.846H1.846v8.308h8.308V6.462H12V10A2,2,0,0,1,10,12Z"
                        transform="translate(-3120 673)"
                        fill="#fff"
                      ></path>
                      <g transform="translate(-3113.286 673.846)">
                        <path
                          d="M10.5,14.94l4.44-4.44"
                          transform="translate(-10.5 -10.5)"
                          fill="none"
                          stroke="#fff"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        ></path>
                        <path
                          d="M10.5,10.5h2.819v2.819h0"
                          transform="translate(-8.88 -10.5)"
                          fill="none"
                          stroke="#fff"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        ></path>
                      </g>
                    </g>
                  </svg>
                </button>
              )}
              <button type="button" onClick={handleLayerBox}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13.25"
                  height="10.25"
                  viewBox="0 0 13.25 10.25"
                >
                  <path
                    d="M3,16.25H16.25V14.542H3Zm0-4.271H16.25V10.271H3ZM3,6V7.708H16.25V6Z"
                    transform="translate(-3 -6)"
                    fill="#fff"
                  ></path>
                </svg>
              </button>
            </div>
          </>
        </div>
      )}
    </>
  );
};

export default React.memo(ChannelHeader, (prev, next) => {
  return prev.channelInfo === next.channelInfo;
});
