import React, { useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChatRoom from '@C/chat/chatroom/ChatRoom';
import MakeRoom from '@C/chat/chatroom/normal/MakeRoom';
import { closeWinRoom, makeRoomView } from '@/modules/room';

// 채널
import { closeWinChannel } from '@/modules/channel';
import Channel from '@C/channels/channel/Channel';

// FIXME: Route 형태로 변형???
const MultiView = () => {
  const currentRoom = useSelector(({ room }) => room.currentRoom);
  const makeRoom = useSelector(({ room }) => room.makeRoom);
  const makeInfo = useSelector(({ room }) => room.makeInfo);
  const currentChannel = useSelector(({ channel }) => channel.currentChannel);
  const makeChannel = useSelector(({ channel }) => channel.makeChannel);
  const makeChannelInfo = useSelector(({ channel }) => channel.makeInfo);

  const dispatch = useDispatch();

  const handleLoadWindow = useCallback(() => {
    // 새창 닫기
    try {
      currentRoom.winObj.close();
    } catch (e) {
      console.log(e);
    }

    dispatch(closeWinRoom(currentRoom.roomID));
  }, [currentRoom, dispatch]);

  useEffect(() => {
    if (currentRoom && currentRoom.newRoom && !makeRoom) {
      dispatch(makeRoomView(makeInfo));
    }
  }, []);

  // 채널
  const handleLoadChannelWindow = useCallback(() => {
    // 새창 닫기
    try {
      currentChannel.winObj.close();
    } catch (e) {
      console.log(e);
    }
    dispatch(closeWinChannel(currentChannel.roomId));
  }, [currentChannel, dispatch]);

  const drawMultiView = useMemo(() => {
    // 채널
    if (currentChannel) {
      if (currentChannel.newWin) {
        return (
          <div className="start-chat-wrap">
            <div className="posi-center">
              <div className="start-chat-img"></div>
              <p className="infotxt mt10">
                {covi.getDic('Msg_newWindow')}
                <button
                  className="loading-newwindow"
                  onClick={handleLoadChannelWindow}
                >
                  {covi.getDic('Msg_loadWindow')}
                </button>
              </p>
            </div>
          </div>
        );
      } else {
        return <Channel channelInfo={currentChannel}></Channel>;
      }
    }
    //

    if (currentRoom === null || currentRoom === {}) {
      return (
        <div className="start-chat-wrap">
          <div className="posi-center">
            <div className="start-chat-img"></div>
            <p className="infotxt mt10">{covi.getDic('Msg_startChat')}</p>
          </div>
        </div>
      );
    } else if (currentRoom.newRoom) {
      return <MakeRoom></MakeRoom>;
    } else if (currentRoom.newWin) {
      return (
        <div className="start-chat-wrap">
          <div className="posi-center">
            <div className="start-chat-img"></div>
            <p className="infotxt mt10">
              {covi.getDic('Msg_newWindow')}
              <button className="loading-newwindow" onClick={handleLoadWindow}>
                {covi.getDic('Msg_loadWindow')}
              </button>
            </p>
          </div>
        </div>
      );
    } else {
      return <ChatRoom roomInfo={currentRoom}></ChatRoom>;
    }
  }, [currentRoom, makeRoom, currentChannel]); // mjseo currentChannel 추가

  return drawMultiView;
};

export default MultiView;
