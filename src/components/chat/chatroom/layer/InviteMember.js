import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@C/common/ProfileBox';
import { inviteMember, makeRoomView, openRoom } from '@/modules/room';
import ContactList from '@C/contact/ContactList';
import { deleteLayer, clearLayer, openPopup, getJobInfo } from '@/lib/common';
import OrgChart from '@C/orgchart/OrgChart';
import { format } from 'date-fns';
import { makeChatRoom } from '@/lib/deviceConnector';
import { getAllUserWithGroupList } from '@/lib/room';
import { openChatRoomView } from '@/lib/roomUtil';
import { getDictionary, getSysMsgFormatStr } from '@/lib/common';
import { isBlockCheck } from '@/lib/orgchart';

const InviteMember = ({
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

  const currentRoom = useSelector(({ room }) => room.currentRoom);
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const userInfo = useSelector(({ login }) => login.userInfo);
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
      if (currentRoom?.members) {
        setOldMembers(currentRoom.members);
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
                message: covi.getDic(
                  'Msg_GroupInviteError',
                  '해당 그룹은 그룹채팅을 시작할 수 없습니다.',
                ),
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
                if (curr?.name) {
                  acc = acc + getDictionary(curr.name) + ', ';
                }
                return acc;
              }, '');

              dupListTxt = dupListTxt.substring(0, dupListTxt.length - 2);

              openPopup(
                {
                  type: 'Alert',
                  message: getSysMsgFormatStr(
                    covi.getDic(
                      'Tmp_exceptExistMember',
                      '%s은 이미 추가된 사용자이므로 제외하고 진행합니다.',
                    ),
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
                message: covi.getDic(
                  'Msg_ExceptExistEmpty',
                  '이미 초대된 사용자는 제외하여, 초대될 사용자가 없습니다.',
                ),
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
          message: covi.getDic(
            'Msg_InviteMemberError',
            '초대할 대상을 선택해주세요.',
          ),
        },
        dispatch,
      );
    }
  };

  const handleAddBtnCallback = inviteMembers => {
    if (
      roomType == 'M' ||
      roomType == 'O' ||
      (isNewRoom && inviteMembers.length > 2)
    ) {
      const makeInfo = {
        roomName: '',
        roomType: 'G',
        members: inviteMembers,
        memberType: 'G',
      };

      const makeData = {
        newRoom: true,
        makeInfo: makeInfo,
      };

      if (viewType == 'S') {
        const winName = `wmr_${format(new Date(), 'yyyyMMddHHmmss')}`;
        const openURL = `${DEVICE_TYPE == 'd' ? '#' : ''}/client/nw/makeroom`;
        makeChatRoom(winName, makeData, openURL);
      } else {
        dispatch(openRoom(makeData));
        dispatch(makeRoomView(makeInfo));
      }
    } else if (isNewRoom && inviteMembers.length == 2) {
      const targetInfo = inviteMembers.filter(item => item.id !== myInfo.id)[0];
      const { blockChat, blockFile } = isBlockCheck({
        targetInfo,
        chineseWall,
      });
      if (blockChat && blockFile) {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_BlockTarget', '차단된 대상입니다.'),
          },
          dispatch,
        );
      } else {
        openChatRoomView(
          dispatch,
          viewType,
          rooms,
          selectId,
          inviteMembers.find(item => item.id != myInfo.id),
          myInfo,
        );
      }
    } else {
      const params = {
        roomID: roomId,
        members: inviteMembers.map(item => item.id),
      };
      dispatch(inviteMember(params));
    }

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
          <span className="colortxt-point mr5">
            {roomType == 'M' || isNewRoom
              ? members.length - oldMembers.length
              : members.length}
          </span>
          {covi.getDic('Ok', '확인')}
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
          {userInfo?.isExtUser !== 'Y' && (
            <li className={selectTab == 'O' ? 'active' : ''} data-tab="tab2">
              <a
                onClick={() => {
                  setSelectTab('O');
                }}
              >
                {covi.getDic('OrgChart', '조직도')}
              </a>
            </li>
          )}
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

export default InviteMember;
