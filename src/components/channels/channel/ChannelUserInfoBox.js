import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import UserInfoBox from '@/components/common/UserInfoBox';
import IconConxtMenu from '@/components/common/popup/IconConxtMenu';

const ChannelUserInfoBox = ({ userId, userInfo, getMenuData, channelAuth }) => {
  const dispatch = useDispatch();

  const menus = getMenuData(dispatch, userInfo);
  const menuId = 'channelmember_' + userInfo.id;

  return (
    <>
      <UserInfoBox userInfo={userInfo} isInherit={true} isClick={false} />
      {channelAuth && userInfo.id != userId && (
        <IconConxtMenu menuId={menuId} menus={menus}>
          <button className="list-more-btn"></button>
        </IconConxtMenu>
      )}
    </>
  );
};

export default ChannelUserInfoBox;
