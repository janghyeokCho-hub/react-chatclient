import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import loadable from '@loadable/component';
import MessageBox from '@C/chat/message/MessageBox';
import NoticeMessageBox from '@C/chat/message/NoticeMessageBox';
import TempMessageBox from '@C/chat/message/TempMessageBox';
import SystemMessageBox from '@C/chat/message/SystemMessageBox';

const ListScrollBox = loadable(() =>
  import('@/components/chat/chatroom/normal/ListScrollBox'),
);
import { format } from 'date-fns';
import {
  openPopup,
  eumTalkRegularExp,
  convertEumTalkProtocol,
} from '@/lib/common';
import {
  setMessages,
  initMessages,
  setMessagesForSync,
  setUnreadCountForSync,
  readMessage,
  getRoomInfo
} from '@/modules/room';
import { hasClass, messageCopy, getMsgElement } from '@/lib/util/domUtil';
import { evalConnector } from '@/lib/deviceConnector';
import { getMessage } from '@/lib/messageUtil';
import LoadingWrap from '@COMMON/LoadingWrap';

const MessageList = ({ onExtension, viewExtension }) => {
  const tempMessage = useSelector(({ message }) => message.tempMessage);
  const tempFiles = useSelector(({ message }) => message.tempFiles);
  const messages = useSelector(({ room }) => room.messages);
  const currentRoom = useSelector(({ room }) => room.currentRoom);

  const [mounted, setMounted] = useState(false);
  const [nextPage, setNextPage] = useState([]);

  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [topEnd, setTopEnd] = useState(false);
  const [reload, setReload] = useState(false);

  const [startSelectMessage, setStartSelectMessage] = useState(-1);
  const [endSelectMessage, setEndSelectMessage] = useState(-1);

  const dispatch = useDispatch();

  const disableCopy = async e => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 67) {
      window.getelestartMessageID;

      let start = document.getElementsByClassName('startMessageID').item(0)
        .value;
      let end = document.getElementsByClassName('endMessageID').item(0).value;

      messageCopy(messages, start, end).then(success => {
        if (success) {
          document.removeEventListener('keydown', disableCopy);
          setStartSelectMessage(-1);
          setEndSelectMessage(-1);
        }
      });

      e.returnValue = false;
    }
  };

  const handleSelectionChange = e => {
    const selectionValue = window.getSelection();

    let startMessageId = -1;
    let endMessageId = -1;

    try {
      const selectRange = selectionValue.getRangeAt(0);

      const selectElementContainer = selectRange.commonAncestorContainer;

      if (hasClass(selectElementContainer, 'messages-chat-list')) {
        // 만약 메시지가 다중 선택일 경우에는 선택 메시지 추가
        startMessageId = getMsgElement(selectRange.startContainer).getAttribute(
          'data-messageid',
        );
        endMessageId = getMsgElement(
          selectRange.endContainer,
          true,
        ).getAttribute('data-messageid');

        if (startMessageId > endMessageId) {
          let tempId = startMessageId;
          startMessageId = endMessageId;
          endMessageId = tempId;
        }

        if (startSelectMessage != startMessageId)
          setStartSelectMessage(startMessageId);
        if (endSelectMessage != endMessageId) setEndSelectMessage(endMessageId);

        document.addEventListener('keydown', disableCopy);
      }
    } catch {
      setStartSelectMessage(-1);
      setEndSelectMessage(-1);
    }
  };

  const handleMouseDown = e => {
    setStartSelectMessage(-1);
    setEndSelectMessage(-1);
  };

  const cbRef = useRef(handleSelectionChange);
  useEffect(() => {
    cbRef.current = handleSelectionChange;
  });

  useEffect(() => {
    setMounted(true);

    const cb = e => cbRef.current(e);

    document.addEventListener('selectionchange', cb);
    document.addEventListener('mousedown', handleMouseDown);

    evalConnector({
      method: 'on',
      channel: 'onReSyncMessage',
      callback: (event, args) => {
        reSyncMessage();
      },
    });

    return () => {
      document.removeEventListener('selectionchange', cb);
      document.removeEventListener('mousedown', handleMouseDown);
      evalConnector({
        method: 'removeListener',
        channel: 'onReSyncMessage',
      });
    };
  }, []);

  const reSyncMessage = useCallback(() => {
    dispatch(getRoomInfo({ roomID: currentRoom.roomID }));
    syncMessage(currentRoom.roomID);
  }, [dispatch, currentRoom]);

  useEffect(() => {
    if (currentRoom && currentRoom.roomID > -1) {
      setNextPage([]);
      setTopEnd(false);
      // 메시지 동기화
      // TODO: AppData 저장 여부값 조건 추가 필요
      if (DEVICE_TYPE == 'd') {
        // NOTE:: 여기는 2번 호출됨
        // NOTE:: 여기 syncMessage 호출시 방 들어올 때 마다 +2 번 호출됨
        syncMessage(currentRoom.roomID);
      }
    }
  }, [currentRoom]);

  useEffect(() => {
    getNext(currentRoom.roomID);
    setTimeout(() => {
      if (messages.length == 0) {
        setReload(true);
      }
    }, 1000);
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      if (messageLoading) {
        setMessageLoading(false);
      }
    }, 10000);
  }, [messageLoading]);

  useEffect(() => {
    if (reload) {
      getMessages(currentRoom.roomID);
    }
  }, [reload]);

  const getMessages = async roomID => {
    console.log('getMessages called!');
    const response = await evalConnector({
      method: 'sendSync',
      channel: 'req-get-messages',
      message: {
        roomID: roomID,
        startId: null,
        dist: 'SYNC',
        loadCnt: 50,
      },
    });
    const messages = response.data.result;

    messages && messages.length > 0 && setTopEnd(false);

    await dispatch(setMessagesForSync(messages));

    setReload(false);
  };

  const syncMessage = useCallback(
    roomID => {
      console.log('syncMessage called :::');
      //NOTE:: 창 열릴 때 마다 (x 2 + 4)번 호출됨
      evalConnector({
        method: 'removeListener',
        channel: 'onSyncUnreadCount',
      });

      evalConnector({
        method: 'removeListener',
        channel: 'onSyncUnreadCountMessages',
      });

      evalConnector({
        method: 'once',
        channel: 'onSyncUnreadCount',
        callback: (event, data) => {
          dispatch(
            setUnreadCountForSync({ roomID, unreadCnts: data.unreadCnts }),
          );
          if (data.sync) {
            dispatch(
              readMessage({
                roomID: roomID,
                isNotice: false,
              }),
            );
          }
        },
      });

      evalConnector({
        method: 'once',
        channel: 'onSyncUnreadCountMessages',
        callback: (event, data) => {
          //NOTE:: 창 열릴 때 마다 (x 2 + 4)번 호출됨
          console.log('onSyncUnreadCountMessages call');
          syncMessage(currentRoom.roomID);
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onSyncMessageSuccess',
        callback: async (event, targetRoomID) => {
          if (roomID == targetRoomID) {
            const response = await evalConnector({
              method: 'sendSync',
              channel: 'req-get-messages',
              message: {
                roomID: roomID,
                startId: null,
                dist: 'SYNC',
                loadCnt: 50,
              },
            });

            const messages = response.data.result;

            messages && messages.length > 0 && setTopEnd(false);

            dispatch(setMessagesForSync(messages));

            if (!messages || messages.length == 0) {
              dispatch(
                readMessage({
                  roomID: roomID,
                  isNotice: false,
                }),
              );
            }
            setMessageLoading(false);
          }
        },
      });

      const isSync = evalConnector({
        method: 'sendSync',
        channel: 'req-sync-messages',
        message: {
          roomId: roomID,
        },
      });

      if (!isSync) {
        evalConnector({
          method: 'removeListener',
          channel: 'onSyncMessageSuccess',
        });
        setMessageLoading(false);
      } else {
        setMessageLoading(true);
      }
    },
    [dispatch],
  );

  const getNext = useCallback(
    roomID => {
      if (!loading && messages.length > 0 && !topEnd) {
        // 실제로 불러와야 할 메시지가 달라진 경우에만 처리
        setLoading(true);
        getMessage(roomID, messages[0].messageID, 'NEXT').then(({ data }) => {
          if (data.status == 'SUCCESS') {
            const result = data.result;
            if (result.length > 0) {
              setNextPage(result);
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
        });
      }
    },
    [loading, messages, topEnd],
  );

  const handleScrollTop = useCallback(() => {
    if (!topEnd && !loading && nextPage.length > 0) {
      dispatch(setMessages({ messages: nextPage, dist: 'NEXT' }));
    }
  }, [dispatch, loading, nextPage, topEnd]);

  const handlePageInit = useCallback(() => {
    // TODO: messages에 내용 split
    setTopEnd(false);
    setNextPage([]);
    dispatch(initMessages());
  }, [dispatch]);

  const getMenuData = useCallback(
    message => {
      const menus = [];
      if (message.messageType != 'S' && message.messageType != 'I') {
        let messageType = 'message';
        if (eumTalkRegularExp.test(message.context)) {
          const processMsg = convertEumTalkProtocol(message.context);
          messageType = processMsg.type;
        }
        if (messageType == 'message') {
          menus.push(
            {
              code: 'copyClipboardMessage',
              isline: false,
              onClick: () => {
                openPopup(
                  {
                    type: 'Alert',
                    message: covi.getDic('Msg_Copy'),
                    callback: result => {
                      navigator.clipboard.writeText(message.context);
                    },
                  },
                  dispatch,
                );
              },
              name: covi.getDic('Copy'),
            }
          );
        }
      }
      return menus;
    },
    [dispatch],
  );

  const drawMessage = useMemo(() => {
    if (messages.length > 0) {
      let lastDate = '';
      let currentSender = '';

      let currentTime = Math.floor(
        messages[messages.length - 1].sendDate / 60000,
      );
      let returnJSX = [];

      messages.forEach((message, index) => {
        let nameBox = !(message.sender == currentSender);
        let sendDate = format(new Date(message.sendDate), 'yyyyMMdd');
        let nextSendTime = '';
        let nextSender = '';
        let dateBox = !(lastDate == sendDate);

        if (message.sender != currentSender) currentSender = message.sender;
        if (message.messageType == 'S') currentSender = '';
        if (dateBox) nameBox = true;

        if (messages.length > index + 1) {
          nextSendTime = Math.floor(messages[index + 1].sendDate / 60000);
          nextSender = messages[index + 1].sender;
        }

        let timeBox = !(nextSendTime == currentTime);
        if (!timeBox) {
          // time은 같지만 다른사용자의 채팅으로 넘어가는경우
          timeBox = !(currentSender == nextSender);
        }

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

        if (message.messageType === 'N') {
          returnJSX.push(
            <MessageBox
              key={message.messageID}
              message={message}
              isMine={message.isMine == 'Y'}
              startMessage={startSelectMessage}
              endMessage={endSelectMessage}
              nameBox={nameBox}
              timeBox={timeBox}
              getMenuData={getMenuData}
            ></MessageBox>,
          );
        } else if (message.messageType === 'A' || message.messageType === 'I') {
          returnJSX.push(
            <NoticeMessageBox
              key={message.messageID}
              message={message}
              isMine={message.isMine == 'Y'}
              nameBox={nameBox}
              timeBox={timeBox}
            ></NoticeMessageBox>,
          );
        } else {
          // System Message
          returnJSX.push(
            <SystemMessageBox
              key={message.messageID}
              message={message}
            ></SystemMessageBox>,
          );
        }
      });

      return returnJSX;
    }
  }, [messages, startSelectMessage, endSelectMessage]);

  const drawTempMessage = useMemo(() => {
    return tempMessage.map(message => {
      if (message.roomID == currentRoom.roomID)
        return (
          <TempMessageBox
            key={message.tempId}
            message={message}
          ></TempMessageBox>
        );
    });
  }, [tempMessage, currentRoom]);

  const handleClick = useCallback(() => {
    onExtension('');
  }, [onExtension]);

  const layerClass = useMemo(() => {
    let layerClass = '';

    if (viewExtension != '' && tempFiles.length > 0) {
      layerClass = 'layer-all';
    } else if (viewExtension != '' && tempFiles.length == 0) {
      layerClass = 'layer';
    } else if (viewExtension == '' && tempFiles.length > 0) {
      layerClass = 'layer-file';
    }

    return layerClass;
  }, [viewExtension, tempFiles]);

  return (
    <>
      <input
        className="startMessageID"
        style={{ display: 'none' }}
        value={startSelectMessage}
        readOnly
      />
      <input
        className="endMessageID"
        style={{ display: 'none' }}
        value={endSelectMessage}
        readOnly
      />

      {messageLoading && (
        <LoadingWrap style={{ top: 60, height: 'calc(100% - 183px)' }} />
      )}
      {mounted && (
        <ListScrollBox
          key={currentRoom.roomID}
          className={['messages-chat', layerClass].join(' ')}
          style={{ height: 'calc(100% - 183px)' }}
          onClick={handleClick}
          onScrollTop={handleScrollTop}
          pageInit={handlePageInit}
        >
          <ul className="messages-chat-list">
            {messages && drawMessage}
            {tempMessage && drawTempMessage}
          </ul>
        </ListScrollBox>
      )}
    </>
  );
};

export default React.memo(MessageList);
