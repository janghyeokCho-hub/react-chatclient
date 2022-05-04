import {
  isJSONStr,
  eumTalkRegularExp,
  convertEumTalkProtocolPreviewForChannelItem,
} from '@/lib/common';

export const makeMessage = async msg => {
  const flag = eumTalkRegularExp.test(msg);
  if (flag) {
    const convertedMessage = await convertEumTalkProtocolPreviewForChannelItem(
      msg,
    );
    if (!convertedMessage?.message) {
      return msg;
    }
    return convertedMessage.message;
  } else {
    return msg;
  }
};

export const isEmptyObj = obj => {
  if (obj?.constructor === Object && Object.keys(obj).length === 0) {
    return true;
  }
  return false;
};

export const getSettings = (item, type) => {
  let setting = {};

  if (!item) {
    return setting;
  }

  const key = type === 'CHANNEL' ? 'settingJSON' : 'setting';
  if (typeof item[key] === 'object') {
    setting = { ...item[key] };
  } else if (isJSONStr(item[key])) {
    setting = JSON.parse(item[key]);
  }
  return setting;
};
