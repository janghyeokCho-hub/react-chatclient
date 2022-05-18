import { chatsvr, managesvr } from '@/lib/api';
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

export const getChineseWall = async ({ userId, myInfo }) => {
  try {
    const { data } = await managesvr('get', `/org/block/${userId}`);
    const { result, status } = data;
    let blockList = [];
    if (status === 'SUCCESS' && result?.length) {
      for (const item of result) {
        const jsonData = {
          target: '',
          blockType: '',
          isChat: item.isChat,
          isFile: item.isFile,
        };
        if (item.block1 === myInfo.id || item.block1 === myInfo.DeptCode) {
          jsonData.target = item.block2;
          jsonData.blockType = item.blockType2;
        } else {
          jsonData.target = item.block1;
          jsonData.blockType = item.blockType1;
        }
        blockList.push(jsonData);
      }
    }
    return { result: blockList, status };
  } catch (e) {
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

  const chineseData = chineseWall.filter(
    item =>
      item.target === targetInfo.id || item.target === targetInfo.deptCode,
  );

  for (const data of chineseData) {
    if (data.isChat === 'Y') {
      result.blockChat = true;
    }
    if (data.isFile === 'Y') {
      result.blockFile = true;
    }
  }
  return result;
};
