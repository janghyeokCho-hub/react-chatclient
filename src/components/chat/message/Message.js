import React from 'react';
import { useChatFontSize, useMyChatFontColor } from '@/hooks/useChat';
import { convertChildren } from '@/lib/messageUtil';

const Message = ({
  children,
  style,
  className,
  eleId,
  marking,
  messageID,
  isMine,
}) => {
  const [fontSize] = useChatFontSize();
  const [myChatColor] = useMyChatFontColor();

  return (
    <div
      className={className}
      style={{ fontSize, color: isMine ? myChatColor : undefined }}
      id={eleId ? eleId : undefined}
      data-messageid={messageID}
    >
      {convertChildren({ children, style, marking })}
    </div>
  );
};

export default React.memo(Message);
