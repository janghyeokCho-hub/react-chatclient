import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteLayer, clearLayer, getJobInfo, openPopup } from '@/lib/common';
import OrgChart from '@C/orgchart/OrgChart';
import ProfileBox from '../common/ProfileBox';
import { addGroupContactList } from '@/lib/contactUtil';
import { getAesUtil } from '@/lib/aesUtil';

const AddGroup = () => {
  const { userID} = useSelector(({ login }) => ({
    userID: login.id
  }));
  const [selectors, setSelectors] = useState([]);
  const [name, setName] = useState("");
  const dispatch = useDispatch();
  const AESUtil = getAesUtil();

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
    /* 그룹명 미입력시 */
    if(name === ""){
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('그룹명을 입력해주세요.'),
        },
        dispatch,
      );

      return;
    }

    /* 사용자 그룹 생성 JSON */
    const groupInfo = [{
      displayName: ";;;;;;;;;".replace(/[\;]/g, name+";"),
      folderType: 'R',
      arrGroup: AESUtil.encrypt(selectors.filter((item)=> item.type == 'G').map((item)=>{
        return item.id+"$$"+item.companyCode;
      }).join(",")),
      arrMember: AESUtil.encrypt(selectors.filter((item)=> item.type == 'U').map((item)=>{
        return item.id;
      }).join(","))
    }]

    addGroupContactList(dispatch, groupInfo, selectors)

    clearLayer(dispatch);
  }, [name, selectors]);

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
          <p>{covi.getDic('그룹 생성')}</p>
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
                value={name}
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
