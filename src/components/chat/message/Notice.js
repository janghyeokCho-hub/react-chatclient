import React, { useMemo, useCallback } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Plain, Link, Tag, Sticker, Mention } from '@C/chat/message/types';
import {
  getDictionary,
  isJSONStr,
  getSysMsgFormatStr,
  moveRoom,
  eumTalkRegularExp,
  convertEumTalkProtocol,
} from '@/lib/common';
import { openPopup } from '@/lib/common';
import ParamUtil, { encryptText } from '@/lib/util/paramUtil';
import { evalConnector } from '@/lib/deviceConnector';
import { useChatFontSize } from '@/hooks/useChat';
import { getAttribute } from '@/lib/messageUtil';

const Notice = ({ type, value, title, func }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector(({ login }) => login.userInfo);
  const loginId = useSelector(({ login }) => login.id);
  const [fontSize] = useChatFontSize();

  const drawText = useMemo(() => {
    let procVal = value;
    let mentionInfo = [];
    let marking = '';

    if (isJSONStr(value)) {
      const jsonData = JSON.parse(value);
      procVal = getSysMsgFormatStr(
        covi.getDic(jsonData.templateKey),
        jsonData.datas,
      );
    }
    let procValMsgMessage = procVal;
    const pattern = new RegExp(
      /[<](LINK|NEWLINE|TAG|STICKER|MENTION)[^>]*[/>]/,
      'gi',
    );

    if (eumTalkRegularExp.test(procVal)) {
      const processMsg = convertEumTalkProtocol(procVal);
      procValMsgMessage = processMsg.message;
      mentionInfo = processMsg.mentionInfo;
    } else if (pattern.exec(procVal)) {
      const processMsg = convertEumTalkProtocol(procVal);
      procValMsgMessage = processMsg.message;
    }

    const pattern2 = new RegExp(
      /[<](LINK|NEWLINE|TAG|STICKER|MENTION)[^>]*[/>]/,
      'gi',
    );
    let returnJSX = [];

    let beforeLastIndex = 0;
    let match = null;

    while ((match = pattern2.exec(procValMsgMessage)) !== null) {
      if (match.index > 0 && match.index > beforeLastIndex) {
        returnJSX.push(
          <Plain
            key={returnJSX.length}
            text={procValMsgMessage.substring(beforeLastIndex, match.index)}
          ></Plain>,
        );
      }

      const attrs = getAttribute(match[0]);
      if (match[1] == 'LINK') {
        returnJSX.push(
          <Link
            key={returnJSX.length}
            text={procValMsgMessage.substring(beforeLastIndex, match.index)}
            {...attrs}
          ></Link>,
        );
      } else if (match[1] == 'NEWLINE') {
        returnJSX.push(<br key={returnJSX.length} />);
      } else if (match[1] == 'TAG') {
        returnJSX.push(
          <Tag key={returnJSX.length} marking={marking} {...attrs}></Tag>,
        );
      } else if (match[1] == 'STICKER') {
        returnJSX.push(<Sticker key={returnJSX.length} {...attrs}></Sticker>);
      } else if (match[1] == 'MENTION') {
        returnJSX.push(
          <Mention
            key={returnJSX.length}
            marking={marking}
            mentionInfo={mentionInfo}
            {...attrs}
          ></Mention>,
        );
      }
      beforeLastIndex = match.index + match[0].length;
    }

    if (beforeLastIndex < procValMsgMessage.length) {
      returnJSX.push(
        <Plain
          key={returnJSX.length}
          text={procValMsgMessage.substring(beforeLastIndex)}
        ></Plain>,
      );
    }

    return returnJSX;
  }, [value]);

  const actionHandler = useCallback(
    (type, data) => {
      if (type == 'link') {
        return async () => {
          // data object 여부 확인 및 처리
          let url = '';

          if (typeof data === 'string') {
            url = data;
          } else if (typeof data === 'object' && data !== null) {
            url = data.baseURL;
            let paramStr = '';

            if (data.params) {
              for (const [key, value] of Object.entries(data.params)) {
                let expressionStr = value.param;
                if (!value.plain) {
                  const pUtil = new ParamUtil(value.param, userInfo);
                  expressionStr = pUtil.getURLParam();
                }

                if (value.enc) {
                  const { data } = await encryptText(expressionStr);

                  if (data.status === 'SUCCESS') {
                    expressionStr = data.result;
                  }
                }

                paramStr += `${
                  paramStr.length > 0 ? '&' : ''
                }${key}=${encodeURIComponent(expressionStr)}`;
              }
            }

            if (paramStr.length > 0) {
              if (url.indexOf('?') > -1) {
                url = `${url}&${paramStr}`;
              } else {
                url = `${url}?${paramStr}`;
              }
            }
          }

          if (DEVICE_TYPE == 'd') {
            window.openExternalPopup(url);
          } else {
            window.open(url, '_blank');
          }
        };
      } else if (type == 'moveChannel') {
        return () => {
          moveRoom(data, true, dispatch);
        };
      } else if (type == 'remote') {
        return () => {
          evalConnector({
            method: 'removeListener',
            channel: 'onRemoteAssistance',
          });

          evalConnector({
            method: 'send',
            channel: 'onRemoteAssistance',
            message: {
              sessionKey: data.sessionKey,
              isViewer: 'Y',
            },
          });
        };
      } else if (type == 'remotevnc') {
        return async () => {
          evalConnector({
            method: 'removeListener',
            channel: 'onVNCRemote',
          });

          evalConnector({
            method: 'send',
            channel: 'onVNCRemote',
            message: {
              roomId: data.roomId,
            },
          });
        };
      } else if (type == 'saeha') {
        return () => {
          const reqOptions = {
            method: 'GET',
            url: `${data.hostURL}/api/conf/room/${data.meetRoomId}`,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
          };

          // 1. 화상 채팅 방이 정상 적인지 확인
          axios(reqOptions)
            .then(response => {
              const resData = response.data;
              if (resData && resData.roomOpenStatusCd < 3) {
                // 2. 정상이라면 inviteUsers에 내가 있는 지 확인
                data.inviteUsers.map(user => {
                  if (user.inviteId == loginId) {
                    // 3. 있으면 화상 채팅방 연동
                    if (DEVICE_TYPE == 'd') {
                      window.openExternalPopup(user.inviteUrl);
                    } else {
                      window.open(user.inviteUrl, '_blank');
                    }
                  }
                });
              } else {
                // 3. 비정상이라면 에러 문구 출력
                openPopup(
                  {
                    type: 'Alert',
                    message: covi.getDic(
                      'Msg_VideoChatEnd',
                      '해당 화상 채팅 방은 종료 되었습니다.',
                    ),
                  },
                  dispatch,
                );
              }
            })
            .catch(error => {
              console.log(error);
              openPopup(
                {
                  type: 'Alert',
                  message: covi.getDic(
                    'Msg_VideoChatEnd',
                    '해당 화상 채팅 방은 종료 되었습니다.',
                  ),
                },
                dispatch,
              );
            });
        };
      }
    },
    [dispatch, userInfo],
  );

  const drawFunc = useMemo(() => {
    if (func) {
      if (func?.data?.hostId?.id && func.data.hostId.id === loginId) {
        return;
      }
      const handlerFunc = actionHandler(func.type, func.data);

      if (type == 'C') {
        return (
          <button
            type="button"
            className="system-btn"
            onClick={e => handlerFunc()}
          >
            {covi.getDic(func.name)}
          </button>
        );
      } else {
        return (
          <button
            type="button"
            className="system-btn"
            onClick={e => handlerFunc()}
          >
            {func.name}
          </button>
        );
      }
    } else {
      return <></>;
    }
  }, [func]);

  return (
    <>
      {(type == 'I' && (
        <div
          style={{
            color: '#000',
            background: '#fff',
            display: 'inline-block',
            lineHeight: '140%',
            wordBreak: 'break-all',
            userSelect: 'text',
            borderRadius: '5px',
            maxWidth: '400px',
            border: '1px solid #eee',
            width: '250px',
            boxSizing: 'border-box',
            padding: '20px',
            textAlign: 'left',
            fontSize,
          }}
        >
          <span className="sys-tit" style={{ fontSize: fontSize + 2 }}>
            <span style={{ float: 'left' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22.469"
                height="19.05"
                viewBox="0 0 22.469 19.05"
              >
                <g id="그룹_465" transform="translate(3296.9 -3961.1)">
                  <path
                    id="빼기_12"
                    d="M3.5,17.25A2.754,2.754,0,0,1,.75,14.5v-2c0-.086,0-.172.012-.257L6.25,13.994V14.5A2.753,2.753,0,0,1,3.5,17.25Z"
                    transform="translate(-3291 3962)"
                    fill="none"
                    stroke="#444"
                    strokeWidth="1.8"
                  />
                  <rect
                    id="사각형_1651"
                    width="5"
                    height="7"
                    transform="translate(-3296 3967)"
                    fill="none"
                    stroke="#444"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                  <path
                    id="패스_1934"
                    d="M0,1,15.67-4V13L0,8Z"
                    transform="translate(-3291 3966)"
                    fill="none"
                    stroke="#444"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </g>
              </svg>
            </span>
            <span style={{ float: 'left', marginLeft: '10px' }}>
              {covi.getDic('AddNotice', '공지 등록')}
            </span>
          </span>
          {drawText}
        </div>
      )) || (
        <div className="msgtxt" style={{ color: '#000', fontSize }}>
          <span className="sys-tit" style={{ fontSize: fontSize + 2 }}>
            {(title && getDictionary(title)) ||
              getDictionary(
                '시스템 알림;System Alarm;System Alarm;System Alarm;System Alarm;System Alarm;System Alarm;System Alarm;System Alarm;',
              )}
          </span>
          {drawText}
          {drawFunc}
        </div>
      )}
    </>
  );
};

export default React.memo(Notice);
