import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLayer, isJSONStr } from '@/lib/common';
import { modifyRoomSetting } from '@/modules/room';
import { modifyChannelSetting } from '@/modules/channel';
import LoadingWrap from '@/components/common/LoadingWrap';

const ChatSettingBox = ({ info, isChannel }) => {
  const loading = useSelector(
    ({ loading }) => loading['room/MODIFY_ROOMSETTING'],
  );
  const [lockInput, setLockInput] = useState('N');
  const dispatch = useDispatch();

  useEffect(() => {
    if (info.setting) {
      let setting = null;

      if (typeof info.setting === 'object') {
        setting = info.setting;
      } else if (isJSONStr(info.setting)) {
        setting = JSON.parse(info.setting);
      }

      setLockInput(setting.lockInput);
    }
  }, []);

  const handleChangeSetting = useCallback(
    (key, value) => {
      let setting = null;

      if (info.setting === null) {
        setting = {};
      } else if (typeof info.setting === 'object') {
        setting = { ...info.setting };
      } else if (isJSONStr(info.setting)) {
        setting = JSON.parse(info.setting);
      }

      setting[key] = value;

      if (!isChannel) {
        dispatch(
          modifyRoomSetting({
            roomID: info.roomID,
            key: key,
            value: value,
            setting: JSON.stringify(setting),
          }),
        );
      } else {
        dispatch(
          modifyChannelSetting({
            roomID: info.roomId,
            key: key,
            value: value,
            setting: JSON.stringify(setting),
          }),
        );
      }
    },
    [info, dispatch],
  );

  const handleClose = () => {
    deleteLayer(dispatch);
  };

  return (
    <>
      <div className="Layer-fileView" style={{ height: '100%' }}>
        <div className="modalheader">
          <a className="closebtn" onClick={handleClose}></a>
          <div className="modaltit">
            <p>{covi.getDic('ChatRoomSetting', '채팅방 설정')}</p>
          </div>
        </div>
        <div style={{ width: '100%' }}>
          <div className="ChatConfigCon">
            <ul>
              <li className="ChatConfig-list">
                <div
                  className={[
                    'opt_setting',
                    lockInput === 'Y' ? 'on' : '',
                  ].join(' ')}
                >
                  <span className="ctrl"></span>
                </div>
                <a
                  className="ChatConfig-menu"
                  onClick={e => {
                    const changeVal = lockInput === 'Y' ? 'N' : 'Y';
                    handleChangeSetting('lockInput', changeVal);
                    setLockInput(changeVal);
                  }}
                >
                  <span>{covi.getDic('LockInput', '입력창 잠금')}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {loading && <LoadingWrap></LoadingWrap>}
    </>
  );
};

export default ChatSettingBox;
