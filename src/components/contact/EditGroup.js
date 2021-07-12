import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@C/common/ProfileBox';
import { deleteLayer, openPopup, getJobInfo, getDictionary } from '@/lib/common';
import OrgChart from '@C/orgchart/OrgChart';
import { createTakeLatestTimer } from '@/lib/util/asyncUtil';
import {modifyCustomGroupName, modifyGroupMember} from '@/modules/contact';
import { editGroupContactList, getApplyGroupInfo } from '@/lib/contactUtil';
import GroupList from '@C/contact/GroupList';

const EditGroup = ({
  headerName,
  group
}) => {
  const groupInfo = useSelector(({ contact }) => {
    const groupIdx = contact.contacts.findIndex((contact)=> contact.folderType == 'R');
    return contact.contacts[groupIdx].sub
  }).find( groupInfo => groupInfo.folderID === group.folderID );
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [selectTab, setSelectTab] = useState('GM');
  const {
    theme
  } = window.covi.settings;
  const dispatch = useDispatch();

  useEffect(() => {
    if(groupInfo && groupInfo.folderName)
      setName(getDictionary(groupInfo.folderName))
      
    /* 그룹인원 멤버 0명일때 처리 */
    if(!groupInfo.sub)
      groupInfo.sub = [];
  }, [group, groupInfo]);

  const editMemberObj = useMemo(
    () => ({
      name: 'editgroup_',
      onChange: (e, userInfo) => {
        console.log('editMember')
        if (e.target.checked) {
          if (userInfo.pChat == 'Y') {
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
              pChat: userInfo.pChat,
              companyCode: userInfo.companyCode,
              isShow: true,
            });
          }
        } else {
          delInviteMember(userInfo.id);
        }
      },
      disabledList: [],
      disabledKey: 'id',
      checkedList: [...members],
      checkedKey: 'id',
    }),
    [members],
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

  const handleGroupEditBtn = useCallback((activeTab) => {
    //그룹멤버 탭
    let groupMembers = groupInfo.sub ?  [...groupInfo.sub] : [];

    /* 그룹 멤버 리스트 */
    if(activeTab == 'GM')
      groupMembers = groupMembers.filter(user =>{
        let flag = true;
        members.forEach(m =>{
          if(m.id == user.id)
            flag = false;
        });
        return flag;
      });
    else
      groupMembers = groupMembers.concat(members);

    editGroupContactList(
      dispatch,
      modifyGroupMember,
      getApplyGroupInfo(
        members,
        name,
        groupInfo,
        (activeTab == 'GM' ? "D" : "A")
      ),
      groupMembers
    )
    
    setMembers([])
  }, [members, groupInfo]);
  
  const checkEditGroup = useCallback(() => {
    if(members.length > 0){
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_Not_Moving_Editing', '멤버 추가/제거중에는 탭을 이동 할 수 없습니다.'),
        },
        dispatch,
      );
      return false;
    }
    return true;
  }, [members]);

  const handleModidyCustomGroupName = useCallback(() => {
    let data= {
      displayName: (groupInfo.folderName).replace(/[^\;]/g, "").replace(/[\;]/g, name+";"),
      folderId: groupInfo.folderID
    }
    dispatch(modifyCustomGroupName(data));
    openPopup(
      {
        type: 'Alert',
        message: covi.getDic('Modify_Group_Name', '그룹명이 변경되었습니다.'),
      },
      dispatch,
    );
  }, [name, groupInfo]);

  return (
    <div className="Layer-AddUser" style={{ height: '100%' }}>
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
                {covi.getDic('Group_Name', '그룹 이름')}
              </label>
              <div style={{display: 'flex'}}>
                <input
                    className="string optional"
                    placeholder={covi.getDic('Input_Group_Name', '그룹명을 입력하세요.')}
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
              {covi.getDic('Group_Member', '그룹 멤버')}
            </a>
          </li>
          <li className={selectTab == 'GA' ? 'active' : ''} data-tab="tab2">
            <a
              onClick={() => {
                if(checkEditGroup())
                  setSelectTab('GA');
              }}
            >
              {covi.getDic('Add_Group_Member', '그룹원 추가')}
            </a>
          </li>
        </ul>
        <div
          className={['tabcontent', selectTab == 'GM' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
              <GroupList group={groupInfo} checkObj={editMemberObj} />
          </div>
        </div>
        <div
          className={['tabcontent', selectTab == 'GA' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            <OrgChart viewType="checklist" checkObj={editMemberObj} group={groupInfo} />
          </div>
        </div>
        {members.length > 0 && 
          <div className={["groupEditBtn", theme].join(" ")} onClick={()=> handleGroupEditBtn(selectTab)}>
            <div className="groupBtnLabel">{selectTab == 'GM' ? covi.getDic('Remove', '제거'): covi.getDic('Add', '추가')}</div>
          </div>
        }
      </div>
    </div>
  );
};

export default EditGroup;
