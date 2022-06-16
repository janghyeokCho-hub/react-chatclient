import React, {
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { makeMessageText, isJSONStr } from '@/lib/common';
import Config from '@/config/config';
import { isBlockCheck } from '@/lib/orgchart';

const ChannelItem = ({
  channel,
  checkObj,
  isJoin,
  pinnedTop,
  chineseWall = [],
}) => {
  const channels = useSelector(({ channel }) => channel.channels);
  const checkRef = useRef(null);

  const checkedValue = useMemo(() => {
    if (!checkObj) {
      return;
    }
    // userInfo[checkedKey] 값이 비어있으면 checkedSubKey 참조
    if (!!checkObj?.checkedSubKey) {
      return channel[checkObj.checkedKey] || channel[checkObj.checkedSubKey];
    }
    return channel[checkObj.checkedKey];
  }, [channel, checkObj]);

  const [lastMessageText, setLastMessageText] = useState('');

  useLayoutEffect(() => {
    if (channel?.lastMessage && chineseWall.length) {
      const lastMessageInfo = isJSONStr(channel.lastMessage)
        ? JSON.parse(channel.lastMessage)
        : channel.lastMessage;
      const targetInfo = {
        id: lastMessageInfo.sender,
        companyCode: lastMessageInfo.companyCode,
        deptCode: lastMessageInfo.deptCode,
      };

      const { blockChat, blockFile } = isBlockCheck({
        targetInfo,
        chineseWall,
      });
      const isFile = !!lastMessageInfo?.File;
      const result = isFile ? blockFile : blockChat;

      if (result) {
        setLastMessageText(covi.getDic('BlockChat', '차단된 메시지 입니다.'));
      } else {
        makeMessageText(channel.lastMessage, 'CHANNEL').then(
          setLastMessageText,
        );
      }
    } else {
      makeMessageText(channel?.lastMessage, 'CHANNEL').then(setLastMessageText);
    }
  }, [channel, chineseWall]);

  const handleClick = useCallback(() => {
    checkRef?.current?.click();
  }, [checkRef]);

  return (
    <li className="person" onClick={() => handleClick()}>
      <>
        <div
          className={
            isJoin && channel.openType !== 'O'
              ? ['profile-photo', 'private-img'].join(' ')
              : 'profile-photo'
          }
        >
          {(!isJoin || (isJoin && channel.openType === 'O')) &&
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
                {(channel.roomName && channel.roomName[0]) || 'N'}
              </div>
            ))}
        </div>

        {channel.openType !== 'O' && <span className="private" />}
        <span className="channelName">
          <span>
            {channel.roomName === ''
              ? covi.getDic('NoTitle', '제목없음')
              : channel.roomName}
          </span>
          <span className="categoryName">
            {channel.categoryName ? `(${channel.categoryName})` : ''}
            {pinnedTop && '📌'}
          </span>
        </span>
        <span className="preview">{lastMessageText}</span>

        <div className="check">
          <div className="chkStyle02">
            <input
              ref={checkRef}
              type="checkbox"
              id={checkObj.name + checkedValue}
              name={checkObj.name + checkedValue}
              onClick={e => {
                e.stopPropagation();
              }}
              onChange={e => {
                checkObj.onChange(e, channel, isJoin);
              }}
              checked={
                checkObj.checkedList.find(
                  item =>
                    (item[checkObj.checkedKey] ||
                      item[checkObj.checkedSubKey]) === checkedValue,
                ) !== undefined
              }
            />
            <label
              htmlFor={checkObj.name + checkedValue}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <span></span>
            </label>
          </div>
        </div>
      </>
    </li>
  );
};

export default ChannelItem;
