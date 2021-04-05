import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import UserInfoBox from '@COMMON/UserInfoBox';
import OrgChartItem from '@C/orgchart/OrgChartItem';

const SearchOrgChart = ({ viewType, checkObj, searchData, handleGroup, offset }) => {
  const userID = useSelector(({ login }) => login.id);
  const handleClick = (groupCode, companyCode) => {
    if (handleGroup) handleGroup(groupCode, companyCode);
  };
  const { renderOffset } = offset;
  return (
    <ul className="people">
      {searchData &&
        searchData.slice(0, renderOffset).map(resultItem => {
          if (viewType == 'list') {
            if (resultItem.id != userID)
              return (
                <div
                  key={`${resultItem.id}_${resultItem.deptCode}`}
                  onClick={() => {
                    if (resultItem.type == 'G')
                      handleClick(resultItem.id, resultItem.companyCode);
                  }}
                >
                  <OrgChartItem result={resultItem} />
                </div>
              );
            else
              return (
                <UserInfoBox
                  key={`${resultItem.id}_${resultItem.deptCode}`}
                  userInfo={resultItem}
                  isInherit={false}
                  isClick={true}
                />
              );
          } else {
            return (
              <div
                key={`${resultItem.id}_${resultItem.deptCode}`}
                onClick={() => {
                  if (resultItem.type == 'G')
                    handleClick(resultItem.id, resultItem.companyCode);
                }}
              >
                <UserInfoBox
                  userInfo={resultItem}
                  isInherit={false}
                  isClick={false}
                  checkObj={checkObj}
                />
              </div>
            );
          }
        })}
      {
        !searchData.length && (
          <li className="person">
            <a>
              {"결과 없음"}
            </a>
          </li>
        )
      }
    </ul>
  );
};

export default React.memo(SearchOrgChart);
