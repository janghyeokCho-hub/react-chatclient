// E:\rd01_messenger\messenger\chatclient\src\components\chat\chatroom\list\MessageList.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MessageBox from '@C/channels/message/MessageBox';
import TempMessageBox from '@C/chat/message/TempMessageBox'; // 그대로 사용
import SystemMessageBox from '@C/chat/message/SystemMessageBox'; // 그대로 사용
import NoticeMessageBox from '@C/chat/message/NoticeMessageBox'; // 그대로 사용
import ListScrollBox from '@C/channels/channel/list/ListScrollBox';
import NoticeBox from '@C/channels/channel/normal/NoticeBox';
import { format } from 'date-fns';
import { setMessages, initMessages } from '@/modules/channel';
import { setChannelNotice } from '@/lib/channel';
import * as messageApi from '@/lib/message';
import {
  openPopup,
  eumTalkRegularExp,
  convertEumTalkProtocol,
} from '@/lib/common';
import { scrollIntoView } from '@/lib/util/domUtil';

const MessageList = ({ onExtension, viewExtension, onSearchBox }) => {
  const tempMessage = useSelector(({ message }) => message.tempMessage);
  const tempFiles = useSelector(({ message }) => message.tempFiles);
  const messages = useSelector(({ channel }) => channel.messages);
  const currentChannel = useSelector(({ channel }) => channel.currentChannel);

  const [mounted, setMounted] = useState(false);
  const [startID, setStartID] = useState(-1);

  const [roomId, setRoomId] = useState(-1);
  const [nextPage, setNextPage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topEnd, setTopEnd] = useState(false);
  const [bottomEnd, setBottomEnd] = useState(true);

  const [newMessageSeperator, setNewMessageSeperator] = useState(null);
  const [showNewMessageSeperator, setShowNewMessageSeperator] = useState(false);
  const [clickNewMessageSeperator, setClickNewMessageSeperator] = useState(
    false,
  );

  const dispatch = useDispatch();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (clickNewMessageSeperator) {
      const newMessageSeperatorObj = document.getElementById(
        'newMessageSeperator',
      );
      if (newMessageSeperatorObj) {
        scrollIntoView('center', newMessageSeperatorObj);
      }
      setShowNewMessageSeperator(false);
    }
  }, [clickNewMessageSeperator]);

  useEffect(() => {
    setTopEnd(false);
    if (currentChannel && currentChannel.roomId == roomId) {
      // 같은 방 안에서 message만 달라진 경우 ( 메시지가 초기화 된 경우 )
      setLoading(true);
    } else if (currentChannel && currentChannel.roomId != roomId) {
      setRoomId(currentChannel.roomId);
    }
  }, [messages]);

  useEffect(() => {
    console.log(`pre-load Next Page :: roomId update ${roomId}`);
    if (roomId > -1) setLoading(true);

    // new messeage seprator
    if (currentChannel && currentChannel.unreadCnt === 0) {
      setNewMessageSeperator(false);
    }
    //
  }, [roomId]);

  /*
  useEffect(() => {
    if (roomId > -1) {
      // 메시지 동기화
      // TODO: AppData 저장 여부값 조건 추가 필요
      if (DEVICE_TYPE == 'd') {
        const isSync = evalConnector({
          method: 'sendSync',
          channel: 'req-sync-messages',
          message: {
            roomID: roomId,
          },
        });

        if (isSync) {
          evalConnector({
            method: 'once',
            channel: 'onSyncMessageSuccess',
            callback: (event, roomId) => {
              if (roomId == roomId) {
                const response = evalConnector({
                  method: 'sendSync',
                  channel: 'req-get-messages',
                  message: {
                    roomID: roomId,
                    startId: null,
                    dist: 'SYNC',
                    loadCnt: 100,
                  },
                });

                console.log('result : ', response.data.result);
                dispatch(setMessagesForSync(response.data.result));
                setLoading(false);
              }
            },
          });

          return () => {
            evalConnector({
              method: 'removeListener',
              channel: 'onSyncMessageSuccess',
            });
          };
        }
      }
    }
  }, [roomId]); */

  useEffect(() => {
    if (loading && messages.length > 0 && !topEnd) {
      // 실제로 불러와야 할 메시지가 달라진 경우에만 처리

      if (startID != messages[0].messageID) {
        const getNextMessage = async () => {
          const response = await getMessage(
            roomId,
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

  /*
  useEffect(() => {
    // new message seperator
    if (newMessageSeperator) {
      const newMessageSeperatorObj = document.getElementById(
        'newMessageSeperator',
      );
      if (newMessageSeperatorObj) {
        newMessageSeperatorObj.scrollIntoView({
          behavior: 'instant',
          block: 'center',
        });
        setNewMessageSeperator(false);
      }
    }
  }); */

  useEffect(() => {
    if (newMessageSeperator) {
      const eleObj = document.getElementById('newMessageSeperator');

      if (eleObj) {
        const eleObjPos = eleObj.getBoundingClientRect();
        if (eleObjPos.top <= 0) {
          setShowNewMessageSeperator(true);
        }
      }
    }
  }, [newMessageSeperator]);

  const getMessage = useCallback((roomId, startId, dist) => {
    let resultObj;
    const param = {
      roomId,
      startId,
      loadCnt: 100,
      dist,
    };

    /*
    // TODO: AppData 저장 여부값 조건 추가 필요
    if (DEVICE_TYPE == 'd') {
      resultObj = evalConnector({
        method: 'sendSync',
        channel: 'req-get-messages',
        message: param,
      });
    } else {
      resultObj = messageApi.getChannelMessages(param);
    } */
    resultObj = messageApi.getChannelMessages(param);
    //

    return resultObj;
  }, []);

  const handleScrollTop = useCallback(() => {
    // if (!topEnd) {
    if (!topEnd && messages && messages.length > 0) {
      dispatch(setMessages({ messages: nextPage, dist: 'NEXT' }));
      setLoading(true);
    }
  }, [messages, topEnd, dispatch]);

  const handleScrollBottom = useCallback(() => {}, []);

  const handlePageInit = useCallback(() => {
    // TODO: messages에 내용 split
    dispatch(initMessages());
    setTopEnd(false);
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
                    message: '복사되었습니다.',
                    callback: result => {
                      navigator.clipboard.writeText(message.context);
                    },
                  },
                  dispatch,
                );
              },
              name: '복사',
            },
            {
              code: 'setNoticeMessage',
              isline: false,
              onClick: () => {
                openPopup(
                  {
                    type: 'Confirm',
                    message:
                      '공지는 1건만 등록됩니다. 해당 메시지를 공지로 등록하시겠습니까?',
                    callback: result => {
                      if (result) {
                        setChannelNotice({
                          messageID: message.messageID,
                        });
                      }
                    },
                  },
                  dispatch,
                );
              },
              name: '공지',
            },
          );
        }

        if (message.isMine == 'Y') {
          menus.push({
            code: 'deleteMessage',
            isline: false,
            onClick: () => {
              openPopup(
                {
                  type: 'Confirm',
                  message: `메시지를 삭제하시겠습니까? 
                삭제 후 복원이 불가하며, 채널 동기화 후 화면에 보여지지 않습니다.`,
                  callback: result => {
                    if (result) {
                      messageApi.deleteChannelMessage({
                        messageId: message.messageID,
                      });
                    }
                  },
                },
                dispatch,
              );
            },
            name: '삭제',
          });
        }
      }
      return menus;
    },
    [dispatch],
  );

  const drawMessage = useMemo(() => {
    if (messages.length > 0) {
      let lastDate = '';
      /*
      if (messages[messages.length - 1].sendDate != null) {
        lastDate = format(
          new Date(messages[messages.length - 1].sendDate),
          'yyyyMMdd',
        );
      }
      */

      // new message seperator
      let hasNewMessageSeperator = newMessageSeperator;
      if (hasNewMessageSeperator === null) {
        hasNewMessageSeperator =
          messages[messages.length - 1].sendDate > currentChannel.lastViewedAt;
      }
      //

      let currentSender = '';
      let currentTime = Math.floor(
        messages[messages.length - 1].sendDate / 60000,
      );
      let returnJSX = [];
      messages.forEach((message, index) => {
        let nameBox = !(message.sender == currentSender);
        let sendDate = '';
        if (message.sendDate != null && message.sendDate != '') {
          sendDate = format(new Date(message.sendDate), 'yyyyMMdd');
        }
        let nextSendTime = '';
        let nextSender = '';
        let dateBox = !(lastDate == sendDate);

        if (message.sender != currentSender) currentSender = message.sender;
        if (message.messageType == 'S' || message.messageType == 'I')
          currentSender = '';
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
        if (dateBox && currentSender != '') {
          lastDate = sendDate;
          dateComponent = (
            <SystemMessageBox
              key={`date_${message.sendDate}`}
              message={message.sendDate}
              date={true}
            ></SystemMessageBox>
          );
        }

        // new message seperator
        if (
          hasNewMessageSeperator &&
          message.sendDate > currentChannel.lastViewedAt
        ) {
          returnJSX.push(
            <li
              key={`newmessageseperator_${currentChannel.lastViewedAt}`}
              className="meassage-newline"
              id="newMessageSeperator"
            >
              <p>여기까지 읽었습니다.</p>
            </li>,
          );
          setTimeout(() => {
            setNewMessageSeperator(true);
          }, 500);
          hasNewMessageSeperator = false;
        }
        //

        if (dateBox) returnJSX.push(dateComponent);

        if (message.messageType == 'S') {
          // System Message
          returnJSX.push(
            <SystemMessageBox
              key={message.messageID}
              message={message}
            ></SystemMessageBox>,
          );
        } else if (message.messageType == 'I') {
          // Channel Notice
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
          // Normal Message
          returnJSX.push(
            <MessageBox
              key={message.messageID}
              message={message}
              isMine={message.isMine == 'Y'}
              nameBox={nameBox}
              timeBox={timeBox}
              getMenuData={getMenuData}
              onSearchBox={onSearchBox}
            ></MessageBox>,
          );
        }
      });

      return returnJSX;
    }
  }, [messages]);

  const drawTempMessage = useMemo(() => {
    return tempMessage.map(message => {
      if (message.roomID == roomId)
        return (
          <TempMessageBox
            key={message.tempId}
            message={message}
          ></TempMessageBox>
        );
    });
  }, [tempMessage, roomId]);

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
      {mounted && (
        <>
          <ListScrollBox
            key={roomId}
            className={['messages-chat', layerClass].join(' ')}
            style={{ height: 'calc(100% - 183px)' }}
            onClick={handleClick}
            onScrollTop={handleScrollTop}
            onScrollBottom={handleScrollBottom}
            pageInit={handlePageInit}
            loadingPage={loading}
            isTopEnd={topEnd}
            isBottomEnd={bottomEnd}
            isClickNewMessageSeperator={clickNewMessageSeperator}
            isShowNewMessageSeperator={showNewMessageSeperator}
            handleShowNewMessageSeperator={setShowNewMessageSeperator}
          >
            <ul className="messages-chat-list">
              {messages && drawMessage}
              {tempMessage && drawTempMessage}
            </ul>
          </ListScrollBox>
          {showNewMessageSeperator && (
            <a className="NewMessageBtn">
              <span
                onClick={e => {
                  setClickNewMessageSeperator(true);
                }}
              >
                <span>읽지않은 첫번째 메시지로 이동</span>
                <span className="ico-arrow"></span>
              </span>
              <span
                style={{ position: 'absolute', right: '-25px', top: '7px' }}
                onClick={e => {
                  setShowNewMessageSeperator(false);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 16 16"
                >
                  <g transform="translate(0.488)">
                    <path
                      d="M8,0A8,8,0,1,1,0,8,8,8,0,0,1,8,0Z"
                      transform="translate(-0.488)"
                      fill="#308dff"
                    ></path>
                    <g transform="translate(4.513 5.224)">
                      <path
                        d="M128.407,133.742a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12l2.284-2.165,2.284,2.165a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12.39.39,0,0,0,0-.565l-2.277-2.158,2.277-2.165a.39.39,0,0,0,0-.564.437.437,0,0,0-.6,0l-2.277,2.165L129,128.3a.444.444,0,0,0-.6,0,.39.39,0,0,0,0,.564l2.284,2.158-2.277,2.165A.371.371,0,0,0,128.407,133.742Z"
                        transform="translate(-128.279 -128.173)"
                        fill="#fff"
                      ></path>
                    </g>
                  </g>
                </svg>
              </span>
            </a>
          )}
          {currentChannel && currentChannel.notice && <NoticeBox />}
        </>
      )}
    </>
  );
};

export default React.memo(MessageList);
