import { managesvr } from '@/lib/api';
import { getJobInfo } from '@/lib/userSettingUtil';
import { getAllUserWithGroup } from '@/lib/room';

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
    const { data } = await managesvr('get', `/na/org/block/${userId}`);
    const { result, status, blockList } = data;
    let chineseWall = [];
    if (status === 'SUCCESS' && result?.length) {
      for (const item of result) {
        const jsonData = {
          target: stringArrToArray(item.target),
          targetType: item.targetType,
          blockChat: item.blockChat,
          blockFile: item.blockFile,
        };
        chineseWall.push(jsonData);
      }
    }
    return { result: chineseWall, status, blockList };
  } catch (e) {
    console.error(e);
    return { result: [], status: 'ERROR', blockList: [] };
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
    const { target, targetType } = data;
    if (target.includes(targetInfo.companyCode)) {
      result.blockChat = result.blockChat
        ? result.blockChat
        : data.blockChat === 'Y';
      result.blockFile = result.blockFile
        ? result.blockFile
        : data.blockFile === 'Y';
    }

    if (targetType === 'G') {
      const targetDeptCode = targetInfo?.deptCode?.split(',');
      if (!targetDeptCode) {
        continue;
      }
      const deptBlocks = target.filter(item => targetDeptCode.includes(item));
      if (deptBlocks?.length) {
        result.blockChat = result.blockChat
          ? result.blockChat
          : data.blockChat === 'Y';
        result.blockFile = result.blockFile
          ? result.blockFile
          : data.blockFile === 'Y';
      }
    } else if (targetType === 'U') {
      if (target.includes(targetInfo.id)) {
        result.blockChat = result.blockChat
          ? result.blockChat
          : data.blockChat === 'Y';
        result.blockFile = result.blockFile
          ? result.blockFile
          : data.blockFile === 'Y';
      }
    }

    if (result.blockChat && result.blockFile) {
      break;
    }
  }
  return result;
};
