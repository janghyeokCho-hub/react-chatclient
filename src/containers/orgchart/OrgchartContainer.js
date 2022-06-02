import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getOrgChart } from '@/lib/orgchart';

import UserInfoBox from '@COMMON/UserInfoBox';
import Scrollbars from 'react-custom-scrollbars';
import OrgChartItem from '@C/orgchart/OrgChartItem';

import { getDictionary } from '@/lib/common';
import { filterSearchGroupMember } from '@/lib/contactUtil';

const OrgchartContainer = ({
  viewType,
  checkObj,
  searchGroup,
  handleGroup,
  searchCompanyCode,
  group,
  chineseWall = [],
}) => {
  const { userInfo, userID } = useSelector(({ login }) => ({
    userInfo: login.userInfo,
    userID: login.id,
  }));

  const [deptProfileList, setDeptProfileList] = useState([]);
  const [orgpathList, setOrgpathList] = useState([]);
  const [oldGroupMember, setOldGroupMember] = useState([]);

  const handleDept = useCallback(
    (deptCode, companyCode) => {
      getOrgChart({ deptID: deptCode }, { CompanyCode: companyCode }).then(
        ({ data }) => {
          if (data.status == 'SUCCESS') {
            //임의그룹화면: 그룹멤버 제외하고 목록나오도록 수정.
            if (group)
              data.result.sub = filterSearchGroupMember(
                data.result.sub,
                group,
                userID,
              );

            setOrgpathList(data.result.path);
            setDeptProfileList(data.result.sub);

            if (handleGroup) handleGroup('');
          }
        },
      );
    },
    [group],
  );

  // 최상위로
  const handleDeptLevel = () => {
    const orgpathListLength = orgpathList.length;
    if (orgpathListLength < 2) {
      return;
    } else {
      const { GroupCode, CompanyCode } = orgpathList[orgpathListLength - 2];
      handleDept(GroupCode, CompanyCode);
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

  useEffect(() => {
    if (group?.sub) {
      if (oldGroupMember.length != group.sub.length) {
        setOldGroupMember(group.sub);
        handleDept(userInfo.DeptCode, userInfo.CompanyCode);
      } else {
        setOldGroupMember(group.sub);
      }
    }
  }, [group]);

  return (
    <>
      <div className="OrgList">
        <div className="org_tree_wrap">
          <a className="top_folder" onClick={handleDeptLevel}>
            {covi.getDic('Top', '최상위로')}
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
                        chineseWall={chineseWall}
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
                        chineseWall={chineseWall}
                      />
                    );
                  else
                    return (
                      <UserInfoBox
                        key={resultItem.id}
                        userInfo={resultItem}
                        isInherit={false}
                        isClick={true}
                        chineseWall={chineseWall}
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
                      chineseWall={chineseWall}
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
