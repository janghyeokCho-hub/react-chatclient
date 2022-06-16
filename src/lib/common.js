import { create, createToFront, close, createToast } from '@/modules/popup';
import { init, setLayer, pushLayer, popLayer } from '@/modules/mainlayer';
import { getProfileInfo } from '@/lib/profile';

import { newChatRoom, newChannel } from '@/lib/deviceConnector';
import { openRoom, newWinRoom } from '@/modules/room';
import { openChannel, newWinChannel } from '@/modules/channel';

import {
  format,
  isValid,
  startOfToday,
  differenceInMilliseconds,
} from 'date-fns';

export const windowPopup = (openURL, windowName, popupWidth, popupHeight) => {
  let openObj = null;
  openObj = window.open(
    openURL,
    windowName,
    `width=${popupWidth},height=${popupHeight}`,
  );
  return openObj;
};

export const openPopup = (popupObj, dispatch) => {
  dispatch(create(popupObj));
};

export const openPopupToFront = (popupObj, dispatch) => {
  dispatch(createToFront(popupObj));
};

export const closePopup = dispatch => {
  dispatch(close());
};

export const openToast = (popupObj, dispatch) => {
  dispatch(createToast(popupObj));
};

export const openLayer = (layerObj, dispatch) => {
  dispatch(setLayer(layerObj));
};

export const clearLayer = dispatch => {
  dispatch(init());
};

export const appendLayer = (layerObj, dispatch) => {
  dispatch(pushLayer(layerObj));
};

export const deleteLayer = dispatch => {
  dispatch(popLayer());
};

// json array 중복 제거
export const removeDuplicates = (jsonArray, key) => {
  jsonArray = jsonArray.filter(
    (jsonObj, idx, self) =>
      self.map(item => item[key]).indexOf(jsonObj[key]) === idx,
  );

  return jsonArray;
};

// URL 정규식 체크
// const urlRegularExp = /(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/gm;
// const urlRegularExp = /(?:(?:(https?):\/\/)((?:[\w$\-_\.+!*\'\(\),]|%[0-9a-f][0-9a-f])*\:(?:[\w$\-_\.+!*\'\(\),;\?&=]|%[0-9a-f][0-9a-f])+\@)?(?:((?:(?:[a-z0-9\-가-힣]+\.)+[a-z0-9\-]{2,})|(?:[\d]{1,3}\.){3}[\d]{1,3})|localhost)(?:\:([0-9]+))?((?:\/(?:[\w$\-_\.+!*\'\(\),;:@&=ㄱ-ㅎㅏ-ㅣ가-힣]|%[0-9a-f][0-9a-f])+)*)(?:\/([^\s\/\?\.:<>|#]*(?:\.[^\s\/\?:<>|#]+)*))?(\/?[\?;](?:[a-z0-9\-]+(?:=[^\s:&<>]*)?\&)*[a-z0-9\-]+(?:=[^\s:&<>]*)?)?(#[\w\-]+)?)/gim;
const urlRegularExp =
  /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;
export const eumTalkRegularExp =
  /eumtalk:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gim;
export const tagPattern = new RegExp(/(#)([a-z가-힣0-9ㄱ-ㅎ]+)/, 'gmi');
export const checkURL = message => {
  let isURL = false;
  let result = message.match(urlRegularExp);
  let url = '';

  if (result != null) {
    url = result[0];
    isURL = true;

    if (url.match(/(http:\/\/|https:\/\/)/g) == null) {
      url = 'http://' + url;
    }
  }

  return { isURL: isURL, url: url };
};

export const convertURLMessage = message => {
  let retMessage = message.replace(urlRegularExp, item => {
    let link = item;

    if (item.match(/(http:\/\/|https:\/\/)/g) == null) {
      link = 'http://' + item;
    }

    // tag 치환 방지
    return `<LINK link="${encodeURIComponent(link)}" text="${encodeURIComponent(
      item,
    )}" />`;

    /*
    if (DEVICE_TYPE == 'd') {
      return `<a onclick="openExternalPopup('${link}')">${item}</a>`;
    } else {
      return `<a href="${link}" target="_blank">${item}</a>`;
    }
    */
  });

  return retMessage;
};

export const convertEumTalkProtocol = message => {
  let returnObj = {
    type: 'message',
    message: message,
    mentionInfo: [],
    external: null,
  };

  let procMsg = message.replace(eumTalkRegularExp, item => {
    if (returnObj.type == 'emoticon') return '';

    const protocol = item.replace('eumtalk://', '').split('.');
    const type = protocol[0];

    if (type == 'emoticon') {
      // emoticon이 포함된 메시지는 별도의 처리없이 drawtext를 emoticon으로 대체
      returnObj.type = 'emoticon';
      returnObj.message = `<STICKER groupId='${protocol[1]}' emoticonId='${protocol[2]}' type='${protocol[3]}' companyCode='${protocol[4]}'/>`;
      return item;
    } else {
      if (type == 'mention') {
        // channel.currentChannel.members에 있는 값 매칭 필요
        const userId = protocol.slice(2).join('.');
        returnObj.mentionInfo.push({
          type: protocol[1],
          id: userId,
        });
        return `<MENTION type='${protocol[1]}' targetId='${userId}' />`;
      } else if (type == 'move') {
        returnObj.external = {
          type: 'move',
          args: {
            subj: protocol[1],
            target: protocol[2],
          },
        };
        return '';
      }
    }
  });

  if (returnObj.type == 'message') returnObj.message = procMsg;

  return returnObj;
};

export const convertEumTalkProtocolPreview = message => {
  let returnObj = {
    type: 'message',
    message: message,
  };

  let procMsg = message.replace(eumTalkRegularExp, item => {
    if (returnObj.type == 'emoticon') return '';

    const protocol = item.replace('eumtalk://', '').split('.');
    const type = protocol[0];

    if (type == 'emoticon') {
      // emoticon이 포함된 메시지는 별도의 처리없이 drawtext를 emoticon으로 대체
      returnObj.type = 'emoticon';
      returnObj.message = covi.getDic('Emoticon', '이모티콘');
      return item;
    } else {
      if (type == 'mention') {
        const userId = protocol.slice(2).join('.');
        return `@${userId}`;
      } else if (type == 'move') {
        return '';
      }
    }
  });

  if (returnObj.type == 'message') returnObj.message = procMsg;

  return returnObj;
};

// 채널 item
export const convertEumTalkProtocolPreviewForChannelItem = async message => {
  let returnObj = {
    type: 'message',
    message: message,
  };

  const replaceAsync = async (str, regex, asyncFn) => {
    const promises = [];
    str.replace(regex, (match, ...args) => {
      const promise = asyncFn(match, ...args);
      promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
  };

  const myAsyncFn = async item => {
    if (returnObj.type == 'emoticon') return '';

    const protocol = item.replace('eumtalk://', '').split('.');
    const type = protocol[0];

    if (type == 'emoticon') {
      // emoticon이 포함된 메시지는 별도의 처리없이 drawtext를 emoticon으로 대체
      returnObj.type = 'emoticon';
      returnObj.message = covi.getDic('Emoticon', '이모티콘');
      return item;
    } else {
      if (type == 'mention') {
        const displayName = await getProfileInfo(protocol[2]).then(
          ({ data }) => {
            const userInfo = data.result;
            if (userInfo.name) {
              return getJobInfo(userInfo);
            } else {
              return userInfo.id;
            }
          },
          e => {
            console.log(e);
            return `${protocol[2]}`;
          },
        );

        return `@${displayName}`;
      } else if (type == 'move') {
        return '';
      }
    }
  };

  let procMsg = await replaceAsync(message, eumTalkRegularExp, myAsyncFn);

  if (returnObj.type == 'message') returnObj.message = procMsg;
  return returnObj;
};
//

export const removeTag = text => {
  return text.replace(/(<([^>]+)>)/gi, '');
};

export const getPlainText = text => {
  text = text.replace(/\n/gi, ' ');
  text = text.replace(/&nbsp;/gi, ' ');
  return text.replace(/(<([^>]+)>)/gi, '');
};

export const convertInputValue = str => {
  return str.replace(/[<>"']/g, function ($0) {
    return '&' + { '<': 'lt', '>': 'gt', '"': 'quot', "'": '#39' }[$0] + ';';
  });
};

export function defaultJobInfo() {
  return (window.covi.settings && window.covi.settings.jobInfo) || 'PN';
}

// TODO: 다국어 (이름 다국어, JobInfo 다국어)
// { name, [jobInfo] }
export const getJobInfo = (userInfo, isEmptySpace) => {
  const jobInfo = defaultJobInfo();

  const userName = userInfo.name;
  const jobInfoLabel = userInfo[jobInfo];

  const multiJobInfoLabel =
    (jobInfoLabel && getDictionary(jobInfoLabel)) || null;

  if (multiJobInfoLabel) {
    if (isEmptySpace) return `${getDictionary(userName)}${multiJobInfoLabel}`;
    else return `${getDictionary(userName)} ${multiJobInfoLabel}`;
  } else {
    return getDictionary(userName);
  }
};

export const getDictionary = (multiDic, lang) => {
  let dictionary = '';
  if (typeof multiDic === 'string') dictionary = multiDic;

  let returnDic = dictionary;
  let findIdx = 0;
  let defaultIdx = 0;
  const arrDics = dictionary.split(';');

  let findLang = lang ? lang : (covi.settings && covi.settings.lang) || 'ko';

  let defaultLang = (covi.config && covi.config.DefaultClientLang) || 'ko';

  try {
    if (arrDics.length > 0) {
      findIdx = getLanguageIndex(findLang);
      defaultIdx = getLanguageIndex(defaultLang);
    }

    returnDic = arrDics[findIdx];
    // returnDic == '' || returnDic == undefined || returnDic == null
    if (!returnDic) {
      returnDic = arrDics[defaultIdx];

      if (!returnDic) {
        returnDic = arrDics[0];
      }
    }
  } catch (e) {
    returnDic = arrDics[0];
  }

  return returnDic;
};

const getLanguageIndex = lang => {
  let findIdx = 0;
  lang = lang.toLowerCase();
  switch (lang) {
    case 'ko':
      findIdx = 0;
      break;
    case 'en':
      findIdx = 1;
      break;
    case 'ja':
      findIdx = 2;
      break;
    case 'zh':
      findIdx = 3;
      break;
    case 'reserved1':
      findIdx = 4;
      break;
    case 'reserved2':
      findIdx = 5;
      break;
    case 'reserved3':
      findIdx = 6;
      break;
    case 'reserved4':
      findIdx = 7;
      break;
    case 'reserved5':
      findIdx = 8;
      break;
  }

  return findIdx;
};

export const isJSONStr = str => {
  try {
    return typeof JSON.parse(str) == 'object';
  } catch (e) {
    return false;
  }
};

export const getSysMsgFormatStr = (str, data) => {
  if (str) {
    return data.reduce((p, c) => {
      let replaceData = null;

      if (c.type == 'Plain') {
        replaceData = c.data;
      } else if (c.type == 'MultiPlain') {
        replaceData = getDictionary(c.data);
      } else if (c.type == 'Array') {
        const separator = c.separator || ',';
        if (typeof c.data == 'object' && typeof c.data.join == 'function') {
          replaceData = c.data.join(separator);
        } else {
          replaceData = '';
        }
      } else if (c.type == 'MultiArray') {
        const separator = c.separator || ',';
        if (typeof c.data == 'object' && typeof c.data.join == 'function') {
          const arrMulti = c.data.map(item => getDictionary(item));

          replaceData = arrMulti.join(separator);
        } else {
          replaceData = '';
        }
      }

      if (replaceData) return p.replace(/%s/, replaceData);
      else return p;
    }, str);
  } else {
    return '';
  }
};

export const moveRoom = (moveId, isChannel, dispatch) => {
  if (window.innerWidth <= 1000 && SCREEN_OPTION != 'G') {
    const winName = `wrf${moveId}`;
    const openURL = `${DEVICE_TYPE == 'd' ? '#' : ''}/client/nw/${
      !isChannel ? 'chatroom' : 'channel'
    }/${moveId}`;

    const roomObj =
      (!isChannel && newChatRoom(winName, moveId, openURL)) ||
      newChannel(winName, moveId, openURL);

    (!args.isChannel &&
      dispatch(newWinRoom({ id: moveId, obj: roomObj, name: winName }))) ||
      dispatch(
        newWinChannel({
          id: moveId,
          obj: roomObj,
          name: winName,
        }),
      );
  } else {
    (!isChannel && dispatch(openRoom({ roomID: moveId }))) ||
      dispatch(openChannel({ roomId: moveId }));
  }
};

export const makeMessageText = async (lastMessage, type) => {
  let returnText = covi.getDic('Msg_NoMessages', '대화내용 없음');
  try {
    let msgObj = null;

    if (typeof lastMessage === 'string') {
      msgObj = JSON.parse(lastMessage);
    } else if (typeof lastMessage === 'object') {
      msgObj = lastMessage;
    }

    if (!msgObj) {
      return returnText;
    }

    if (!!msgObj.Message) {
      let drawText = (msgObj.Message && msgObj.Message) || '';
      if (isJSONStr(msgObj.Message)) {
        const drawData = JSON.parse(msgObj.Message);

        if (drawData.msgType === 'C') {
          drawText = getDictionary(drawData.title);
        } else {
          drawText = drawData.context;
        }
      }

      if (eumTalkRegularExp.test(drawText)) {
        const messageObj =
          type === 'CHANNEL'
            ? await convertEumTalkProtocolPreviewForChannelItem(drawText)
            : convertEumTalkProtocolPreview(drawText);
        if (messageObj.type === 'emoticon') {
          returnText = covi.getDic('Emoticon', '이모티콘');
        } else {
          returnText = messageObj.message.split('\n')[0];
        }
      } else {
        returnText = drawText.split('\n')[0];
      }
    } else if (msgObj.File) {
      let fileObj = null;

      if (typeof msgObj.File == 'string') {
        fileObj = JSON.parse(msgObj.File);
      } else if (typeof msgObj.File == 'object') {
        fileObj = msgObj.File;
      }

      if (!fileObj) {
        return returnText;
      }

      // files 일경우
      if (fileObj.length > 1) {
        if (fileObj[0].isImage === 'Y') {
          // 사진 외 %s건
          returnText = getSysMsgFormatStr(
            covi.getDic('Tmp_imgExCnt', '사진 외 %s건'),
            [{ type: 'Plain', data: fileObj.length - 1 }],
          );
        } else {
          // 파일 외 %s건
          returnText = getSysMsgFormatStr(
            covi.getDic('Tmp_fileExCnt', '파일 외 %s건'),
            [{ type: 'Plain', data: fileObj.length - 1 }],
          );
        }
      } else {
        if (fileObj.isImage === 'Y') {
          returnText = covi.getDic('Image', '사진');
        } else {
          returnText = covi.getDic('File', '파일');
        }
      }
    }
  } catch (e) {
    // console.log(e);
  }

  return returnText;
};

export const getFilterMember = (members, id, roomType = null) => {
  if (!members) {
    return [];
  } else if (roomType === 'O') {
    return members;
  } else {
    return members.filter(item => {
      if (item.id === id) {
        return false;
      }

      return true;
    });
  }
};

export const makeDateTime = timestamp => {
  if (timestamp && isValid(new Date(timestamp))) {
    const toDay = startOfToday();
    const procTime = new Date(timestamp);
    let dateText = '';

    if (differenceInMilliseconds(procTime, toDay) >= 0) {
      // 오늘보다 큰 경우 시간 표시
      dateText = format(procTime, 'HH:mm');
    } else {
      // 오늘과 이틀이상 차이나는 경우 날짜로 표시
      dateText = format(procTime, 'yyyy.MM.dd');
    }
    // 오늘과 하루 차이인 경우 어제로 표시 -- 차후에 추가 ( 다국어처리 )
    return dateText;
  } else {
    return '';
  }
};
