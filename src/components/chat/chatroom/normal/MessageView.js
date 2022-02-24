import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChatRoomHeader from '@C/chat/chatroom/normal/ChatRoomHeader';
import MessagePostBox from '@C/chat/chatroom/normal/MessagePostBox';
import MessageList from '@/components/chat/chatroom/normal/MessageList';
import FileUploadBox from '@C/chat/chatroom/normal/FileUploadBox';
import { getConfig } from '@/lib/util/configUtil';
import { getDictionary, getSysMsgFormatStr } from '@/lib/common';
import Config from '@/config/config';
import useCopyWithSenderInfo from '@/hooks/useCopyWithSenderInfo';
import { getUserInfo, requestOAuth } from '@/lib/zoomService';
import { openPopup } from '@/lib/common';
import { clearZoomData } from '@/lib/util/localStorageUtil';
import axios from 'axios';

const MessageView = ({
  roomInfo,
  onSearchBox,
  onNewWin,
  isNewWin,
  handleUploadBox,
  onExtension,
  viewExtension,
  onRead,
  postAction,
  view,
}) => {
  const chatBot = getConfig('ChatBot');
  const liveMeet = getConfig('LiveMeet');
  const zoomMeet = getConfig('ZoomMeet');
  const useMessageCopy = getConfig('UseMessageCopy', true);
  const remoteAssistance = getConfig('UseRemoteView', 'N');
  const useMessageDelete = getConfig('UseChatroomDeleteMessage', false) === true;

  const getFilterMember = (members, id) => {
    if (members) {
      const filterMember = members.filter(item => {
        if (item.id === id) return false;

        return true;
      });

      return filterMember;
    }
    return [];
  };

  const id = useSelector(({ login }) => login.id);
  const chatBox = useRef(null);
  const contentEditable = useRef(null);
  const dispatch = useDispatch();

  // ZoomMeet용 임시
  const userInfo = useSelector(({ login }) => login.userInfo);

  const readMessageEvt = useCallback(
    e => {
      // focus in 시 지정된 이벤트 모두 제거
      onRead(roomInfo.roomID, false);
      chatBox.current.removeEventListener('keypress', readMessageEvt);
      chatBox.current.removeEventListener('click', readMessageEvt);
      chatBox.current.removeEventListener('dragenter', readMessageEvt);
      contentEditable.current.removeEventListener('focus', readMessageEvt);
    },
    [onRead, roomInfo],
  );

  const callZoomMeet = useCallback(async () => {
    const { data } = await getUserInfo();
    let message = null;
    if (data.status === 'FAIL') {
      // zoom api 요청이 실패한 경우
      message = covi.getDic(
        'Zoom_Meeting_Error',
        '초대 메시지를 발송할 수 없습니다.<br />다시 시도해주세요.',
      );
    } else {
      console.log('Zoom UserInfo   ', data);
      if (data.meeting_url === null) {
        // 토큰문제로 meeting_url 가져오지 못한 경우 (시간만료 or 다른 클라이언트에서 새 토큰 발급)
        message = covi.getDic(
          'Zoom_Meeting_TokenExpired',
          'Zoom 계정 재연동이 필요합니다.',
        );
        clearZoomData();
      } else if (data.meeting_url) {
        // meeting url에서 meeting id 파싱
        const match = data.meeting_url.match(/\/([0-9]*)\?/);
        if (match[1]) {
          const msgObj = {
            title: '화상회의(Zoom)',
            context: `Zoom 회의초대:Meeting ID ${match[1]}`,
            func: {
              name: '회의에 참가하기',
              type: 'link',
              data: {
                baseURL: data.meeting_url,
              },
            },
          };
          postAction(JSON.stringify(msgObj), null, null, 'A');
        } else {
          // meeting_url에서 meeting id를 파싱할 수 없는 경우
          message = covi.getDic(
            'Zoom_Meeting_Error',
            '초대 메시지를 발송할 수 없습니다.<br />다시 시도해주세요.',
          );
        }
      } else {
        // 이외의 에러 대응
        message = covi.getDic(
          'Zoom_Meeting_Error',
          '초대 메시지를 발송할 수 없습니다.<br />다시 시도해주세요.',
        );
      }

      message !== null &&
        openPopup(
          {
            type: 'Alert',
            message,
            callback: () => {},
          },
          dispatch,
        );
    }
  }, [roomInfo]);

  const callZoomSignup = useCallback(() => {
    requestOAuth(userInfo.id);
  });
  const messages = useSelector(({ room }) => room.messages);
  const { copyWithSenderInfo } = useCopyWithSenderInfo();

  useEffect(() => {
    // 서버에서 포함기능을 껏으면 사용 x
    if (useMessageCopy === false) {
      return;
    }

    const disableCopy = e => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode == 67) {
        copyWithSenderInfo(messages);
        e.returnValue = false;
      }
    };
    window.addEventListener('keydown', disableCopy);

    return () => {
      window.removeEventListener('keydown', disableCopy);
    };
  }, []);

  useEffect(() => {
    window.onblur = e => {
      chatBox.current.addEventListener('keypress', readMessageEvt, {
        once: true,
      });

      chatBox.current.addEventListener('click', readMessageEvt, { once: true });

      chatBox.current.addEventListener('dragenter', readMessageEvt, {
        once: true,
      });

      contentEditable.current.addEventListener('focus', readMessageEvt, {
        once: true,
      });
    };

    chatBox.current.ondragenter = e => {
      if (e.dataTransfer && e.dataTransfer.types) {
        const type = e.dataTransfer.types[0];
        if (type == 'Files') {
          handleUploadBox(true);
        }
      }
      e.preventDefault();
      e.stopPropagation();
    };
  }, [roomInfo]);

  useEffect(() => {
    return () => {
      window.onblur = null;
    };
  }, []);

  const callLiveMeet = useCallback(() => {
    // TODO: 다국어 처리
    if (liveMeet.type == 'saeha') {
      let inviteUsers = [];

      const filterMember = getFilterMember(roomInfo.members, id);

      // 1. 참여 중인 방인원의 정보를 기반하여 inviteUsers를 생성
      filterMember.map(user => {
        inviteUsers.push({
          inviteId: user.id,
          inviteName: getDictionary(user.name),
        });
      });

      // 2. api 요청 데이터 생성
      const reqOptions = {
        method: 'POST',
        url: liveMeet.domain + '/api/conf/createRoom',
        data: JSON.stringify({
          userId: id,
          companyId: 'company',
          inviteUsers: inviteUsers,
        }),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      };

      // 3. api 요청
      axios(reqOptions)
        .then(response => {
          const data = response.data;
          if (data && data.success) {
            // 4. 반환 링크 오픈
            if (DEVICE_TYPE == 'd') {
              window.openExternalPopup(data.hostUrl);
            } else {
              window.open(data.hostUrl, '_blank');
            }

            // 5. 메시지 전송
            const msgObj = {
              title: '화상회의',
              context: '회의에 참석해주세요',
              func: {
                name: '페이지로 이동',
                type: 'saeha',
                data: {
                  ownerId: id,
                  hostURL: liveMeet.domain,
                  inviteUsers: data.inviteUsers,
                  meetRoomId: data.roomId,
                  simpleInviteURL: data.simpleInviteLink,
                },
              },
            };
            postAction(JSON.stringify(msgObj), null, null, 'A');
          } else {
            openPopup(
              {
                type: 'Alert',
                message: '화상회의를 시작 할 수 없습니다.',
                callback: () => {
                  console.log(data);
                },
              },
              dispatch,
            );
          }
        })
        .catch(error => {
          openPopup(
            {
              type: 'Alert',
              message: '화상회의를 시작 할 수 없습니다.',
              callback: () => {
                console.log(error);
              },
            },
            dispatch,
          );
        });
    } else {
      const msgObj = {
        title: '화상회의',
        context: '회의에 참석해주세요',
        func: {
          name: '페이지로 이동',
          type: 'link',
          data: {
            baseURL: `${Config.ServerURL.HOST}/manager/liveMeetGate.do?type=${liveMeet.type}&rKey=${roomInfo.roomID}&cu=${id}`,
            params: {
              tk: { param: 'toToken#', plain: false, enc: false },
              dir: {
                param: `${liveMeet.domain}`,
                plain: true,
                enc: false,
              },
            },
          },
        },
      };

      postAction(JSON.stringify(msgObj), null, null, 'A');
    }
  }, [roomInfo]);

  const remoteHost = useCallback(
    sessionKey => {
      console.log(sessionKey);
      const msgObj = {
        title: '원격지원',
        context: '원격지원 요청입니다.',
        func: {
          name: '원격지원 수락',
          type: 'remote',
          data: {
            sessionKey: sessionKey,
          },
        },
      };
      postAction(JSON.stringify(msgObj), null, null, 'A');
    },
    [roomInfo],
  );

  const roomName = useMemo(() => {
    const refWord = `(Enter ${covi.getDic(
      'Send',
    )} / Shift + Enter ${covi.getDic('NewLine')})`;
    if (roomInfo.roomType === 'M') {
      const filterMember = getFilterMember(roomInfo.members, id);
      // M의 경우 남은 값이 1개
      const target = filterMember[0];

      return `${getDictionary(target.name)} ${refWord}`;
    } else if (roomInfo.roomType === 'B') {
      return `${chatBot?.name} ${refWord}`;
    } else if (roomInfo.roomType === 'O') {
      const target = (roomInfo.members && roomInfo.members[0]) || null;
      if (target) {
        return `${getDictionary(target.name)} ${refWord}`;
      } else {
        return `${covi.getDic('NoChatMembers')} ${refWord}`;
      }
    } else {
      const filterMember = getFilterMember(roomInfo.members, id);
      if (roomInfo.roomName) {
        return `${roomInfo.roomName} ${refWord}`;
      }

      if (filterMember.length == 0)
        return `${covi.getDic('NoChatMembers')} ${refWord}`;

      const groupNames = filterMember.map((item, index) => {
        return getDictionary(item.name);
      });

      const getGroupName = (groupNames, limitCnt) => {
        const spliceArr = groupNames.slice(0, limitCnt);
        const otherCnt = groupNames.length - limitCnt;

        if (otherCnt > 0) {
          return getSysMsgFormatStr(covi.getDic('Tmp_andOthers'), [
            { type: 'Plain', data: spliceArr.join(', ') },
            { type: 'Plain', data: otherCnt },
          ]);
        } else {
          return spliceArr.join(', ');
        }
      };

      return `${getGroupName(groupNames, 4)} ${refWord}`;
    }
  }, [roomInfo, id]);
  const useZoom = useMemo(() => {
    // ZoomMeet 설정값 체크
    const zoomFlag = zoomMeet && zoomMeet.use;
    // 2021.03.19
    // allowedUsers 설정에 현재 유저의 id가 해당될 경우만 Zoom 초대버튼 렌더링 (임시구현)
    // 정식배포시 allowedUsers 관련 로직 제거해야함
    const allowed =
      zoomFlag &&
      zoomMeet.allowedUsers !== undefined &&
      Array.isArray(zoomMeet.allowedUsers)
        ? zoomMeet.allowedUsers.includes(userInfo.id)
        : false;
    return allowed;
  }, [userInfo]);

  console.log('roomInfo > ', roomInfo);

  return (
    <div style={{ width: '100%', height: '100%' }} ref={chatBox}>
      <ChatRoomHeader
        roomInfo={roomInfo}
        isMakeRoom={false}
        onSearchBox={onSearchBox}
        onNewWin={onNewWin}
        isNewWin={isNewWin}
      />
      <MessageList onExtension={onExtension} viewExtension={viewExtension} useMessageDelete={useMessageDelete} />
      <MessagePostBox
        postAction={postAction}
        viewExtension={viewExtension}
        onExtension={onExtension}
        disabledButtons={roomInfo?.roomType === 'B' ? true : false}
        ref={contentEditable}
        liveMeet={(liveMeet && liveMeet.use && callLiveMeet) || null}
        zoomMeet={(useZoom && callZoomMeet) || null}
        zoomSignup={(useZoom && callZoomSignup) || null}
        remoteAssistance={remoteAssistance}
        remoteHost={remoteHost}
        placeholder={roomName}
        isLock={
          (roomInfo.setting && roomInfo.setting.lockInput === 'Y') || false
        }
      />
      <FileUploadBox onView={handleUploadBox} view={view}></FileUploadBox>
    </div>
  );
};

export default React.memo(MessageView);
