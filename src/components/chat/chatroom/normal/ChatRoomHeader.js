import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import loadable from '@loadable/component';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@/components/common/ProfileBox';
import { openLayer, getJobInfo, openPopup } from '@/lib/common';
import { setInitCurrentRoom, messageCurrentTyping } from '@/modules/room';
import { setWindowTitle, isMainWindow } from '@/lib/deviceConnector';
import useTyping from '@/hooks/useTyping';

const ChatMenuBox = loadable(() =>
  import('@/components/chat/chatroom/layer/ChatMenuBox'),
);

const useTitle = (room, id) => {
  const roomName = useRef();

  useEffect(() => {
    if (!isMainWindow()) {
      try {
        // 새창만 title 변경
        const filterMember =
          (room.roomType !== 'O' &&
            room.members.filter(item => item.id !== id)) ||
          room.members;
        if (room.roomType === 'M' || room.roomType === 'O') {
          // M의 경우 남은 값이 1개
          const target = filterMember[0];

          roomName.current = getJobInfo(target);
        } else {
          if (room.roomName && room.roomName !== '') {
            roomName.current = room.roomName;
          }

          if (filterMember.length == 0)
            roomName.current = covi.getDic('NoChatMembers', '대화상대없음');

          const memberTextArr = filterMember.map(item => getJobInfo(item));

          roomName.current = `${memberTextArr.slice(0, 5).join(',')}${
            memberTextArr.length > 5 ? '...' : ''
          }`;
        }

        roomName.current && setWindowTitle(roomName.current);
      } catch (e) {}
    }
  }, [room]);

  return roomName.current;
};

const makeRoomName = (room, id, isInherit) => {
  // 방 이름 생성하는 규칙 처리 필요
  if (room && (room.members || room.groups)) {
    // 그룹단위로 선택된 경우 ( 방생성시에만 유효 )
    if (room.roomType === 'M' || room.roomType === 'O') {
      let filterMember = null;

      if (room.roomType === 'M') {
        filterMember = room.members.filter(item => {
          if (item.id === id) return false;
          return true;
        });
      } else if (room.roomType === 'O') {
        filterMember = room.members;
      }

      const target = filterMember && filterMember[0];

      if (target) {
        return (
          <>
            <ProfileBox
              userId={target.id}
              userName={target.name}
              presence={target.presence}
              isInherit={isInherit} // 새방 생성 시 프레젠스 목록에 추가
              img={target.photoPath}
            />
            <span className="name">
              {getJobInfo(target)}
              {target.isMobile === 'Y' && (
                <span style={{ padding: '0px 5px' }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="9"
                    height="12"
                    viewBox="0 0 7 10"
                  >
                    <g transform="translate(-185 -231)">
                      <rect
                        width="7"
                        height="10"
                        transform="translate(185 231)"
                        fill="#4f5050"
                      ></rect>
                      <rect
                        width="5"
                        height="6"
                        transform="translate(186 232)"
                        fill="#fff"
                      ></rect>
                      <circle
                        cx="0.5"
                        cy="0.5"
                        r="0.5"
                        transform="translate(188 239)"
                        fill="#fff"
                      ></circle>
                    </g>
                  </svg>
                </span>
              )}
            </span>
          </>
        );
      } else {
        return <></>;
      }
    } else if (room.roomType === 'A') {
      const target = room.members[0];

      return (
        <>
          <ProfileBox
            userId={target.id}
            userName={target.name}
            presence={null}
            isInherit={false} // 새방 생성 시 프레젠스 목록에 추가
            img={target.photoPath}
            handleClick={false}
          />
          <span className="name">{target.name}</span>
        </>
      );
    } else {
      // 차후에 몇명인지 표시 필요
      if (room.roomType == 'B') {
        return (
          <>
            <span className="name">
              {!room.roomName || room.roomName == '' ? '이음이' : room.roomName}
            </span>
          </>
        );
      } else {
        return (
          <>
            <span className="name">
              {!room.roomName || room.roomName == ''
                ? covi.getDic('GroupChatRoom', '그룹채팅방')
                : room.roomName}{' '}
              ({room.members.length})
            </span>
          </>
        );
      }
    }
  } else {
    return '';
  }
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

const ChatRoomHeader = ({
  roomInfo,
  isMakeRoom,
  onSearchBox,
  onNewWin,
  isNewWin,
}) => {
  const id = useSelector(({ login }) => login.id);

  const { needAlert, confirm } = useTyping();

  const roomName = useMemo(
    () => makeRoomName(roomInfo, id, !isMakeRoom),
    [roomInfo, id, isMakeRoom],
  );

  const dispatch = useDispatch();

  const title =
    (DEVICE_TYPE === 'd' && !isMakeRoom && useTitle(roomInfo, id)) || null;

  const handleLayerBox = useCallback(() => {
    openLayer(
      {
        component: (
          <ChatMenuBox
            roomInfo={roomInfo}
            isMakeRoom={isMakeRoom}
            isNewWin={isNewWin}
          />
        ),
      },
      dispatch,
    );
  }, [roomInfo, isMakeRoom, isNewWin, dispatch]);

  const viewSearchBox = useCallback(() => {
    onSearchBox(true);
  }, [onSearchBox]);

  const handleClose = useCallback(() => {
    // 2020.12.21
    // 뒤로가기 버튼으로 대화창을 닫을 시,
    // 다음 대화상대를 선택할 때에도 경고창이 또 등장할 수 있어서
    // store에 저장된 flag 값을 직접 false로 업데이트 해줘야 함
    confirm(dispatch, setInitCurrentRoom, {}, true);
  }, [dispatch]);

  return (
    <>
      <div
        className="top"
        style={{
          paddingLeft: SCREEN_OPTION == 'G' ? '30px' : '',
          backgroundColor:
            roomInfo && roomInfo.background
              ? getBackgroundColor(roomInfo.background)
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
          {roomInfo && roomName}
          {roomInfo?.roomType != 'B' && (
            <div className="LeftMenuBox">
              {!isMakeRoom && roomInfo && roomInfo.roomType != 'A' && (
                <button
                  type="button"
                  onClick={viewSearchBox}
                  alt={covi.getDic('Search', '검색')}
                  title={covi.getDic('Search', '검색')}
                >
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
                /* 새창 */
              )}
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
              {roomInfo && (roomInfo.roomType != 'A' || DEVICE_TYPE == 'd') && (
                <>
                  <button
                    type="button"
                    onClick={handleLayerBox}
                    alt={covi.getDic('ExtensionMenu', '확장메뉴')}
                    title={covi.getDic('ExtensionMenu', '확장메뉴')}
                  >
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
                </>
              )}
            </div>
          )}
        </>
      </div>
    </>
  );
};

export default React.memo(ChatRoomHeader, (prev, next) => {
  return prev.roomInfo === next.roomInfo;
});
