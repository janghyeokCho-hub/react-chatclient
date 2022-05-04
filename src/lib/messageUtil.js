import { evalConnector } from './deviceConnector';
import * as messageApi from '@/lib/message';

export const getMessage = (roomID, startId, dist) => {
  let resultObj;
  const param = {
    roomID,
    startId,
    loadCnt: 100,
    dist,
  };

  // TODO: AppData 저장 여부값 조건 추가 필요
  if (DEVICE_TYPE == 'd') {
    resultObj = new Promise((resolve, reject) => {
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
  if (DEVICE_TYPE == 'd') {
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
  const match = tag.match(attrPattern);

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
