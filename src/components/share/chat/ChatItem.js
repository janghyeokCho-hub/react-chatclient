import React, { useMemo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import RoomMemberBox from '@C/chat/RoomMemberBox';
import ProfileBox from '@COMMON/ProfileBox';
import { getConfig } from '@/lib/util/configUtil';
import * as common from '@/lib/common';

const ChatItem = ({ room, checkObj, pinnedTop }) => {
  const id = useSelector(({ login }) => login.id);
  const checkRef = useRef(null);

  const chatBotConfig = getConfig('ChatBot');

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

  const filterMember = useMemo(
    () => getFilterMember(room.members, id, room.roomType),
    [room.members, id],
  );

  const handleClick = useCallback(() => {
    checkRef && checkRef.current && checkRef.current.click();
  }, [checkRef]);

  const makeMessageText = lastMessage => {
    let returnText = covi.getDic('Msg_NoMessages', '대화내용 없음');
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
          if (messageObj.type == 'emoticon')
            returnText = covi.getDic('Emoticon', '이모티콘');
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
            returnText = common.getSysMsgFormatStr(
              covi.getDic('Tmp_imgExCnt', '사진 외 %s건'),
              [{ type: 'Plain', data: fileObj.length - 1 }],
            );
          } else {
            // 파일 외 %s건
            returnText = common.getSysMsgFormatStr(
              covi.getDic('Tmp_fileExCnt', '파일 외 %s건'),
              [{ type: 'Plain', data: fileObj.length - 1 }],
            );
          }
        } else {
          if (
            fileObj.ext == 'png' ||
            fileObj.ext == 'jpg' ||
            fileObj.ext == 'jpeg' ||
            fileObj.ext == 'bmp'
          ) {
            returnText = covi.getDic('Image', '사진');
          } else {
            returnText = covi.getDic('File', '파일');
          }
        }
      }
    } catch (e) {
      // console.log(e);
    }

    return returnText;
  };

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

        if (filterMember.length == 0)
          return <>{covi.getDic('NoChatMembers', '대화상대없음')}</>;

        return (
          <>
            <span>
              {filterMember.map((item, index) => {
                if (index == filterMember.length - 1)
                  return common.getJobInfo(item);
                else return common.getJobInfo(item) + ',';
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

  const checkedValue = useMemo(() => {
    if (typeof checkObj === 'undefined') {
      return;
    }
    // userInfo[checkedKey] 값이 비어있으면 checkedSubKey 참조
    if (typeof checkObj.checkedSubKey !== 'undefined') {
      return room[checkObj.checkedKey] || room[checkObj.checkedSubKey];
    }
    return room[checkObj.checkedKey];
  }, [room, checkObj]);

  return (
    <li className="person" onClick={() => handleClick()}>
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
        <span className="name">
          {makeRoomName(filterMember)}
          {pinnedTop && '📌'}
        </span>
        <span className="preview">
          {room.lastMessage && makeMessageText(room.lastMessage)}
        </span>
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
