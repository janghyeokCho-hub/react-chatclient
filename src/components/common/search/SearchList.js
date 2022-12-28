import React, { useEffect, useState, useCallback } from 'react';
import MessageBox from '@C/channels/message/MessageBox';
import { useDispatch, useSelector } from 'react-redux';
import SystemMessageBox from '@C/chat/message/SystemMessageBox';
import NoticeMessageBox from '@C/chat/message/NoticeMessageBox';
import SearchScrollBox from '@/components/common/search/SearchScrollBox';
import {
  isJSONStr,
  openPopup,
  eumTalkRegularExp,
  convertEumTalkProtocol,
} from '@/lib/common';
import { format } from 'date-fns';
import { getMessage } from '@/lib/messageUtil';
import { isBlockCheck } from '@/lib/orgchart';

const SearchList = ({ moveData, markingText, roomID }) => {
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const [messages, setMessages] = useState([]);
  const [moveId, setMoveId] = useState('');
  const [topEnd, setTopEnd] = useState(false);
  const [bottomEnd, setBottomEnd] = useState(false);

  const [nextId, setNextId] = useState(-1);
  const [nextMessages, setNextMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [beforeId, setBeforeId] = useState(-1);
  const [beforeMessages, setBeforeMessages] = useState([]);
  const dispatch = useDispatch();

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

  useEffect(() => {
    if (!loading && !topEnd && nextId > -1) {
      setLoading(true);
      const getNextMessage = async () => {
        try {
          const response = await getMessage(roomID, nextId, 'NEXT');
          if (response.data.status == 'SUCCESS') {
            const data = response.data.result;

            if (data.length > 0) {
              setNextMessages(data);
            } else {
              setTopEnd(true);
              setNextId(-1);
            }
          } else {
            setTopEnd(true);
            setNextId(-1);
          }

          setLoading(false);
        } catch (e) {
          setTopEnd(true);
          setNextId(-1);
          setLoading(false);
        }
      };
      getNextMessage();
    }
  }, [nextId]);

  useEffect(() => {
    if (!loading && !bottomEnd && beforeId > -1) {
      setLoading(true);
      const getBeforeMessage = async () => {
        try {
          const response = await getMessage(roomID, beforeId, 'BEFORE');
          if (response.data.status == 'SUCCESS') {
            const data = response.data.result;
            if (data.length > 0) {
              setBeforeMessages(data);
            } else {
              setBottomEnd(true);
              setBeforeId(-1);
            }
          } else {
            setBottomEnd(true);
            setBeforeId(-1);
          }

          setLoading(false);
        } catch (e) {
          setBottomEnd(true);
          setBeforeId(-1);
          setLoading(false);
        }
      };
      getBeforeMessage();
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
          menus.push({
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
          });
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

        if (message?.isMine === 'N' && chineseWall?.length) {
          const senderInfo = isJSONStr(message?.senderInfo)
            ? JSON.parse(message?.senderInfo)
            : message?.senderInfo;

          const { blockChat, blockFile } = isBlockCheck({
            targetInfo: {
              ...senderInfo,
              id: message.sender,
            },
            chineseWall,
          });
          const isFile = !!message.fileInfos;
          isBlock = isFile ? blockFile : blockChat;
        }

        let nameBox = !(message.sender == currentSender);
        let sendDate = format(new Date(message.sendDate), 'yyyyMMdd');
        let nextSendTime = '';
        let nextSender = '';
        let dateBox = !(lastDate == sendDate);

        if (message.sender !== currentSender) {
          currentSender = message.sender;
        }
        if (message.messageType === 'S') {
          currentSender = '';
        }
        if (dateBox) {
          nameBox = true;
        }

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
          if (message.messageID === moveId) {
            returnJSX.push(
              <MessageBox
                key={message.messageID}
                message={message}
                isMine={message.isMine === 'Y'}
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
                isMine={message.isMine === 'Y'}
                nameBox={nameBox}
                timeBox={timeBox}
                marking={markingText}
                getMenuData={getMenuData}
                isBlock={isBlock}
              ></MessageBox>,
            );
          }
        } else if (message.messageType === 'A' || message.messageType === 'I') {
          returnJSX.push(
            <NoticeMessageBox
              key={message.messageID}
              message={message}
              isMine={message.isMine === 'Y'}
              nameBox={nameBox}
              timeBox={timeBox}
              isBlock={isBlock}
            ></NoticeMessageBox>,
          );
        } else if (message.messageType === 'S') {
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
        moveId={moveId != '' ? moveId : ''}
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