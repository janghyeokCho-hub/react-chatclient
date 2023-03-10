import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';

import {
  format,
  isValid,
  startOfToday,
  differenceInMilliseconds,
} from 'date-fns';
import { useSelector, useDispatch } from 'react-redux';
import Message from '@C/channels/message/Message';
import {
  convertURLMessage,
  eumTalkRegularExp,
  convertEumTalkProtocol,
  getJobInfo,
  openPopup,
  checkURL,
  tagPattern,
} from '@/lib/common';
import IconConxtMenu from '@C/common/popup/IconConxtMenu';
import { removeChannelNotice } from '@/modules/channel';
import { setMessageLinkInfo } from '@/modules/room';
import { useChatFontSize } from '@/hooks/useChat';

import { evalConnector } from '@/lib/deviceConnector';
import useMemberInfo from '@/hooks/useMemberInfo';
import { getAttribute } from '@/lib/messageUtil';

const NoticeBox = ({ isBlock }) => {
  const currentChannel = useSelector(({ channel }) => channel.currentChannel);
  const id = useSelector(({ login }) => login.id);

  const [openNotice, setOpenNotice] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [hideChannelNotices, setHideChannelNotices] = useState({});
  const [noticeContext, setNoticeContext] = useState('');
  const [fontSize] = useChatFontSize();
  const dispatch = useDispatch();

  const { findMemberInfo } = useMemberInfo();

  const _isMounted = useRef(true);

  useEffect(() => {
    const saveHideChannelNotices = localStorage.getItem('hide_channel_notices');
    if (saveHideChannelNotices) {
      try {
        const parsingData = JSON.parse(saveHideChannelNotices);
        _isMounted.current && setHideChannelNotices(parsingData);
      } catch (e) {
        console.log('load hide notices error');
      }
    }

    return () => {
      _isMounted.current = false;
      setHideChannelNotices(null);
      setIsNew(null);
      setOpenNotice(null);
      setNoticeContext(null);
    };
  }, []);

  useEffect(() => {
    // 현재 채널의 공지사항 확인
    if (currentChannel) {
      const { notice } = currentChannel;
      const tempHideChannelNotices = { ...hideChannelNotices };

      const hideChannelNoticeMessageId = tempHideChannelNotices[notice.roomID];
      if (hideChannelNoticeMessageId) {
        if (hideChannelNoticeMessageId == notice.messageID) {
          setOpenNotice(null);
          setIsNew(false);
        } else {
          delete tempHideChannelNotices[notice.roomID];
          setOpenNotice(true);
          setIsNew(false);
          setHideChannelNotices(tempHideChannelNotices);
          localStorage.setItem(
            'hide_channel_notices',
            JSON.stringify(tempHideChannelNotices),
          );
        }
      } else {
        setOpenNotice(true);

        // 신규 알림
        if (currentChannel.lastViewedAt < notice.sendDate) {
          setIsNew(true);
        }
      }
    } else {
      setOpenNotice(null);
      setIsNew(false);
    }
  }, [hideChannelNotices, currentChannel]);

  const handleMessageLinkInfo = useCallback(
    args => {
      dispatch(setMessageLinkInfo(args));
    },
    [dispatch],
  );

  const drawChannelNotice = useCallback(
    message => {
      /*
    let senderInfo = null;
    if (!(typeof message.senderInfo === 'object')) {
      senderInfo = JSON.parse(message.senderInfo);
    } else {
      senderInfo = message.senderInfo;
    }

    // {senderInfo && ` ${senderInfo.Name} ${senderInfo.JobPosition}`} */
      let messageType = 'message';
      let drawText = isBlock
        ? covi.getDic('BlockChat', '차단된 메시지 입니다.')
        : message.context;
      let mentionInfo = [];

      // 시간
      const timestamp = message.sendDate;
      let dateText = '';

      const smallFontSize = Math.max(10, fontSize - 2);

      if (timestamp && isValid(new Date(timestamp))) {
        const toDay = startOfToday();
        const procTime = new Date(timestamp);

        if (differenceInMilliseconds(procTime, toDay) >= 0) {
          // 오늘보다 큰 경우 시간 표시
          dateText = format(procTime, 'HH:mm');
        } else {
          // 오늘과 이틀이상 차이나는 경우 날짜와 시간으로 표시
          dateText = format(procTime, 'yyyy.MM.dd HH:mm');
        }
      }

      // protocol check
      if (eumTalkRegularExp.test(drawText)) {
        const processMsg = convertEumTalkProtocol(drawText);
        messageType = processMsg.type;
        drawText = processMsg.message;
        mentionInfo = processMsg.mentionInfo;
      }

      if (messageType == 'message') {
        let index = 0;

        if (drawText) {
          index = 1;
        }

        // 링크 썸네일 처리
        if (message.linkInfo) {
          let linkInfoObj = null;
          if (typeof message.linkInfo == 'object') {
            linkInfoObj = message.linkInfo;
          } else {
            linkInfoObj = JSON.parse(message.linkInfo);
          }

          drawText = convertURLMessage(drawText);

          if (linkInfoObj.thumbNailInfo) {
            const linkThumbnailObj = linkInfoObj.thumbNailInfo;

            index = 2;
            urlInfoJSX = (
              <li
                className={['text-only', isMine ? 'replies' : 'sent'].join(' ')}
                key={`${message.messageID}_linkThumnail`}
              >
                {!isMine && (
                  <LinkMessageBox
                    link={linkInfoObj.link}
                    thumbnailInfo={linkThumbnailObj}
                  />
                )}
                {!message.fileInfos && (
                  <div className="chatinfo">
                    {timeBox && (
                      <span
                        className="Sendtime"
                        style={{ fontSize: smallFontSize }}
                      >
                        {}
                      </span>
                    )}
                  </div>
                )}
                {isMine && (
                  <LinkMessageBox
                    link={linkInfoObj.link}
                    thumbnailInfo={linkThumbnailObj}
                  />
                )}
              </li>
            );
          }
        } else if (message.linkInfo == null && DEVICE_TYPE != 'b') {
          const checkURLResult = checkURL(drawText);

          if (checkURLResult.isURL) {
            evalConnector({
              method: 'once',
              channel: `onLinkThumbnailInfo_${message.messageID}`,
              callback: (event, args) => {
                handleMessageLinkInfo(args);
              },
            });

            evalConnector({
              method: 'send',
              channel: 'get-url-graph-data',
              message: {
                messageId: message.messageID,
                roomId: message.roomID,
                url: checkURLResult.url,
                returnChannel: `onLinkThumbnailInfo_${message.messageID}`,
              },
            });
          }
        }

        // Tag 처리
        drawText = drawText.replace(
          tagPattern,
          `<TAG text="$1$2" value="$2" />`,
        );

        // Mention 처리
        if (mentionInfo.length > 0) {
          mentionInfo.map((m, idx) => {
            const member = currentChannel.members.find(item => item.id == m.id);
            if (member) {
              mentionInfo[idx] = { isMine: member.id == id, ...member };
            }
          });
        }

        // NEW LINE 처리
        drawText = drawText.replace(/\n/gi, '<NEWLINE />');
      }

      // 등록한 사람

      // TODO: 다국어, 사용자 JobInfo 관련내용 수정 필요
      let senderInfo = message.senderInfo;
      if (typeof senderInfo == 'string') {
        senderInfo = JSON.parse(senderInfo);
      }

      return (
        <>
          <span className="txt">
            <Message
              className={
                messageType == 'message' ? 'msgtxt' : `msgtxt ${messageType}`
              }
              eleId={`channelnotice_${message.id}`}
              mentionInfo={mentionInfo}
            >
              {drawText}
            </Message>
          </span>
          <span className="subtxt">{`${dateText}  ${getJobInfo(
            senderInfo,
          )}`}</span>
        </>
      );
    },
    [openNotice, currentChannel, fontSize, isBlock],
  );

  const processContext = async () => {
    const { context, senderInfo, sendDate } = currentChannel.notice;
    const _context = isBlock
      ? covi.getDic('BlockChat', '차단된 메시지 입니다.')
      : convertURLMessage(context);
    const pattern = new RegExp(/[<](MENTION|LINK)[^>]*[/>]/, 'gi');
    const returnJSX = [];
    let match = null;
    let beforeLastIndex = 0;
    let maxLength = null;
    let maxContext = '';

    // eumtalk:// http(s)?:// \n
    // console.log('0000002', eumTalkRegularExp.test(_context));
    if (
      eumTalkRegularExp.test(_context) ||
      /[<](LINK)[^>]*[/>]/.test(_context)
    ) {
      // if(eumTalkRegularExp.test(_context)) {
      const { message, mentionInfo } = convertEumTalkProtocol(_context);
      while ((match = pattern.exec(message)) !== null) {
        maxContext = match.input;
        if (match.index > 0 && match.index > beforeLastIndex) {
          const txt = message.substring(beforeLastIndex, match.index);
          returnJSX.push(`${txt}`);
        }

        const attrs = getAttribute(match[0]);
        if (match[1] === 'MENTION') {
          const memberInfo = await findMemberInfo(mentionInfo, attrs.targetId);
          let mention = '@Unknown';
          if (memberInfo.name) {
            mention = `@${getJobInfo(memberInfo)}`;
          } else if (memberInfo.id) {
            mention = `@${memberInfo.id}`;
          }
          returnJSX.push(`${mention}`);
        } else if (match[1] === 'LINK') {
          const _attrs =
            DEVICE_TYPE === 'd'
              ? `onClick="window.openExternalPopup('${attrs.link}'); return false;"`
              : `href='${attrs.link}' target="_blank"`;
          returnJSX.push(`<a ${_attrs}>${attrs.link}</a>`);
        }
        beforeLastIndex = match.index + match[0].length;
        maxLength = match.input.length;
      }

      if (beforeLastIndex < maxLength) {
        returnJSX.push(`${maxContext.substring(beforeLastIndex)}`);
      }
    } else {
      // URL 또는 멘션이 없는 plain message는 그대로 push
      returnJSX.push(_context);
    }

    let stringString = '';
    returnJSX.forEach(element => {
      stringString += element.toString();
      return stringString;
    });
    return `<span>${stringString}</span>`;
  };

  useEffect(() => {
    processContext().then(str => {
      const text = isBlock
        ? covi.getDic('BlockChat', '차단된 메시지 입니다.')
        : str;
      _isMounted.current && setNoticeContext(text);
    });
  }, [currentChannel.notice, _isMounted, isBlock]);

  const getNoticeMenuData = useMemo(() => {
    const noticeMenus = [
      {
        code: 'keep',
        isline: false,
        onClick: () => {
          setOpenNotice(false);
          setIsNew(false);
        },
        name: covi.getDic('FlipNotice', '접어두기'),
      },
      {
        code: 'hide',
        isline: false,
        onClick: () => {
          setOpenNotice(null);
          setIsNew(false);
          const { notice } = currentChannel;
          const tempHideChannelNotices = { ...hideChannelNotices };
          tempHideChannelNotices[notice.roomID] = notice.messageID;
          setHideChannelNotices(tempHideChannelNotices);
          localStorage.setItem(
            'hide_channel_notices',
            JSON.stringify(tempHideChannelNotices),
          );
        },
        name: covi.getDic('CloseNotice', '다시보지 않기'),
      },
    ];

    if (isBlock) {
      const index = noticeMenus.findIndex(menu => menu.code === 'detail');
      if (index > -1) {
        noticeMenus.splice(index, 1);
      }
    } else {
      noticeMenus.unshift({
        code: 'detail',
        isline: false,
        onClick: () => {
          setIsNew(false);

          const { notice } = currentChannel;
          let senderInfo = notice.senderInfo;
          if (typeof senderInfo == 'string') {
            senderInfo = JSON.parse(senderInfo);
          }
          openPopup(
            {
              type: 'Alert',
              message: `<p class="normaltxt"><b style="font-size: 16px;">${covi.getDic(
                'Notice',
                '공지',
              )}</b><br><br>${noticeContext}<br/><br><font style="color:#999;float: right;">${format(
                new Date(notice.sendDate),
                'yyyy.MM.dd HH:mm:ss',
              )} ${getJobInfo(senderInfo)}</font>`,
            },
            dispatch,
          );
        },
        name: covi.getDic('ShowDetail', '자세히보기'),
      });
    }

    let channelAuth = false;
    if (currentChannel) {
      if (currentChannel.members) {
        const myChannelMembership = currentChannel.members.find(
          cm => cm.id === id,
        );
        if (myChannelMembership) {
          channelAuth = myChannelMembership.channelAuth == 'Y';
        }
      }

      if (channelAuth || id == currentChannel.notice.sender) {
        noticeMenus.push({
          code: 'delete',
          isline: false,
          onClick: () => {
            openPopup(
              {
                type: 'Confirm',
                message: covi.getDic(
                  'Msg_DeleteNotice',
                  '공지를 내리시겠습니까?',
                ),
                callback: result => {
                  if (result) {
                    dispatch(
                      removeChannelNotice({
                        messageId: currentChannel.notice.messageID,
                        memberInfo: id,
                        roomId: currentChannel.roomId.toString(),
                      }),
                    );
                  }
                },
              },
              dispatch,
            );
          },
          name: covi.getDic('RemoveNotice', '공지 내리기'),
        });
      }
    }

    return noticeMenus;
  }, [currentChannel, noticeContext, dispatch, isBlock]);

  return (
    <>
      {openNotice && currentChannel ? (
        <div className="NoticeLayer">
          <a style={{ cursor: 'default' }}>
            {isNew && <div className="notice-new" />}
            <div className="notice-ico"></div>
            <div className="notice-txt">
              {drawChannelNotice(currentChannel.notice)}
            </div>
          </a>
          <IconConxtMenu menuId="channel_notice" menus={getNoticeMenuData}>
            <button className="list-more-btn"></button>
          </IconConxtMenu>
        </div>
      ) : (
        openNotice != null &&
        currentChannel && (
          <button className="NoticeBtn" onClick={() => setOpenNotice(true)} />
        )
      )}
    </>
  );
};

NoticeBox.defaultProps = {};

export default NoticeBox;
