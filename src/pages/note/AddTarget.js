import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import ProfileBox from '@C/common/ProfileBox';
import ContactList from '@C/contact/ContactList';
import OrgChart from '@C/orgchart/OrgChart';
import { deleteLayer, getJobInfo } from '@/lib/common';

export default function AddTarget({ oldMemberList, onChange, onRemove }) {
  const dispatch = useDispatch();
  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, []);

  const [members, setMembers] = useState([]);
  const [selectTab, setSelectTab] = useState('C');
  const [oldMembers, setOldMembers] = useState(oldMemberList || []);

  const addUser = useCallback(member => {
    setMembers(prevState => prevState.concat(member));
  }, []);

  const delUser = useCallback((key, value) => {
    setMembers(prevState => prevState.filter(item => item[key] !== value));
    setOldMembers(prevState => prevState.filter(item => item[key] !== value));
  }, []);

  const checkObj = useMemo(
    () => ({
      name: 'note_',
      onChange(e, userInfo) {
        if (e.target.checked === true) {
          addUser(userInfo);
        } else if (e.target.checked === false) {
          delUser('jobKey', userInfo.jobKey);
        }
      },
      // disabledList: oldMembers,
      disabledList: [],
      disabledKey: 'jobKey',
      checkedList: [...members, ...oldMembers],
      checkedKey: 'jobKey',
      checkedSubKey: 'id',
    }),
    [oldMembers, members],
  );

  const handleChange = useCallback(() => {
    onChange([...members, ...oldMembers]);
    handleClose();
  }, [members, oldMembers]);

  return (
    <div
      key="AddTarget"
      className="Layer-AddUser"
      style={{ height: '100%', minWidth: '400px' }}
    >
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>{covi.getDic('Note_AddNoteTarget', '받는사람 추가')}</p>
        </div>
        <a className="Okbtn" onClick={handleChange}>
          <span className="colortxt-point mr5">
            {members.length + oldMembers.length}
          </span>
          {covi.getDic('Ok', '확인')}
        </a>
      </div>
      <div className="container AddUser">
        <div className="org_select_wrap">
          <ul>
            {members.map((member, idx) => {
              return (
                <li key={idx}>
                  <a
                    className="ui-link"
                    onClick={() => delUser('jobKey', member.jobKey)}
                  >
                    <ProfileBox
                      userId={member.id}
                      img={member.photoPath}
                      presence={member.presence}
                      isInherit={true}
                      userName={member.name}
                      handleClick={false}
                    />
                    <p className="name">{getJobInfo(member)}</p>
                    <span className="del"></span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <ul className="tab">
          <li className={selectTab == 'C' ? 'active' : ''} data-tab="tab1">
            <a
              onClick={() => {
                setSelectTab('C');
              }}
            >
              {covi.getDic('Contact', '내 대화상대')}
            </a>
          </li>
          <li className={selectTab == 'O' ? 'active' : ''} data-tab="tab2">
            <a
              onClick={() => {
                setSelectTab('O');
              }}
            >
              {covi.getDic('OrgChart', '조직도')}
            </a>
          </li>
        </ul>
        <div
          className={['tabcontent', selectTab == 'C' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            <ContactList viewType="checklist" checkObj={checkObj} />
          </div>
        </div>
        <div
          className={['tabcontent', selectTab == 'O' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            <OrgChart viewType="checklist" checkObj={checkObj} />
          </div>
        </div>
      </div>
    </div>
  );
}
