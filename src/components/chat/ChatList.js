import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bound, setTopButton } from '@/modules/menu';
import ChatRoomContainer from '@/containers/chatRoom/ChatRoomContainer';
import { openLayer } from '@/lib/common';
import InviteMember from './chatroom/layer/InviteMember';

import AddChatIcon from '@/icons/svg/AddChat';

const ChatList = () => {
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bound({ name: covi.getDic('Chat'), type: 'chatlist' }));
    if (isExtUser && isExtUser != 'Y') {
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
            svg: <AddChatIcon />
          },
        ]),
      );
    }
  }, []);

  return <ChatRoomContainer />;
};

export default ChatList;
