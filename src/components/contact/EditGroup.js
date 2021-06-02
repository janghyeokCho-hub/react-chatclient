import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@C/common/ProfileBox';
import { inviteMember, makeRoomView, openRoom } from '@/modules/room';
import ContactList from '@C/contact/ContactList';
import { deleteLayer, clearLayer, openPopup, getJobInfo } from '@/lib/common';
import OrgChart from '@C/orgchart/OrgChart';
import { format } from 'date-fns';
import { makeChatRoom } from '@/lib/deviceConnector';
import { getAllUserWithGroup, getAllUserWithGroupList } from '@/lib/room';
import { openChatRoomView } from '@/lib/roomUtil';
import { getSysMsgFormatStr } from '@/lib/common';

const EditGroup = ({
  headerName,
  roomId,
  roomType,
  isNewRoom,
  oldMemberList,
}) => {
  const { viewType, rooms, selectId, myInfo } = useSelector(
    ({ room, login }) => ({
      viewType: room.viewType,
      rooms: room.rooms,
      selectId: room.selectId,
      myInfo: login.userInfo,
    }),
  );
  const [members, setMembers] = useState([]);
  const [selectTab, setSelectTab] = useState('C');
  const [oldMembers, setOldMembers] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (oldMemberList) {
      setOldMembers(oldMemberList);
      if (roomType == 'M' || roomType == 'O' || isNewRoom)
        oldMemberList.forEach(item => {
          addInviteMember({
            ...item,
            type: 'U',
            isShow: false,
          });
        });
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
                message: covi.getDic('Msg_GroupInviteError'),
              },
              dispatch,
            );
          }
        } else {
          delInviteMember(userInfo.id);
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
    let inviteMembers = [];

    if (members.find(item => item.isShow == true) != undefined) {
      inviteMembers = inviteMembers.concat(
        members.filter(item => item.type == 'U'),
      );

      let dupList = [];
      const groupIds = members
        .filter(item => item.type == 'G')
        .map(item => item.id);
      if (groupIds.length > 0) {
        getAllUserWithGroupList(groupIds).then(({ data }) => {
          if (data.result && data.result.length > 0) {
            inviteMembers = inviteMembers.concat(data.result);

            inviteMembers = inviteMembers.filter(
              (item, idx) =>
                inviteMembers.findIndex(i => i.id == item.id) == idx,
            );

            if (roomType == 'G' && !isNewRoom) {
              dupList = inviteMembers.filter(
                (item, idx) =>
                  oldMemberList.find(i => i.id == item.id) !== undefined,
              );

              inviteMembers = inviteMembers.filter(
                (item, idx) =>
                  oldMemberList.find(i => i.id == item.id) == undefined,
              );
            }
          }

          if (inviteMembers.length > 0) {
            if (dupList.length > 0) {
              let dupListTxt = dupList.reduce((acc, curr) => {
                acc = acc + curr.name + ', ';
                return acc;
              }, '');

              dupListTxt = dupListTxt.substring(0, dupListTxt.length - 2);

              openPopup(
                {
                  type: 'Alert',
                  message: getSysMsgFormatStr(
                    covi.getDic('Tmp_exceptExistMember'),
                    [{ type: 'Plain', data: dupListTxt }],
                  ),
                  callback: () => {
                    handleAddBtnCallback(inviteMembers);
                  },
                },
                dispatch,
              );
            } else {
              handleAddBtnCallback(inviteMembers);
            }
          } else
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
                    onChange={e => setName(e.target.value)}
                />
                <div className="ChgBtn" >변경</div>
              </div>
            </div>
        </div>
        <ul className="tab">
          <li className={selectTab == 'C' ? 'active' : ''} data-tab="tab1">
            <a
              onClick={() => {
                setSelectTab('C');
              }}
            >
              {covi.getDic('그룹멤버')}
            </a>
          </li>
          <li className={selectTab == 'O' ? 'active' : ''} data-tab="tab2">
            <a
              onClick={() => {
                setSelectTab('O');
              }}
            >
              {covi.getDic('그룹원 추가')}
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
};

export default EditGroup;
