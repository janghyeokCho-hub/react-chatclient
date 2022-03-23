// components\chat\ChatList.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { bound, setTopButton } from '@/modules/menu';
import { openLayer } from '@/lib/common';

import ChannelContainer from '@/containers/channel/ChannelContainer';
import CreateChannel from './layer/CreateChannel';
import ChannelCategoryList from './layer/ChannelCategoryList';

import ChannelCategoryIcon from '@/icons/svg/ChannelCategory';
import PlusIcon from '@/icons/svg/Plus';

const ChannelList = () => {
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      bound({ name: covi.getDic('Channel', '채널'), type: 'channellist' }),
    );
    if (isExtUser && isExtUser != 'Y') {
      dispatch(
        setTopButton([
          {
            code: 'showChannelCategory',
            alt: covi.getDic('Category', '카테고리'),
            onClick: () => {
              openLayer(
                {
                  component: (
                    <ChannelCategoryList
                      headerName={covi.getDic('Category', '카테고리')}
                    />
                  ),
                },
                dispatch,
              );
            },
            svg: <ChannelCategoryIcon />,
          },
          {
            code: 'crateChannel',
            alt: covi.getDic('CreateChannel'),
            onClick: () => {
              openLayer(
                {
                  component: (
                    <CreateChannel
                      headerName={covi.getDic('CreateChannel', '채널 생성')}
                    />
                  ),
                },
                dispatch,
              );
            },
            svg: <PlusIcon />,
          },
        ]),
      );
    }
  }, []);

  return <ChannelContainer />;
};

export default ChannelList;
