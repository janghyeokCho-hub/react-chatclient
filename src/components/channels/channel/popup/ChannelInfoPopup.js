import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Config from '@/config/config';
import { getConfig } from '@/lib/util/configUtil';
import {
  getChannelCategories,
  modifyChannelInfo,
  uploadChannelIcon,
} from '@/modules/channel';
import { close } from '@/modules/popup';

import { getAesUtil } from '@/lib/aesUtil';
import { openPopup, openPopupToFront } from '@/lib/common';

const ChannelInfoPopup = () => {
  const { popups, myInfo, channelCategories, currentChannel } = useSelector(
    ({ popup, login, channel }) => ({
      popups: popup.popups,
      myInfo: login.userInfo,
      channelCategories: channel.categories,
      currentChannel: channel.currentChannel,
    }),
  );

  const [visible, setVisible] = useState(false);

  const [iconImagePath, setIconImagePath] = useState(null);
  const [icon, setIcon] = useState(null);

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [displayCategory, setDisplayCategory] = useState(false);
  const [openType, setOpenType] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [roomId, setRoomId] = useState('');

  const [openPopType, setOpenPopType] = useState('');

  const IsSaaSClient = getConfig('IsSaaSClient', 'N');
  const fileUploadControl = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (channelCategories == null || channelCategories.length == 0)
      if (IsSaaSClient == 'Y')
        dispatch(getChannelCategories({ companyCode: myInfo.CompanyCode }));
      else dispatch(getChannelCategories());
  }, []);

  useEffect(() => {
    if (popups.length > 0) {
      const openPop = popups[0];
      const popType = openPop.type;
      setOpenPopType(popType);

      if (popType == 'ChannelInfo' || popType == 'ChannelInfoModify') {
        if (!visible) {
          setRoomId(currentChannel.roomId || currentChannel.roomID);
          setIconImagePath(
            currentChannel.iconPath ? currentChannel.iconPath : '',
          );
          setDisplayName(currentChannel.roomName);
          setDescription(
            currentChannel.description ? currentChannel.description : '',
          );
          setCategory({
            categoryCode: currentChannel.categoryCode,
            categoryName: currentChannel.categoryName,
          });
          setOpenType(currentChannel.openType);

          setVisible(true);
        }
      }
    }
  }, [popups]);

  // 채널 아이콘
  const handleFileChange = useCallback(
    e => {
      const target = e.target;

      if (target.files.length > 0) {
        const iconImage = target.files[0];

        // validation check
        if (!iconImage.type.startsWith('image/')) {
          openPopup(
            {
              type: 'Alert',
              message: covi.getDic('Msg_InvalidImage'),
              callback: () => {},
            },
            dispatch,
          );
          return;
        }

        setIconImagePath(URL.createObjectURL(iconImage));
        setIcon(iconImage);
      }
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    setVisible(false);
    dispatch(close());
  }, [dispatch]);

  const handleModifyChannelInfo = useCallback(() => {
    // 채널 아이콘 수정
    if (icon) {
      const formData = new FormData();
      formData.append('fileName', icon);
      formData.append('roomId', roomId);
      dispatch(uploadChannelIcon(formData));
    }

    // 비밀번호 암호화
    let encryptSecretKey = '';
    if (openType != 'O' && secretKey) {
      const AESUtil = getAesUtil();
      encryptSecretKey = AESUtil.encrypt(secretKey);
    }

    // 채널 정보 수정
    dispatch(
      modifyChannelInfo({
        roomId,
        description,
        roomName: displayName,
        categoryCode: category.categoryCode,
        secretKey: encryptSecretKey,
      }),
    );
    handleClose();
  }, [dispatch, roomId, description, displayName, category, secretKey]);

  return (
    <>
      {visible && (
        <div
          style={{
            position: 'fixed',
            left: '0',
            right: '0',
            top: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            zIndex: '750',
          }}
        >
          <div className="popup-layer-wrap Layer-AddChannel">
            <div className="popup-layer">
              <div
                style={{ cursor: 'default' }}
                className="add-cover-photo"
                onClick={() => {
                  if (openPopType == 'ChannelInfoModify')
                    fileUploadControl.current.click();
                }}
              >
                {iconImagePath ? (
                  <img
                    src={
                      // openPopType === 'ChannelInfoModify'
                      // ?
                      icon
                        ? `${iconImagePath}`
                        : `${Config.ServerURL.HOST}${iconImagePath}`
                      // : openPopType === 'ChannelInfoModify'
                      //   ? `${iconImagePath}`
                      //   : `${Config.ServerURL.HOST}${iconImagePath}`
                    }
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '15px',
                    }}
                    onError={e => {
                      e.target.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
                      e.target.onerror = null;
                    }}
                  ></img>
                ) : (
                  <span>{covi.getDic('AddPhoto')}</span>
                )}
                {openPopType === 'ChannelInfoModify' && (
                  <input
                    ref={fileUploadControl}
                    type="file"
                    accept="image/*"
                    style={{ opacity: '0.0' }}
                    onChange={handleFileChange}
                    readOnly={openPopType === 'ChannelInfo'}
                  />
                )}
              </div>

              <div className="Profile-info-input">
                <div className="input full">
                  <label
                    style={{ cursor: 'default' }}
                    className="string optional"
                    htmlFor="user-name"
                  >
                    {covi.getDic('ChannelName')}
                  </label>
                  {openPopType === 'ChannelInfoModify' ? (
                    <input
                      className="string optional"
                      placeholder={covi.getDic('Msg_InputChannelName')}
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      readOnly={openPopType === 'ChannelInfo'}
                    />
                  ) : (
                    <input
                      style={{ cursor: 'default' }}
                      className="string optional"
                      placeholder={covi.getDic('Msg_InputChannelName')}
                      type="text"
                      value={displayName}
                      readOnly={true}
                    />
                  )}
                </div>
                <div className="input full">
                  <label
                    style={{ cursor: 'default' }}
                    className="string optional"
                    htmlFor="user-name"
                  >
                    {covi.getDic('ChannelDescription')}
                  </label>
                  {openPopType === 'ChannelInfoModify' ? (
                    <input
                      className="string optional"
                      placeholder={covi.getDic('Msg_InputChannelDesc')}
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      readOnly={openPopType === 'ChannelInfo'}
                    />
                  ) : (
                    <input
                      style={{ cursor: 'default' }}
                      className="string optional"
                      placeholder={covi.getDic('Msg_InputChannelDesc')}
                      type="text"
                      value={description}
                      readOnly={true}
                    />
                  )}
                </div>
                <div className="input full">
                  <label
                    style={{ cursor: 'default' }}
                    className="string optional"
                    htmlFor="user-name"
                  >
                    {covi.getDic('Category')}
                  </label>
                  <div className="link_select_box">
                    {openPopType === 'ChannelInfoModify' ? (
                      <a onClick={() => setDisplayCategory(!displayCategory)}>
                        {category.categoryName}
                      </a>
                    ) : (
                      <a style={{ cursor: 'default' }}>
                        {category.categoryName}
                      </a>
                    )}
                    {openPopType === 'ChannelInfoModify ' && (
                      <ul
                        className="select_list"
                        style={{ display: displayCategory ? 'block' : 'none' }}
                      >
                        {channelCategories.map(category => {
                          return (
                            <li
                              key={category.categoryCode}
                              onClick={() => {
                                setCategory(category);
                                setDisplayCategory(false);
                              }}
                            >
                              {category.categoryName}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
                {openType != 'O' && openPopType == 'ChannelInfoModify' && (
                  <div className="input full">
                    <label
                      style={{ cursor: 'default' }}
                      className="string optional"
                      htmlFor="user-name"
                    >
                      {covi.getDic('ChannelPassword')}
                    </label>
                    <input
                      className="string optional"
                      placeholder={covi.getDic('Msg_InputChannelPassword')}
                      type="password"
                      value={secretKey}
                      onChange={e => setSecretKey(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="btnbox">
                {openPopType == 'ChannelInfoModify' && (
                  // <a onClick={handleModifyChannelInfo}>
                  <a
                    onClick={() => {
                      if (!displayName) {
                        openPopupToFront(
                          {
                            type: 'Alert',
                            message: covi.getDic('Msg_InputChannelName'),
                          },
                          dispatch,
                        );
                      } else if (openType != 'O' && secretKey == '') {
                        openPopupToFront(
                          {
                            type: 'Alert',
                            message: covi.getDic('Msg_InputPassword'),
                          },
                          dispatch,
                        );
                      } else {
                        handleModifyChannelInfo();
                      }
                    }}
                  >
                    <span className="colortxt-point">
                      {covi.getDic('Modify')}
                    </span>
                  </a>
                )}
                <a>
                  <span className="colortxt-grey" onClick={() => handleClose()}>
                    {openPopType == 'ChannelInfoModify'
                      ? covi.getDic('Cancel')
                      : covi.getDic('Ok')}
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div className="bg_dim_layer"></div>
        </div>
      )}
    </>
  );
};

export default ChannelInfoPopup;
