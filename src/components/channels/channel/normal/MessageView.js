import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import ChannelHeader from '@C/channels/channel/normal/ChannelHeader';
import MessagePostBox from '@C/channels/channel/normal/MessagePostBox';
import MessageList from '@C/channels/channel/normal/MessageList';
import FileUploadBox from '@C/chat/chatroom/normal/FileUploadBox'; // 그대로 사용
import { getConfig } from '@/lib/util/configUtil';
import Config from '@/config/config';
import axios from 'axios';

const liveMeet = getConfig('LiveMeet');

const MessageView = ({
  channelInfo,
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
  const channelBox = useRef(null);
  const contentEditable = useRef(null);
  const useMessageDelete = getConfig('UseChatroomDeleteMessage', 'N') === 'Y';

  const readMessageEvt = useCallback(
    e => {
      // focus in 시 지정된 이벤트 모두 제거
      onRead(channelInfo.roomId, false);
      channelBox.current.removeEventListener('keypress', readMessageEvt);
      channelBox.current.removeEventListener('click', readMessageEvt);
      channelBox.current.removeEventListener('dragenter', readMessageEvt);
      contentEditable.current.removeEventListener('focus', readMessageEvt);
    },
    [onRead],
  );

  useEffect(() => {
    window.onblur = e => {
      channelBox.current.addEventListener('keypress', readMessageEvt, {
        once: true,
      });

      channelBox.current.addEventListener('click', readMessageEvt, {
        once: true,
      });

      channelBox.current.addEventListener('dragenter', readMessageEvt, {
        once: true,
      });

      contentEditable.current.addEventListener('focus', readMessageEvt, {
        once: true,
      });
    };

    channelBox.current.ondragenter = e => {
      if (e.dataTransfer && e.dataTransfer.types) {
        const type = e.dataTransfer.types[0];
        if (type == 'Files') {
          handleUploadBox(true);
        }
      }
      e.preventDefault();
      e.stopPropagation();
    };
  }, [channelInfo]);

  useEffect(() => {
    return () => {
      window.onblur = null;
    };
  }, []);

  const callLiveMeet = useCallback(() => {
    const msgObj = {
      title: covi.getDic('VideoConferencing', '화상회의'),
      context: covi.getDic(
        'Msg_JoinVideoConference',
        '화상회의에 참석해주세요.',
      ),
      func: {
        name: covi.getDic('GoToPage', '페이지로 이동'),
        type: 'link',
        data: {
          baseURL: `${Config.ServerURL.HOST}/manager/liveMeetGate.do?type=${liveMeet.type}&rKey=${channelInfo.roomId}`,
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
    postAction(JSON.stringify(msgObj), null, null, null, null, 'A');
  }, [channelInfo]);

  const roomName = useMemo(() => {
    const refWord = `(Enter ${covi.getDic(
      'Send',
      '전송',
    )} / Shift + Enter ${covi.getDic('NewLine', '개행')})`;
    return `${channelInfo.roomName}(${channelInfo.categoryName}) ${refWord}`;
  }, [channelInfo]);

  return (
    <div style={{ width: '100%', height: '100%' }} ref={channelBox}>
      <ChannelHeader
        channelInfo={channelInfo}
        onSearchBox={onSearchBox}
        onNewWin={onNewWin}
        isNewWin={isNewWin}
      />
      <MessageList
        onExtension={onExtension}
        viewExtension={viewExtension}
        useMessageDelete={useMessageDelete}
      />
      <MessagePostBox
        postAction={postAction}
        viewExtension={viewExtension}
        onExtension={onExtension}
        disabled={channelInfo.disabled}
        ref={contentEditable}
        liveMeet={(liveMeet && liveMeet.use && callLiveMeet) || null}
        placeholder={roomName}
        isLock={
          (channelInfo.setting && channelInfo.setting.lockInput === 'Y') ||
          false
        }
      />
      <FileUploadBox onView={handleUploadBox} view={view}></FileUploadBox>
    </div>
  );
};

export default React.memo(MessageView);
