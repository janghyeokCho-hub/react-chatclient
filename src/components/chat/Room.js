import React, { useMemo, useCallback, useState, useEffect } from 'react';
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
import * as common from '@/lib/common';
import { leaveRoomUtil } from '@/lib/roomUtil';

const getFilterMember = (members, id, roomType) => {
  if (members && roomType !== 'O') {
    const filterMember = members.filter(item => {
      if (item.id === id) return false;

      return true;
    });

    return filterMember;
  } else if (members && roomType === 'O') {
    const filterMember = members;

    return filterMember;
  }

  return [];
};

const makeMessageText = lastMessage => {
  let returnText = covi.getDic('Msg_NoMessages');
  try {
    let msgObj = null;

    if (typeof lastMessage == 'string') {
      msgObj = JSON.parse(lastMessage);
    } else if (typeof lastMessage == 'object') {
      msgObj = lastMessage;
    }

    if (!msgObj) return returnText;

    if (msgObj.Message !== '' && msgObj.Message !== null) {
      let drawText = (msgObj.Message && msgObj.Message) || '';
      if (common.isJSONStr(msgObj.Message)) {
        const drawData = JSON.parse(msgObj.Message);

        console.log('drawData=>', drawData);
        if (drawData.msgType == 'C') {
          drawText = common.getDictionary(drawData.title);
        } else if (typeof drawData == 'object') {
          drawText = drawData.context || JSON.stringify(drawData);
        } else {
          drawText = drawData.context;
        }
      }
      // protocol check
      if (common.eumTalkRegularExp.test(drawText)) {
        const messageObj = common.convertEumTalkProtocolPreview(drawText);
        if (messageObj.type == 'emoticon') returnText = covi.getDic('Emoticon');
        else returnText = messageObj.message.split('\n')[0];
      } else {
        // 첫줄만 노출
        returnText = drawText.split('\n')[0];
      }
    } else if (msgObj.File) {
      let fileObj = null;

      if (typeof msgObj.File == 'string') {
        fileObj = JSON.parse(msgObj.File);
      } else if (typeof msgObj.File == 'object') {
        fileObj = msgObj.File;
      }

      if (!fileObj) return returnText;

      // files 일경우
      if (fileObj.length != undefined && fileObj.length > 1) {
        const firstObj = fileObj[0];
        if (
          firstObj.ext == 'png' ||
          firstObj.ext == 'jpg' ||
          firstObj.ext == 'jpeg' ||
          firstObj.ext == 'bmp'
        ) {
          // 사진 외 %s건
          returnText = common.getSysMsgFormatStr(covi.getDic('Tmp_imgExCnt'), [
            { type: 'Plain', data: fileObj.length - 1 },
          ]);
        } else {
          // 파일 외 %s건
          returnText = common.getSysMsgFormatStr(covi.getDic('Tmp_fileExCnt'), [
            { type: 'Plain', data: fileObj.length - 1 },
          ]);
        }
      } else {
        if (
          fileObj.ext == 'png' ||
          fileObj.ext == 'jpg' ||
          fileObj.ext == 'jpeg' ||
          fileObj.ext == 'bmp'
        ) {
          returnText = covi.getDic('Image');
        } else {
          returnText = covi.getDic('File');
        }
      }
    }
  } catch (e) {
    // console.log(e);
  }

  return returnText;
};

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

const Room = ({ room, onRoomChange, isSelect, dbClickEvent }) => {
  const id = useSelector(({ login }) => login.id);
  const [isNoti, setIsNoti] = useState(true);

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

  const dispatch = useDispatch();

  const makeRoomName = useCallback(
    filterMember => {
      if (room.roomType === 'M' || room.roomType === 'O') {
        // M의 경우 남은 값이 1개
        const target = filterMember[0];

        return <>{common.getJobInfo(target)}</>;
      } else {
        if (room.roomName && room.roomName !== '') {
          return (
            <>
              <span>{room.roomName}</span>
              <span className="roomMemberCtn">
                {room.members && `(${room.members.length})`}
              </span>
            </>
          );
        }

        if (filterMember.length == 0)
          return <>{covi.getDic('NoChatMembers')}</>;

        return (
          <>
            <span>
              {filterMember.map((item, index) => {
                if (index == filterMember.length - 1)
                  return common.getJobInfo(item);
                else return common.getJobInfo(item) + ',';
              })}
            </span>
            {room.roomType != 'A' && room.members && (
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

  const menus = useMemo(() => {
    const menus = [
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
        name: covi.getDic('OpenChat'),
      },
      {
        code: 'outRoom',
        isline: false,
        onClick: () => {
          leaveRoomUtil(dispatch, room, id);
        },
        name: covi.getDic('LeaveChat'),
      },
    ];

    if (DEVICE_TYPE != 'b') {
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
        name: !isNoti ? covi.getDic('AlarmOn') : covi.getDic('AlarmOff'),
      });
    }

    return menus;
  }, [dispatch, room, id, dbClickEvent, isSelect, handleDoubleClick, isNoti]);

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
              ))) || (
              <RoomMemberBox type="G" data={filterMember}></RoomMemberBox>
            )}
          </>

          <span className="name">{makeRoomName(filterMember)}</span>
          <span className="time">{makeDateTime(room.lastMessageDate)}</span>
          <span className="preview">
            {room.lastMessage && makeMessageText(room.lastMessage)}
          </span>

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
