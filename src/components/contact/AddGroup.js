import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteLayer, clearLayer, getJobInfo } from '@/lib/common';
import OrgChart from '@C/orgchart/OrgChart';
import ProfileBox from '../common/ProfileBox';
import { addGroupContactList } from '@/lib/contactUtil';

const AddGroup = () => {
  const { userID, contacts } = useSelector(({ login, contact }) => ({
    userID: login.id,
    contacts: contact.contacts,
  }));
  const [selectors, setSelectors] = useState([]);
  const [name, setName] = useState("");

  const dispatch = useDispatch();

  let oldContactList = [{ id: userID }];

  const addContact = selector => {
    setSelectors(prevState => prevState.concat(selector));
  };

  const delContact = selectorId => {
    setSelectors(prevState => prevState.filter(item => item.id != selectorId));
  };

  const checkObj = useMemo(
    () => ({
      name: 'addgroup_',
      onChange: (e, userInfo) => {
        if (e.target.checked) {
          addContact(userInfo);

          document
            .getElementsByName('addgroup_' + userInfo.id)
            .forEach(item => (item.checked = true));
        } else {
          delContact(userInfo.id);
          document
            .getElementsByName('addgroup_' + userInfo.id)
            .forEach(item => (item.checked = false));
        }
      },
      disabledList: oldContactList,
      disabledKey: 'id',
      checkedList: [...selectors, ...oldContactList],
      checkedKey: 'id',
    }),
    [oldContactList, selectors],
  );

  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, []);

  const handleAddBtn = useCallback(() => {
    const groupIdx = contacts.findIndex((contact)=> contact.folderType == 'R');
    var groupCnt = contacts[groupIdx].sub ? contacts[groupIdx].sub.length : 0;
    let groupInfo = {
      id: groupCnt+1,
      groupID: groupCnt+1
      ,groupName: name
      ,groupSortKey: groupCnt+1
      ,groupCode: ""
      ,pChat: "Y"
      ,sub: selectors.map(item =>{
        return {
          ...item,
          targetId: item.id,
          targetType: item.type,
          presence: item.presence,
          folderType: item.type == 'G' ? 'G' : 'C',
          companyCode: item.companyCode,
        }
      })
    };

    addGroupContactList(dispatch, groupInfo)

    clearLayer(dispatch);
  }, [selectors]);

  const handleDelete = useCallback(userId => {
    delContact(userId);
    document
      .getElementsByName('addgroup_' + userId)
      .forEach(item => (item.checked = false));
  }, []);

  return (
    <div className="Layer-AddGroup" style={{ height: '100%',minWidth:'400px' }}>
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>{covi.getDic('임의 그룹 생성')}</p>
        </div>
        <a className="Okbtn" onClick={handleAddBtn}>
          <span className="colortxt-point mr5">{selectors.length}</span>
          {covi.getDic('Ok')}
        </a>
      </div>
      <div className="container AddUser">
        <div className="org_select_wrap">
          <ul>
            {selectors &&
              selectors.map(item => {
                return (
                  <li key={'addgroup_' + item.id}>
                    <a
                      className="ui-link"
                      onClick={() => {
                        handleDelete(item.id);
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
              })}
          </ul>
        </div>
        <div className="Profile-info-input">
            <div className="input full">
              <label style={{ cursor: 'default' }} className="string optional">
                {covi.getDic('그룹 이름')}
              </label>
              <input
                className="string optional"
                placeholder={covi.getDic('그룹명을 입력하세요.')}
                type="text"
                onChange={e => setName(e.target.value)}
              />
            </div>
        </div>
        <div className="tabcontent active">
          <div className="AddUserCon">
            <OrgChart viewType="checklist" checkObj={checkObj} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGroup;
