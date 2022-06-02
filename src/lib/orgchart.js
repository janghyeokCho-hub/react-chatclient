import { managesvr } from '@/lib/api';
import { getJobInfo } from '@/lib/userSettingUtil';

export const getOrgChart = ({ deptID }, { CompanyCode }) => {
  return managesvr('get', `/org/${deptID}/gr/${CompanyCode}`);
};

export const searchOrgChart = ({ userID, value, type }) => {
  let param = `value=${encodeURIComponent(value)}&st=${getJobInfo()}`;
  if (type) {
    param += `&type=${encodeURIComponent(type)}`;
  }
  return managesvr('get', `/org/search/${userID}?${param}`);
};

const stringArrToArray = str => {
  const regStr = /\[.*\]/gi;
  str = str.match(regStr);
  str += '';
  str = str.split('[').join('');
  str = str.split(']').join('');
  str = str.replace(/"/gi, '');
  if (str.includes(',')) {
    return str.split(',');
  } else {
    return Array(str);
  }
};

export const getChineseWall = async ({ userId }) => {
  try {
    const { data } = await managesvr('get', `/org/block/${userId}`);
    const { result, status } = data;
    let blockList = [];
    if (status === 'SUCCESS' && result?.length) {
      for (const item of result) {
        const jsonData = {
          target: stringArrToArray(item.target),
          targetType: item.targetType,
          blockChat: item.blockChat,
          blockFile: item.blockFile,
        };
        blockList.push(jsonData);
      }
    }
    return { result: blockList, status };
  } catch (e) {
    console.error(e);
    return { result: [], status: 'ERROR' };
  }
};

export const isBlockCheck = ({ targetInfo, chineseWall = [] }) => {
  let result = {
    blockChat: false,
    blockFile: false,
  };
  if (!chineseWall.length) {
    return result;
  }

  for (const data of chineseWall) {
    const target = data.target;
    if (target.includes(targetInfo.companyCode)) {
      result.blockChat = result.blockChat
        ? result.blockChat
        : data.blockChat === 'Y';
      result.blockFile = result.blockFile
        ? result.blockFile
        : data.blockFile === 'Y';
    }
    if (target.includes(targetInfo.deptCode)) {
      result.blockChat = result.blockChat
        ? result.blockChat
        : data.blockChat === 'Y';
      result.blockFile = result.blockFile
        ? result.blockFile
        : data.blockFile === 'Y';
    }
    if (target.includes(targetInfo.id)) {
      result.blockChat = result.blockChat
        ? result.blockChat
        : data.blockChat === 'Y';
      result.blockFile = result.blockFile
        ? result.blockFile
        : data.blockFile === 'Y';
    }

    if (result.blockChat && result.blockFile) {
      break;
    }
  }
  return result;
};
