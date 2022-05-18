import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MessageBox from '@C/channels/message/MessageBox';
import { setChannelNotice } from '@/lib/channel';
import SystemMessageBox from '@C/chat/message/SystemMessageBox';
import NoticeMessageBox from '@C/chat/message/NoticeMessageBox';
import SearchScrollBox from '@/components/chat/chatroom/search/SearchScrollBox';
import {
  isJSONStr,
  openPopup,
  eumTalkRegularExp,
  convertEumTalkProtocol,
} from '@/lib/common';
import { format } from 'date-fns';
import * as messageApi from '@/lib/message';
import { setChineseWall } from '@/modules/login';
import { getChineseWall, isBlockCheck } from '@/lib/orgchart';

const SearchList = ({ moveData, markingText, roomID }) => {
  const userInfo = useSelector(({ login }) => login.userInfo);
  const userChineseWall = useSelector(({ login }) => login.chineseWall);
  const [messages, setMessages] = useState([]);
  const [moveId, setMoveId] = useState('');
  const [topEnd, setTopEnd] = useState(false);
  const [bottomEnd, setBottomEnd] = useState(false);

  const [nextId, setNextId] = useState(-1);
  const [nextMessages, setNextMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [beforeId, setBeforeId] = useState(-1);
  const [beforeMessages, setBeforeMessages] = useState([]);
  const [chineseWallState, setChineseWallState] = useState([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const getChineseWallList = async () => {
      const { result, status } = await getChineseWall({
        userId: userInfo?.id,
        myInfo: userInfo,
      });
      if (status === 'SUCCESS') {
        setChineseWallState(result);
        if (DEVICE_TYPE === 'd' && !isMainWindow()) {
          dispatch(setChineseWall(result));
        }
      } else {
        setChineseWallState([]);
      }
    };

    if (userChineseWall?.length) {
      setChineseWallState(userChineseWall);
    } else {
      getChineseWallList();
    }

    return () => {
      setChineseWallState([]);
    };
  }, []);

  useEffect(() => {
    if (moveData != null) {
      setMessages(moveData.firstPage);
      setMoveId(moveData.moveId);
      setNextId(moveData.firstPage[0].messageID);
      setBeforeId(moveData.firstPage[moveData.firstPage.length - 1].messageID);
    } else {
      setMessages([]);
      setNextMessages([]);
      setBeforeMessages([]);
      setMoveId('');
    }
  }, [moveData]);

  const getMessage = (roomID, startId, dist) => {
    const response = messageApi.getChannelMessages({
      roomId: roomID,
      startId,
      loadCnt: 100,
      dist,
    });

    return response;
  };

  useEffect(() => {
    if (!loading && !topEnd && nextId > -1) {
      setLoading(true);
      getMessage(roomID, nextId, 'NEXT')
        .then(({ data }) => {
          if (data.status == 'SUCCESS') {
            if (data.result.length > 0) {
              setNextMessages(data.result);
            } else {
              setTopEnd(true);
              setNextId(-1);
            }
          } else {
            setTopEnd(true);
            setNextId(-1);
          }

          setLoading(false);
        })
        .catch(() => {
          setTopEnd(true);
          setNextId(-1);
          setLoading(false);
        });
    }
  }, [nextId]);

  useEffect(() => {
    if (!loading && !bottomEnd && beforeId > -1) {
      setLoading(true);
      getMessage(roomID, beforeId, 'BEFORE')
        .then(({ data }) => {
          if (data.status == 'SUCCESS') {
            if (data.result.length > 0) {
              setBeforeMessages(data.result);
            } else {
              setBottomEnd(true);
              setBeforeId(-1);
            }
          } else {
            setBottomEnd(true);
            setBeforeId(-1);
          }

          setLoading(false);
        })
        .catch(() => {
          setBottomEnd(true);
          setBeforeId(-1);
          setLoading(false);
        });
    }
  }, [beforeId]);

  const handleScrollTop = () => {
    if (nextMessages.length > 0 && !topEnd) {
      setNextId(nextMessages[0].messageID);
      setMessages([...nextMessages, ...messages]);
    }
  };

  const handleScrollBottom = () => {
    if (beforeMessages.length > 0 && !bottomEnd) {
      setBeforeId(beforeMessages[beforeMessages.length - 1].messageID);
      setMessages([...messages, ...beforeMessages]);
    }
  };

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
          if (!message.fileInfos) {
            menus.push(
              {
                code: 'copyClipboardMessage',
                isline: false,
                onClick: () => {
                  openPopup(
                    {
                      type: 'Alert',
                      message: covi.getDic('Msg_Copy', '복사되었습니다.'),
                      callback: result => {
                        navigator.clipboard.writeText(message.context);
                      },
                    },
                    dispatch,
                  );
                },
                name: covi.getDic('Copy', '내용 복사'),
              },
              {
                code: 'setNoticeMessage',
                isline: false,
                onClick: () => {
                  openPopup(
                    {
                      type: 'Confirm',
                      message: covi.getDic(
                        'Msg_RegNotice',
                        '공지는 1건만 등록됩니다. 해당 메시지를 공지로 등록하시겠습니까?',
                      ),
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
                name: covi.getDic('Notice', '공지'),
              },
            );
          }
        }
      }
      return menus;
    },
    [dispatch],
  );

  const drawMessage = () => {
    if (messages.length > 0) {
      let lastDate = format(
        new Date(messages[messages.length - 1].sendDate),
        'yyyyMMdd',
      );

      let currentSender = '';
      let currentTime = Math.floor(
        messages[messages.length - 1].sendDate / 60000,
      );
      let returnJSX = [];
      messages.forEach((message, index) => {
        let isBlock = false;

        if (message?.isMine === 'N' && chineseWallState?.length) {
          const senderInfo = isJSONStr(message?.senderInfo)
            ? JSON.parse(message?.senderInfo)
            : message?.senderInfo;

          const { blockChat, blockFile } = isBlockCheck({
            targetInfo: {
              ...senderInfo,
              id: message.sender,
            },
            chineseWall: chineseWallState,
          });
          const isFile = !!message.fileInfos;
          isBlock = isFile ? blockFile : blockChat;
        }
        let nameBox = !(message.sender == currentSender);
        let sendDate = format(new Date(message.sendDate), 'yyyyMMdd');
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
          if (message.messageID == moveId) {
            returnJSX.push(
              <MessageBox
                key={message.messageID}
                message={message}
                isMine={message.isMine == 'Y'}
                nameBox={nameBox}
                timeBox={timeBox}
                id={`msg_${message.messageID}`}
                marking={markingText}
                getMenuData={getMenuData}
                isBlock={isBlock}
              ></MessageBox>,
            );
          } else {
            returnJSX.push(
              <MessageBox
                key={message.messageID}
                message={message}
                isMine={message.isMine == 'Y'}
                nameBox={nameBox}
                timeBox={timeBox}
                marking={markingText}
                getMenuData={getMenuData}
                isBlock={isBlock}
              ></MessageBox>,
            );
          }
        } else {
          if (message.messageType == 'S') {
            // System Message
            returnJSX.push(
              <SystemMessageBox
                key={message.messageID}
                message={message}
              ></SystemMessageBox>,
            );
          } else if (
            message.messageType === 'I' ||
            message.messageType === 'A'
          ) {
            // Channel Notice
            returnJSX.push(
              <NoticeMessageBox
                key={message.messageID}
                message={message}
                isMine={message.isMine == 'Y'}
                nameBox={nameBox}
                timeBox={timeBox}
                isBlock={isBlock}
              ></NoticeMessageBox>,
            );
          }
        }
      });

      return returnJSX;
    }
  };

  return (
    <>
      <SearchScrollBox
        className="messages-chat search-box"
        style={{ height: 'calc(100% - 100px)' }}
        onScrollTop={handleScrollTop}
        onScrollBottom={handleScrollBottom}
        loadingPage={loading}
        isTopEnd={topEnd}
        isBottomEnd={bottomEnd}
        moveId={moveId != '' ? `msg_${moveId}` : ''}
      >
        {(messages && messages.length > 0 && (
          <ul className="messages-chat-list">{drawMessage()}</ul>
        )) || (
          <div className="start-chat-wrap">
            <div className="posi-center">
              <div className="start-chat-img"></div>
              <p className="infotxt mt10"></p>
            </div>
          </div>
        )}
      </SearchScrollBox>
    </>
  );
};

export default SearchList;
