import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import ProfileBox from '@COMMON/ProfileBox';
import RightConxtMenu from '@C/common/popup/RightConxtMenu';
import * as common from '@/lib/common';
import * as messageApi from '@/lib/message';
import { useChatFontSize } from '@/hooks/useChat';

const ChatBotMessageBox = ({
  message,
  isMine,
  startMessage,
  endMessage,
  nameBox,
  marking,
  getMenuData,
}) => {
  const currMember = useSelector(({ room }) => room.currentRoom.members);
  const [fontSize] = useChatFontSize();

  const isOldMember = useMemo(() => {
    return (
      currMember &&
      currMember.find(item => item.id == message.sender) == undefined
    );
  }, [currMember, message]);

  const drawMessage = useMemo(() => {
    const botkey = message.key;
    const botInfo = JSON.parse(message.botInfo);
    const botInfoTitle = botInfo.title;
    const botInfoType = botInfo.type;
    const botInfoCount = botInfo.cnt;
    const botInfoValue =
      typeof botInfo.value == 'string'
        ? JSON.parse(botInfo.value)
        : botInfo.value;

    let drawText = (message.context && message.context) || '';
    let nameBoxVisible = nameBox;

    let senderInfo = null;

    if (!isMine) {
      if (!(typeof message.senderInfo === 'object')) {
        senderInfo = JSON.parse(message.senderInfo);
      } else {
        senderInfo = message.senderInfo;
      }
    }

    // NEW LINE 처리
    drawText = drawText.replace(/(\r\n|\n|\r)/gi, '<NEWLINE />');

    // Menu calling
    let menus = [];
    let menuId = '';
    if (getMenuData) {
      menus = getMenuData(message);
      menuId = `channelmessage_${message.messageID}`;
    }

    let copy = false;
    if (startMessage > 0 && endMessage > 0) {
      if (
        startMessage <= message.messageID &&
        endMessage >= message.messageID
      ) {
        copy = true;
      }
    }

    let linkInfo = null;
    if (message.linkInfo != null) linkInfo = JSON.parse(message.linkInfo).url;

    if (!isMine) {
      return (
        <>
          {(drawText && (
            <>
              <li className={nameBoxVisible ? 'sent' : 'text-only sent'}>
                {copy && (
                  <div
                    className="copyBox"
                    style={{
                      position: 'absolute',
                      display: 'inline-block',
                      marginLeft: 'auto',
                      backgroundColor: '#00000044',
                      width: '150px',
                      height: '100%',
                    }}
                  ></div>
                )}
                {nameBoxVisible && (
                  <>
                    <ProfileBox
                      userId={message.sender}
                      userName={senderInfo.name}
                      presence={senderInfo.presence}
                      isInherit={isOldMember ? false : true}
                      img={senderInfo.photoPath}
                    ></ProfileBox>
                    <p className="msgname" style={{ fontSize }}>
                      {common.getJobInfo(senderInfo)}
                      {senderInfo.isMobile === 'Y' && (
                        <span style={{ padding: '0px 5px' }}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="9"
                            height="12"
                            viewBox="0 0 7 10"
                          >
                            <g transform="translate(-185 -231)">
                              <rect
                                width="7"
                                height="10"
                                transform="translate(185 231)"
                                fill="#4f5050"
                              ></rect>
                              <rect
                                width="5"
                                height="6"
                                transform="translate(186 232)"
                                fill="#fff"
                              ></rect>
                              <circle
                                cx="0.5"
                                cy="0.5"
                                r="0.5"
                                transform="translate(188 239)"
                                fill="#fff"
                              ></circle>
                            </g>
                          </svg>
                        </span>
                      )}
                    </p>
                  </>
                )}
                <RightConxtMenu menuId={menuId} menus={menus}>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 5,
                      display: 'inline-block',
                    }}
                  >
                    <p style={{ marginTop: 5, marginBottom: 10 }}>
                      {message.context}
                    </p>
                    <div>
                      {botInfoType == 'LINK' && (
                        <a
                          href={linkInfo}
                          style={{
                            borderRadius: 5,
                            background: '#12cfee',
                            color: '#fff',
                            padding: 12,
                            display: 'block',
                            textAlign: 'center',
                          }}
                        >
                          이동
                        </a>
                      )}
                      {botInfoType == 'DIVIDER' && (
                        <div>
                          <p>{botInfoTitle}</p>
                        </div>
                      )}
                      {botInfoType == 'BUTTON' &&
                        botInfoValue.map(item => {
                          return (
                            <li>
                              <button
                                onClick={() => {
                                  messageApi.sendChatBotKeyMessage(botkey, {
                                    context: item.displayName,
                                    roomID: message.roomID,
                                    roomType: 'B',
                                    tempId: 0,
                                    messageType: 'N',
                                  });
                                }}
                                style={{
                                  marginTop: 10,
                                  background: '#12cfee',
                                  padding: 10,
                                  borderRadius: 5,
                                  color: '#fff',
                                  fontWeight: 'bold',
                                  width: '100%',
                                }}
                              >
                                {item.displayName}
                              </button>
                            </li>
                          );
                        })}
                    </div>
                  </div>
                  {/* </Message> */}
                </RightConxtMenu>
              </li>
            </>
          )) || (
            <li className={nameBoxVisible ? 'sent' : 'text-only sent'}>
              {copy && (
                <div
                  className="copyBox"
                  style={{
                    position: 'absolute',
                    display: 'inline-block',
                    marginLeft: 'auto',
                    backgroundColor: '#00000044',
                    width: '150px',
                    height: '100%',
                  }}
                ></div>
              )}
              {nameBoxVisible && (
                <>
                  <ProfileBox
                    userId={message.sender}
                    userName={senderInfo.name}
                    presence={senderInfo.presence}
                    isInherit={isOldMember ? false : true}
                    img={senderInfo.photoPath}
                  ></ProfileBox>
                  <p className="msgname" style={{ fontSize }}>
                    {common.getJobInfo(senderInfo)}
                    {senderInfo.isMobile === 'Y' && (
                      <span style={{ padding: '0px 5px' }}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="9"
                          height="12"
                          viewBox="0 0 7 10"
                        >
                          <g transform="translate(-185 -231)">
                            <rect
                              width="7"
                              height="10"
                              transform="translate(185 231)"
                              fill="#4f5050"
                            ></rect>
                            <rect
                              width="5"
                              height="6"
                              transform="translate(186 232)"
                              fill="#fff"
                            ></rect>
                            <circle
                              cx="0.5"
                              cy="0.5"
                              r="0.5"
                              transform="translate(188 239)"
                              fill="#fff"
                            ></circle>
                          </g>
                        </svg>
                      </span>
                    )}
                  </p>
                </>
              )}
              {botInfoType == 'DIVIDER' && (
                <div
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: 5,
                    display: 'inline-block',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                      fontSize: 16,
                      borderBottom: '1px solid #ccc',
                      padding: '18px 12px',
                    }}
                  >
                    {botInfoTitle}
                  </div>

                  {botInfoValue?.map(item => {
                    return (
                      <ul
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: 12,
                          borderBottom: '1px solid #ccc',
                        }}
                      >
                        {Object.keys(item).map(key => {
                          return (
                            <li>
                              <strong>{covi.getDic(key)}</strong>
                              {' ' + common.getDictionary(item[key])}
                            </li>
                          );
                        })}{' '}
                      </ul>
                    );
                  })}
                  {!botInfoValue && (
                    <ul
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 12,
                        borderBottom: '1px solid #ccc',
                      }}
                    >
                      <li>{'등록된 일정이 없습니다.'}</li>
                    </ul>
                  )}
                  {linkInfo && (
                    <a
                      href={linkInfo}
                      style={{
                        background: '#12cfee',
                        color: '#fff',
                        display: 'block',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ lineHeight: 1.5, fontSize: 16, padding: 10 }}>
                        {(botInfoCount > 0 && (
                          <div>
                            {'외 ' + botInfoCount + ' 건 (클릭 후 자세히 보기)'}
                          </div>
                        )) || <div>{'자세히 보기'}</div>}
                      </p>
                    </a>
                  )}
                </div>
              )}
            </li>
          )}
        </>
      );
    }
  }, [message, marking, startMessage, endMessage, fontSize]);

  return drawMessage;
};

ChatBotMessageBox.defaultProps = {
  id: '',
  marking: '',
};

export default React.memo(ChatBotMessageBox);
