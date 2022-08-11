import React from 'react';
import { useChatFontSize, useMyChatFontColor } from '@/hooks/useChat';
import { convertChildren } from '@/lib/messageUtil';
import styled from 'styled-components';
import MessageReplyBox from '@/components/reply/MessageReplyBox';

const MessageDiv = styled.div`
  font-size: ${props => props.fontSize};
  color: ${props => props.fontColor};
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
        <MessageReplyBox
          replyID={replyID}
          replyInfo={replyInfo}
          goToOriginMsg={goToOriginMsg}
          roomType="CHAT"
        />
      )}
      {convertChildren({ children, style, marking })}
    </MessageDiv>
  );
};

export default React.memo(Message);
