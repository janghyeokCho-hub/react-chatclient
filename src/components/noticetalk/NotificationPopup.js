import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { deleteLayer } from '@/lib/common';
import useSWR from 'swr';
import { managesvr } from '@/lib/api';

export default function NotificationPopup({ onChange }) {
  const dispatch = useDispatch();
  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, []);

  const { data: channelList } = useSWR(
    '/noticetalk/list',
    async () => {
      const response = await managesvr('get', '/notice/subject');
      if (response.data.status === 'SUCCESS') {
        return response.data.result;
      } else {
        return;
      }
    },
    { revalidateOnFocus: false },
  );

  const handleClick = useCallback(subject => {
    onChange?.(subject);
    handleClose();
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
        {channelList &&
          channelList.map((channel, idx) => {
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
}
