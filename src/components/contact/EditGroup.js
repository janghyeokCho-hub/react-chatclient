import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@C/common/ProfileBox';
import { deleteLayer, openPopup, getJobInfo, getDictionary } from '@/lib/common';
import OrgChart from '@C/orgchart/OrgChart';
import SearchOrgChart from '@C/orgchart/SearchOrgChart';
import { searchOrgChart } from "@/lib/orgchart";
import SearchBar from '@COMMON/SearchBar';
import { Scrollbars } from 'react-custom-scrollbars';
import useOffset from '@/hooks/useOffset';
import { createTakeLatestTimer } from '@/lib/util/asyncUtil';
import GroupContainer from '@/containers/contact/GroupContainer';
import {deleteGroupMember, addGroupMember, modifyCustomGroupName} from '@/modules/contact'
import GroupItem from './GroupItem';

const EditGroup = ({
  headerName,
  group
}) => {
  const groupInfo = useSelector(({ contact }) => {
    const groupIdx = contact.contacts.findIndex((contact)=> contact.folderType == 'R');
    return contact.contacts[groupIdx].sub
  }).filter( groupInfo => groupInfo.id === group.id );
  const userID = useSelector(({ login }) => login.id);
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [selectTab, setSelectTab] = useState('GM');
  const [groupMembers, setGroupMembers] = useState([]);
  const RENDER_UNIT = 10;
  const { renderOffset, handleScrollUpdate} = useOffset(searchResult, { renderPerBatch : RENDER_UNIT });
  const searchListEl = useRef(null);
  const contactListEl = useRef(null);
  const {
    theme
  } = window.covi.settings;
  const dispatch = useDispatch();

  useEffect(() => {
    if(group && group.folderName)
      setName(getDictionary(group.folderName))
  }, [group]);

  const editMemberObj = useMemo(
    () => ({
      name: 'editgroup_',
      onChange: (e, userInfo) => {
        console.log('removeMem')
        if (e.target.checked) {
          //if (userInfo.pChat == 'Y') {
            addInviteMember({
              id: userInfo.id,
              name: userInfo.name,
              presence: userInfo.presence,
              photoPath: userInfo.photoPath,
              PN: userInfo.PN,
              LN: userInfo.LN,
              TN: userInfo.TN,
              dept: userInfo.dept,
              type: userInfo.type,
              isShow: true,
            });
          //}
        } else {
          delInviteMember(userInfo.id);
        }
      },
      disabledList: groupMembers,
      disabledKey: 'id',
      checkedList: [...members, ...groupMembers],
      checkedKey: 'id',
    }),
    [groupMembers, members],
  );

  const addInviteMember = useCallback(member => {
    setMembers(prevState => prevState.concat(member));
  }, []);

  const delInviteMember = useCallback(memberId => {
    setMembers(prevState => prevState.filter(item => item.id != memberId));
  }, []);

  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, []);

  const groupMemberHandleDelete = useCallback(userId =>{
    delInviteMember(userId);
    document
      .getElementsByName('editgroup_' + userId)
      .forEach(item => (item.checked = false));
  }, []);

  const debounceTimer = createTakeLatestTimer(200);

  const handleChange = useCallback(
    e => {
      const text = e.target.value;
      setSearchText(text);

      if (text !== '') {
        debounceTimer.takeLatest(() => {
          /* 그룹멤버 검색으로 변경.... */
          searchOrgChart({
            userID: userID,
            value: encodeURIComponent(text),
            type: 'C',
          }).then(({ data }) => {
            if (data.status == 'SUCCESS') setSearchResult(data.result);
            else setSearchResult([]);
          });
        }, 200);

        searchListEl.current.container.style.display = '';
        contactListEl.current.container.style.display = 'none';
      } else {
        searchListEl.current.container.style.display = 'none';
        contactListEl.current.container.style.display = '';

        debounceTimer.cancel();
        setSearchResult([]);
      }
    },
    [userID],
  );

  const handleGroupEditBtn = useCallback((activeTab) => {
    //탭 열린거 확인 후 추가삭제
    let paramList = [];

    //console.log(activeTab, members)
    //그룹멤버 탭
    if(activeTab == 'GM'){
      //그룹멤버 제거
      dispatch(deleteGroupMember({members, group}))
    }else{
      //그룹멤버 추가
      dispatch(addGroupMember({members, group}))
    }

    setMembers([])
  }, [members]);

  const handleUpdate = handleScrollUpdate({
    threshold: 0.85
  });
  
  const checkEditGroup = useCallback(() => {
    if(members.length > 0){
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('멤버 추가/제거중에는 탭을 이동 할 수 없습니다.'),
        },
        dispatch,
      );
      return false;
    }
    return true;
  }, [members]);

  const handleModidyCustomGroupName = useCallback(() => {
    let data= {
      displayName: (group.folderName).replace(/[^\;]/g, "").replace(/[\;]/g, name+";"),
      folderId: group.folderID
    }
    dispatch(modifyCustomGroupName(data));
    openPopup(
      {
        type: 'Alert',
        message: covi.getDic('그룹명이 변경되었습니다.'),
      },
      dispatch,
    );
  }, [name]);

  return (
    <div className="Layer-AddGroup" style={{ height: '100%' }}>
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>{headerName}</p>
        </div>
      </div>
      <div className="container AddUser">
        <div className="org_select_wrap">
          <ul>
            {members &&
              members.map(item => {
                if (item.isShow) {
                  return (
                    <li key={'editgroup_' + item.id}>
                      <a
                        className="ui-link"
                        onClick={() => {
                          groupMemberHandleDelete(item.id);
                        }}
                      >
                        <ProfileBox
                          userId={item.id}
                          img={item.photoPath}
                          presence={item.type == 'G' ? item.presence : null}
                          isInherit={item.type == 'U'}
                          userName={item.name}
                          handleClick={false}
                        />
                        <p className="name">{getJobInfo(item)}</p>
                        <span className="del"></span>
                      </a>
                    </li>
                  );
                }
              })}
          </ul>
        </div>
        <div className="Profile-info-input" style={{display: "inline-block", width: "100%"}}>
            <div className="input full">
              <label style={{ cursor: 'default' }} className="string optional">
                {covi.getDic('그룹 이름')}
              </label>
              <div style={{display: 'flex'}}>
                <input
                    className="string optional"
                    placeholder={covi.getDic('그룹명을 입력하세요.')}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <div className="ChgBtn" onClick={handleModidyCustomGroupName} >변경</div>
              </div>
            </div>
        </div>
        <ul className="tab">
          <li className={selectTab == 'GM' ? 'active' : ''} data-tab="tab1">
            <a
              onClick={() => {
                if(checkEditGroup())
                  setSelectTab('GM');
              }}
            >
              {covi.getDic('그룹멤버')}
            </a>
          </li>
          <li className={selectTab == 'GA' ? 'active' : ''} data-tab="tab2">
            <a
              onClick={() => {
                if(checkEditGroup())
                  setSelectTab('GA');
              }}
            >
              {covi.getDic('그룹원 추가')}
            </a>
          </li>
        </ul>
        <div
          className={['tabcontent', selectTab == 'GM' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            <SearchBar
              placeholder={getDictionary(group.folderName)+" "+covi.getDic('멤버 검색')}
              input={searchText}
              onChange={handleChange}
            />
            <Scrollbars
              ref={searchListEl}
              autoHide={true}
              className="PeopleList"
              onUpdate={handleUpdate}
              style={{  height: 'calc(100% - '+ (members.length > 0 ? '220px': '124px' )+')', display: 'none' }}
            >
            <SearchOrgChart
              viewType="checklist"
              checkObj={editMemberObj}
              searchData={searchResult}
              offset = {{
                renderOffset
              }}
            />
            </Scrollbars>
            <Scrollbars
              ref={contactListEl}
              autoHide={true}
              className="PeopleList"
              onUpdate={handleUpdate}
              style={{ height: 'calc(100% - '+ (members.length > 0 ? '220px': '124px' )+')'}}
            >
              <GroupContainer viewType="checklist" checkObj={editMemberObj} group={groupInfo[0]}/>
            </Scrollbars>
          </div>
        </div>
        <div
          className={['tabcontent', selectTab == 'GA' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            <OrgChart viewType="checklist" checkObj={editMemberObj} group={groupInfo[0]} />
          </div>
        </div>
        {members.length > 0 && 
          <div className={["groupEditBtn", theme].join(" ")} onClick={()=> handleGroupEditBtn(selectTab)}>
            <div className="groupBtnLabel">{selectTab == 'GM' ? covi.getDic('제거'): covi.getDic('추가')}</div>
          </div>
        }
      </div>
    </div>
  );
};

export default EditGroup;
