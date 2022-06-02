import React from 'react';
import { useSelector } from 'react-redux';
import UserInfoBox from '@COMMON/UserInfoBox';
import OrgChartItem from '@C/orgchart/OrgChartItem';

const SearchOrgChart = ({
  viewType,
  checkObj,
  searchData,
  handleGroup,
  chineseWall = [],
}) => {
  const userID = useSelector(({ login }) => login.id);
  const handleClick = (groupCode, companyCode) => {
    if (handleGroup) handleGroup(groupCode, companyCode);
  };
  return (
    <ul className="people">
      {searchData?.map(resultItem => {
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
                <OrgChartItem result={resultItem} chineseWall={chineseWall} />
              </div>
            );
          else
            return (
              <UserInfoBox
                key={`${resultItem.id}_${resultItem.deptCode}`}
                userInfo={resultItem}
                isInherit={false}
                isClick={true}
                chineseWall={chineseWall}
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
                chineseWall={chineseWall}
              />
            </div>
          );
        }
      })}
      {!searchData.length && (
        <li className="person">
          <a>{covi.getDic('Msg_noSearchResult', '검색결과가 없습니다.')}</a>
        </li>
      )}
    </ul>
  );
};

export default React.memo(SearchOrgChart);
