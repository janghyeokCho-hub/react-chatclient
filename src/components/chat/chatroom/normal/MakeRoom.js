import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChatRoomHeader from '@C/chat/chatroom/normal/ChatRoomHeader';
import MessagePostBox from '@C/chat/chatroom/normal/MessagePostBox';
import { openRoom } from '@/modules/room';
import { mappingUserChatRoom } from '@/modules/contact';
import FileUploadBox from '@C/chat/chatroom/normal/FileUploadBox';
import { createRoom } from '@/lib/room';
import { clearFiles } from '@/modules/message';
import * as common from '@/lib/common';
import * as coviFile from '@/lib/fileUpload/coviFile';
import LayerTemplate from '@COMMON/layer/LayerTemplate';

import {
  getMakeData,
  mappingChatRoomEvent,
  evalConnector,
} from '@/lib/deviceConnector';
import { sendMessage, uploadFile, getURLThumbnail } from '@/lib/message';

const getFilterMember = (members, id) => {
  if (members) {
    const filterMember = members.filter(item => {
      if (item.id === id) return false;

      return true;
    });

    return filterMember;
  }

  return [];
};

const MakeRoom = ({ history }) => {
  const isNewWin =
    window.opener != null ||
    (history && history.location.pathname.indexOf('/nw/') > -1);

  const { makeInfo, sender } = useSelector(({ room, login }) => ({
    makeInfo: room.makeInfo,
    sender: login.id,
  }));

  const [viewFileUpload, setViewFileUpload] = useState(false);

  const [viewExtension, setViewExtension] = useState('');
  const [disabeld, setDisabled] = useState(false);

  const contentEditable = useRef(null);
  const chatBox = useRef(null);

  const dispatch = useDispatch();

  const handleExtension = extension => {
    setViewExtension(extension);
  };

  useEffect(() => {
    if (isNewWin) {
      let makeData = null;
      if (DEVICE_TYPE == 'b') {
        if (
          window.opener.parent[window.name] &&
          typeof window.opener.parent[window.name].getRoomInfo == 'function'
        ) {
          makeData = window.opener.parent[window.name].getRoomInfo();
        }
      } else {
        // 현재창에 설정된 makeData load
        makeData = getMakeData();
      }

      if (makeData) {
        dispatch(openRoom(makeData));
      } else {
        common.openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_RetryMakeRoom'),
            callback: () => {
              window.close();
            },
          },
          dispatch,
        );
      }
    }

    // file control 초기화
    const fileCtrl = coviFile.getInstance();
    fileCtrl.clear();
    dispatch(clearFiles());
    setViewFileUpload(false);

    chatBox.current.ondragenter = e => {
      if (e.dataTransfer && e.dataTransfer.types) {
        const type = e.dataTransfer.types[0];
        if (type == 'Files') {
          handleUploadBox(true);
        }
      }
      e.preventDefault();
      e.stopPropagation();
    };

    return () => {
      chatBox.current.ondragenter = null;
    };
  }, []);

  const handleUploadBox = visible => {
    setViewFileUpload(visible);
  };

  const remoteHost = sessionKey => {
    const msgObj = {
      title: '원격지원',
      context: '원격지원 요청입니다.',
      func: {
        name: '원격지원 수락',
        type: 'remote',
        data: {
          sessionKey: sessionKey,
        },
      },
    };

    handleMessage(JSON.stringify(msgObj), null, null, 'A');
  };

  const handleNewRoom = roomID => {
    dispatch(openRoom({ roomID: roomID }));
    // 타입이 M인경우 기존 사용자정보에 해당하는 사용자에 개인채팅방 매핑
    if (!isNewWin) {
      if (makeInfo.roomType === 'M') {
        dispatch(
          mappingUserChatRoom({
            id: makeInfo.members[0].id,
            roomID: roomID,
          }),
        );
      }
    } else {
      // 새창처리
      // #을 이용한 hash router 이동은 새창으로 연결할때만 사용
      history.push(`/client/nw/chatroom/${roomID}`);
      // chatroom으로 이동하면서 창에걸린 event bind
      if (DEVICE_TYPE == 'd') {
        mappingChatRoomEvent(roomID);
      }
    }
  };

  // TODO: 메시지 전송 실패 여부 처리
  const handleMessage = (message, filesObj, linkObj, messageType) => {
    // 방생성 api 호출
    // 호출 결과에 따라 ChatRoom으로 화면 전환
    // -- MultiView의 경우 dispatch
    // -- NewWindow의 경우 route 이동
    setDisabled(true);

    let invites = [];
    makeInfo.members.forEach(item => invites.push(item.id));

    if (invites.indexOf(sender) == -1) invites.push(sender);

    const data = {
      roomType: makeInfo.roomType,
      name: '',
      members: invites,
      memberType: makeInfo.memberType,
      message: message,
      sendFileInfo: filesObj,
      linkInfo: linkObj,
      messageType: messageType ? messageType : 'N',
    };

    if (messageType == 'A') {
      createRoom(data).then(({ data }) => {
        if (data.status === 'SUCCESS') {
          console.log(data);
          const roomID = data.result.room.roomID;
          handleNewRoom(roomID);
        }
      });
      return;
    }

    if (filesObj) {
      uploadFile(data).then(({ data }) => {
        if (data.state === 'SUCCESS') {
          const messageParams = {
            context: message,
            roomID: data.roomID,
            sender: sender,
            roomType: makeInfo.roomType,
            fileInfos: JSON.stringify(data.result),
          };

          sendMessage(messageParams).then(({ data }) => {
            if (data.status === 'SUCCESS') {
              if (linkObj) {
                getURLThumbnail({
                  roomId: data.result.roomID,
                  messageId: data.result.messageID,
                  url: linkObj.url,
                });
              }

              handleNewRoom(data.result.roomID);
            }
          });
        }
      });
    } else {
      createRoom(data).then(({ data }) => {
        if (data.status === 'SUCCESS') {
          console.log(data);
          const roomID = data.result.room.roomID;
          if (linkObj) {
            getURLThumbnail({
              roomId: roomID,
              messageId: data.result.messageID,
              url: linkObj.url,
            });
          }

          handleNewRoom(roomID);
        }
      });
    }
  };

  const roomName = useMemo(() => {
    if (makeInfo) {
      const refWord = `(Enter ${covi.getDic(
        'Send',
      )} / Shift + Enter ${covi.getDic('NewLine')})`;
      if (makeInfo.roomType === 'M') {
        // M의 경우 남은 값이 1개
        const filterMember = getFilterMember(makeInfo.members, sender);
        const target = filterMember[0];

        return `${common.getDictionary(target.name)} ${refWord}`;
      } else if (makeInfo.roomType === 'O') {
        const target = (makeInfo.members && makeInfo.members[0]) || null;
        if (target) {
          return `${common.getDictionary(target.name)} ${refWord}`;
        } else {
          return `${covi.getDic('NoChatMembers')} ${refWord}`;
        }
      } else {
        const filterMember = getFilterMember(makeInfo.members, sender);
        if (filterMember.length == 0)
          return `${covi.getDic('NoChatMembers')} ${refWord}`;

        const groupNames = filterMember.map((item, index) => {
          return common.getDictionary(item.name);
        });

        const getGroupName = (groupNames, limitCnt) => {
          const spliceArr = groupNames.slice(0, limitCnt);
          const otherCnt = groupNames.length - limitCnt;

          if (otherCnt > 0) {
            return common.getSysMsgFormatStr(covi.getDic('Tmp_andOthers'), [
              { type: 'Plain', data: spliceArr.join(', ') },
              { type: 'Plain', data: otherCnt },
            ]);
          } else {
            return spliceArr.join(', ');
          }
        };

        return `${getGroupName(groupNames, 4)} ${refWord}`;
      }
    }
  }, [makeInfo, sender]);

  return (
    <>
      {isNewWin && (
        <>
          <div className="Chat Newwindow">
            <div style={{ width: '100%', height: '100%' }} ref={chatBox}>
              <ChatRoomHeader
                roomInfo={makeInfo}
                isMakeRoom={true}
                isNewWin={isNewWin}
              />
              <MessagePostBox
                postAction={handleMessage}
                viewExtension={viewExtension}
                onExtension={handleExtension}
                disabeld={disabeld}
                disabeldButtons={makeInfo?.roomType == 'B' ? true : false}
                ref={contentEditable}
                placeholder={roomName}
                remoteAssistance={null}
                remoteHost={remoteHost}
              />
              <FileUploadBox
                onView={handleUploadBox}
                view={viewFileUpload}
              ></FileUploadBox>
            </div>
            <LayerTemplate />
          </div>
        </>
      )}
      {!isNewWin && (
        <div style={{ width: '100%', height: '100%' }} ref={chatBox}>
          <ChatRoomHeader
            roomInfo={makeInfo}
            isMakeRoom={true}
            isNewWin={isNewWin}
          />
          <div
            className="messages-chat"
            style={{ position: 'relative', background: '#fff' }}
          ></div>
          <MessagePostBox
            postAction={handleMessage}
            viewExtension={viewExtension}
            onExtension={handleExtension}
            disabeld={disabeld}
            disabeldButtons={makeInfo?.roomType == 'B' ? true : false}
            ref={contentEditable}
            placeholder={roomName}
            remoteAssistance={null}
            remoteHost={remoteHost}
          />

          <FileUploadBox
            onView={handleUploadBox}
            view={viewFileUpload}
          ></FileUploadBox>
        </div>
      )}
    </>
  );
};

export default MakeRoom;
