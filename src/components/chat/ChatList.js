import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bound, setTopButton } from '@/modules/menu';
import ChatRoomContainer from '@/containers/chatRoom/ChatRoomContainer';
import { openLayer } from '@/lib/common';
import { format } from 'date-fns';
import InviteMember from './chatroom/layer/InviteMember';
import { makeChatRoom } from '@/lib/deviceConnector';
import { openRoom, makeRoomView } from '@/modules/room';
import AddChatIcon from '@/icons/svg/AddChat';

const ChatList = () => {
  const { viewType, isExtUser } = useSelector(({ room, login }) => ({
    viewType: room.viewType,
    isExtUser: login.userInfo.isExtUser,
  }));

  const dispatch = useDispatch();

  const handleNewChatBotRoom = () => {
    const makeInfo = {
      roomName: '이음봇',
      roomType: 'B',
      members: [],
      memberType: 'B',
    };

    const makeData = {
      newRoom: true,
      makeInfo: makeInfo,
    };

    if (viewType == 'S') {
      const winName = `wmr_${format(new Date(), 'yyyyMMddHHmmss')}`;
      const openURL = `${DEVICE_TYPE == 'd' ? '#' : ''}/client/nw/makeroom`;
      makeChatRoom(winName, makeData, openURL);
    } else {
      dispatch(openRoom(makeData));
      dispatch(makeRoomView(makeInfo));
    }
  };

  useEffect(() => {
    dispatch(bound({ name: covi.getDic('Chat'), type: 'chatlist' }));
    if (isExtUser && isExtUser != 'Y') {
      dispatch(
        setTopButton([
          {
            code: 'startChatBot',
            alt: covi.getDic('StartChatBot'),
            onClick: () => {
              handleNewChatBotRoom();
            },
            svg: <AddChatIcon />,
          },
          {
            code: 'startChat',
            alt: covi.getDic('StartChat'),
            onClick: () => {
              openLayer(
                {
                  component: (
                    <InviteMember
                      headerName={covi.getDic('NewChatRoom')}
                      isNewRoom={true}
                    />
                  ),
                },
                dispatch,
              );
            },
            svg: <AddChatIcon />,
          },
        ]),
      );
    }
  }, []);

  return <ChatRoomContainer />;
};

export default ChatList;
