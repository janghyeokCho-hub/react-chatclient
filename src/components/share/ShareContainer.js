import React, {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@C/common/ProfileBox';
import RoomMemberBox from '@C/chat/RoomMemberBox';
import { createRoom } from '@/lib/room';
import { sendMessage, sendChannelMessage, shareFile } from '@/lib/message';
import { rematchingMember, getRooms } from '@/modules/room';
import { getChannels } from '@/modules/channel';
import OrgChart from '@C/orgchart/OrgChart';
import ChatList from './chat/ChatList';
import ChannelList from './channel/ChannelList';
import Config from '@/config/config';
import { isMainWindow } from '@/lib/deviceConnector';
import { getAllUserWithGroupList } from '@/lib/room';
import {
  getJobInfo,
  deleteLayer,
  openPopup,
  clearLayer,
  isJSONStr,
} from '@/lib/common';
import { makeMessage } from './share';

const ShareContainer = ({
  headerName = covi.getDic('Msg_Note_Forward', '전달하기'),
  message,
  context,
  messageType,
}) => {
  const userId = useSelector(({ login }) => login.id);
  const roomList = useSelector(({ room }) => room.rooms);
  const channelList = useSelector(({ channel }) => channel.channels);
  const userInfo = useSelector(({ login }) => login.userInfo);
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const blockUser = useSelector(({ login }) => login.blockList);

  const dispatch = useDispatch();

  const [messageText, setMessageText] = useState('');
  const [members, setMembers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectTab, setSelectTab] = useState('orgchart');

  useLayoutEffect(() => {
    if (DEVICE_TYPE === 'd' && !isMainWindow()) {
      dispatch(getRooms());
      dispatch(
        getChannels({
          userId,
          members: [userId],
        }),
      );
    }
  }, []);

  useLayoutEffect(() => {
    if (messageType === 'message') {
      makeMessage(context).then(result => {
        setMessageText(result);
      });
    } else {
      setMessageText(context || '');
    }
  }, [message]);

  const memberCheckObj = useMemo(
    () => ({
      name: 'invite_',
      onChange: (e, userInfo) => {
        if (e.target.checked) {
          const groups = members.filter(item => item.type === 'G');
          const discord = members.filter(item => item.type !== userInfo.type);
          if (userInfo.type === 'G' && groups?.length) {
            sharePopup({
              msg: covi.getDic(
                'Msg_GroupSelectOne',
                '부서에 대한 그룹채팅은 한 부서만 선택할 수 있습니다.',
              ),
            });
          } else if (discord?.length) {
            sharePopup({
              msg: covi.getDic(
                'Msg_GroupAndUserSelect',
                '부서와 사용자는 동시에 선택할 수 없습니다.',
              ),
            });
          } else {
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
          }
        } else {
          delInviteMember(userInfo.id);
          document
            .getElementsByName('invite_' + userInfo.id)
            .forEach(item => (item.checked = false));
        }
      },
      disabledList: [],
      disabledKey: 'id',
      checkedList: [...members],
      checkedKey: 'id',
    }),
    [members],
  );

  const roomCheckObj = useMemo(
    () => ({
      name: 'invite_',
      onChange: (e, room, filterMember) => {
        if (e.target.checked) {
          if (rooms.length) {
            sharePopup({
              msg: covi.getDic(
                'Msg_SelectOnlyOneChatRoom',
                '대화방은 1개만 선택할 수 있습니다.',
              ),
            });
          } else {
            addInviteRooms({
              roomID: room.roomID,
              roomType: room.roomType,
              realMemberCnt: room.realMemberCnt,
              filterMember: filterMember,
            });
            document
              .getElementsByName('invite_' + room.roomID)
              .forEach(item => (item.checked = true));
          }
        } else {
          delInviteRooms(room.roomID);
          document
            .getElementsByName('invite_' + room.roomID)
            .forEach(item => (item.checked = false));
        }
      },
      disabledKey: 'roomID',
      checkedList: [...rooms],
      checkedKey: 'roomID',
    }),
    [rooms],
  );

  const channelCheckObj = useMemo(
    () => ({
      name: 'invite_',
      onChange: (e, channel, isJoin) => {
        if (e.target.checked) {
          if (channels.length) {
            sharePopup({
              msg: covi.getDic(
                'Msg_SelectOnlyOneChannel',
                '채널은 1개만 선택할 수 있습니다.',
              ),
            });
          } else {
            addInviteChannels({
              roomId: channel.roomId,
              iconPath: channel.iconPath,
              roomType: channel.roomType,
              roomName: channel.roomName,
              isJoin,
            });
            document
              .getElementsByName('invite_' + channel.roomId)
              .forEach(item => (item.checked = true));
          }
        } else {
          delInviteChannels(channel.roomId);
          document
            .getElementsByName('invite_' + channel.roomId)
            .forEach(item => (item.checked = false));
        }
      },
      disabledKey: 'roomId',
      checkedList: [...channels],
      checkedKey: 'roomId',
    }),
    [channels],
  );

  const addInviteMember = useCallback(member => {
    setMembers(prevState => prevState.concat(member));
  }, []);

  const delInviteMember = useCallback(memberId => {
    setMembers(prevState => prevState.filter(item => item.id != memberId));
  }, []);

  const addInviteRooms = useCallback(room => {
    setRooms(prevState => prevState.concat(room));
  }, []);

  const delInviteRooms = useCallback(roomID => {
    setRooms(prevState => prevState.filter(item => item.roomID != roomID));
  }, []);

  const addInviteChannels = useCallback(channel => {
    setChannels(prevState => prevState.concat(channel));
  }, []);

  const delInviteChannels = useCallback(roomId => {
    setChannels(prevState => prevState.filter(item => item.roomId != roomId));
  }, []);

  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, []);

  const handleDelete = useCallback((id, type) => {
    switch (type) {
      case 'member':
        delInviteMember(id);
        break;
      case 'room':
        delInviteRooms(id);
        break;
      case 'channel':
        delInviteChannels(id);
        break;
    }
    document
      .getElementsByName('invite_' + id)
      .forEach(item => (item.checked = false));
  }, []);

  const handleTabChange = useCallback(
    type => {
      if (selectTab === type) {
        return;
      }

      if (type !== 'orgchart') {
        setMembers([]);
      } else if (type !== 'chat') {
        setRooms([]);
      } else if (type !== 'channel') {
        setChannels([]);
      }
      setSelectTab(type);
    },
    [selectTab],
  );

  const sharePopup = ({ status = 'FAIL', msg }) => {
    openPopup(
      {
        type: 'Alert',
        message: msg,
        callback: () => {
          if (status === 'SUCCESS') {
            switch (selectTab) {
              case 'orgchart':
                setMembers([]);
                break;
              case 'chat':
                setRooms([]);
                break;
              case 'channel':
                setChannels([]);
                break;
            }
            clearLayer(dispatch);
          }
        },
      },
      dispatch,
    );
  };

  const handleShare = useCallback(async () => {
    // 선택한 대상이 있는지 확인

    const hasSelectedData = () => {
      switch (selectTab) {
        case 'orgchart':
          return Boolean(members.length);
        case 'chat':
          return Boolean(rooms.length);
        case 'channel':
          return Boolean(channels.length);
        default:
          return false;
      }
    };

    if (!hasSelectedData()) {
      sharePopup({
        msg: covi.getDic('Msg_NoTargetSelected', '선택한 대상이 없습니다.'),
      });
      return;
    }

    let params = await makeParams();
    if (!params) {
      return;
    }

    params.blockList = blockUser || [];

    if (
      params.targetType === 'CHAT' &&
      params.roomType === 'M' &&
      params.realMemberCnt === 1
    ) {
      // sendMessage 하기 전에 RoomType이 M인데 참가자가 자기자신밖에 없는경우 상대를 먼저 초대함.
      dispatch(rematchingMember(params));
    }

    if (messageType === 'message') {
      handleMessage(params);
    } else {
      handleShareFile(params);
    }
  }, [blockUser, selectTab, members, rooms, channels]);

  const handleShareFile = useCallback(
    async params => {
      let fileInfos = isJSONStr(params.fileInfos)
        ? JSON.parse(params.fileInfos)
        : params.fileInfos;
      if (!Array.isArray(fileInfos)) {
        // 단일 파일일 경우 Array 로 변환 후 전송하기 위함
        fileInfos = new Array(fileInfos);
      }
      params.fileInfos = JSON.stringify(fileInfos);

      const formData = new FormData();
      for (const key in params) {
        formData.append(key, params[key]);
      }

      const { data } = await shareFile(formData);
      if (data.state !== 'SUCCESS') {
        sharePopup({
          msg: covi.getDic(
            'Msg_ForwardingWasFailed',
            '전달에 실패 하였습니다.',
          ),
        });
        return;
      }
      params.roomID = data.roomID;
      params.roomType = data.roomType;
      params.fileInfos = JSON.stringify(data.fileInfos);
      // 파일 전송의 경우 서버에서 채팅방 생성 후 파일 업로드까지 진행
      params.targetType =
        params.targetType === 'NEWROOM' ? 'CHAT' : params.targetType;
      params.blockList = blockUser || [];
      handleMessage(params);
    },
    [blockUser],
  );

  const makeParams = useCallback(async () => {
    // type의 정의
    // UR : 유저
    // GR : 부서
    // CR : 채팅방 또는 채널
    let params = {
      name: '',
      messageType: 'N',
      status: 'send',
      type: 'CR',
      message: messageText,
      context: messageText,
      fileInfos: message.fileInfos,
      sendFileInfo: null,
      linkInfo: null,
      sender: userId,
    };

    switch (selectTab) {
      case 'orgchart':
        let inviteMembers = [];
        const groupIds = members
          .filter(item => item.type === 'G')
          .map(item => item.id);
        if (groupIds?.length) {
          // 선택한 부서에 해당되는 유저 ID List
          const { data } = await getAllUserWithGroupList(groupIds);
          const { result, status } = data;

          if (status !== 'SUCCESS') {
            sharePopup({
              msg: covi.getDic(
                'Msg_Error',
                '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
              ),
            });
            return;
          }

          if (status === 'SUCCESS' && !result?.length) {
            // 선택한 부서에 사람이 없을 경우
            sharePopup({
              msg: covi.getDic(
                'Msg_NoUsersDepartment',
                '선택된 부서에 사용자가 없습니다.',
              ),
            });
            return;
          }

          if (result?.length) {
            // 부서를 선택할 경우 type = 'GR'
            params.type = 'GR';
            params.groupCode = groupIds[0];
            inviteMembers = inviteMembers.concat(result);
            inviteMembers = inviteMembers.filter(
              (item, idx) =>
                inviteMembers.findIndex(i => i.id == item.id) === idx,
            );
          }
        }

        inviteMembers = inviteMembers.concat(
          members.filter(item => item.type === 'U' && item.isShow === true),
        );

        // 자기 자신의 ID 추가
        const targetMembers = inviteMembers.map(item => item.id);
        if (!targetMembers.includes(userId)) {
          targetMembers.push(userId);
        }

        if (inviteMembers.length > 1) {
          // 선택한 대상이 2명 이상일 경우 채팅방을 새로 만든다.
          params.targetType = 'NEWROOM';
          params.type = 'UR';
          params.memberType = 'G';
          params.roomType = 'G';
          params.members = targetMembers;
          params.targets = targetMembers.join(';');
        } else {
          const target = roomList.filter(r => {
            if (userId === members[0].id) {
              return r.roomType === 'O';
            } else {
              return r.roomType === 'M' && r.targetCode === members[0].id;
            }
          })[0];

          params.targets = targetMembers.join(';');
          if (target) {
            params.targetType = 'CHAT';
            params = {
              ...params,
              ...target,
            };
          } else {
            params.targetType = 'NEWROOM';
            params.type = 'UR';
            params.roomType = userId === members[0].id ? 'O' : 'M';
            params.members = targetMembers;
          }
        }
        break;
      case 'chat':
        params.roomID = rooms[0].roomID;
        params.roomType = rooms[0].roomType;
        params.realMemberCnt = rooms[0].realMemberCnt;
        params.targetType = 'CHAT';
        break;
      case 'channel':
        params.roomID = channels[0].roomId;
        params.roomType = 'C';
        params.targetArr = [];
        params.tempId = channels[0].roomId * 10000;
        params.targetType = 'CHANNEL';
        break;
    }
    return params;
  }, [dispatch, selectTab, members, rooms, channels]);

  const handleMessage = async params => {
    let response;
    let msg = covi.getDic(
      'Msg_ForwardingWasSuccessful',
      '전달에 성공 하였습니다.',
    );

    switch (params.targetType) {
      case 'CHAT':
        response = await sendMessage(params);
        break;
      case 'CHANNEL':
        response = await sendChannelMessage(params);
        break;
      case 'NEWROOM':
        response = await createRoom(params);
        break;
    }

    const { status } = response.data;

    if (status !== 'SUCCESS') {
      msg = covi.getDic('Msg_ForwardingWasFailed', '전달에 실패 하였습니다.');
    }
    sharePopup({ status, msg });
  };

  const makeRoomName = room => {
    const filterMember = room.filterMember;
    if (room.roomType === 'M' || room.roomType === 'O') {
      return <>{getJobInfo(filterMember[0])}</>;
    } else {
      if (!!room?.roomName) {
        return (
          <>
            <span>{room.roomName}</span>
            {room.roomType !== 'B' && (
              <span className="roomMemberCtn">
                {room.members && `(${room.members.length})`}
              </span>
            )}
          </>
        );
      } else {
        if (room.roomType === 'B') {
          return (
            <>
              <span>{'이음이'}</span>
            </>
          );
        }
      }

      if (!filterMember?.length) {
        return <>{covi.getDic('NoChatMembers', '대화상대없음')}</>;
      }

      return (
        <>
          {filterMember?.length > 1
            ? `${getJobInfo(filterMember[0])} ...`
            : getJobInfo(filterMember[0])}
        </>
      );
    }
  };

  return (
    <div className="Layer-AddUser" style={{ height: '100%' }}>
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>{headerName}</p>
        </div>
        <a className="Okbtn" onClick={handleShare}>
          <span className="colortxt-point mr5">
            {selectTab === 'orgchart' && members.length}
            {selectTab === 'chat' && rooms.length}
            {selectTab === 'channel' && channels.length}
          </span>
          {covi.getDic('Ok', '확인')}
        </a>
      </div>
      <div className="container AddUser">
        <div className="org_select_wrap">
          <ul>
            {(selectTab === 'chat' &&
              rooms &&
              rooms.map(room => {
                return (
                  <li key={'invite_' + room.roomID}>
                    <a
                      className="ui-link"
                      onClick={() => {
                        handleDelete(room.roomID, 'room');
                      }}
                    >
                      {((room.roomType === 'M' ||
                        room.filterMember.length === 1) &&
                        ((room.roomType === 'A' && (
                          <ProfileBox
                            userId={room.filterMember[0].id}
                            userName={room.filterMember[0].name}
                            presence={null}
                            isInherit={false}
                            img={room.filterMember[0].photoPath}
                            handleClick={false}
                          />
                        )) || (
                          <ProfileBox
                            userId={room.filterMember[0].id}
                            userName={room.filterMember[0].name}
                            isInherit={true}
                            img={room.filterMember[0].photoPath}
                          />
                        ))) ||
                        (room.roomType !== 'B' && (
                          <RoomMemberBox
                            type="G"
                            data={room.filterMember}
                            floatStyle="none"
                          ></RoomMemberBox>
                        ))}
                      <span className="name">{makeRoomName(room)}</span>
                      <span className="del"></span>
                    </a>
                  </li>
                );
              })) ||
              (selectTab === 'channel' &&
                channels &&
                channels.map(channel => {
                  return (
                    <li key={'invite_' + channel.roomId}>
                      <a
                        className="ui-link"
                        onClick={() => {
                          handleDelete(channel.roomId, 'channel');
                        }}
                      >
                        <div
                          className={
                            channel.isJoin && channel.openType !== 'O'
                              ? ['profile-photo', 'private-img'].join(' ')
                              : 'profile-photo'
                          }
                        >
                          {(!channel.isJoin ||
                            (channel.isJoin && channel.openType === 'O')) &&
                            (channel.iconPath ? (
                              <img
                                src={`${Config.ServerURL.HOST}${channel.iconPath}`}
                                onError={e => {
                                  e.target.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
                                  e.target.onerror = null;
                                }}
                              ></img>
                            ) : (
                              <div className="spare-text">
                                {(channel.roomName && channel.roomName[0]) ||
                                  'N'}
                              </div>
                            ))}
                        </div>
                        {channel.openType !== 'O' && (
                          <span className="private" />
                        )}
                        <span className="name">
                          {channel.roomName === ''
                            ? covi.getDic('NoTitle', '제목없음')
                            : channel.roomName}
                        </span>
                        <span className="del"></span>
                      </a>
                    </li>
                  );
                })) ||
              (members &&
                members.map(member => {
                  if (member.isShow) {
                    return (
                      <li key={'invite_' + member.id}>
                        <a
                          className="ui-link"
                          onClick={() => {
                            handleDelete(member.id, 'member');
                          }}
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
                  }
                }))}
          </ul>
        </div>
        <ul className="tab">
          <li
            className={selectTab === 'orgchart' ? 'active' : ''}
            data-tab="tab2"
          >
            <a
              onClick={() => {
                handleTabChange('orgchart');
              }}
            >
              {covi.getDic('OrgChart', '조직도')}
            </a>
          </li>
          <li className={selectTab === 'chat' ? 'active' : ''} data-tab="tab3">
            <a
              onClick={() => {
                handleTabChange('chat');
              }}
            >
              {covi.getDic('Chat', '채팅방')}
            </a>
          </li>
          <li
            className={selectTab === 'channel' ? 'active' : ''}
            data-tab="tab4"
          >
            <a
              onClick={() => {
                handleTabChange('channel');
              }}
            >
              {covi.getDic('Channel', '채널')}
            </a>
          </li>
        </ul>
        <div
          className={[
            'tabcontent',
            selectTab === 'orgchart' ? 'active' : '',
          ].join(' ')}
        >
          <div className="AddUserCon">
            <OrgChart viewType="checklist" checkObj={memberCheckObj} />
          </div>
        </div>
        <div
          className={['tabcontent', selectTab === 'chat' ? 'active' : ''].join(
            ' ',
          )}
        >
          <div className="AddUserCon">
            <ChatList
              roomList={roomList}
              checkObj={roomCheckObj}
              chineseWall={chineseWall}
              myInfo={userInfo}
            />
          </div>
        </div>
        <div
          className={[
            'tabcontent',
            selectTab === 'channel' ? 'active' : '',
          ].join(' ')}
        >
          <div className="AddUserCon">
            <ChannelList
              channels={channelList}
              checkObj={channelCheckObj}
              chineseWall={chineseWall}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareContainer;
