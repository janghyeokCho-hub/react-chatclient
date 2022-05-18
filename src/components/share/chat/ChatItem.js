import React, {
  useMemo,
  useCallback,
  useRef,
  useState,
  useLayoutEffect,
} from 'react';
import { useSelector } from 'react-redux';
import RoomMemberBox from '@C/chat/RoomMemberBox';
import ProfileBox from '@COMMON/ProfileBox';
import { getConfig } from '@/lib/util/configUtil';
import {
  getJobInfo,
  makeMessageText,
  getFilterMember,
  isJSONStr,
} from '@/lib/common';
import { isBlockCheck } from '@/lib/orgchart';

const ChatItem = ({ room, checkObj, pinnedTop, chineseWall }) => {
  const id = useSelector(({ login }) => login.id);
  const checkRef = useRef(null);

  const chatBotConfig = getConfig('ChatBot');
  const [lastMessageText, setLastMessageText] = useState('');

  useLayoutEffect(() => {
    if (room?.lastMessage && chineseWall.length) {
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
        chineseWall,
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
  }, [room, chineseWall]);

  const filterMember = useMemo(
    () => getFilterMember(room.members, id, room.roomType),
    [room.members, id],
  );

  const handleClick = useCallback(() => {
    checkRef?.current?.click();
  }, [checkRef]);

  const makeRoomName = useCallback(
    filterMember => {
      if (room.roomType === 'M' || room.roomType === 'O') {
        // M의 경우 남은 값이 1개
        return <>{getJobInfo(filterMember[0])}</>;
      } else {
        if (!!room.roomName) {
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
        } else if (room.roomType === 'B') {
          return (
            <>
              <span>{'이음이'}</span>
            </>
          );
        }

        if (!filterMember.length) {
          return <>{covi.getDic('NoChatMembers', '대화상대없음')}</>;
        }

        return (
          <>
            <span>
              {filterMember.map((item, index) => {
                if (index === filterMember.length - 1) {
                  return getJobInfo(item);
                } else {
                  return `${getJobInfo(item)},`;
                }
              })}
            </span>
            {!['A', 'B'].includes(room.roomType) && room.members && (
              <span className="roomMemberCtn">({room.members.length})</span>
            )}
          </>
        );
      }
    },
    [room],
  );

  const checkedValue = useMemo(() => {
    if (!checkObj) {
      return;
    }
    // userInfo[checkedKey] 값이 비어있으면 checkedSubKey 참조
    if (!!checkObj?.checkedSubKey) {
      return room[checkObj.checkedKey] || room[checkObj.checkedSubKey];
    }
    return room[checkObj.checkedKey];
  }, [room, checkObj]);

  return (
    <li className="person" onClick={() => handleClick()}>
      <>
        {((room.roomType === 'M' || filterMember.length === 1) &&
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
              handleClick={false}
            />
          ))) ||
          (room.roomType !== 'B' && (
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
        <span className="name">
          {makeRoomName(filterMember)}
          {pinnedTop && '📌'}
        </span>
        <span className="preview">{lastMessageText}</span>
        <div className="check">
          <div className="chkStyle02">
            <input
              ref={checkRef}
              type="checkbox"
              id={checkObj.name + checkedValue}
              name={checkObj.name + checkedValue}
              onClick={e => {
                e.stopPropagation();
              }}
              onChange={e => {
                checkObj.onChange(e, room, filterMember);
              }}
              checked={
                checkObj.checkedList.find(
                  item =>
                    (item[checkObj.checkedKey] ||
                      item[checkObj.checkedSubKey]) === checkedValue,
                ) !== undefined
              }
            />
            <label
              htmlFor={checkObj.name + checkedValue}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <span></span>
            </label>
          </div>
        </div>
      </>
    </li>
  );
};

export default ChatItem;
