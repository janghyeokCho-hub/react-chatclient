import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import RoomMemberBox from '@C/chat/RoomMemberBox';
import {
  format,
  isValid,
  startOfToday,
  differenceInMilliseconds,
} from 'date-fns';
import { newWinRoom } from '@/modules/room';
import ProfileBox from '@COMMON/ProfileBox';
import RightConxtMenu from '../common/popup/RightConxtMenu';
import { newChatRoom, evalConnector } from '@/lib/deviceConnector';
import {
  isJSONStr,
  getJobInfo,
  openPopup,
  makeMessageText,
  getFilterMember,
} from '@/lib/common';
import { leaveRoomUtil } from '@/lib/roomUtil';
import { getConfig } from '@/lib/util/configUtil';
import { modifyRoomSetting } from '@/modules/room';
import { getChineseWall, isBlockCheck } from '@/lib/orgchart';
import { isMainWindow } from '@/lib/deviceConnector';

const makeDateTime = timestamp => {
  if (isValid(new Date(timestamp))) {
    const toDay = startOfToday();
    const procTime = new Date(timestamp);
    let dateText = '';

    if (differenceInMilliseconds(procTime, toDay) >= 0) {
      // 오늘보다 큰 경우 시간 표시
      dateText = format(procTime, 'HH:mm');
    } else {
      // 오늘과 이틀이상 차이나는 경우 날짜로 표시
      dateText = format(procTime, 'yyyy.MM.dd');
    }

    // 오늘과 하루 차이인 경우 어제로 표시 -- 차후에 추가 ( 다국어처리 )

    return dateText;
  } else {
    return '';
  }
};

const Room = ({
  room,
  onRoomChange,
  isSelect,
  dbClickEvent,
  pinnedRooms,
  getRoomSettings,
  isEmptyObj,
  pinToTopLimit = -1,
}) => {
  const id = useSelector(({ login }) => login.id);
  const myInfo = useSelector(({ login }) => login.userInfo);
  const userChineseWall = useSelector(({ login }) => login.chineseWall);
  const [isNoti, setIsNoti] = useState(true);
  const chatBotConfig = getConfig('ChatBot');
  const forceDisableNoti = getConfig('ForceDisableNoti', 'N') === 'Y';
  const [pinnedTop, setPinnedTop] = useState(false);
  const setting = useMemo(() => getRoomSettings(room), [room]);
  const [lastMessageText, setLastMessageText] = useState('');
  const [chineseWallState, setChineseWallState] = useState([]);

  useEffect(() => {
    const getChineseWallList = async () => {
      const { result, status } = await getChineseWall({
        userId: myInfo?.id,
        myInfo,
      });
      if (status === 'SUCCESS') {
        setChineseWallState(result);
        if (DEVICE_TYPE === 'd' && !isMainWindow()) {
          dispatch(setChineseWall(result));
        }
      } else {
        setChineseWallState([]);
      }
    };

    if (userChineseWall?.length) {
      setChineseWallState(userChineseWall);
    } else {
      getChineseWallList();
    }

    return () => {
      setChineseWallState([]);
    };
  }, []);

  useLayoutEffect(() => {
    if (room?.lastMessage && chineseWallState.length) {
      const lastMessageInfo = isJSONStr(room.lastMessage)
        ? JSON.parse(room.lastMessage)
        : room.lastMessage;
      const targetInfo = {
        id: lastMessageInfo.sender,
        companyCode: lastMessageInfo.companyCode,
        deptCode: lastMessageInfo.deptCode,
      };
      const { blockChat, blockFile } = isBlockCheck({
        targetInfo,
        chineseWall: chineseWallState,
      });
      const isFile = !!lastMessageInfo?.File;
      const result = isFile ? blockFile : blockChat;

      if (result) {
        setLastMessageText(covi.getDic('BlockChat', '차단된 메시지 입니다.'));
      } else {
        makeMessageText(room.lastMessage, 'CHAT').then(setLastMessageText);
      }
    } else {
      makeMessageText(room.lastMessage, 'CHAT').then(setLastMessageText);
    }
  }, [room, userChineseWall, chineseWallState]);

  const filterMember = useMemo(
    () => getFilterMember(room.members, id, room.roomType),
    [room.members, id],
  );

  useEffect(() => {
    if (DEVICE_TYPE == 'd') {
      const userConfig = evalConnector({
        method: 'getGlobal',
        name: 'USER_SETTING',
      });

      // notiExRooms에 없거나 등록된경우에도 false로 등록됨으로 not 연산자 처리
      if (userConfig && userConfig.config) {
        const notiExRooms = userConfig.get(`notiExRooms.${room.roomID}`);
        setIsNoti(!notiExRooms);
      }
    }
  }, []);

  useEffect(() => {
    if (pinToTopLimit >= 0) {
      if (setting && !isEmptyObj(setting) && !!setting.pinTop) {
        setPinnedTop(true);
      } else {
        setPinnedTop(false);
      }
    } else {
      setPinnedTop(false);
    }
  }, [setting]);

  const dispatch = useDispatch();

  const makeRoomName = useCallback(
    filterMember => {
      if (room.roomType === 'M' || room.roomType === 'O') {
        // M의 경우 남은 값이 1개
        const target = filterMember[0];

        return <>{getJobInfo(target)}</>;
      } else {
        if (!!room?.roomName) {
          return (
            <>
              <span>{room.roomName}</span>
              {room.roomType != 'B' && (
                <span className="roomMemberCtn">
                  {room.members && `(${room.members.length})`}
                </span>
              )}
            </>
          );
        } else {
          if (room.roomType == 'B') {
            return (
              <>
                <span>{'이음이'}</span>
              </>
            );
          }
        }

        if (!filterMember.length)
          return <>{covi.getDic('NoChatMembers', '대화상대없음')}</>;

        return (
          <>
            <span>
              {filterMember.map((item, index) => {
                if (index == filterMember.length - 1) return getJobInfo(item);
                else return getJobInfo(item) + ',';
              })}
            </span>
            {room.roomType != 'A' && room.roomType != 'B' && room.members && (
              <span className="roomMemberCtn">({room.members.length})</span>
            )}
          </>
        );
      }
    },
    [room],
  );

  const handleDoubleClick = useCallback(() => {
    if (dbClickEvent && !room.newWin) {
      onRoomChange(room.roomID);

      const winName = `wrf${room.roomID}`;

      const openURL = `${DEVICE_TYPE == 'd' ? '#' : ''}/client/nw/chatroom/${
        room.roomID
      }`;

      const roomObj = newChatRoom(winName, room.roomID, openURL);

      dispatch(newWinRoom({ id: room.roomID, obj: roomObj, name: winName }));
    } else if (dbClickEvent && room.newWin) {
      if (DEVICE_TYPE == 'd') {
        try {
          if (room.winObj) {
            if (room.winObj.isMinimized()) {
              room.winObj.restore();
            }

            room.winObj.focus();
          }
        } catch (e) {
          // no windows - window 재 맵핑
          onRoomChange(room.roomID);
          const winName = `wrf${room.roomID}`;
          const openURL = `${
            DEVICE_TYPE == 'd' ? '#' : ''
          }/client/nw/chatroom/${room.roomID}`;
          const roomObj = newChatRoom(winName, room.roomID, openURL);
          dispatch(
            newWinRoom({ id: room.roomID, obj: roomObj, name: winName }),
          );
        }
      }
    }
  }, [room, dbClickEvent, dispatch]);

  const handleChangeSetting = useCallback(
    (key, value, type) => {
      let chageSetting = getRoomSettings(room);
      if (type === 'ADD') {
        if (
          pinToTopLimit > -1 &&
          pinToTopLimit !== 0 &&
          pinnedRooms?.length >= pinToTopLimit
        ) {
          openPopup(
            {
              type: 'Alert',
              message: covi.getDic(
                'Msg_PinToTop_LimitExceeded',
                '더 이상 고정할 수 없습니다.',
              ),
            },
            dispatch,
          );
          return;
        }
        chageSetting[key] = value;
      } else {
        if (isEmptyObj(chageSetting)) {
          chageSetting = {};
        } else {
          chageSetting[key] = value;
        }
      }
      dispatch(
        modifyRoomSetting({
          roomID: room.roomID,
          key: key,
          value: value,
          setting: JSON.stringify(chageSetting),
        }),
      );
    },
    [room, pinnedRooms, dispatch, pinToTopLimit],
  );

  const menus = useMemo(() => {
    const pinToTop = {
      code: 'pinRoom',
      isline: false,
      onClick: () => {
        const today = new Date();
        handleChangeSetting('pinTop', `${today.getTime()}`, 'ADD');
      },
      name: covi.getDic('PinToTop', '상단고정'),
    };
    const unpinToTop = {
      code: 'unpinRoom',
      isline: false,
      onClick: () => {
        handleChangeSetting('pinTop', '', 'DEL');
      },
      name: covi.getDic('UnpinToTop', '상단고정 해제'),
    };
    const menus = [
      pinToTopLimit >= 0 && (pinnedTop ? unpinToTop : pinToTop),
      {
        code: 'openRoom',
        isline: false,
        onClick: () => {
          if (dbClickEvent) {
            handleDoubleClick();
          } else {
            if (!isSelect) onRoomChange(room.roomID);
          }
        },
        name: covi.getDic('OpenChat', '채팅방 열기'),
      },
      room?.roomType !== 'A' &&
        room?.roomType !== 'B' && {
          code: 'outRoom',
          isline: false,
          onClick: () => {
            leaveRoomUtil(dispatch, room, id);
          },
          name: covi.getDic('LeaveChat', '채팅방 나가기'),
        },
    ];

    if (DEVICE_TYPE != 'b' && forceDisableNoti === false) {
      menus.push({
        code: 'line',
        isline: true,
        onClick: () => {},
        name: '',
      });

      menus.push({
        code: 'notiOff',
        isline: false,
        onClick: () => {
          const result = evalConnector({
            method: 'sendSync',
            channel: 'room-noti-setting',
            message: { type: 'noti', roomID: room.roomID, noti: !isNoti },
          });

          setIsNoti(!isNoti);
        },
        name: !isNoti
          ? covi.getDic('AlarmOn', '알림 켜기')
          : covi.getDic('AlarmOff', '알림 끄기'),
      });
    }

    return menus;
  }, [
    dispatch,
    room,
    id,
    dbClickEvent,
    isSelect,
    handleDoubleClick,
    isNoti,
    pinnedTop,
    pinToTopLimit,
    pinnedRooms,
  ]);

  const menuId = useMemo(() => 'room_' + room.roomID, [room]);

  if (room.lastMessageDate != null) {
    return (
      <RightConxtMenu menuId={menuId} menus={menus}>
        <li
          className={(isSelect && ['person', 'active'].join(' ')) || 'person'}
          onClick={() => {
            if (!isSelect) onRoomChange(room.roomID);
          }}
          onDoubleClick={handleDoubleClick}
        >
          <>
            {((room.roomType === 'M' || filterMember.length == 1) &&
              ((room.roomType === 'A' && (
                <ProfileBox
                  userId={filterMember[0].id}
                  userName={filterMember[0].name}
                  presence={null}
                  isInherit={false}
                  img={filterMember[0].photoPath}
                  handleClick={false}
                />
              )) || (
                <ProfileBox
                  userId={filterMember[0].id}
                  userName={filterMember[0].name}
                  isInherit={true}
                  img={filterMember[0].photoPath}
                />
              ))) ||
              (room.roomType != 'B' && (
                <RoomMemberBox type="G" data={filterMember}></RoomMemberBox>
              )) ||
              (room.roomType === 'B' && (
                <ProfileBox
                  userId={'eumbot-758f37d1-f6a6-4bc2-bb5b-0376da769697'}
                  userName={chatBotConfig?.name}
                  presence={null}
                  isInherit={false}
                  img={chatBotConfig?.photoURL}
                  handleClick={false}
                />
              ))}
          </>

          <span className="name">{makeRoomName(filterMember)}</span>
          <span className="time">
            {pinnedTop && '📌'}
            {makeDateTime(room.lastMessageDate)}
          </span>
          <span className="preview">{lastMessageText}</span>

          {room.unreadCnt > 0 && (
            <span className="count">
              {room.unreadCnt > 999 ? '999+' : room.unreadCnt}
            </span>
          )}
        </li>
      </RightConxtMenu>
    );
  } else return null;
};

export default React.memo(Room);
