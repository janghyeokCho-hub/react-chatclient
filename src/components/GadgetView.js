import React, { useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChatRoom from '@C/chat/chatroom/ChatRoom';
import MakeRoom from '@C/chat/chatroom/normal/MakeRoom';
import { closeWinRoom, makeRoomView } from '@/modules/room';

// 채널
import { closeWinChannel } from '@/modules/channel';
import Channel from '@C/channels/channel/Channel';

const GadgetView = () => {
  const currentRoom = useSelector(({ room }) => room.currentRoom);
  const makeRoom = useSelector(({ room }) => room.makeRoom);
  const makeInfo = useSelector(({ room }) => room.makeInfo);
  const currentChannel = useSelector(({ channel }) => channel.currentChannel);
  const makeChannel = useSelector(({ channel }) => channel.makeChannel);
  const makeChannelInfo = useSelector(({ channel }) => channel.makeInfo);

  const dispatch = useDispatch();

  useEffect(() => {
    if (currentRoom && currentRoom.newRoom && !makeRoom) {
      dispatch(makeRoomView(makeInfo));
    }
  }, []);

  const drawGadgetView = useMemo(() => {
    // 채널
    if (currentChannel) {
      return <Channel channelInfo={currentChannel}></Channel>;
    } else if (currentRoom) {
      if (currentRoom.newRoom) return <MakeRoom></MakeRoom>;
      else return <ChatRoom roomInfo={currentRoom}></ChatRoom>;
    }
  }, [currentRoom, makeRoom, currentChannel]); // mjseo currentChannel 추가

  return (
    <div
      className="Chat"
      style={{
        position: 'absolute',
        top: '0px',
        left: '0px',
        zIndex: currentRoom || currentChannel ? '100' : '-50',
        display: 'block',
      }}
    >
      {drawGadgetView}
    </div>
  );
};

export default GadgetView;
