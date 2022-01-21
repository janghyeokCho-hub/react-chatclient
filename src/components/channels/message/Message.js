import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Plain, Link, Tag, Sticker, Mention } from '@C/chat/message/types';
import { useChatFontSize, useMyChatFontColor } from '@/hooks/useChat';

const getAttribute = tag => {
  const attrPattern = new RegExp(
    /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/,
    'gi',
  );
  let attrs = {};
  const match = tag.match(attrPattern);

  if (match && match.length > 0) {
    match.forEach(item => {
      try {
        const key = item.split('=')[0];
        let value = decodeURIComponent(item.split('=')[1]);

        if (
          (value[0] == '"' && value[value.length - 1] == '"') ||
          (value[0] == "'" && value[value.length - 1] == "'")
        ) {
          value = value.substring(1, value.length - 1);
        }

        attrs[key] = value;
      } catch (e) {}
    });
  }

  return attrs;
};

const Message = ({
  children,
  className,
  eleId,
  marking,
  mentionInfo,
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

      var attrs = getAttribute(match[0]);

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
            mentionInfo={mentionInfo}
            {...attrs}
          ></Mention>,
        );
      }

      beforeLastIndex = match.index + match[0].length;
    }

    if (beforeLastIndex < children.length)
      returnJSX.push(
        <Plain
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
    >
      {drawText}
    </div>
  );
};

export default React.memo(Message);
