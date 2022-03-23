import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import NoticeMessageBox from '@C/chat/message/NoticeMessageBox';
import SystemMessageBox from '@C/chat/message/SystemMessageBox';
import NoticeScrollBox from '@/components/chat/chatroom/notice/NoticeScrollBox';
import { format } from 'date-fns';
import {
  setMessages,
  initMessages,
  readMessage,
  setMessagesForSync,
  setUnreadCountForSync,
} from '@/modules/room';
import { evalConnector } from '@/lib/deviceConnector';
import { getNotice } from '@/lib/messageUtil';

const NoticeList = () => {
  const { messages, currentRoom } = useSelector(({ room }) => ({
    messages: room.messages,
    currentRoom: room.currentRoom,
  }));

  const [startID, setStartID] = useState(-1);
  const [roomID, setRoomID] = useState(-1);
  const [nextPage, setNextPage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topEnd, setTopEnd] = useState(false);
  const [bottomEnd, setBottomEnd] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    // console.log('isMounted');
  }, []);

  useEffect(() => {
    setTopEnd(false);
    if (currentRoom && currentRoom.roomID == roomID) {
      // 같은 방 안에서 message만 달라진 경우 ( 메시지가 초기화 된 경우 )
      setLoading(true);
    } else if (currentRoom && currentRoom.roomID != roomID) {
      setRoomID(currentRoom.roomID);
    }
  }, [messages]);

  useEffect(() => {
    if (roomID > -1) {
      setLoading(true);
      // 메시지 동기화
      // TODO: AppData 저장 여부값 조건 추가 필요
      if (DEVICE_TYPE == 'd') {
        evalConnector({
          method: 'removeListener',
          channel: 'onSyncUnreadCount',
        });

        evalConnector({
          method: 'on',
          channel: 'onSyncUnreadCount',
          callback: (_, data) => {
            dispatch(
              setUnreadCountForSync({ roomID, unreadCnts: data.unreadCnts }),
            );
            if (data.sync) {
              dispatch(
                readMessage({
                  roomID: roomID,
                  isNotice: true,
                }),
              );
            }
          },
        });

        evalConnector({
          method: 'removeListener',
          channel: 'onSyncMessageSuccess',
        });

        evalConnector({
          method: 'once',
          channel: 'onSyncMessageSuccess',
          callback: (_, roomId) => {
            if (roomID == roomId) {
              const response = evalConnector({
                method: 'sendSync',
                channel: 'req-get-messages',
                message: {
                  roomID: roomID,
                  startId: null,
                  dist: 'SYNC',
                  loadCnt: 50,
                  isNotice: true,
                },
              });

              const messages = response.data.result;

              dispatch(setMessagesForSync(messages));

              if (!messages || messages.length == 0) {
                dispatch(
                  readMessage({
                    roomID: roomID,
                    isNotice: true,
                  }),
                );
              }
              setLoading(false);
            }
          },
        });

        const isSync = evalConnector({
          method: 'sendSync',
          channel: 'req-sync-messages',
          message: {
            roomId: roomID,
            isNotice: true,
          },
        });

        if (!isSync) {
          evalConnector({
            method: 'removeListener',
            channel: 'onSyncMessageSuccess',
          });

          dispatch(
            readMessage({
              roomID: roomID,
              isNotice: true,
            }),
          );
        }
      }
    }
  }, [roomID]);

  useEffect(() => {
    if (loading && messages.length > 0 && !topEnd) {
      // 실제로 불러와야 할 메시지가 달라진 경우에만 처리

      if (startID != messages[0].messageID) {
        const getNextMessage = async () => {
          const response = await getNotice(
            roomID,
            messages[0].messageID,
            'NEXT',
          );

          if (response.data.status == 'SUCCESS') {
            const data = response.data.result;

            if (data.length > 0) {
              setNextPage(data);
              setStartID(messages[0].messageID);
            } else {
              setNextPage([]);
              setTopEnd(true);
            }
            setLoading(false);
          } else {
            setNextPage([]);
            setTopEnd(true);
            setLoading(false);
          }
        };

        getNextMessage();
      } else {
        setLoading(false);
      }
    }
  }, [loading]);

  const handleScrollTop = () => {
    if (!topEnd) {
      dispatch(setMessages({ messages: nextPage, dist: 'NEXT' }));
      setLoading(true);
    }
  };

  const handleScrollBottom = () => {};

  const handlePageInit = () => {
    // TODO: messages에 내용 split
    dispatch(initMessages());
    setTopEnd(false);
  };

  const drawMessage = useMemo(() => {
    if (messages.length > 0) {
      let lastDate = format(
        new Date(messages[messages.length - 1].sendDate),
        'yyyyMMdd',
      );

      let beforeSendTime = '';
      let currentTime = Math.floor(
        messages[messages.length - 1].sendDate / 60000,
      );
      let returnJSX = [];
      messages.forEach((message, index) => {
        let nameBox = beforeSendTime != currentTime;
        let sendDate = format(new Date(message.sendDate), 'yyyyMMdd');
        let nextSendTime = '';

        let dateBox = !(lastDate == sendDate);

        if (dateBox) nameBox = true;

        if (messages.length > index + 1) {
          nextSendTime = Math.floor(messages[index + 1].sendDate / 60000);
        }

        let timeBox = !(nextSendTime == currentTime);

        beforeSendTime = currentTime;
        currentTime = nextSendTime;

        let dateComponent = '';

        if (dateBox) {
          lastDate = sendDate;
          dateComponent = (
            <SystemMessageBox
              key={`date_${lastDate}`}
              message={message.sendDate}
              date={true}
            ></SystemMessageBox>
          );
        }

        if (dateBox) returnJSX.push(dateComponent);

        returnJSX.push(
          <NoticeMessageBox
            key={message.messageID}
            message={message}
            isMine={message.isMine == 'Y'}
            nameBox={nameBox}
            timeBox={timeBox}
          ></NoticeMessageBox>,
        );
      });

      return returnJSX;
    }
  }, [messages]);

  return (
    <>
      <NoticeScrollBox
        key={roomID}
        className="messages-chat"
        style={{ height: 'calc(100% - 183px)' }}
        onScrollTop={handleScrollTop}
        onScrollBottom={handleScrollBottom}
        pageInit={handlePageInit}
        loadingPage={loading}
        isTopEnd={topEnd}
        isBottomEnd={bottomEnd}
      >
        <ul className="messages-chat-list">{messages && drawMessage}</ul>
      </NoticeScrollBox>
    </>
  );
};

export default NoticeList;
