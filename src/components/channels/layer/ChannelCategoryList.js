// components\chat\chatroom\layer\InviteMember.js

import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Scrollbars from 'react-custom-scrollbars';

import * as channelApi from '@/lib/channel';
import { getChannelCategories, openChannel } from '@/modules/channel';
import { getConfig } from '@/lib/util/configUtil';
import LoadingWrap from '@COMMON/LoadingWrap';

import ChannelItem from '@C/channels/ChannelItem';
import { deleteLayer } from '@/lib/common';

const ChannelCategoryList = ({ headerName }) => {
  const [itemList, setItemList] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const { myInfo, channelCategoryList, channels, loading } = useSelector(
    ({ login, channel, loading }) => ({
      myInfo: login.userInfo,
      channelCategoryList: channel.categories,
      channels: channel.channels,
      loading: loading['channel/GET_CHANNEL_CATEGORIES'],
    }),
  );

  const IsSaaSClient = getConfig('IsSaaSClient', 'N');

  const dispatch = useDispatch();

  useEffect(() => {
    if (channelCategoryList && !currentCategory) {
      setItemList(channelCategoryList);
    }
  }, [channelCategoryList]);

  useEffect(() => {
    if (channelCategoryList === null || channelCategoryList.length === 0)
      if (IsSaaSClient == 'Y')
        dispatch(getChannelCategories({ companyCode: myInfo.CompanyCode }));
      else dispatch(getChannelCategories());
  }, []);

  const handleClose = useCallback(() => {
    deleteLayer(dispatch);
  }, []);

  const showChannelCategory = () => {
    setCurrentCategory(null);
    setItemList(channelCategoryList);
  };

  const handleCategory = category => {
    let searchType = 'type';
    let searchValue = '';

    if (category) {
      searchValue = category.categoryCode;
    } else {
      category = {
        categoryName: covi.getDic('All'),
      };
      searchType = 'name';
      searchValue = '';
    }
    setCurrentCategory(category);

    setSearchLoading(true);

    let reqDatas;

    if (IsSaaSClient == 'Y') {
      reqDatas = {
        type: searchType,
        value: searchValue,
        companyCode: myInfo.CompanyCode,
      };
    } else {
      reqDatas = {
        type: searchType,
        value: searchValue,
      };
    }
    channelApi
      .searchChannel({
        reqDatas,
      })
      .then(({ data }) => {
        if (data.status == 'SUCCESS') {
          setItemList(data.result);
        }
        setSearchLoading(false);
      })
      .catch(err => {
        // 초기화
        setSearchLoading(false);
      });
  };

  const handleChannelChange = roomId => {
    handleClose();
    dispatch(openChannel({ roomId }));
  };

  return (
    <div className="Layer-AddUser" style={{ height: '100%' }}>
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        <div className="modaltit">
          <p>
            <span>{headerName}</span>
          </p>
        </div>
      </div>

      <div className="OrgList" style={{ height: '100%' }}>
        {currentCategory && (
          <div className="org_tree_wrap">
            <a className="top_folder" onClick={showChannelCategory}>
              {covi.getDic('Top')}
            </a>
            <div className="scr_h">
              <ul>
                <li>
                  <a onClick={showChannelCategory}>{covi.getDic('Category')}</a>
                </li>
                <li>
                  <a>{currentCategory.categoryName}</a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {(loading || searchLoading) && <LoadingWrap />}
        {!(loading || searchLoading) && itemList && itemList.length > 0 && (
          <Scrollbars
            autoHide={true}
            style={{
              overflowX: 'hidden',
              boxSizing: 'border-box',
              height: 'calc(100% - 124px)',
            }}
            renderTrackHorizontal={() => <div style={{ display: 'none' }} />}
          >
            {/*
            <ul className="people">
              {itemList.map((item, index) => {
                return currentCategory ? (
                  <ChannelItem
                    key={item.roomId}
                    channel={item}
                    onChannelChange={() => {}}
                    dbClickEvent={false}
                    isSelect={false}
                    getMenuData={() => {}}
                    isJoin={true}
                    isCategory={true}
                  />
                ) : (
                  <li
                    key={item.categoryCode}
                    className="person"
                    onClick={() => handleCategory(item)}
                  >
                    {item.categoryName}
                  </li>
                );
              })}
            </ul> */}
            {currentCategory ? (
              <ul className="people">
                {itemList.map((item, index) => {
                  const channelIdx = channels.findIndex(
                    c => c.roomId == item.roomId,
                  );
                  if (channelIdx > -1) {
                    item.isJoin = false;
                  } else {
                    item.isJoin = true;
                  }

                  return (
                    <ChannelItem
                      key={item.roomId}
                      channel={item}
                      onChannelChange={handleChannelChange}
                      dbClickEvent={false}
                      isSelect={false}
                      getMenuData={() => {}}
                      isJoin={true}
                      isCategory={true}
                    />
                  );
                })}
              </ul>
            ) : (
              <ul className="channel-category">
                <li
                  key={`CHANNEL-CATOEGRYall`}
                  onClick={() => handleCategory(null)}
                >
                  <div className="category-box all">
                    <p className="category-box-txt">{covi.getDic('All')}</p>
                  </div>
                </li>
                {itemList.map((item, index) => (
                  <li
                    key={`CHANNEL-CATOEGRY${item.categoryCode}`}
                    onClick={() => handleCategory(item)}
                  >
                    <div className="category-box">
                      <p className="category-box-txt">{item.categoryName}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Scrollbars>
        )}
      </div>
    </div>
  );
};

export default ChannelCategoryList;
