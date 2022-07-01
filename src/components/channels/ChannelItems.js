// components\chat\RoomItems.js

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChannelItem from '@C/channels/ChannelItem';
import LoadingWrap from '@COMMON/LoadingWrap';
import { Scrollbars } from 'react-custom-scrollbars';
import { evalConnector } from '@/lib/deviceConnector';
import useOffset from '@/hooks/useOffset';
import { isJSONStr } from '@/lib/common';
import { getConfig } from '@/lib/util/configUtil';

const ChannelItems = ({
  channels,
  loading,
  onChannelChange,
  isDoubleClick,
}) => {
  const selectId = useSelector(({ channel }) => channel.selectedId);
  const joinedChannelList = useSelector(({ channel }) => channel.channels);
  const [pinnedChannels, setPinnedChannels] = useState([]);
  const pinToTopLimit = useMemo(
    () => getConfig('PinToTop_Limit_Channel', -1),
    [channels],
  );

  const [isNotis, setIsNotis] = useState({});
  const RENDER_UNIT = 5;

  const isEmptyObj = obj => {
    if (obj?.constructor === Object && Object.keys(obj).length === 0) {
      return true;
    }
    return false;
  };

  const getChannelSettings = channel => {
    return (
      (isJSONStr(channel?.settingJSON)
        ? JSON.parse(channel?.settingJSON)
        : channel?.settingJSON) || {}
    );
  };

  const sortedChannels = useMemo(() => {
    const pinned = [];
    const unpinned = [];
    const result = [];
    if (pinToTopLimit >= 0) {
      channels.forEach(c => {
        const setting = getChannelSettings(c);
        if (setting && !isEmptyObj(setting) && !!setting.pinTop) {
          pinned.push(c);
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
      return result.concat([...pinned, ...unpinned]);
    } else {
      return result.concat(channels).sort((a, b) => {
        return b.lastMessageDate - a.lastMessageDate;
      });
    }
  }, [channels, pinToTopLimit]);

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
            return (
              <ChannelItem
                key={channel.roomId}
                channel={channel}
                onChannelChange={onChannelChange}
                dbClickEvent={isJoined !== -1 && isDoubleClick}
                isSelect={isSelect}
                getMenuData={getMenuData}
                isJoin={isJoined === -1}
                getChannelSettings={getChannelSettings}
                isEmptyObj={isEmptyObj}
                pinnedChannels={pinnedChannels}
                pinToTopLimit={pinToTopLimit}
              />
            );
          })}
      </ul>
    </Scrollbars>
  );
};

export default React.memo(ChannelItems);
