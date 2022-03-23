import { format } from 'date-fns';
import { getJobInfo } from '@/lib/common';
import { secureCopy } from '@/lib/util/clipboardUtil';

export const scrollIntoView = (pos, target) => {
  const parent = target.offsetParent;
  const { scrollHeight: totalHeight, offsetHeight: viewHeight } = parent;
  const { offsetTop: targetPos } = target;

  if (pos == 'center') {
    parent.scrollTo(0, targetPos - Math.floor(viewHeight / 2));
  } else {
    // start
    parent.scrollTo(0, targetPos);
  }
};

export const hasClass = (element, className) => {
  return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
};

export const getMsgElement = (element, debug) => {
  if (hasClass(element, 'msgtxt')) {
    return element;
  } else {
    let tempElement = element;
    try {
      while (tempElement != null) {
        tempElement = tempElement.parentNode;
        if (hasClass(tempElement, 'msgtxt')) {
          return tempElement;
        } else if (
          hasClass(tempElement, 'send') ||
          hasClass(tempElement, 'replies')
        ) {
          if (hasClass(tempElement.childNodes[2].firstChild, 'msgtxt'))
            return tempElement.childNodes[2].firstChild;
        }
      }
    } catch {}
    tempElement = element;
    try {
      while (tempElement != null) {
        tempElement = tempElement.firstChild;
        if (hasClass(tempElement, 'msgtxt')) {
          return tempElement;
        }
      }
    } catch {}
    return null;
  }
};

export const messageCopy = (messages, startID, endID) => {
  return new Promise((resolve, reject) => {
    let copiedMessage = '';
    try {
      if (messages != null) {
        messages.forEach(message => {
          if (message.messageID >= startID && message.messageID <= endID) {
            let senderInfo = null;
            if (typeof message.senderInfo === 'string') {
              senderInfo = JSON.parse(message.senderInfo);
            } else senderInfo = message.senderInfo;
            let senderName = covi.getDic('UnknownUser', '알 수 없는 사용자');
            if (senderInfo != null) {
              senderName = getJobInfo(senderInfo);
            }
            if (message.context.includes('eumtalk://emoticon')) {
              copiedMessage += `[${senderName}] [${format(
                new Date(message.sendDate),
                'a hh:mm',
              )}] (${covi.getDic('Emoticon', '이모티콘')}) \r\n`;
            } else if (message.context.length <= 0) {
              copiedMessage += `[${senderName}] [${format(
                new Date(message.sendDate),
                'a hh:mm',
              )}] (${covi.getDic('File', '파일')}) \r\n`;
            } else {
              copiedMessage += `[${senderName}] [${format(
                new Date(message.sendDate),
                'a hh:mm',
              )}] ${message.context} \r\n`;
            }
          }
        });
        if (copiedMessage != '') secureCopy(copiedMessage);
        resolve(true);
      } else reject('messages is null');
    } catch (ex) {
      reject(ex);
    }
  });
};
