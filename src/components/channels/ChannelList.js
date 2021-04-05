// components\chat\ChatList.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { bound, setTopButton } from '@/modules/menu';
import { openLayer } from '@/lib/common';

import ChannelContainer from '@/containers/channel/ChannelContainer';
import CreateChannel from './layer/CreateChannel';
import ChannelCategoryList from './layer/ChannelCategoryList';

const ChannelList = () => {
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bound({ name: covi.getDic('Channel'), type: 'channellist' }));
    if (isExtUser && isExtUser != 'Y') {
      dispatch(
        setTopButton([
          {
            code: 'showChannelCategory',
            alt: covi.getDic('Category'),
            onClick: () => {
              openLayer(
                {
                  component: (
                    <ChannelCategoryList headerName={covi.getDic('Category')} />
                  ),
                },
                dispatch,
              );
            },
            svg: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <g transform="translate(-271 -56)">
                  <g
                    transform="translate(271 56)"
                    fill="none"
                    stroke="#333"
                    strokeWidth="1.2"
                  >
                    <rect width="7" height="7" rx="1" stroke="none"></rect>
                    <rect
                      x="0.6"
                      y="0.6"
                      width="5.8"
                      height="5.8"
                      rx="0.4"
                      fill="none"
                    ></rect>
                  </g>
                  <g
                    transform="translate(271 65)"
                    fill="none"
                    stroke="#333"
                    strokeWidth="1.2"
                  >
                    <rect width="7" height="7" rx="1" stroke="none"></rect>
                    <rect
                      x="0.6"
                      y="0.6"
                      width="5.8"
                      height="5.8"
                      rx="0.4"
                      fill="none"
                    ></rect>
                  </g>
                  <g
                    transform="translate(280 56)"
                    fill="none"
                    stroke="#333"
                    strokeWidth="1.2"
                  >
                    <rect width="7" height="7" rx="1" stroke="none"></rect>
                    <rect
                      x="0.6"
                      y="0.6"
                      width="5.8"
                      height="5.8"
                      rx="0.4"
                      fill="none"
                    ></rect>
                  </g>
                  <g
                    transform="translate(280 65)"
                    fill="none"
                    stroke="#333"
                    strokeWidth="1.2"
                  >
                    <rect width="7" height="7" rx="1" stroke="none"></rect>
                    <rect
                      x="0.6"
                      y="0.6"
                      width="5.8"
                      height="5.8"
                      rx="0.4"
                      fill="none"
                    ></rect>
                  </g>
                </g>
              </svg>
            ),
          },
          {
            code: 'crateChannel',
            alt: covi.getDic('CreateChannel'),
            onClick: () => {
              openLayer(
                {
                  component: (
                    <CreateChannel headerName={covi.getDic('CreateChannel')} />
                  ),
                },
                dispatch,
              );
            },
            svg: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
              >
                <g transform="translate(-344 -60)">
                  <rect
                    width="2"
                    height="14"
                    transform="translate(350 60)"
                    fill="#333"
                  ></rect>
                  <rect
                    width="2"
                    height="14"
                    transform="translate(358 66) rotate(90)"
                    fill="#333"
                  ></rect>
                </g>
              </svg>
            ),
          },
        ]),
      );
    }
  }, []);

  return <ChannelContainer />;
};

export default ChannelList;
