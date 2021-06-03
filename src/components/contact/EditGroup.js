import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@C/common/ProfileBox';
import { deleteLayer, openPopup, getJobInfo } from '@/lib/common';
import OrgChart from '@C/orgchart/OrgChart';
import SearchOrgChart from '@C/orgchart/SearchOrgChart';
import SearchBar from '@COMMON/SearchBar';
import { Scrollbars } from 'react-custom-scrollbars';
import useOffset from '@/hooks/useOffset';
import { createTakeLatestTimer } from '@/lib/util/asyncUtil';
import GroupContainer from '@/containers/contact/GroupContainer';

const EditGroup = ({
  headerName,
  roomId,
  roomType,
  isNewRoom,
  oldMemberList,
  group
}) => {
  const { viewType, rooms, selectId, myInfo } = useSelector(
    ({ room, login }) => ({
      viewType: room.viewType,
      rooms: room.rooms,
      selectId: room.selectId,
      myInfo: login.userInfo,
    }),
  );
  const userID = useSelector(({ login }) => login.id);
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [selectTab, setSelectTab] = useState('GM');
  const [groupMembers, setGroupMembers] = useState([]);
  const [InviteMembers, setInviteMembers] = useState([]);
  const [selectors, setSelectors] = useState([]);
  const RENDER_UNIT = 10;
  const { renderOffset, handleScrollUpdate} = useOffset(searchResult, { renderPerBatch : RENDER_UNIT });
  
  const searchListEl = useRef(null);
  const contactListEl = useRef(null);
  const {
    theme
  } = window.covi.settings;
  const dispatch = useDispatch();

  useEffect(() => {
    if(group && group.groupName)
      setName(group.groupName)

    if (setGroupMembers) {
      setGroupMembers(groupMembers);      

    } else {
      ////선택한 그룹의 초기 초대멤버 표시
      setGroupMembers([
        {
          id: myInfo.id,
          name: myInfo.name,
          presence: myInfo.presence,
          photoPath: myInfo.photoPath,
          PN: myInfo.PN,
          LN: myInfo.LN,
          TN: myInfo.TN,
          dept: myInfo.dept,
          type: 'U',
        },
      ]);
    }
  }, []);

  const removeMemberObj = useMemo(
    () => ({
      name: 'editgroup_',
      onChange: (e, userInfo) => {
        console.log('removeMem')
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
              isShow: true,
            });
          } else {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic('그룹 멤버제거를 성공하였습니다.'),
              },
              dispatch,
            );
          }
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

  const addMemberObj = useMemo(
    () => ({
      name: 'editgroup_',
      onChange: (e, userInfo) => {
        console.log('addMember')
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
              isShow: true,
            });
          } else {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic('그룹 멤버추가를 성공하였습니다.'),
              },
              dispatch,
            );
          }
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

  const removeGrouphandleDelete = useCallback(userId => {
    delInviteMember(userId);
    document
      .getElementsByName('removegroup_' + userId)
      .forEach(item => (item.checked = false));
  }, []);

  const addGrouphandleDelete = useCallback(userId =>{
    delInviteMember(userId);
    document
      .getElementsByName('addgroup_' + userId)
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
            console.log(data);
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

  const handleGroupEditBtn = useCallback(() => {
    //탭 열린거 확인 후 추가삭제
    let paramList = [];

  }, [selectors]);

  

  const handleUpdate = handleScrollUpdate({
    threshold: 0.85
  });
  console.log(members)
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
                          addGrouphandleDelete(item.id);
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
                <div className="ChgBtn" >변경</div>
              </div>
            </div>
        </div>
        <ul className="tab">
          <li className={selectTab == 'GM' ? 'active' : ''} data-tab="tab1">
            <a
              onClick={() => {
                setSelectTab('GM');
              }}
            >
              {covi.getDic('그룹멤버')}
            </a>
          </li>
          <li className={selectTab == 'GA' ? 'active' : ''} data-tab="tab2">
            <a
              onClick={() => {
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
              placeholder={group.groupName+" "+covi.getDic('멤버 검색')}
              input={searchText}
              onChange={handleChange}
            />
            <Scrollbars
              ref={searchListEl}
              autoHide={true}
              className="PeopleList"
              onUpdate={handleUpdate}
              style={{  height: 'calc(100% - '+ (members.length > 0 ? '192px': '124px' )+')', display: 'none' }}
            >
            <SearchOrgChart
              viewType="checklist"
              checkObj={removeMemberObj}
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
              style={{ height: 'calc(100% - '+ (members.length > 0 ? '192px': '124px' )+')'}}
            >
              <GroupContainer viewType="checklist" checkObj={removeMemberObj} group={group}/>
            </Scrollbars>
          </div>
        </div>
        <div
          className={['tabcontent', selectTab == 'GA' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            <OrgChart viewType="checklist" checkObj={addMemberObj} group={group} />
          </div>
        </div>
        {members.length > 0 && 
          <div className={["groupEditBtn", theme].join(" ")} onClick={handleGroupEditBtn}>
            <span className="groupBtnLabel">{selectTab == 'GM' ? covi.getDic('제거'): covi.getDic('추가')}</span>
          </div>
        }
      </div>
    </div>
  );
};

export default EditGroup;
