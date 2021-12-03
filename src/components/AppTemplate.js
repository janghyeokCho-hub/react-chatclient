import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import LeftMenu from '@C/LeftMenu';
import Content from '@C/Content';
import MultiView from '@C/MultiView';
import GadgetView from '@C/GadgetView';
import LayerTemplate from '@COMMON/layer/LayerTemplate';
import {
  closeWinRoom,
  changeViewType,
  resetUnreadCount,
  checkRoomMove,
  modifyRoomNameList,
} from '@/modules/room';
import { changeMyPhotoPath, changeMyInfo, reSync } from '@/modules/login';
import {
  changeViewType as changeChannelViewType,
  resetUnreadCount as resetChannelUnreadCount,
  closeWinChannel,
  checkChannelMove,
  setChannelInfo,
} from '@/modules/channel';
import { clearLayer } from '@/lib/common';
import Header from '@C/Header';
import { evalConnector, newChatRoom, focusWin } from '@/lib/deviceConnector';
import { leaveRoomUtilAfter } from '@/lib/roomUtil';
import {
  leaveChannelUtilAfter,
  leaveChannelByAdminUtilAfter,
} from '@/lib/channelUtil';
import { useChatFontType } from '../hooks/useChat';
import { SyncFavoriteIPC } from '../hooks/useSyncFavorite';

const AppTemplate = () => {
  const viewType = useSelector(({ room }) => room.viewType);
  const dispatch = useDispatch();
  const [fontType] = useChatFontType();

  const windowSizeChange = useCallback(() => {
    if (viewType === 'M' && window.innerWidth <= 1000) {
      // single type으로 돌림
      dispatch(changeViewType(false));
      dispatch(changeChannelViewType(false)); // 채널
    } else if (viewType === 'S' && window.innerWidth > 1000) {
      dispatch(changeViewType(true));
      dispatch(changeChannelViewType(true)); // 채널
    }
  }, [viewType, dispatch]);

  const menu = useSelector(({ menu }) => menu.menu);

  useEffect(() => {
    // static 함수 등록

    if (DEVICE_TYPE == 'b') {
      // Browser의 경우 Gadget View 유지
      handleNewWinClose();
      handleNewWindowLeave();
      handleNewWinReadMessage();
    } else {
      evalConnector({
        method: 'on',
        channel: 'onNewWinClose',
        callback: (event, args) => {
          if (args.isChannel) dispatch(closeWinChannel(args.roomID));
          else dispatch(closeWinRoom(args.roomID));
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onNewWinLeave',
        callback: (event, room, userId) => {
          leaveRoomUtilAfter(dispatch, room, userId);
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onChangeUserInfo',
        callback: (event, args) => {
          if (args.type == 'img') {
            dispatch(changeMyPhotoPath(args.data));
          } else if (args.type == 'info') {
            dispatch(changeMyInfo(args.data));
          }
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onNewWinChannelLeave',
        callback: (event, channel, userId) => {
          leaveChannelUtilAfter(dispatch, channel, userId);
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onNewWinReadMessage',
        callback: (event, args) => {
          if (args.isChannel) dispatch(resetChannelUnreadCount(args.roomID));
          else dispatch(resetUnreadCount(args.roomID));
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onMoveView',
        callback: (event, data) => {
          //currentRoom인 경우에만 이동
          focusWin();
          clearLayer(dispatch);
          if (data.isChannel) dispatch(checkChannelMove(data));
          else dispatch(checkRoomMove(data));
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onModifyRoomName',
        callback: (event, data) => {
          dispatch(modifyRoomNameList(data));
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onModifyChannelInfo',
        callback: (event, data) => {
          dispatch(setChannelInfo(data));
        },
      });

      evalConnector({
        method: 'on',
        channel: 'onReSync',
        callback: (event, data) => {
          dispatch(reSync());
        },
      });
    }

    window.onresize = windowSizeChange;

    if (window.innerWidth > 1000) {
      dispatch(changeViewType(true));
      dispatch(changeChannelViewType(true)); // 채널
    }

    // 채널 브라우저, 데스크탑 동일
    handleNewWindowChannelLeave(); // 채널
    handleNewWindowChannelLeaveByAdmin(); // 채널 내보내기

    return () => {
      window.onresize = null;

      evalConnector({
        method: 'removeListener',
        channel: 'onNewWinReadMessage',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onNewWinClose',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onNewWinLeave',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onMoveView',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onModifyRoomName',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onChangeUserInfo',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'onReSync',
      });
      evalConnector({
        method: 'removeListener',
        channel: 'sync-favorite',
      });
    };
  }, []);

  useEffect(() => {
    window.onresize = null;
    window.onresize = windowSizeChange;

    return () => {
      window.onresize = null;
    };
  }, [viewType]);

  const handleNewWinClose = useCallback(() => {
    if (!window.newWincloseCallback) {
      window.newWincloseCallback = (args, children) => {
        // 창이 완전히 닫힌경우만 체크하기위해 timeout 부여
        setTimeout(
          ((args, children) => {
            return () => {
              if (children.closed) {
                if (args.isChannel) dispatch(closeWinChannel(args.roomID));
                else dispatch(closeWinRoom(args.roomID));
              }
            };
          })(args, children),
          300,
        );
      };
    }
  }, [dispatch]);

  const handleNewWindowLeave = useCallback(() => {
    if (!window.newWinLeaveCallback) {
      window.newWinLeaveCallback = (room, userId) => {
        leaveRoomUtilAfter(dispatch, room, userId);
      };
    }
  }, [dispatch]);

  // 채널
  const handleNewWindowChannelLeave = useCallback(() => {
    if (!window.newWinChannelLeaveCallback) {
      window.newWinChannelLeaveCallback = (roomId, userId) => {
        leaveChannelUtilAfter(dispatch, roomId, userId);
      };
    }
  }, [dispatch]);

  // 채널 내보내기
  const handleNewWindowChannelLeaveByAdmin = useCallback(() => {
    if (!window.newWinChannelLeaveByAdminCallback) {
      window.newWinChannelLeaveByAdminCallback = (roomId, userId) => {
        leaveChannelByAdminUtilAfter(dispatch, roomId, userId);
      };
    }
  }, [dispatch]);

  const handleNewWinReadMessage = useCallback(() => {
    if (!window.newWinReadMessageCallback) {
      window.newWinReadMessageCallback = id => {
        dispatch(resetUnreadCount(id));
        dispatch(resetChannelUnreadCount(id)); // 채널
      };
    }
  }, [dispatch]);

  return (
    <>
      <SyncFavoriteIPC /> 
      <div id="wrap">
        <nav className="menu">
          <LeftMenu />
        </nav>
        <div className="Content">
          <div
            className="ListCont"
            style={{ width: menu == 'Extension' ? '100%' : '' }}
          >
            <Header />
            <Content />
          </div>
          <>
            {viewType === 'M' && (
              <div
                className="Chat"
                style={{ fontFamily: fontType === 'Default' ? null : fontType }}
              >
                <MultiView></MultiView>
              </div>
            )}
            {viewType === 'S' && SCREEN_OPTION == 'G' && (
              <GadgetView></GadgetView>
            )}
          </>
        </div>
      </div>
      <LayerTemplate />
    </>
  );
};

export default AppTemplate;
