import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getOrgChart } from '@/lib/orgchart';

import UserInfoBox from '@COMMON/UserInfoBox';
import Scrollbars from 'react-custom-scrollbars';
import OrgChartItem from '@C/orgchart/OrgChartItem';

import { getDictionary } from '@/lib/common';

const OrgchartContainer = ({
  viewType,
  checkObj,
  searchGroup,
  handleGroup,
  searchCompanyCode,
}) => {
  const { userInfo, userID } = useSelector(({ login }) => ({
    userInfo: login.userInfo,
    userID: login.id,
  }));

  const [deptProfileList, setDeptProfileList] = useState([]);
  const [orgpathList, setOrgpathList] = useState([]);

  const handleDept = (deptCode, companyCode) => {
    getOrgChart({ deptID: deptCode }, { CompanyCode: companyCode }).then(
      ({ data }) => {
        if (data.status == 'SUCCESS') {
          setOrgpathList(data.result.path);
          setDeptProfileList(data.result.sub);

          if (handleGroup) handleGroup('');
        }
      },
    );
  };

  // 최상위로
  const handleDeptLevel = () => {
    const orgpathListLength = orgpathList.length;
    if (orgpathListLength < 2) {
      return;
    } else {
      const { GroupCode, CompanyCode } = orgpathList[orgpathListLength - 2];
      handleDept(
        GroupCode,
        CompanyCode,
      );
    }
  };

  // componentDidMount
  useEffect(() => {
    if (
      (deptProfileList == null || deptProfileList.length == 0) &&
      userInfo.DeptCode != null &&
      userInfo.CompanyCode != null &&
      searchGroup == ''
    ) {
      handleDept(userInfo.DeptCode, userInfo.CompanyCode);
    }
  }, []);

  useEffect(() => {
    if (searchGroup && searchGroup != '') {
      console.log('orgchartcont =>', searchGroup, searchCompanyCode);
      handleDept(searchGroup, searchCompanyCode);
    }
  }, [searchGroup]);

  return (
    <>
      <div className="OrgList">
        <div className="org_tree_wrap">
          <a className="top_folder" onClick={handleDeptLevel}>
            {covi.getDic('Top')}
          </a>
          <Scrollbars
            style={{ height: '43px', padding: '0px' }}
            renderView={({ style }) => {
              const viewStyle = {
                overflowY: 'hidden',
                padding: '10px',
              };
              return <div style={{ ...style, ...viewStyle }}></div>;
            }}
            renderTrackVertical={() => <div style={{ display: 'none' }} />}
            autoHide={true}
            className="scr_h"
          >
            <ul>
              {orgpathList &&
                orgpathList.map(resultItem => (
                  <li
                    key={resultItem.GroupCode}
                    onClick={() =>
                      handleDept(resultItem.GroupCode, resultItem.CompanyCode)
                    }
                  >
                    <a>{getDictionary(resultItem.MultiDisplayName)}</a>
                  </li>
                ))}
            </ul>
          </Scrollbars>
        </div>
        <ul className="people">
          {deptProfileList &&
            deptProfileList.map(resultItem => {
              if (resultItem.type === 'G') {
                return (
                  <div
                    key={'orgchart_' + resultItem.id}
                    onClick={() => {
                      setTimeout(() => {
                        handleDept(resultItem.id, resultItem.companyCode);
                      }, 200);
                    }}
                  >
                    {viewType == 'list' && <OrgChartItem result={resultItem} />}
                    {viewType == 'checklist' && (
                      <UserInfoBox
                        key={'orgchart_' + resultItem.id}
                        userInfo={resultItem}
                        isInherit={false}
                        isClick={false}
                        checkObj={checkObj}
                      />
                    )}
                  </div>
                );
              } else {
                if (viewType == 'list') {
                  if (resultItem.id != userID)
                    return (
                      <OrgChartItem
                        key={'orgchart_' + resultItem.id}
                        result={resultItem}
                      />
                    );
                  else
                    return (
                      <UserInfoBox
                        key={resultItem.id}
                        userInfo={resultItem}
                        isInherit={false}
                        isClick={true}
                      />
                    );
                } else {
                  return (
                    <UserInfoBox
                      key={'orgchart_' + resultItem.id}
                      userInfo={resultItem}
                      isInherit={false}
                      isClick={false}
                      checkObj={checkObj}
                    />
                  );
                }
              }
            })}
        </ul>
      </div>
    </>
  );
};

export default OrgchartContainer;
