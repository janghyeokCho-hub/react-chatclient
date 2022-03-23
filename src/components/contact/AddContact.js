import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteLayer, clearLayer, getJobInfo } from '@/lib/common';
import OrgChart from '@C/orgchart/OrgChart';
import ProfileBox from '../common/ProfileBox';
import {
  addContactList,
  editGroupContactList,
  getApplyGroupInfo,
} from '@/lib/contactUtil';
import { addCustomGroup } from '@/modules/contact';
import { openPopup } from '@/lib/common';

const AddContact = ({ useGroup }) => {
  const { userID, contacts } = useSelector(({ login, contact }) => ({
    userID: login.id,
    contacts: contact.contacts,
  }));
  const [selectors, setSelectors] = useState([]);
  const [name, setName] = useState('');
  const dispatch = useDispatch();

  let oldContactList = [{ id: userID }];

  if (!useGroup) {
    contacts.forEach(item => {
      if ((item.folderType == 'F' || item.folderType == 'C') && item.sub)
        item.sub.forEach(itemSub => {
          oldContactList.push(itemSub);
        });
      else if (item.folderType == 'G' || item.folderType == 'M') {
        oldContactList.push({ id: item.groupCode });
      }
    });
  }

  const addContact = selector => {
    setSelectors(prevState => prevState.concat(selector));
  };

  const delContact = selectorId => {
    setSelectors(prevState => prevState.filter(item => item.id != selectorId));
  };

  const checkObj = useMemo(
    () => ({
      name: 'addcontact_',
      onChange: (e, userInfo) => {
        if (e.target.checked) {
          addContact(userInfo);

          document
            .getElementsByName('addcontact_' + userInfo.id)
            .forEach(item => (item.checked = true));
        } else {
          delContact(userInfo.id);
          document
            .getElementsByName('addcontact_' + userInfo.id)
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
    let paramList = [];

    selectors.forEach(item => {
      paramList.push({
        targetId: item.id,
        targetType: item.type,
        presence: item.presence,
        folderType: item.type == 'G' ? 'G' : 'C',
        userInfo: item,
        companyCode: item.companyCode,
      });
    });

    addContactList(dispatch, paramList);

    clearLayer(dispatch);
  }, [selectors]);

  const handleAddGroupBtn = useCallback(() => {
    /* 그룹명 미 입력시 Alert Msg*/
    if (name === '') {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Input_Group_Name', '그룹명을 입력하세요.'),
        },
        dispatch,
      );
      return;
    }
    /* 그룹 생성 */
    editGroupContactList(
      dispatch,
      addCustomGroup,
      getApplyGroupInfo(selectors, name),
      selectors,
    );

    clearLayer(dispatch);
  }, [name, selectors]);

  const handleDelete = useCallback(userId => {
    delContact(userId);
    document
      .getElementsByName('addcontact_' + userId)
      .forEach(item => (item.checked = false));
  }, []);

  return (
    <div
      className="Layer-AddUser"
      style={{ height: '100%', minWidth: '400px' }}
    >
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>{covi.getDic('AddContact', '내 대화상대 추가')}</p>
        </div>
        <a
          className="Okbtn"
          onClick={useGroup ? handleAddGroupBtn : handleAddBtn}
        >
          <span className="colortxt-point mr5">{selectors.length}</span>
          {covi.getDic('Ok', '확인')}
        </a>
      </div>
      <div className="container AddUser">
        <div className="org_select_wrap">
          <ul>
            {selectors &&
              selectors.map(item => {
                return (
                  <li key={'addcontact_' + item.id}>
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
        {useGroup ? (
          <div className="Profile-info-input">
            <div className="input full">
              <label style={{ cursor: 'default' }} className="string optional">
                {covi.getDic('Group_Name', '그룹 이름')}
              </label>
              <input
                className="string optional"
                placeholder={covi.getDic(
                  'Input_Group_Name',
                  '그룹명을 입력하세요.',
                )}
                value={name}
                type="text"
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>
        ) : null}
        <div className="tabcontent active">
          <div className="AddUserCon">
            <OrgChart viewType="checklist" checkObj={checkObj} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddContact;
