import React from 'react';
import { useChatFontSize, useMyChatFontColor } from '@/hooks/useChat';
import { convertChildren } from '@/lib/messageUtil';
import styled from 'styled-components';
import MessageReplyBox from '@/components/reply/MessageReplyBox';

const MessageDiv = styled.div`
  font-size: ${props => props.fontSize}px;
  span {
    color: ${props => props.fontColor};
  }
`;

const LineDiv = styled.hr`
  margin-top: 5px;
  margin-bottom: 10px;
  width: 100%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.5);
  border: 0;
`;

const Message = ({
  children,
  style,
  className,
  eleId,
  marking,
  messageID,
  isMine,
  replyID,
  replyInfo,
  goToOriginMsg,
}) => {
  const [fontSize] = useChatFontSize();
  const [myChatColor] = useMyChatFontColor();
  const replyView = replyID > 0;

  return (
    <MessageDiv
      className={className}
      fontSize={fontSize}
      fontColor={isMine ? myChatColor : undefined}
      id={eleId ? eleId : undefined}
      data-messageid={messageID}
    >
      {replyView && (
        <>
          <MessageReplyBox
            replyID={replyID}
            replyInfo={replyInfo}
            goToOriginMsg={goToOriginMsg}
            roomType="CHAT"
          />
          <LineDiv />
        </>
      )}
      {convertChildren({ children, style, marking })}
    </MessageDiv>
  );
};

export default React.memo(Message);
