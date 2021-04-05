import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import loadable from '@loadable/component';

import MessageBox from '@C/channels/message/MessageBox';
import TempMessageBox from '@C/chat/message/TempMessageBox';
import SystemMessageBox from '@C/chat/message/SystemMessageBox';
import NoticeMessageBox from '@C/chat/message/NoticeMessageBox'; // 그대로 사용
const ListScrollBox = loadable(() =>
  import('@/components/chat/chatroom/normal/ListScrollBox'),
);

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
import { delay } from 'redux-saga/effects';

const MessageList = ({ onExtension, viewExtension }) => {
  const tempMessage = useSelector(({ message }) => message.tempMessage);
  const tempFiles = useSelector(({ message }) => message.tempFiles);
  const messages = useSelector(({ channel }) => channel.messages);
  const currentChannel = useSelector(({ channel }) => channel.currentChannel);

  const [mounted, setMounted] = useState(false);
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
    if (currentChannel && currentChannel.roomId > -1) {
      setNextPage([]);
      setTopEnd(false);
    }
  }, [currentChannel.roomId]);

  useEffect(() => {
    getNext(currentChannel.roomId);
  }, [messages]);

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

  useEffect(() => {
    if (clickNewMessageSeperator) {
      const newMessageSeperatorObj = document.getElementById(
        'newMessageSeperator',
      );

      setTimeout(() => {
        if (newMessageSeperatorObj) {
          scrollIntoView('center', newMessageSeperatorObj);
        }
        if (messages <= 40) {
          // 이전 메세지 리스트가 생기지 않는 경우
          setShowNewMessageSeperator(false);
        } else {
          console.log('here !');
          setTimeout(() => {
            // 이전 메세지 리스트 동기화 후, 다시 스크롤 이동
            scrollIntoView('center', newMessageSeperatorObj);
            setShowNewMessageSeperator(false);
          }, 500);
        }
      }, 500);
    }
  }, [clickNewMessageSeperator]);

  const getNext = useCallback(
    roomID => {
      if (!loading && messages.length > 0 && !topEnd) {
        // 실제로 불러와야 할 메시지가 달라진 경우에만 처리
        setLoading(true);
        const startID = messages[0].messageID;
        messageApi
          .getChannelMessages({
            roomId: roomID,
            startId: startID,
            loadCnt: 100,
            dist: 'NEXT',
          })
          .then(({ data }) => {
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
            },
            {
              code: 'setNoticeMessage',
              isline: false,
              onClick: () => {
                openPopup(
                  {
                    type: 'Confirm',
                    message: covi.getDic('Msg_RegNotice'),
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
              name: covi.getDic('Notice'),
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
                  message: covi.getDic('Msg_DeleteMsg'),
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
            name: covi.getDic('Delete'),
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

        if (message.messageType === 'S') {
          // System Message
          returnJSX.push(
            <SystemMessageBox
              key={message.messageID}
              message={message}
            ></SystemMessageBox>,
          );
        } else if (message.messageType === 'I' || message.messageType === 'A') {
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
              isMine={message.isMine === 'Y'}
              nameBox={nameBox}
              timeBox={timeBox}
              getMenuData={getMenuData}
            ></MessageBox>,
          );
        }
      });

      return returnJSX;
    }
  }, [messages]);

  const drawTempMessage = useMemo(() => {
    return tempMessage.map(message => {
      if (message.roomID == currentChannel.roomId)
        return (
          <TempMessageBox
            key={message.tempId}
            message={message}
          ></TempMessageBox>
        );
    });
  }, [tempMessage, currentChannel]);

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
            key={currentChannel.roomId}
            className={['messages-chat', layerClass].join(' ')}
            style={{ height: 'calc(100% - 183px)' }}
            onClick={handleClick}
            onScrollTop={handleScrollTop}
            pageInit={handlePageInit}
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
