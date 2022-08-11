import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import querystring from 'query-string';
import ChannelHeader from '@C/channels/channel/normal/ChannelHeader';
import MessagePostBox from '@C/channels/channel/normal/MessagePostBox';
import MessageList from '@C/channels/channel/normal/MessageList';
import FileUploadBox from '@C/chat/chatroom/normal/FileUploadBox'; // 그대로 사용
import { getConfig } from '@/lib/util/configUtil';
import Config from '@/config/config';

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

  const [replyMode, setReplyMode] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);

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
    /**
     * 2022.07.01
     * (모바일에서 URL 열람시 /manager 접근제어 문제)
     * IP 접근제어가 설정된 사이트에서 화상회의 사용시
     * liveMeet 시스템설정에 gate: `${이음톡주소}/manager/na/nf/liveMeetGate.do` 값 추가하기
     */
    const gateURL =
      liveMeet?.gate || `${Config.ServerURL.HOST}/manager/liveMeetGate.do`;
    const invitationURL = querystring.stringifyUrl({
      url: gateURL,
      query: {
        type: liveMeet.type,
        rKey: channelInfo.roomId,
      },
    });
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
          baseURL: invitationURL,
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
        replyMessage={replyMessage}
        replyMode={replyMode}
        setReplyMode={setReplyMode}
        setReplyMessage={setReplyMessage}
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
        replyMessage={replyMessage}
        setReplyMode={setReplyMode}
        setReplyMessage={setReplyMessage}
      />
      <FileUploadBox onView={handleUploadBox} view={view}></FileUploadBox>
    </div>
  );
};

export default React.memo(MessageView);
