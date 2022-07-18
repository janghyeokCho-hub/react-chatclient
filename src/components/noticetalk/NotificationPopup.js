import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteLayer } from '@/lib/common';
import { getChannel } from '@/lib/noticetalk';

const NotificationPopup = ({ onChange }) => {
  const dispatch = useDispatch();
  const [channelList, setChannelList] = useState([]);
  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, []);

  const getChannelList = async () => {
    const response = await getChannel();
    if (response.data.status === 'SUCCESS') {
      setChannelList(response.data.result);
    }
  };

  const handleClick = useCallback(subject => {
    onChange?.(subject);
    handleClose();
  }, []);

  useEffect(() => {
    getChannelList();
  }, []);

  return (
    <div
      key="NotificationPopup"
      className="Layer-AddUser"
      style={{ height: '100%', minWidth: '400px' }}
    >
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>{covi.getDic('AddNotificationChannel', '알림 채널 추가')}</p>
        </div>
      </div>
      <div className="NotificationChannelList">
        {channelList?.map((channel, idx) => {
          return (
            <div
              className="NotificationChannel"
              key={idx}
              onClick={() => handleClick(channel)}
            >
              <div className="imgBox">
                <img src={channel.subjectPhoto} />
              </div>
              <p>{channel.subjectName}</p>
              <span className="del"></span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationPopup;
