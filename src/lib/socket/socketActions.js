import produce from 'immer';

import {
  receiveMessage,
  roomInviteMessageAdd,
  roomLeaveMessageAdd,
  messageReadCountChanged,
  setMessageLinkInfo,
  roomLeaveOtherDevice,
  roomLeaveTargetUser,
  messageReadOtherDevice,
} from '@/modules/room';

import {
  receiveMessage as receiveChannelMessage,
  receiveDeletedMessage as receiveDeletedChannelMessage,
  receiveNotice as receiveChannelNotice,
  receiveDeletedNotice as receiveDeletedChannelNotice,
  channelInviteMessageAdd,
  channelLeaveMessageAdd,
  channelClosure,
  receiveDeletedNotice,
  resetUnreadCount,
  channelLeaveOtherDevice,
  changeChannelAuth,
} from '@/modules/channel';

import { setUsersPresence, addFixedUsers } from '@/modules/presence';
const { closeSocket } = require(`@/lib/socket/socketConnect.${DEVICE_TYPE}`);
import { logout, changeSocketConnect } from '@/modules/login';
import * as common from '@/lib/common';
import * as deviceConnector from '@/lib/deviceConnector';
import { getDictionary, getJobInfo } from '@/lib/common';
import { clearUserData } from '@/lib/util/localStorageUtil';

// 새메시지 도착
export const handleNewMessage = (dispatch, userInfo) => {
  return data => {
    const json_data = JSON.parse(data);
    json_data.senderInfo = JSON.parse(json_data.senderInfo);
    // if (json_data.context.includes('"context":')) {
    //   let text = JSON.parse(json_data.context);
    //   text = JSON.stringify(text.context);
    //   text = text.replace(/\"/gi, '');
    //   json_data.context = text;
    // }

    if (json_data.sender == userInfo.id) json_data.isMine = 'Y';
    json_data.isNotice = false;

    // browser mode만 직접 알림 발송
    if (json_data.isMine != 'Y' && DEVICE_TYPE == 'b') {
      if (Notification.permission === 'granted') {
        if (localStorage.getItem('check_notification') == 'true') {
          const notification = new Notification(covi.getDic('NewMessage'), {
            icon: '',
            body: `${getJobInfo(json_data.senderInfo)} : ${json_data.context}`,
          });

          setTimeout(notification.close.bind(notification), 2000);
        }
      } else {
        Notification.requestPermission();
      }
    }

    // dispatch(roomMessageAdd(json_data));
    dispatch(receiveMessage(json_data));
  };
};

// 쪽지 도착
export const handleNewNoteMessage = (dispatch, userInfo, setNoteList) => {
  return data => {
    try {
      const json_data = JSON.parse(data);
      console.log('Note Received   ', json_data);

      // Noti 알림 표기용 데이터
      const senderInfo = {
        id: json_data.userId,
        name: json_data.multiDisplayName,
        photoPath: json_data.photoPath,
        deptName: json_data.multiDeptName,
        LN: json_data.multiJobLevelName,
        PN: json_data.multiJobPositionName,
        TN: json_data.multiJobTitleName
      };

      if (DEVICE_TYPE === 'b') {
        // 브라우저 noti
        if (Notification.permission !== 'granted') {
          Notification.requestPermission();
          return;
        }
        const notification = new Notification(covi.getDic('NewNoteMessage', '새 쪽지'), {
          icon: '',
          body: `${covi.getDic('NewNoteMessage', '새 쪽지')}: ${getJobInfo(senderInfo)}`
        });
        setTimeout(notification.close.bind(notification), 2000);
      } else if (DEVICE_TYPE === 'd') {
        // PC noti
      }

      setNoteList((prevState) => {
        // 쪽지 리스트에 추가할 데이터 (쪽지 조회시 sender 구조와 동일해야 함)
        const receivedInfo = {
          noteId: json_data.noteId,
          senderUserId: json_data.userId,
          senderDisplayName: json_data.multiDisplayName,
          senderJobPositionName: json_data.multiJobPositionName,
          senderPhotoPath: json_data.photoPath,
          senderPresence: json_data.state,
          fileFlag: json_data.fileFlag,
          subject: json_data.subject,
          sendDate: Date.now(),
          readFlag: 'N',  //새로 발송된 쪽지는 기본적으로 읽지 않은 상태임
          favorites: '2', //새로 발송된 쪽지는 기본적으로 즐겨찾기되어 있지 않음
        };

        if(typeof prevState === 'undefined') {
          return [receivedInfo];
        }
        return produce(prevState, draft => {
          const insertPoint = prevState.findIndex(i => i.favorites === '2');
          draft?.splice(insertPoint, 0, receivedInfo);
        });
      }, false);
    } catch (err) {
      console.log('Note Error   ', err);
    }
  };
};

export const handleChatRoomInvite = dispatch => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);

    dispatch(roomInviteMessageAdd(json_data));

    const members = json_data.inviteMember.map(item => {
      return { id: item.id, presence: item.presense };
    });
    dispatch(addFixedUsers(members));
  };
};

export const handleChatRoomExit = (dispatch, userInfo) => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);

    if (userInfo.id == json_data.leaveMember) {
      // 다른기기에서 자기자신이 퇴장한 경우 store에서 삭제함
      dispatch(roomLeaveOtherDevice(json_data));
    } else {
      if (json_data.roomType != 'M') {
        // 다른 사용자가 퇴장한 경우 퇴장 메시지 추가
        dispatch(roomLeaveMessageAdd(json_data));
      } else {
        // 개인채팅방에서 target 사용자가 퇴장한 경우 store 업데이트
        dispatch(roomLeaveTargetUser(json_data));
      }
    }
  };
};

export const handleReadCountChanged = (dispatch, userInfo) => {
  return data => {
    // browser 버전에서는 current room에 대한 처리만 있음.
    const json_data = JSON.parse(data);

    if (json_data.reader == userInfo.id) {
      json_data.isMine = 'Y';
    } else {
      json_data.isMine = 'N';
    }

    // 차후 삭제 필요
    console.dir(json_data);

    dispatch(messageReadCountChanged(json_data));

    json_data.isMine == 'Y' && dispatch(messageReadOtherDevice(json_data));
  };
};

export const handleReadChannel = dispatch => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);

    dispatch(resetUnreadCount(json_data.roomID));
  };
};

export const handlePresenceChanged = dispatch => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);

    dispatch(setUsersPresence(json_data));
  };
};

export const handleNewLinkThumbnail = dispatch => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);

    dispatch(setMessageLinkInfo(json_data));
  };
};

export const handleForceToLogout = dispatch => {
  return data => {
    const json_data = JSON.parse(data);
    // 차후 삭제 필요
    console.dir(json_data);

    if (DEVICE_TYPE == 'd') {
      // 연결끊기
      clearUserData();

      if (deviceConnector.isMainWindow()) {
        deviceConnector.closeAllChildWindow();
      }

      common.openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_LoginOtherDevice'),
          callback: () => {
            if (deviceConnector.isMainWindow()) {
              location.reload();
            } else {
              deviceConnector.closeWindow();
            }
          },
        },
        dispatch,
      );
    } else {
      closeSocket(true);
      clearUserData();

      common.openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_LoginOtherDevice'),
          callback: () => {
            dispatch(logout());
          },
        },
        dispatch,
      );
    }
  };
};

export const handleConnect = dispatch => {
  return data => {
    console.log('socket connect & token auth success');
    dispatch(changeSocketConnect('CC'));
  };
};

export const handleDisconnect = dispatch => {
  return data => {
    console.log('socket disconnected');
    dispatch(changeSocketConnect('DC'));
  };
};

// 채널 폐쇄
export const handleChannelClosure = dispatch => {
  return data => {
    const json_data = JSON.parse(data);

    console.dir(json_data);

    json_data.senderInfo = 'ccn';

    dispatch(receiveChannelMessage(json_data));

    dispatch(channelClosure(json_data));
  };
};

// 채널
export const handleNewChannelMessage = (dispatch, userInfo) => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);

    json_data.senderInfo = JSON.parse(json_data.senderInfo);

    if (json_data.sender == userInfo.id) json_data.isMine = 'Y';

    // browser mode만 직접 알림 발송
    if (json_data.isMine != 'Y' && DEVICE_TYPE == 'b') {
      if (Notification.permission === 'granted') {
        if (localStorage.getItem('check_notification') == 'true') {
          /*
          const notification = new Notification('새 메세지', {
            icon: '',
            body: `${json_data.senderInfo.Name} ${json_data.senderInfo.JobPosition} : ${json_data.context}`,
          });

          setTimeout(notification.close.bind(notification), 2000);
           */
          if (json_data.context) {
            let returnText = json_data.context;

            if (common.eumTalkRegularExp.test(returnText)) {
              common
                .convertEumTalkProtocolPreviewForChannelItem(returnText)
                .then(messageObj => {
                  if (messageObj.type == 'emoticon')
                    returnText = covi.getDic('Emoticon');
                  else returnText = messageObj.message.split('\n')[0];
                  const notification = new Notification(
                    covi.getDic('NewMessage'),
                    {
                      icon: '',
                      body: `${getJobInfo(
                        json_data.senderInfo,
                      )} : ${returnText}`,
                    },
                  );

                  setTimeout(notification.close.bind(notification), 2000);
                });
            } else {
              returnText = json_data.context.split('\n')[0];
              const notification = new Notification(covi.getDic('NewMessage'), {
                icon: '',
                // body: `채널 메시지가 도착하였습니다`,
                body: `${getJobInfo(json_data.senderInfo)} : ${returnText}`,
              });

              setTimeout(notification.close.bind(notification), 2000);
            }
          }
        }
      } else {
        Notification.requestPermission();
      }
    }

    dispatch(receiveChannelMessage(json_data));
  };
};

export const handleChannelInvite = dispatch => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);

    dispatch(channelInviteMessageAdd(json_data));

    // TODO: inviteMember 값이 넘어오지 않음
    /*
    const members = json_data.inviteMember.map(item => {
      return { id: item.id, presence: item.presense };
    });
    dispatch(addFixedUsers(members)); */
  };
};

export const handleChannelExit = (dispatch, userInfo) => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);

    if (userInfo.id == json_data.leaveMember) {
      dispatch(channelLeaveOtherDevice(json_data));
    } else {
      dispatch(channelLeaveMessageAdd(json_data));
    }
  };
};

// 새메시지 도착
export const handleNewNotice = dispatch => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);
    json_data.isNotice = true;
    json_data.isMine = 'N';

    json_data.senderInfo = JSON.parse(json_data.senderInfo);

    // browser mode만 직접 알림 발송
    if (DEVICE_TYPE == 'b') {
      if (Notification.permission === 'granted') {
        if (localStorage.getItem('check_notification') == 'true') {
          const notification = new Notification(covi.getDic('NewMessage'), {
            icon: '',
            body: `멘션메시지 도착`,
          });

          setTimeout(notification.close.bind(notification), 2000);
        }
      } else {
        Notification.requestPermission();
      }
    }

    // dispatch(roomMessageAdd(json_data));
    dispatch(receiveMessage(json_data));
  };
};

// 채널 메시지 삭제
export const handleDelChannelMessage = dispatch => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);
    if (json_data.messageType === 'I') {
      dispatch(receiveDeletedChannelNotice(json_data));
    } else {
      dispatch(receiveDeletedChannelMessage(json_data));
    }
  };
};

// 채널 메시지 삭제
export const handleDelChannelNotice = dispatch => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.log('handleDelChannelNotice => ', json_data);

    dispatch(receiveDeletedNotice(json_data));
  };
};
// 채널 공지
export const handleNewChannelNotice = (dispatch, userInfo) => {
  return data => {
    const json_data = JSON.parse(data);

    // 차후 삭제 필요
    console.dir(json_data);

    json_data.senderInfo = JSON.parse(json_data.senderInfo);

    if (json_data.sender == userInfo.id) json_data.isMine = 'Y';

    // browser mode만 직접 알림 발송
    if (json_data.isMine != 'Y' && DEVICE_TYPE == 'b') {
      if (Notification.permission === 'granted') {
        if (localStorage.getItem('check_notification') == 'true') {
          const notification = new Notification(covi.getDic('NewMessage'), {
            icon: '',
            body: `채널 공지가 등록되었습니다.`,
            // body: `${getJobInfo(json_data.senderInfo)} : ${json_data.context}`,
          });

          setTimeout(notification.close.bind(notification), 2000);
        }
      } else {
        Notification.requestPermission();
      }
    }

    dispatch(receiveChannelMessage(json_data));
    dispatch(receiveChannelNotice(json_data));
  };
};

// 채널 관리자 변경
export const handleAuthChanged = (dispatch, userInfo) => {
  return data => {
    const json_data = JSON.parse(data);
    dispatch(changeChannelAuth(json_data));
  };
};
