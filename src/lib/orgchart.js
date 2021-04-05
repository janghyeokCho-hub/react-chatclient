import { chatsvr, managesvr } from '@/lib/api';

export const getOrgChart = ({ deptID }, { CompanyCode }) => {
  return managesvr('get', `/org/${deptID}/gr/${CompanyCode}`);
};

export const searchOrgChart = ({ userID, value, type }) => {
  let param = `value=${encodeURIComponent(value)}`;
  if (type) {
    param += `&type=${encodeURIComponent(type)}`;
  }
  return managesvr('get', `/org/search/${userID}?${param}`);
};
