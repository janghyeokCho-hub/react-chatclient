import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChatRoomHeader from '@C/chat/chatroom/normal/ChatRoomHeader';
import MessagePostBox from '@C/chat/chatroom/normal/MessagePostBox';
import { openRoom } from '@/modules/room';
import { mappingUserChatRoom } from '@/modules/contact';
import FileUploadBox from '@C/chat/chatroom/normal/FileUploadBox';
import { createRoom } from '@/lib/room';
import { updateRooms } from '@/modules/room';
import { clearFiles } from '@/modules/message';
import {
  openPopup,
  getDictionary,
  getSysMsgFormatStr,
  getFilterMember,
} from '@/lib/common';
import { getInstance } from '@/lib/fileUpload/coviFile';
import LayerTemplate from '@COMMON/layer/LayerTemplate';

import {
  getMakeData,
  mappingChatRoomEvent,
  sendMain,
} from '@/lib/deviceConnector';
import { sendMessage, uploadFile, getURLThumbnail } from '@/lib/message';

const MakeRoom = ({ history }) => {
  const isNewWin =
    window.opener != null ||
    (history && history.location.pathname.indexOf('/nw/') > -1);

  const { makeInfo, sender } = useSelector(({ room, login }) => ({
    makeInfo: room.makeInfo,
    sender: login.id,
  }));
  const blockUser = useSelector(({ login }) => login.blockList);

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
        // ???????????? ????????? makeData load
        makeData = getMakeData();
      }

      if (makeData) {
        dispatch(openRoom(makeData));
      } else {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic(
              'Msg_RetryMakeRoom',
              '????????? ????????? ??? ????????????. ?????? ??????????????????.',
            ),
            callback: () => {
              window.close();
            },
          },
          dispatch,
        );
      }
    }

    // file control ?????????
    const fileCtrl = getInstance();
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
      title: covi.getDic('RemoteSupport', 'RemoteSupport'),
      context: covi.getDic('Msg_RequestRemoteSupport', '???????????? ???????????????.'),
      func: {
        name: covi.getDic('AcceptRemoteSupport', '???????????? ??????'),
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
    // ????????? M????????? ?????? ?????????????????? ???????????? ???????????? ??????????????? ??????
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
      // ????????????
      // #??? ????????? hash router ????????? ???????????? ??????????????? ??????
      history.push(`/client/nw/chatroom/${roomID}`);
      // chatroom?????? ??????????????? ???????????? event bind
      if (DEVICE_TYPE == 'd') {
        mappingChatRoomEvent(roomID);
      }
    }
  };

  // TODO: ????????? ?????? ?????? ?????? ??????
  const handleMessage = async (
    message,
    filesObj,
    linkObj,
    messageType,
    emoticon,
  ) => {
    console.log(message);
    // ????????? api ??????
    // ?????? ????????? ?????? ChatRoom?????? ?????? ??????
    // -- MultiView??? ?????? dispatch
    // -- NewWindow??? ?????? route ??????
    setDisabled(true);

    let invites = [];
    makeInfo?.members?.forEach(item => invites.push(item.id));

    let blockList = [];
    if (invites?.length && blockUser) {
      blockList = blockUser.filter(
        item => item !== sender && invites.includes(item),
      );
    }

    if (invites.indexOf(sender) == -1) {
      invites.push(sender);
    }

    let data;

    if (makeInfo.roomType === 'B') {
      data = {
        roomType: makeInfo.roomType,
        name: '?????????',
        members: invites,
        memberType: 'U',
        message: message,
        sendFileInfo: filesObj,
        linkInfo: linkObj,
        messageType: messageType ? messageType : 'N',
        blockList: blockList || [],
      };
    } else {
      data = {
        roomType: makeInfo.roomType,
        name: '',
        members: invites,
        memberType: makeInfo.memberType,
        message: message,
        sendFileInfo: filesObj,
        linkInfo: linkObj,
        messageType: messageType ? messageType : 'N',
        blockList: blockList || [],
      };
    }

    if (messageType === 'A') {
      const { data: response } = await createRoom(data);
      if (response.status === 'SUCCESS') {
        const roomID = response.result.room.roomID;
        if (response.result.room.updateDate === null) {
          dispatch(updateRooms({ updateList: [roomID] }));
        }
        sendMain('onCreateChatRoom', { roomID });
        handleNewRoom(roomID);
      }
      return;
    }

    if (filesObj) {
      const { data: response } = await uploadFile(data);
      if (response.state === 'SUCCESS') {
        const messageParams = {
          context: message,
          roomID: response.roomID,
          sender: sender,
          roomType: makeInfo.roomType,
          fileInfos: JSON.stringify(response.result),
          blockList: blockList || [],
        };
        const { data: sendMessageResponse } = await sendMessage(messageParams);
        if (sendMessageResponse.status === 'SUCCESS') {
          const roomId = sendMessageResponse.result.roomID;
          if (linkObj) {
            getURLThumbnail({
              roomId,
              messageId: sendMessageResponse.result.messageID,
              url: linkObj.url,
            });
          }
          if (emoticon) {
            sendMessage({
              context: emoticon,
              roomID: roomId,
              sender,
              roomType: makeInfo.roomType,
              blockList: blockList || [],
            });
          }
          sendMain('onCreateChatRoom', { roomID: roomId });
          handleNewRoom(roomId);
        }
      }
    } else {
      const { data: createRoomResponse } = await createRoom(data);
      if (createRoomResponse.status === 'SUCCESS') {
        const roomID = createRoomResponse.result.room.roomID;
        if (createRoomResponse.result.room.updateDate === null) {
          dispatch(updateRooms({ updateList: [roomID] }));
        }
        if (linkObj) {
          getURLThumbnail({
            roomId: roomID,
            messageId: createRoomResponse.result.messageID,
            url: linkObj.url,
          });
        }
        if (emoticon) {
          sendMessage({
            context: emoticon,
            roomID,
            sender,
            roomType: makeInfo.roomType,
            blockList: blockList || [],
          });
        }
        sendMain('onCreateChatRoom', { roomID });
        handleNewRoom(roomID);
      }
    }
  };

  const roomName = useMemo(() => {
    if (makeInfo) {
      if (makeInfo.roomType === 'B') {
        // B????????? ???????????? ???????????? ?????? (?????? ????????? ?????? ??????)
        return '???????????? ????????? ?????? "??????"????????? ???????????? ?????????????????? !!';
      }
      const refWord = `(Enter ${covi.getDic(
        'Send',
        '??????',
      )} / Shift + Enter ${covi.getDic('NewLine', '??????')})`;
      if (makeInfo.roomType === 'M') {
        // M??? ?????? ?????? ?????? 1???
        const filterMember = getFilterMember(makeInfo.members, sender);
        const target = filterMember[0];

        return `${getDictionary(target.name)} ${refWord}`;
      } else if (makeInfo.roomType === 'O') {
        const target = (makeInfo.members && makeInfo.members[0]) || null;
        if (target) {
          return `${getDictionary(target.name)} ${refWord}`;
        } else {
          return `${covi.getDic('NoChatMembers', '??????????????????')} ${refWord}`;
        }
      } else {
        const filterMember = getFilterMember(makeInfo.members, sender);
        if (filterMember.length == 0)
          return `${covi.getDic('NoChatMembers', '??????????????????')} ${refWord}`;

        const groupNames = filterMember.map((item, index) => {
          return getDictionary(item.name);
        });

        const getGroupName = (groupNames, limitCnt) => {
          const spliceArr = groupNames.slice(0, limitCnt);
          const otherCnt = groupNames.length - limitCnt;

          if (otherCnt > 0) {
            return getSysMsgFormatStr(
              covi.getDic('Tmp_andOthers', 'Tmp_andOthers'),
              [
                { type: 'Plain', data: spliceArr.join(', ') },
                { type: 'Plain', data: otherCnt },
              ],
            );
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
                disabledButtons={makeInfo?.roomType == 'B' ? true : false}
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
          <MessagePostBox
            postAction={handleMessage}
            viewExtension={viewExtension}
            onExtension={handleExtension}
            disabeld={disabeld}
            disabledButtons={makeInfo?.roomType == 'B' ? true : false}
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
