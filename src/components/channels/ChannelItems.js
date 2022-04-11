// components\chat\RoomItems.js

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import ChannelItem from '@C/channels/ChannelItem';
import LoadingWrap from '@COMMON/LoadingWrap';
import { Scrollbars } from 'react-custom-scrollbars';
import { evalConnector } from '@/lib/deviceConnector';
import useOffset from '@/hooks/useOffset';
import { isJSONStr } from '@/lib/common';

const isEmptyObj = obj => {
  if (obj && obj.constructor === Object && Object.keys(obj).length === 0) {
    return true;
  }
  return false;
};

const getChannelSettings = channel => {
  let setting = null;

  if (channel.settingJSON === null) {
    setting = {};
  } else if (typeof channel.settingJSON === 'object') {
    setting = { ...channel.settingJSON };
  } else if (isJSONStr(channel.settingJSON)) {
    setting = JSON.parse(channel.settingJSON);
  }
  return setting;
};

const ChannelItems = ({
  channels,
  loading,
  onChannelChange,
  isDoubleClick,
}) => {
  const selectId = useSelector(({ channel }) => channel.selectedId);
  const joinedChannelList = useSelector(({ channel }) => channel.channels);
  const [pinnedChannels, setPinnedChannels] = useState([]);

  const [isNotis, setIsNotis] = useState({});
  const RENDER_UNIT = 5;

  const sortedChannels = useMemo(() => {
    const pinned = [];
    const unpinned = [];

    channels.forEach(c => {
      const setting = getChannelSettings(c);
      if (setting) {
        if (isEmptyObj(setting)) {
          unpinned.push(c);
        } else {
          if (!!setting.pinTop) {
            pinned.push(c);
          } else {
            unpinned.push(c);
          }
        }
      } else {
        unpinned.push(c);
      }
    });
    setPinnedChannels(pinned);

    pinned.sort((a, b) => {
      const aSetting = getChannelSettings(a);
      const bSetting = getChannelSettings(b);
      return bSetting.pinTop - aSetting.pinTop;
    });
    return [...pinned, ...unpinned];
  }, [channels]);

  const { handleScrollUpdate, list } = useOffset(sortedChannels, {
    initialNumToRender: 1,
    renderPerBatch: RENDER_UNIT,
  });
  const handleUpdate = handleScrollUpdate({
    threshold: 0.85,
  });

  useEffect(() => {
    if (DEVICE_TYPE == 'd') {
      const userConfig = evalConnector({
        method: 'getGlobal',
        name: 'USER_SETTING',
      });

      // notiExRooms에 없거나 등록된경우에도 false로 등록됨으로 not 연산자 처리
      if (userConfig && userConfig.config) {
        const notiExRooms = userConfig.get('notiExRooms');
        setIsNotis(notiExRooms);
      }
    }
  }, []);

  const getMenuData = useCallback(
    (dispatch, channel, id, dbClickEvent, isSelect, handleDoubleClick) => {
      const menus = [
        {
          code: 'openChannel',
          isline: false,
          onClick: () => {
            if (dbClickEvent) {
              handleDoubleClick();
            } else {
              if (!isSelect) onChannelChange(channel.roomId);
            }
          },
          name: covi.getDic('OpenChannel', '채널 열기'),
        },
      ];

      return menus;
    },
    [isNotis],
  );

  return (
    <Scrollbars
      style={{ height: 'calc(100% - 156px)' }}
      autoHide={true}
      className="MessageList"
      onUpdate={handleUpdate}
    >
      <ul className="people">
        {loading && <LoadingWrap />}
        {!loading &&
          list((channel, _) => {
            const isSelect = channel.roomId === selectId;
            const isJoined = joinedChannelList?.findIndex(
              chan => chan.roomId === channel.roomId,
            );
            const setting = getChannelSettings(channel);

            let isPinTop = false;
            if (setting && !isEmptyObj(setting) && !!setting.pinTop) {
              isPinTop = true;
            }
            return (
              <ChannelItem
                key={channel.roomId}
                channel={channel}
                onChannelChange={onChannelChange}
                dbClickEvent={isJoined !== -1 && isDoubleClick}
                isSelect={isSelect}
                getMenuData={getMenuData}
                isJoin={isJoined === -1}
                pinnedTop={isPinTop}
                pinnedChannels={pinnedChannels}
              />
            );
          })}
      </ul>
    </Scrollbars>
  );
};

export default React.memo(ChannelItems);
