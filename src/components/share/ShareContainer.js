import React, { useState, useCallback, useLayoutEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@C/common/ProfileBox';
import RoomMemberBox from '@C/chat/RoomMemberBox';
import {
  deleteLayer,
  clearLayer,
  openPopup,
  getJobInfo,
  eumTalkRegularExp,
  convertEumTalkProtocolPreviewForChannelItem,
} from '@/lib/common';
import { createRoom } from '@/lib/room';
import { sendMessage, sendChannelMessage } from '@/lib/message';
import { rematchingMember, getRooms } from '@/modules/room';
import { getChannels } from '@/modules/channel';
import OrgChart from '@C/orgchart/OrgChart';
import ChatList from './chat/ChatList';
import ChannelList from './channel/ChannelList';
import Config from '@/config/config';
import { isMainWindow } from '@/lib/deviceConnector';
import { getAllUserWithGroupList } from '@/lib/room';

const makeMessage = async msg => {
  const flag = eumTalkRegularExp.test(msg);
  if (flag) {
    const convertedMessage = await convertEumTalkProtocolPreviewForChannelItem(
      msg,
    );
    if (!convertedMessage?.message) {
      return msg;
    }
    return convertedMessage.message;
  } else {
    return msg;
  }
};

const ShareContainer = ({
  headerName = covi.getDic('Msg_Note_Forward'),
  message,
}) => {
  const dispatch = useDispatch();

  const [messageText, setMessageText] = useState('');
  const [members, setMembers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectTab, setSelectTab] = useState('orgchart');

  const userId = useSelector(({ login }) => login.id);
  const roomList = useSelector(({ room }) => room.rooms);
  const channelList = useSelector(({ channel }) => channel.channels);

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
    makeMessage(message).then(result => {
      setMessageText(result);
    });
  }, [message]);

  const memberCheckObj = useMemo(
    () => ({
      name: 'invite_',
      onChange: (e, userInfo) => {
        if (e.target.checked) {
          const groups = members.filter(item => item.type === 'G');
          const discord = members.filter(item => item.type !== userInfo.type);
          if (userInfo.type === 'G' && groups?.length) {
            sharePopup({ msg: covi.getDic('Msg_GroupSelectOne') });
          } else if (discord?.length) {
            sharePopup({ msg: covi.getDic('Msg_GroupAndUserSelect') });
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
          if (rooms.length)
            sharePopup({ msg: covi.getDic('Msg_SelectOnlyOneChatRoom') });
          else {
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
          if (channels.length)
            sharePopup({ msg: covi.getDic('Msg_SelectOnlyOneChannel') });
          else {
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

  const makeRoomName = useCallback(room => {
    const filterMember = room.filterMember;
    if (room.roomType === 'M' || room.roomType === 'O')
      return <>{getJobInfo(filterMember[0])}</>;
    else {
      if (room.roomName && room.roomName !== '') {
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

      if (!filterMember.length) return <>{covi.getDic('NoChatMembers')}</>;

      return (
        <>
          {filterMember.length > 1
            ? `${getJobInfo(filterMember[0])} ...`
            : getJobInfo(filterMember[0])}
        </>
      );
    }
  }, []);

  const handleTabChange = useCallback(
    type => {
      if (selectTab === type) return;
      if (type !== 'orgchart') setMembers([]);
      else if (type !== 'chat') setRooms([]);
      else if (type !== 'channel') setChannels([]);
      setSelectTab(type);
    },
    [selectTab],
  );

  const sharePopup = ({ status = 'FAIL', tit, msg }) => {
    openPopup(
      {
        type: 'Alert',
        title: tit,
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

  const handleShare = useCallback(() => {
    let target;
    let shareData;
    const failPopup = {
      tit: covi.getDic('Msg_ForwardingFail'),
      msg: covi.getDic('Msg_NoTargetSelected'),
    };
    switch (selectTab) {
      case 'orgchart':
        if (members.length) {
          // 선택한 대상이 2명 이상일 경우 채팅방을 새로 만든다.
          let inviteMembers = [];
          if (members.length > 1) {
            if (members.find(item => item.isShow === true) !== undefined) {
              inviteMembers = inviteMembers.concat(
                members.filter(item => item.type === 'U'),
              );
              const shareMembers = inviteMembers.map(item => item.id);
              shareMembers.push(userId);
              shareData = {
                name: '',
                roomType: 'G',
                message: messageText,
                members: shareMembers,
                memberType: 'G',
                sendFileInfo: null,
                linkInfo: null,
                messageType: 'N',
                targetType: 'NEWROOM',
              };

              handleMessage({ shareData });
            }
          } else {
            const groupIds = members
              .filter(item => item.type === 'G')
              .map(item => item.id);
            if (groupIds.length > 0) {
              getAllUserWithGroupList(groupIds).then(({ data }) => {
                if (data.result && data.result.length) {
                  inviteMembers = inviteMembers.concat(data.result);
                  inviteMembers = inviteMembers.filter(
                    (item, idx) =>
                      inviteMembers.findIndex(i => i.id == item.id) === idx,
                  );
                }

                if (inviteMembers.length) {
                  const shareMembers = inviteMembers.map(item => item.id);
                  shareMembers.push(userId);
                  shareData = {
                    name: '',
                    roomType: 'G',
                    message: messageText,
                    members: shareMembers,
                    memberType: 'G',
                    sendFileInfo: null,
                    linkInfo: null,
                    messageType: 'N',
                    targetType: 'NEWROOM',
                  };

                  handleMessage({ shareData });
                }
              });
            } else {
              target = roomList.filter(
                r => r.roomType === 'M' && r.targetCode === members[0].id,
              )[0];

              // 1:1 대화방이 존재하는지 확인하고 없을 경우 새로 만든다.
              if (target) {
                shareData = {
                  roomID: target.roomID,
                  roomType: target.roomType,
                  context: messageText,
                  realMemberCnt: target.realMemberCnt,
                  targetType: 'CHAT',
                  messageType: 'N',
                  status: 'send',
                };
                // sendMessage 하기 전에 RoomType이 M인데 참가자가 자기자신밖에 없는경우 상대를 먼저 초대함.
                if (target.roomType === 'M' && target.realMemberCnt === 1) {
                  dispatch(rematchingMember(shareData));
                }
                handleMessage({ shareData });
              } else {
                const shareMembers = members.map(item => item.id);
                shareMembers.push(userId);
                shareData = {
                  name: '',
                  roomType: 'M',
                  message: messageText,
                  members: shareMembers,
                  sendFileInfo: null,
                  linkInfo: null,
                  messageType: 'N',
                  targetType: 'NEWROOM',
                };
                handleMessage({ shareData });
              }
            }
          }
        } else sharePopup(failPopup);

        break;
      case 'chat':
        if (rooms.length) {
          target = rooms[0];
          shareData = {
            roomID: target.roomID,
            roomType: target.roomType,
            realMemberCnt: target.realMemberCnt,
            context: messageText,
            targetType: 'CHAT',
            messageType: 'N',
            status: 'send',
          };
          handleMessage({ shareData });
        } else sharePopup(failPopup);

        break;
      case 'channel':
        if (channels.length) {
          target = channels[0];
          shareData = {
            roomID: target.roomId,
            roomType: 'C',
            context: messageText,
            sender: userId,
            targetArr: [],
            tempId: target.roomId * 10000,
            targetType: 'CHANNEL',
            messageType: 'N',
            status: 'send',
          };
          handleMessage({ shareData });
        } else sharePopup(failPopup);

        break;
    }
  }, [dispatch, selectTab, members, rooms, channels]);

  const handleMessage = async ({ shareData }) => {
    let result;
    let tit = covi.getDic('Msg_ForwardingSuccess');
    let msg = covi.getDic('Msg_ForwardingWasSuccessful');

    switch (shareData.targetType) {
      case 'CHAT':
        result = await sendMessage(shareData);
        break;
      case 'CHANNEL':
        result = await sendChannelMessage(shareData);
        break;
      case 'NEWROOM':
        result = await createRoom(shareData);
        break;
      default:
    }

    if (result?.data?.status === 'ERROR') {
      tit = covi.getDic('Msg_ForwardingFail');
      msg = covi.getDic('Msg_ForwardingWasFailed');
    }
    sharePopup({ status: result?.data?.status, tit, msg });
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
          {covi.getDic('Ok')}
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
                        room.filterMember.length == 1) &&
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
                        (room.roomType != 'B' && (
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
                            channel.isJoin && channel.openType != 'O'
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
                            ? covi.getDic('NoTitle')
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
              {covi.getDic('OrgChart')}
            </a>
          </li>
          <li className={selectTab === 'chat' ? 'active' : ''} data-tab="tab3">
            <a
              onClick={() => {
                handleTabChange('chat');
              }}
            >
              {covi.getDic('Chat')}
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
              {covi.getDic('Channel')}
            </a>
          </li>
        </ul>
        <div
          className={[
            'tabcontent',
            selectTab == 'orgchart' ? 'active' : '',
          ].join(' ')}
        >
          <div className="AddUserCon">
            <OrgChart viewType="checklist" checkObj={memberCheckObj} />
          </div>
        </div>
        <div
          className={['tabcontent', selectTab == 'chat' ? 'active' : ''].join(
            ' ',
          )}
        >
          <div className="AddUserCon">
            <ChatList roomList={roomList} checkObj={roomCheckObj} />
          </div>
        </div>
        <div
          className={[
            'tabcontent',
            selectTab == 'channel' ? 'active' : '',
          ].join(' ')}
        >
          <div className="AddUserCon">
            <ChannelList channels={channelList} checkObj={channelCheckObj} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareContainer;
