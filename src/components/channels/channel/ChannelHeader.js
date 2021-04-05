// components\chat\chatroom\ChatRoomHeader.js

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileBox from '@/components/common/ProfileBox';
import ChannelMenuBox from '@/components/channels/channel/layer/ChannelMenuBox';
import { searchMessage } from '@/modules/message';
import { openLayer } from '@/lib/common';
import Config from '@/config/config';
import LoadingWrap from '@COMMON/LoadingWrap';

const ChannelHeader = ({
  channelInfo,
  isMakeRoom,
  onSearchBox,
  onNewWin,
  isNewWin,
}) => {
  const { id } = useSelector(({ login }) => ({
    id: login.id,
  }));

  const dispatch = useDispatch();

  const handleLayerBox = () => {
    let channelAuth = false;
    if (channelInfo && channelInfo.members) {
      const myChannelMembership = channelInfo.members.find(cm => cm.id === id);
      if (myChannelMembership) {
        channelAuth = myChannelMembership.channelAuth == 'Y';
      }
    }
    openLayer(
      {
        component: (
          <ChannelMenuBox
            key={`channelmember_${channelInfo.id}`}
            channelInfo={channelInfo}
            isMakeRoom={isMakeRoom}
            isNewWin={isNewWin}
            channelAuth={channelAuth}
          />
        ),
      },
      dispatch,
    );
  };

  const viewSearchBox = () => {
    onSearchBox(true);
  };
  return (
    <>
      {!channelInfo && <LoadingWrap />}
      {channelInfo && (
        <div className="top">
          <>
            <div className="profile-photo">
              {(channelInfo.iconPath && (
                <img
                  src={`${Config.ServerURL.HOST}${channelInfo.iconPath}`}
                  onError={e => {
                    e.target.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
                    e.target.onerror = null;
                  }}
                ></img>
              )) || (
                <div className="spare-text">
                  {(channelInfo.roomName && channelInfo.roomName[0]) || 'N'}
                </div>
              )}
            </div>

            <span className="name">
              {channelInfo.roomName}({channelInfo.categoryName}){' '}
              <span className="usernumber">
                {channelInfo.members
                  ? channelInfo.members.length
                  : channelInfo.realMemberCnt}
              </span>
            </span>
            <div className="LeftMenuBox">
              {!isMakeRoom && (
                <button type="button" onClick={viewSearchBox}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13.364"
                    height="13.364"
                    viewBox="0 0 13.364 13.364"
                  >
                    <path
                      d="M304.2,2011.439l-3.432-3.432a5.208,5.208,0,0,0,.792-2.728,5.279,5.279,0,1,0-5.28,5.279,5.208,5.208,0,0,0,2.728-.792l3.432,3.432a.669.669,0,0,0,.88,0l.88-.88A.669.669,0,0,0,304.2,2011.439Zm-7.919-2.64a3.52,3.52,0,1,1,3.52-3.52A3.53,3.53,0,0,1,296.279,2008.8Z"
                      transform="translate(-291 -2000)"
                      fill="#ababab"
                    ></path>
                  </svg>
                </button>
                /* 새창 */
              )}
              {onNewWin && (
                <button
                  type="button"
                  onClick={e => {
                    onNewWin();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12.427"
                    height="12.427"
                    viewBox="0 0 12.427 12.427"
                  >
                    <g transform="translate(3120 -672.573)">
                      <path
                        d="M10,12H2a2,2,0,0,1-2-2V2A2,2,0,0,1,2,0H5.539V1.846H1.846v8.308h8.308V6.462H12V10A2,2,0,0,1,10,12Z"
                        transform="translate(-3120 673)"
                        fill="#ababab"
                      ></path>
                      <g transform="translate(-3113.286 673.846)">
                        <path
                          d="M10.5,14.94l4.44-4.44"
                          transform="translate(-10.5 -10.5)"
                          fill="none"
                          stroke="#ababab"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        ></path>
                        <path
                          d="M10.5,10.5h2.819v2.819h0"
                          transform="translate(-8.88 -10.5)"
                          fill="none"
                          stroke="#ababab"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        ></path>
                      </g>
                    </g>
                  </svg>
                </button>
              )}
              <button type="button" onClick={handleLayerBox}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13.25"
                  height="10.25"
                  viewBox="0 0 13.25 10.25"
                >
                  <path
                    d="M3,16.25H16.25V14.542H3Zm0-4.271H16.25V10.271H3ZM3,6V7.708H16.25V6Z"
                    transform="translate(-3 -6)"
                    fill="#ababab"
                  ></path>
                </svg>
              </button>
            </div>
          </>
        </div>
      )}
    </>
  );
};

export default ChannelHeader;
