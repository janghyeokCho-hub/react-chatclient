import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@COMMON/ProfileBox';
import { openChatRoomView } from '@/lib/roomUtil';
import { format } from 'date-fns';
import { getProfileInfo } from '@/lib/profile';
import { addFavorite, deleteFavorite } from '@/lib/contactUtil';
import { getConfig } from '@/lib/util/configUtil';
import axios from 'axios';

import {
  deleteLayer,
  clearLayer,
  getJobInfo,
  getDictionary,
} from '@/lib/common';
import useTyping from '@/hooks/useTyping';
import { useSyncFavorite } from '@/hooks/useSyncFavorite';

const ProfilePopup = ({ userInfo }) => {
  const { viewType, rooms, selectId, myInfo, contact } = useSelector(
    ({ room, login, contact }) => ({
      viewType: room.viewType,
      rooms: room.rooms,
      selectId: room.selectId,
      myInfo: login.userInfo,
      contact: contact.contacts,
    }),
  );

  const [isFavorite, setIsFavorite] = useState(userInfo.isFavorite);
  const { confirm } = useTyping();
  const dispatch = useDispatch();

  const makeCall = getConfig('makeCall', null);
  const { syncFavorite } = useSyncFavorite();

  const getAbsenceInfo = useMemo(() => {
    try {
      let absenceInfo = userInfo.absenceInfo;
      if (typeof userInfo.absenceInfo !== 'object') {
        try {
          absenceInfo = JSON.parse(userInfo.absenceInfo);
        } catch (e) {
          absenceInfo = null;
        }
      }

      return (
        <>
          <span className="team">
            {covi.getDic(`Ab_${absenceInfo.code}`, absenceInfo.code)}
          </span>
          <span className="team">{`${format(
            absenceInfo.startDate,
            `MM. dd`,
          )} ~ ${format(absenceInfo.endDate, `MM. dd`)}`}</span>
        </>
      );
    } catch (e) {
      return <></>;
    }
  }, [userInfo]);

  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, []);

  const handleFavorit = () => {
    if (userInfo.isFavorite === 'Y') {
      syncFavorite({
        op: 'del',
        userId: userInfo.id,
      });
      setIsFavorite('N');
      userInfo.isFavorite = 'N';
    } else if (userInfo.isFavorite === 'N') {
      syncFavorite({
        op: 'add',
        userInfo: userInfo,
      });
      setIsFavorite('Y');
      userInfo.isFavorite = 'Y';
    }
  };

  return (
    <div
      className="cover_profile type2"
      style={{
        width: '100%',
      }}
    >
      <div className="innerbox">
        <div className="profileheader">
          <a
            onClick={handleClose}
            className="closebtn"
            style={{ position: 'fixed' }}
          ></a>
          {userInfo.id != myInfo.id && (
            <a
              onClick={handleFavorit}
              className={['favoritebtn', isFavorite == 'Y' && 'active'].join(
                ' ',
              )}
              style={{ cursor: 'default' }}
            ></a>
          )}
        </div>
        <div className="profile-con-box">
          <div className="pro-photobox">
            <ProfileBox
              userId={userInfo.id}
              img={userInfo.photoPath}
              userName={userInfo.name}
              presence={userInfo.presence}
              isInherit={false}
              handleClick={false}
            />
            <div className="txtbox">
              <span
                className="name"
                style={{
                  wordBreak: 'break-all',
                  lineHeight: '1.0',
                }}
              >
                {getJobInfo(userInfo)}
                {userInfo.isMobile === 'Y' && (
                  <span style={{ padding: '0px 5px' }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="15"
                      viewBox="0 0 7 10"
                    >
                      <g transform="translate(-185 -231)">
                        <rect
                          width="7"
                          height="10"
                          transform="translate(185 231)"
                          fill="#4f5050"
                        ></rect>
                        <rect
                          width="5"
                          height="6"
                          transform="translate(186 232)"
                          fill="#fff"
                        ></rect>
                        <circle
                          cx="0.5"
                          cy="0.5"
                          r="0.5"
                          transform="translate(188 239)"
                          fill="#fff"
                        ></circle>
                      </g>
                    </svg>
                  </span>
                )}
              </span>
              <span
                className="team"
                style={{
                  wordBreak: 'break-all',
                  lineHeight: '1.0',
                }}
              >
                {getDictionary(userInfo.dept)}
              </span>
              {userInfo.absenceInfo && getAbsenceInfo}
            </div>
          </div>

          <div className="pro-infobox">
            <dl>
              <dt>{covi.getDic('Mobile', '휴대폰')}</dt>
              <dd>
                {userInfo.phoneNumber}
                {'  '}
                {makeCall?.isUse && userInfo?.phoneNumber?.length > 0 && (
                  <button
                    onClick={() => {
                      // make call
                      getProfileInfo(myInfo.id).then(({ data }) => {
                        if (data.result) {
                          const requestData = {
                            command: 'make',
                            caller: data.result.companyNumber,
                            callee: '9' + userInfo.phoneNumber,
                          };
                          console.log(requestData);
                          const reqOptions = {
                            method: 'POST',
                            url: makeCall.hostURL,
                            data: requestData,
                            headers: {
                              'Content-Type': 'application/json; charset=utf-8',
                            },
                          };
                          axios(reqOptions)
                            .then(data => {
                              console.log('request success >> ', data);
                            })
                            .catch(error => {
                              console.log('request error >> ', error);
                            });
                        }
                      });
                    }}
                  >
                    <svg
                      fill="none"
                      height="16"
                      stroke="#000"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="16"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                )}
              </dd>
            </dl>
            <dl>
              <dt>{covi.getDic('Phone', '내선번호')}</dt>
              <dd>
                {userInfo.companyNumber}
                {'  '}
                {makeCall?.isUse && userInfo?.companyNumber?.length > 0 && (
                  <button
                    onClick={() => {
                      // make call
                      getProfileInfo(myInfo.id).then(({ data }) => {
                        if (data.result) {
                          const requestData = {
                            command: 'make',
                            caller: data.result.companyNumber,
                            callee: userInfo.companyNumber,
                          };
                          const reqOptions = {
                            method: 'POST',
                            url: makeCall.hostURL,
                            data: requestData,
                            headers: {
                              'Content-Type': 'application/json; charset=utf-8',
                            },
                          };
                          axios(reqOptions)
                            .then(data => {
                              console.log('request success >> ', data);
                            })
                            .catch(error => {
                              console.log('request error >> ', error);
                            });
                        }
                      });
                    }}
                  >
                    <svg
                      fill="none"
                      height="16"
                      stroke="#000"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="16"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                )}
              </dd>
            </dl>
            <dl>
              <dt>{covi.getDic('Email', '이메일')}</dt>
              <dd>
                {userInfo.mailAddress == null ? '' : userInfo.mailAddress}
              </dd>
            </dl>
            <dl>
              <dt>{covi.getDic('Work', '담당업무')}</dt>
              <dd>
                <a>{userInfo.work == null ? '' : userInfo.work}</a>
              </dd>
            </dl>
          </div>
        </div>
        <div className="profile-link-btn">
          {userInfo.id != myInfo.id && (
            <ul>
              <li className="link-btn-chat">
                <a
                  onClick={() => {
                    const openChatRoomArgs = [
                      dispatch,
                      viewType,
                      rooms,
                      selectId,
                      userInfo,
                      myInfo,
                    ];
                    confirm(dispatch, openChatRoomView, openChatRoomArgs);
                    clearLayer(dispatch);
                  }}
                >
                  <span>{covi.getDic('StartChat', '대화시작')}</span>
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
