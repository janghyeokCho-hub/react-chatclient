import React from 'react';
import { evalConnector } from './deviceConnector';
import * as messageApi from '@/lib/message';
import { Plain, Link, Tag, Sticker, Mention } from '@C/chat/message/types';

export const getMessage = (roomID, startId, dist) => {
  let resultObj;
  const param = {
    roomID,
    startId,
    loadCnt: 100,
    dist,
  };

  // TODO: AppData 저장 여부값 조건 추가 필요
  if (DEVICE_TYPE === 'd') {
    resultObj = new Promise((resolve, _) => {
      const returnVal = evalConnector({
        method: 'sendSync',
        channel: 'req-get-messages',
        message: param,
      });
      resolve(returnVal);
    });
  } else {
    resultObj = messageApi.getMessages(param);
  }

  return resultObj;
};

export const getNotice = (roomID, startId, dist) => {
  let resultObj;
  const param = {
    roomID,
    startId,
    loadCnt: 100,
    dist,
    isNotice: true,
  };

  // TODO: AppData 저장 여부값 조건 추가 필요
  if (DEVICE_TYPE === 'd') {
    resultObj = evalConnector({
      method: 'sendSync',
      channel: 'req-get-messages',
      message: param,
    });
  } else {
    resultObj = messageApi.getNotice(param);
  }

  return resultObj;
};

export const getAttribute = tag => {
  const attrPattern = new RegExp(
    /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/,
    'gi',
  );
  let attrs = {};
  const match = tag?.match(attrPattern);

  if (match?.length) {
    match.forEach(item => {
      try {
        const key = item.split('=')[0];
        let value = decodeURIComponent(item.split('=')[1]);

        if (
          (value[0] === '"' && value[value.length - 1] === '"') ||
          (value[0] === "'" && value[value.length - 1] === "'")
        ) {
          value = value.substring(1, value.length - 1);
        }

        attrs[key] = value;
      } catch (e) {}
    });
  }

  return attrs;
};

export const convertChildren = ({
  children,
  style,
  marking,
  mentionInfo = {},
}) => {
  const returnJSX = [];
  const collectURL = text => {
    const rUrlRegex =
      /(?:(?:(https?|ftp|telnet):\/\/|[\s\t\r\n\[\]\`\<\>\"\'])((?:[\w$\-_\.+!*\'\(\),]|%[0-9a-f][0-9a-f])*\:(?:[\w$\-_\.+!*\'\(\),;\?&=]|%[0-9a-f][0-9a-f])+\@)?(?:((?:(?:[a-z0-9\-가-힣]+\.)+[a-z0-9\-]{2,})|(?:[\d]{1,3}\.){3}[\d]{1,3})|localhost)(?:\:([0-9]+))?((?:\/(?:[\w$\-_\.+!*\'\(\),;:@&=ㄱ-ㅎㅏ-ㅣ가-힣]|%[0-9a-f][0-9a-f])+)*)(?:\/([^\s\/\?\.:<>|#]*(?:\.[^\s\/\?:<>|#]+)*))?(\/?[\?;](?:[a-z0-9\-]+(?:=[^\s:&<>]*)?\&)*[a-z0-9\-]+(?:=[^\s:&<>]*)?)?(#[\w\-]+)?)/gim;
    return text ? text.match(rUrlRegex)?.[0] : '';
  };
  let txt = '';
  let onTag = false;
  for (let i = 0; i < children.length; i++) {
    const char = children.charAt(i);
    if (char === '<') {
      onTag = onTag ? onTag : !onTag;
      returnJSX.push(
        <Plain
          style={style}
          key={returnJSX.length}
          text={txt}
          marking={marking}
        ></Plain>,
      );
      txt = '';
    }

    if (onTag && char === '>') {
      onTag = false;
      txt += char;
      const pattern = new RegExp(
        /[<](LINK|NEWLINE|TAG|STICKER|MENTION)[^>]*[/>]/,
        'gi',
      );
      let returnTag = (
        <Plain
          style={style}
          key={returnJSX.length}
          text={txt}
          marking={marking}
        ></Plain>
      );
      const match = pattern.exec(txt);
      let matchedTag = match?.[1];
      const attrs = getAttribute(match?.[0]);
      switch (matchedTag) {
        case 'LINK':
          if (attrs.link && collectURL(attrs.link)) {
            returnTag = (
              <Link
                key={returnJSX.length}
                marking={marking}
                {...attrs}
                link={collectURL(attrs.link)}
              ></Link>
            );
          }
          break;
        case 'NEWLINE':
          if (children.charAt(i - 1) === '/') {
            returnTag = <br key={returnJSX.length} />;
          }
          break;
        case 'TAG':
          if (attrs.value && attrs.text?.startsWith('#')) {
            returnTag = (
              <Tag key={returnJSX.length} marking={marking} {...attrs}></Tag>
            );
          }
          break;
        case 'STICKER':
          if (attrs.emoticonId) {
            returnTag = <Sticker key={returnJSX.length} {...attrs}></Sticker>;
          }
          break;
        case 'MENTION':
          if (attrs.type) {
            returnTag = (
              <Mention
                key={returnJSX.length}
                marking={marking}
                mentionInfo={mentionInfo}
                {...attrs}
              ></Mention>
            );
          }
          break;
      }
      returnJSX.push(returnTag);
      txt = '';
    } else {
      txt += char;
    }

    if (i === children.length - 1) {
      returnJSX.push(
        <Plain
          style={style}
          key={returnJSX.length}
          text={txt}
          marking={marking}
        ></Plain>,
      );
    }
  }
  return returnJSX;
};
