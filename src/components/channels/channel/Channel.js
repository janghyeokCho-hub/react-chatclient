import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import loadable from '@loadable/component';
import LoadingWrap from '@COMMON/LoadingWrap';
import LayerTemplate from '@COMMON/layer/LayerTemplate';
import {
  newWinChannel,
  checkChannelMove,
  getChannelInfo,
  getChannelNotice,
  readMessage,
} from '@/modules/channel';
import {
  sendChannelMessage,
  clearFiles,
  updateChannelTempMessage,
} from '@/modules/message';
import * as coviFile from '@/lib/fileUpload/coviFile';
import * as common from '@/lib/common';
import { addTargetUserList, delTargetUserList } from '@/modules/presence';
import { newChannel, evalConnector, focusWin } from '@/lib/deviceConnector';
import MessageView from '@C/channels/channel/normal/MessageView';
import ChatBackground from '@C/chat/chatroom/layer/ChatBackground';

const SearchView = loadable(() =>
  import('@/components/common/search/SearchView'),
);
const MoveView = loadable(() => import('@C/channels/channel/move/MoveView'));

import ChannelInfoPopup from '@C/channels/channel/popup/ChannelInfoPopup';
import { useChatFontType } from '../../../hooks/useChat';

const Channel = ({ match, channelInfo }) => {
  // channelInfo가 넘어오지 않은경우 URL로 접근
  let roomId;
  const isNewWin =
    window.opener != null || (match && match.url.indexOf('/nw/') > -1);

  if (channelInfo != null) {
    roomId = parseInt(channelInfo.roomId);
  } else if (!channelInfo && match) {
    roomId = parseInt(match.params.roomId);
  } else {
    roomId = null;
  }

  const userId = useSelector(({ login }) => login.id);
  const blockUser = useSelector(({ login }) => login.blockList);
  const channel = useSelector(({ channel }) => channel.currentChannel);
  const moveVisible = useSelector(({ message }) => message.moveVisible);
  const loading = useSelector(
    ({ loading }) => loading['channel/GET_CHANNEL_INFO'],
  );

  const [searchVisible, setSearchVisible] = useState(false);
  const [viewFileUpload, setViewFileUpload] = useState(false);

  const [viewExtension, setViewExtension] = useState('');
  const [cancelHandlerFn, setCancelHandlerFn] = useState(null);

  const [fontType] = useChatFontType();

  const dispatch = useDispatch();

  const openCurrentChannel = useCallback(() => {
    const winName = `wrf${roomId}`;

    const openURL = `${
      DEVICE_TYPE == 'd' ? '#' : ''
    }/client/nw/channel/${roomId}`;

    let channelObj = newChannel(winName, roomId, openURL);

    dispatch(newWinChannel({ id: roomId, obj: channelObj, name: winName }));
  }, [roomId, dispatch]);

  useEffect(() => {
    if (isNewWin) {
      if (DEVICE_TYPE == 'b') {
        window.onunload = e => {
          if (typeof window.opener.parent.newWincloseCallback == 'function') {
            window.opener.parent.newWincloseCallback(
              { roomID: roomId, isChannel: true },
              window,
            );
          }
        };
      } else if (DEVICE_TYPE == 'd') {
        evalConnector({
          method: 'on',
          channel: 'onMoveView',
          callback: (event, data) => {
            //currentChannel인 경우에만 이동
            focusWin();
            common.clearLayer(dispatch);
            if (data.isChannel) dispatch(checkChannelMove(data));
          },
        });
      }
    }

    const fileCtrl = coviFile.getInstance();
    fileCtrl.clear();
    dispatch(clearFiles());

    covi.changeSearchView = searchText => {
      covi.changeSearchText = searchText;
      setSearchVisible(true);
    };

    return () => {
      covi.changeSearchText = null;
      covi.changeSearchView = null;

      if (isNewWin) {
        window.onunload = null;
        evalConnector({
          method: 'removeListener',
          channel: 'onMoveView',
        });
      }
    };
  }, []);

  useEffect(() => {
    // init
    dispatch(
      getChannelInfo({
        roomId,
        members: [userId],
      }),
    );
    setSearchVisible(false);

    // 메시지 읽음처리 ( Channel Open )
    // dispatch(readMessage({ roomID: roomId }));

    // file control 초기화
    const fileCtrl = coviFile.getInstance();
    fileCtrl.clear();
    dispatch(clearFiles());
    setViewFileUpload(false);
  }, [roomId]);

  useEffect(() => {
    // presence - channel members
    if (channel && channel.members)
      dispatch(
        addTargetUserList(
          channel.members.map(item => ({
            userId: item.id,
            state: item.presence,
          })),
        ),
      );

    return () => {
      if (channel && channel.members)
        dispatch(delTargetUserList(channel.members.map(item => item.presence)));
    };
  }, [channel]);

  useEffect(() => {
    if (!loading && channel) {
      // 채널 공지 조회
      dispatch(
        getChannelNotice({
          roomId: channel.roomId,
          method: 'TOP',
        }),
      );
      dispatch(readMessage({ roomID: channel.roomId }));
    }
  }, [loading]);

  const handleMessage = useCallback(
    async (
      message,
      filesObj,
      linkObj,
      tagArr,
      mentionArr,
      messageType,
      reply,
    ) => {
      const members = channel?.members?.map(
        item => item.id !== userId && item.id,
      );
      let blockList = [];
      if (members?.length && blockUser) {
        blockList = blockUser.filter(
          item => item !== userId && members.includes(item),
        );
      }

      const data = {
        roomID: channel.roomId,
        context: message,
        roomType: channel.roomType,
        sendFileInfo: filesObj,
        linkInfo: linkObj,
        tagInfo: tagArr,
        mentionInfo: mentionArr,
        messageType: !!messageType ? messageType : 'N',
        blockList: blockList || [],
        ...reply,
        onUploadHandler: (data, cancelHandler) => {
          if (filesObj.fileInfos.length) {
            filesObj.fileInfos[0].tempId;
            const payload = {
              inprogress: data.loaded,
              total: data.total,
              tempId: filesObj.fileInfos[0].tempId,
            };
            setCancelHandlerFn(cancelHandler);
            dispatch(updateChannelTempMessage(payload));
          }
        },
      };

      dispatch(sendChannelMessage(data));

      if (window.covi && window.covi.listBottomBtn) {
        window.covi.listBottomBtn.click();
      }
    },
    [dispatch, channel, blockUser],
  );

  const handleSearchBox = useCallback(visible => {
    setSearchVisible(visible);
  }, []);

  const handleUploadBox = useCallback(visible => {
    setViewFileUpload(visible);
  }, []);

  const handleExtension = useCallback(extension => {
    setViewExtension(extension);
  }, []);

  const handleReadMessage = useCallback(
    (roomId, isNotice) => {
      dispatch(readMessage({ roomID: roomId, isNotice }));
    },
    [roomId, dispatch],
  );

  useEffect(() => {
    const setCtrlFEventListner = e => {
      if (e.ctrlKey && e.key == 'f') {
        setSearchVisible(true);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', setCtrlFEventListner);

    return () => {
      window.removeEventListener('keydown', setCtrlFEventListner);
    };
  }, []);

  return (
    <>
      {loading && <LoadingWrap />}
      {!loading && roomId && (
        <>
          {isNewWin && (
            <div
              className="Chat Newwindow"
              style={{ fontFamily: fontType === 'Default' ? null : fontType }}
            >
              {DEVICE_TYPE == 'd' && channel && (
                <ChatBackground background={channel.background} />
              )}
              {(moveVisible && (
                <>
                  <MoveView></MoveView>
                </>
              )) ||
                (searchVisible && (
                  <>
                    <SearchView onSearchBox={handleSearchBox}></SearchView>
                  </>
                )) || (
                  <>
                    {channel && (
                      <MessageView
                        channelInfo={channel}
                        onSearchBox={handleSearchBox}
                        onNewWin={null}
                        isNewWin={isNewWin}
                        handleUploadBox={handleUploadBox}
                        onExtension={handleExtension}
                        viewExtension={viewExtension}
                        postAction={handleMessage}
                        onRead={handleReadMessage}
                        view={viewFileUpload}
                      />
                    )}
                  </>
                )}
              <LayerTemplate />
            </div>
          )}
          {!isNewWin && (
            <>
              {DEVICE_TYPE == 'd' && channel && (
                <ChatBackground background={channel.background} />
              )}
              {(moveVisible && (
                <>
                  <MoveView></MoveView>
                </>
              )) ||
                (searchVisible && (
                  <>
                    <SearchView onSearchBox={handleSearchBox}></SearchView>
                  </>
                )) || (
                  <>
                    <MessageView
                      channelInfo={channel}
                      onSearchBox={handleSearchBox}
                      onNewWin={openCurrentChannel}
                      isNewWin={isNewWin}
                      handleUploadBox={handleUploadBox}
                      onExtension={handleExtension}
                      viewExtension={viewExtension}
                      postAction={handleMessage}
                      onRead={handleReadMessage}
                      view={viewFileUpload}
                    />
                  </>
                )}
            </>
          )}
        </>
      )}
      {!loading && !roomId && (
        <div>{covi.getDic('Msg_InvalidApproach', '잘못된 접근입니다.')}</div>
      )}
      {/* 채널 정보 수정 팝업 */}
      <ChannelInfoPopup />
    </>
  );
};

export default React.memo(Channel);
