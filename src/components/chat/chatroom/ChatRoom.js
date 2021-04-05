import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import loadable from '@loadable/component';
import LoadingWrap from '@COMMON/LoadingWrap';
import LayerTemplate from '@COMMON/layer/LayerTemplate';
import {
  newWinRoom,
  getRoomInfo,
  rematchingMember,
  readMessage,
  checkRoomMove,
} from '@/modules/room';
import { sendMessage, clearFiles } from '@/modules/message';
import * as coviFile from '@/lib/fileUpload/coviFile';
import { addTargetUserList, delTargetUserList } from '@/modules/presence';
import { newChatRoom, evalConnector, focusWin } from '@/lib/deviceConnector';
import { clearLayer } from '@/lib/common';
import MessageView from '@C/chat/chatroom/normal/MessageView';
import ChatBackground from './layer/ChatBackground';

const SearchView = loadable(() => import('@C/chat/chatroom/search/SearchView'));
const MoveView = loadable(() => import('@C/chat/chatroom/move/MoveView'));
const NoticeView = loadable(() => import('@C/chat/chatroom/notice/NoticeView'));

const ChatRoom = ({ match, roomInfo }) => {
  // roomInfo가 넘어오지 않은경우 URL로 접근
  let roomID;
  const isNewWin =
    window.opener != null || (match && match.url.indexOf('/nw/') > -1);

  if (roomInfo != null) roomID = parseInt(roomInfo.roomID);
  else if (!roomInfo && match) roomID = parseInt(match.params.roomID);
  else roomID = null;

  const room = useSelector(({ room }) => room.currentRoom);

  const moveVisible = useSelector(({ message }) => message.moveVisible);
  const loading = useSelector(({ loading }) => loading['room/GET_ROOM_INFO']);

  const [searchVisible, setSearchVisible] = useState(false);
  const [viewFileUpload, setViewFileUpload] = useState(false);

  const [viewExtension, setViewExtension] = useState('');

  const dispatch = useDispatch();

  const openCurrentRoom = useCallback(() => {
    const winName = `wrf${roomID}`;

    const openURL = `${
      DEVICE_TYPE == 'd' ? '#' : ''
    }/client/nw/chatroom/${roomID}`;

    let roomObj = newChatRoom(winName, roomID, openURL);

    dispatch(newWinRoom({ id: roomID, obj: roomObj, name: winName }));
  }, [dispatch, roomID]);

  useEffect(() => {
    if (isNewWin) {
      if (DEVICE_TYPE == 'b') {
        window.onunload = e => {
          if (typeof window.opener.parent.newWincloseCallback == 'function') {
            window.opener.parent.newWincloseCallback(
              { roomID: roomID, isChannel: false },
              window,
            );
          }
        };
      } else if (DEVICE_TYPE == 'd') {
        evalConnector({
          method: 'on',
          channel: 'onMoveView',
          callback: (event, data) => {
            //currentRoom인 경우에만 이동
            focusWin();
            clearLayer(dispatch);
            if (!data.isChannel) dispatch(checkRoomMove(data));
          },
        });
      }
    }

    const fileCtrl = coviFile.getInstance();
    fileCtrl.clear();
    dispatch(clearFiles());

    covi.changeSearchView = searchText => {
      covi.changeSearchText = searchText;
      setSearchVisible(true);
    };

    return () => {
      covi.changeSearchText = null;
      covi.changeSearchView = null;

      if (isNewWin) {
        window.onunload = null;
        evalConnector({
          method: 'removeListener',
          channel: 'onMoveView',
        });
      }
    };
  }, []);

  useEffect(() => {
    // init
    if (roomID) {
      console.log('Open ROOM :: ' + roomID);

      dispatch(getRoomInfo({ roomID }));

      // 메시지 읽음 처리 ( Room Open )
      dispatch(readMessage({ roomID }));

      // file control 초기화
      const fileCtrl = coviFile.getInstance();
      fileCtrl.clear();
      dispatch(clearFiles());

      setSearchVisible(false);
      setViewFileUpload(false);
    }
  }, [roomID]);

  useEffect(() => {
    // presence - room members
    if (room && room.roomType != 'A' && room.members)
      dispatch(
        addTargetUserList(
          room.members.map(item => ({ userId: item.id, state: item.presence })),
        ),
      );
    return () => {
      if (room && room.roomType != 'A' && room.members)
        dispatch(delTargetUserList(room.members.map(item => item.presence)));
    };
  }, [room]);

  const handleMessage = useCallback(
    (message, filesObj, linkObj, messageType) => {
      const data = {
        roomID: room.roomID,
        context: message,
        roomType: room.roomType,
        sendFileInfo: filesObj,
        linkInfo: linkObj,
        messageType: !!messageType ? messageType : 'N',
      };
      // sendMessage 하기 전에 RoomType이 M인데 참가자가 자기자신밖에 없는경우 상대를 먼저 초대함.
      if (room.roomType === 'M' && room.realMemberCnt === 1) {
        dispatch(rematchingMember(data));
      } else {
        // rematchingMember 내에서 서버 호출 후 sendMessage 호출하도록 변경
        dispatch(sendMessage(data));
      }

      if (window.covi && window.covi.listBottomBtn) {
        window.covi.listBottomBtn.click();
      }
    },
    [dispatch, room],
  );

  const handleSearchBox = useCallback(visible => {
    if (typeof covi.changeSearchText == 'string') covi.changeSearchText = null;
    setSearchVisible(visible);
  }, []);

  const handleUploadBox = useCallback(visible => {
    setViewFileUpload(visible);
  }, []);

  const handleExtension = useCallback(extension => {
    setViewExtension(extension);
  }, []);

  const handleReadMessage = useCallback(
    (roomID, isNotice) => {
      dispatch(readMessage({ roomID, isNotice }));
    },
    [roomID, dispatch],
  );

  return (
    <>
      {loading && <LoadingWrap />}
      {!loading && roomID && (
        <>
          {isNewWin && (
            <div className="Chat Newwindow">
              {DEVICE_TYPE == 'd' && room && (
                <ChatBackground background={room.background} />
              )}
              {(moveVisible && (
                <>
                  <MoveView></MoveView>
                </>
              )) ||
                (searchVisible && (
                  <>
                    <SearchView onSearchBox={handleSearchBox}></SearchView>
                  </>
                )) || (
                  <>
                    {room &&
                      ((room.roomType == 'A' && (
                        <NoticeView
                          roomInfo={room}
                          onNewWin={null}
                          isNewWin={isNewWin}
                          onRead={handleReadMessage}
                        ></NoticeView>
                      )) || (
                        <MessageView
                          roomInfo={room}
                          onSearchBox={handleSearchBox}
                          onNewWin={null}
                          isNewWin={isNewWin}
                          handleUploadBox={handleUploadBox}
                          onExtension={handleExtension}
                          viewExtension={viewExtension}
                          postAction={handleMessage}
                          onRead={handleReadMessage}
                          view={viewFileUpload}
                        />
                      ))}
                  </>
                )}
              <LayerTemplate />
            </div>
          )}
          {!isNewWin && (
            <>
              {DEVICE_TYPE == 'd' && room && (
                <ChatBackground background={room.background} />
              )}
              {(moveVisible && (
                <>
                  <MoveView></MoveView>
                </>
              )) ||
                (searchVisible && (
                  <>
                    <SearchView onSearchBox={handleSearchBox}></SearchView>
                  </>
                )) || (
                  <>
                    {room &&
                      ((room.roomType == 'A' && (
                        <NoticeView
                          roomInfo={room}
                          onNewWin={openCurrentRoom}
                          isNewWin={isNewWin}
                          onRead={handleReadMessage}
                        ></NoticeView>
                      )) || (
                        <MessageView
                          roomInfo={room}
                          onSearchBox={handleSearchBox}
                          onNewWin={openCurrentRoom}
                          isNewWin={isNewWin}
                          handleUploadBox={handleUploadBox}
                          onExtension={handleExtension}
                          viewExtension={viewExtension}
                          postAction={handleMessage}
                          onRead={handleReadMessage}
                          view={viewFileUpload}
                        />
                      ))}
                  </>
                )}
            </>
          )}
        </>
      )}
      {!loading && !roomID && <div>{covi.getDic('Msg_InvalidApproach')}</div>}
    </>
  );
};

export default React.memo(ChatRoom);
