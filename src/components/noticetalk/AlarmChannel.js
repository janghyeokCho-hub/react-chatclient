import React, { useCallback } from 'react';
import NotificationPopup from '@/components/noticetalk/NotificationPopup';
import { appendLayer } from '@/lib/common';

const AlarmChannel = props => {
  const { setNoticeSubject, viewState, noticeSubject, targets, dispatch } =
    props;

  const handleNotificationPopup = useCallback(() => {
    appendLayer(
      {
        component: (
          <NotificationPopup onChange={subject => setNoticeSubject(subject)} />
        ),
      },
      dispatch,
    );
  }, [viewState, targets]);

  return (
    <>
      <div className="txtBox" style={{ padding: '0 30px' }}>
        <p>{covi.getDic('Notitification_Channel', '알림 채널')}</p>
      </div>
      <div
        className="org_select_wrap"
        style={{ marginRight: '30px', marginLeft: '30px' }}
      >
        <ul>
          {noticeSubject && (
            <li>
              <div>
                <div className="profile-photo">
                  <img src={noticeSubject.subjectPhoto}></img>
                </div>
                <p className="name">{noticeSubject.subjectName}</p>
                <span
                  className="del"
                  onClick={() => setNoticeSubject(null)}
                ></span>
              </div>
            </li>
          )}
          <li>
            <div className="add" onClick={handleNotificationPopup}>
              <a className="ui-link">
                <div
                  className={
                    noticeSubject
                      ? 'profile-photo addChange'
                      : 'profile-photo add'
                  }
                ></div>
              </a>
            </div>
          </li>
        </ul>
      </div>
    </>
  );
};

export default AlarmChannel;
