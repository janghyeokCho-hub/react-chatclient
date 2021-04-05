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
