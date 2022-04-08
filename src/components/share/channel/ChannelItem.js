import React, {
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { getConfig } from '@/lib/util/configUtil';
import * as common from '@/lib/common';
import Config from '@/config/config';

const ChannelItem = ({ channel, checkObj, isJoin, pinnedTop }) => {
  const id = useSelector(({ login }) => login.id);
  const channels = useSelector(({ channel }) => channel.channels);
  const checkRef = useRef(null);

  const checkedValue = useMemo(() => {
    if (typeof checkObj === 'undefined') {
      return;
    }
    // userInfo[checkedKey] 값이 비어있으면 checkedSubKey 참조
    if (typeof checkObj.checkedSubKey !== 'undefined') {
      return channel[checkObj.checkedKey] || channel[checkObj.checkedSubKey];
    }
    return channel[checkObj.checkedKey];
  }, [channel, checkObj]);

  const [lastMessageText, setLastMessageText] = useState('');

  useLayoutEffect(() => {
    const changeTargetChannel = channels.find(c => c.roomId == channel.roomId);
    if (changeTargetChannel) {
      makeMessageText(
        changeTargetChannel.lastMessage,
        changeTargetChannel.lastMessageType,
      ).then(setLastMessageText);
    } else {
      makeMessageText(channel.lastMessage, channel.lastMessageType).then(
        setLastMessageText,
      );
    }
  }, [channel]);

  const handleClick = useCallback(() => {
    checkRef && checkRef.current && checkRef.current.click();
  }, [checkRef]);

  const makeMessageText = async lastMessage => {
    let returnText = covi.getDic('Msg_NoMessages', '대화내용 없음');

    try {
      let msgObj = null;

      if (typeof lastMessage == 'string') {
        msgObj = JSON.parse(lastMessage);
      } else if (typeof lastMessage == 'object') {
        msgObj = lastMessage;
      }

      if (!msgObj) return returnText;

      if (msgObj.Message !== '' && msgObj.Message !== null) {
        // returnText = commonApi.getPlainText(msgObj.Message);
        let drawText = (msgObj.Message && msgObj.Message) || '';
        if (common.isJSONStr(msgObj.Message)) {
          const drawData = JSON.parse(msgObj.Message);

          if (drawData.msgType == 'C') {
            drawText = common.getDictionary(drawData.title);
          } else {
            drawText = drawData.context;
          }
        }
        // protocol check
        if (common.eumTalkRegularExp.test(drawText)) {
          const messageObj =
            await common.convertEumTalkProtocolPreviewForChannelItem(drawText);
          if (messageObj.type == 'emoticon')
            returnText = covi.getDic('Emoticon', '이모티콘');
          else returnText = messageObj.message.split('\n')[0];
        } else {
          // 첫줄만 노출
          returnText = drawText.split('\n')[0];
        }
      } else if (msgObj.File) {
        let fileObj = null;

        if (typeof msgObj.File == 'string') {
          fileObj = JSON.parse(msgObj.File);
        } else if (typeof msgObj.File == 'object') {
          fileObj = msgObj.File;
        }

        if (!fileObj) return returnText;

        // files 일경우
        if (fileObj.length != undefined && fileObj.length > 1) {
          const firstObj = fileObj[0];
          if (
            firstObj.ext == 'png' ||
            firstObj.ext == 'jpg' ||
            firstObj.ext == 'jpeg' ||
            firstObj.ext == 'bmp'
          ) {
            // 사진 외 %s건
            returnText = common.getSysMsgFormatStr(
              covi.getDic('Tmp_imgExCnt', 'Tmp_imgExCnt'),
              [{ type: 'Plain', data: fileObj.length - 1 }],
            );
          } else {
            // 파일 외 %s건
            returnText = common.getSysMsgFormatStr(
              covi.getDic('Tmp_fileExCnt', '파일 외 %s건'),
              [{ type: 'Plain', data: fileObj.length - 1 }],
            );
          }
        } else {
          if (
            fileObj.ext == 'png' ||
            fileObj.ext == 'jpg' ||
            fileObj.ext == 'jpeg' ||
            fileObj.ext == 'bmp'
          ) {
            returnText = covi.getDic('Image', '사진');
          } else {
            returnText = covi.getDic('File', '파일');
          }
        }
      }
    } catch (e) {
      // console.log(e);
    }

    return returnText;
  };

  return (
    <li className="person" onClick={() => handleClick()}>
      <>
        <div
          className={
            isJoin && channel.openType != 'O'
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
            {channel.roomName == ''
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
