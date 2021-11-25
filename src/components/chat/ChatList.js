import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bound, setTopButton } from '@/modules/menu';
import ChatRoomContainer from '@/containers/chatRoom/ChatRoomContainer';
import { getConfig } from '@/lib/util/configUtil';
import { openLayer } from '@/lib/common';
import { format } from 'date-fns';
import InviteMember from './chatroom/layer/InviteMember';
import { makeChatRoom } from '@/lib/deviceConnector';
import { openRoom, makeRoomView } from '@/modules/room';
import AddChatIcon from '@/icons/svg/AddChat';
import AddChatBotIcon from '@/icons/svg/AddChatBot';
import useTyping from '@/hooks/useTyping';

const ChatList = () => {
  const { id, rooms, viewType, isExtUser } = useSelector(({ room, login }) => ({
    id: login.id,
    rooms: room.rooms,
    viewType: room.viewType,
    isExtUser: login.userInfo.isExtUser,
  }));

  const { confirm } = useTyping();

  const dispatch = useDispatch();

  const handleRoomChange = useCallback(
    roomId => {
      confirm(dispatch, openRoom, { roomID: roomId });
    },
    [dispatch],
  );

  const handleNewChatBotRoom = () => {
    const makeInfo = {
      members: [],
      roomName: '이음이',
      roomType: 'B',
    };

    // TODO :: 추후 챗봇이 여러개가 생긴다면 구조 변경 해야함
    const findRoom = rooms?.find(x => x.roomType === 'B');

    const makeData = {
      newRoom: true,
      makeInfo: makeInfo,
    };

    if (findRoom) {
      handleRoomChange(findRoom.roomID);
    } else {
      if (DEVICE_TYPE == 'd') {
        if (viewType == 'S') {
          const winName = `wmr_${format(new Date(), 'yyyyMMddHHmmss')}`;
          const openURL = `${DEVICE_TYPE == 'd' ? '#' : ''}/client/nw/makeroom`;
          makeChatRoom(winName, makeData, openURL);
        } else {
          dispatch(openRoom(makeData));
          dispatch(makeRoomView(makeInfo));
        }
      } else {
        dispatch(openRoom(makeData));
        dispatch(makeRoomView(makeInfo));
      }
    }
  };

  useEffect(() => {
    let chatBotAddFlag = false;
    const chatBotConfig = getConfig('ChatBot');

    if (chatBotConfig?.isUse) {
      if (chatBotConfig?.targetUser == 'ALL') {
        chatBotAddFlag = true;
      } else {
        const matchedUserId = chatBotConfig?.targetUser.find(
          userId => userId == id,
        );
        if (matchedUserId) {
          chatBotAddFlag = true;
        }
      }
    }

    dispatch(bound({ name: covi.getDic('Chat'), type: 'chatlist' }));
    if (isExtUser && isExtUser != 'Y') {
      if (chatBotAddFlag) {
        dispatch(
          setTopButton([
            {
              code: 'startChatBot',
              alt: covi.getDic('StartChatBot'),
              onClick: () => {
                handleNewChatBotRoom();
              },
              svg: <AddChatBotIcon />,
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
      } else {
        dispatch(
          setTopButton([
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
    }
  }, []);

  return <ChatRoomContainer />;
};

export default ChatList;
