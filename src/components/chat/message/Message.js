import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Plain, Link, Tag, Sticker, Mention } from '@C/chat/message/types';
import { useChatFontSize, useMyChatFontColor } from '@/hooks/useChat';
import { getAttribute } from '@/lib/messageUtil';

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

  const drawText = useMemo(() => {
    const pattern = new RegExp(
      /[<](LINK|NEWLINE|TAG|STICKER|MENTION)[^>]*[/>]/,
      'gi',
    );

    let returnJSX = [];

    // msgRegExp.exec(children);
    let beforeLastIndex = 0;
    let match = null;
    while ((match = pattern.exec(children)) != null) {
      if (match.index > 0 && match.index > beforeLastIndex) {
        returnJSX.push(
          <Plain
            key={returnJSX.length}
            text={children.substring(beforeLastIndex, match.index)}
            marking={marking}
          ></Plain>,
        );
      }

      const attrs = getAttribute(match[0]);

      if (match[1] == 'LINK') {
        returnJSX.push(
          <Link key={returnJSX.length} marking={marking} {...attrs}></Link>,
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
            {...attrs}
          ></Mention>,
        );
      }

      beforeLastIndex = match.index + match[0].length;
    }

    if (beforeLastIndex < children.length)
      returnJSX.push(
        <Plain
          style={style}
          key={returnJSX.length}
          text={children.substr(beforeLastIndex)}
          marking={marking}
        ></Plain>,
      );

    return returnJSX;
  }, [children]);

  return (
    <div
      className={className}
      style={{ fontSize, color: isMine ? myChatColor : undefined }}
      id={eleId ? eleId : undefined}
      data-messageid={messageID}
    >
      {drawText}
    </div>
  );
};

export default React.memo(Message);
