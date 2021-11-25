import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@C/common/ProfileBox';
import { inviteMember } from '@/modules/channel';
import ContactList from '@C/contact/ContactList';
import { deleteLayer, clearLayer, openPopup, getJobInfo, getDictionary, getSysMsgFormatStr } from '@/lib/common';
import OrgChart from '@C/orgchart/OrgChart';
import { getAllUserWithGroup } from '@/lib/room';
import ExternalUserList from '@C/externaluserlist/ExternalUserList';

const InviteMember = ({
  headerName,
  roomId,
  openType,
  isNewRoom, // false
  oldMemberList,
}) => {
  const { channels, selectId, myInfo } = useSelector(({ channel, login }) => ({
    channels: channel.channels,
    selectId: channel.selectId,
    myInfo: login.userInfo,
  }));
  const [members, setMembers] = useState([]);
  const [selectTab, setSelectTab] = useState('C');
  const [oldMembers, setOldMembers] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (oldMemberList) {
      setOldMembers(oldMemberList);
    } else {
      setOldMembers([
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
      addInviteMember({
        id: myInfo.id,
        name: myInfo.name,
        presence: myInfo.presence,
        photoPath: myInfo.photoPath,
        PN: myInfo.PN,
        LN: myInfo.LN,
        TN: myInfo.TN,
        dept: myInfo.dept,
        type: 'U',
      });
    }
  }, []);

  const checkObj = useMemo(
    () => ({
      name: 'invite_',
      onChange: (e, userInfo) => {
        if (e.target.checked) {
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

          document
            .getElementsByName('invite_' + userInfo.id)
            .forEach(item => (item.checked = true));
        } else {
          delInviteMember(userInfo.id);
          document
            .getElementsByName('invite_' + userInfo.id)
            .forEach(item => (item.checked = false));
        }
      },
      disabledList: oldMembers,
      disabledKey: 'id',
      checkedList: [...members, ...oldMembers],
      checkedKey: 'id',
    }),
    [oldMembers, members],
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

  const handleDelete = useCallback(userId => {
    delInviteMember(userId);
    document
      .getElementsByName('invite_' + userId)
      .forEach(item => (item.checked = false));
  }, []);

  const handleAddBtn = () => {
    if (members.find(item => item.isShow == true) !== undefined) {
      const groupItems = [];
      const inviteMembers = [];
      /*
      const groupItem = members.find(item => item.type == 'G');
      if (groupItem != undefined) {
        getAllUserWithGroup(groupItem.id).then(({ data }) => {
          inviteMembers = inviteMembers.concat(data.result);
          handleAddBtnCallback(inviteMembers);
        });
      } else {
        members.forEach(item => {
          inviteMembers.push(item);
        });
        handleAddBtnCallback(inviteMembers);
      } */
      members.map(item => {
        if (item.type == 'G') groupItems.push(item);
        else inviteMembers.push(item);
      });

      // 부서 대상 초대요청 처리
      if (groupItems.length > 0) {
        groupItems.map((groupItem, idx) => {
          getAllUserWithGroup(groupItem.id).then(({ data }) => {
            if (Array.isArray(data?.result) === true) {
              const dupList = [];
              const targetList = [];
              if (!isNewRoom) {
                for (const target of data.result) {
                  // 부서 사용자를 조회하여 기존의 채널 멤버와 중복여부 식별
                  if (oldMemberList.find(m => m.id === target.id)) {
                    dupList.push(target);
                  } else {
                    targetList.push(target);
                  }
                }
              }
              inviteMembers.push(...targetList);

              if (targetList.length > 0) {
                if (dupList.length > 0) {
                  const dupListTxt = [];
                  for (const duplicatedUser of dupList) {
                    duplicatedUser?.name &&
                      dupListTxt.push(getDictionary(duplicatedUser.name));
                  }
                  // 중복으로 제외된 유저목록 팝업으로 안내 && 부서초대 진행
                  openPopup(
                    {
                      type: 'Alert',
                      message: getSysMsgFormatStr(
                        covi.getDic('Tmp_exceptExistMember'),
                        [{ type: 'Plain', data: dupListTxt.join(', ') }],
                      ),
                      callback() {
                        handleAddBtnCallback(inviteMembers);
                      },
                    },
                    dispatch,
                  );
                } else {
                  handleAddBtnCallback(inviteMembers);
                }
              } else {
                // 중복제거 후 초대 대상이 0명인 경우 - 초대요청을 중단하고 팝업 안내
                openPopup(
                  {
                    type: 'Alert',
                    message: covi.getDic('Msg_ExceptExistEmpty'),
                    callback: () => {
                      handleClose();
                    },
                  },
                  dispatch,
                );
              }
            }
          });
        });
      } else {
        handleAddBtnCallback(inviteMembers);
      }
    } else {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_InviteMemberError'),
        },
        dispatch,
      );
    }
  };

  const handleAddBtnCallback = inviteMembers => {
    // openType 공개채널
    const data = {
      roomId,
      members: inviteMembers,
    };
    dispatch(inviteMember(data));
    clearLayer(dispatch);
  };

  return (
    <div className="Layer-AddUser" style={{ height: '100%' }}>
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>{headerName}</p>
        </div>
        <a className="Okbtn" onClick={handleAddBtn}>
          <span className="colortxt-point mr5">{members.length}</span>
          {covi.getDic('Ok')}
        </a>
      </div>
      <div className="container AddUser">
        <div className="org_select_wrap">
          <ul>
            {members &&
              members.map(item => {
                if (item.isShow) {
                  return (
                    <li key={'invite_' + item.id}>
                      <a
                        className="ui-link"
                        onClick={() => {
                          handleDelete(item.id);
                        }}
                      >
                        <ProfileBox
                          userId={item.id}
                          img={item.photoPath}
                          presence={item.presence}
                          isInherit={true}
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
        <ul className="tab">
          <li className={selectTab == 'C' ? 'active' : ''} data-tab="tab1">
            <a
              onClick={() => {
                setSelectTab('C');
              }}
            >
              {covi.getDic('Contact')}
            </a>
          </li>
          <li className={selectTab == 'O' ? 'active' : ''} data-tab="tab2">
            <a
              onClick={() => {
                setSelectTab('O');
              }}
            >
              {covi.getDic('OrgChart')}
            </a>
          </li>
          {/*<li className={selectTab == 'E' ? 'active' : ''} data-tab="tab3">
            <a
              onClick={() => {
                setSelectTab('E');
              }}
            >
              외부사용자
            </a>
            </li>*/}
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
        {/*<div
          className={['tabcontent', selectTab == 'E' ? 'active' : ''].join(' ')}
        >
          <div className="AddUserCon">
            <ExternalUserList />
          </div>
        </div>*/}
      </div>
    </div>
  );
};

export default InviteMember;
