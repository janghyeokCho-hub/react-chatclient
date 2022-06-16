import React from 'react';
import { useChatFontSize, useMyChatFontColor } from '@/hooks/useChat';
import { convertChildren } from '@/lib/messageUtil';

const Message = ({
  children,
  style,
  className,
  eleId,
  marking,
  mentionInfo,
  isMine,
}) => {
  const [fontSize] = useChatFontSize();
  const [myChatColor] = useMyChatFontColor();

  return (
    <div
      className={className}
      style={{ fontSize, color: isMine ? myChatColor : undefined }}
      id={eleId ? eleId : undefined}
    >
      {convertChildren({ children, style, marking, mentionInfo })}
    </div>
  );
};

export default React.memo(Message);
