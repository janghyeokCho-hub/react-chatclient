import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as emoticonApi from '@/lib/emoticon';
import Config from '@/config/config';
import Scrollbars from 'react-custom-scrollbars';
import { getConfig } from '@/lib/util/configUtil';
import { selectEmoticon } from '@/modules/channel';

const EmoticonLayer = ({ onClick }) => {
  const { userInfo, selectedEmot } = useSelector(({ login, channel }) => ({
    userInfo: login.userInfo,
    selectedEmot: channel.selectEmoticon,
  }));

  const storagePrefix = getConfig('storePrefix', '/storage/');

  const emoticonRef = useRef(null);

  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState(null);
  const [emoticons, setEmoticons] = useState(null);
  const [selectItem, setSelectItem] = useState(null);

  const dispatch = useDispatch();

  const IsSaaSClient = getConfig('IsSaaSClient', 'N');

  useEffect(() => {
    // groups 받아오기
    const getGroups = async () => {
      try {
        // 이모티콘 그룹 호출 SaaS 처리에 따른 분기 처리
        // 언제가 될지 모르겠으나 추후 통합하는 과정이 필요함
        let response;
        if (IsSaaSClient == 'Y') {
          response = await emoticonApi.getGroupsWithSaaS({
            companyCode: userInfo.CompanyCode,
          });
        } else {
          response = await emoticonApi.getGroups();
        }

        if (response.data.status == 'SUCCESS') {
          const groups = response.data.result;
          if (groups) {
            setGroups(groups);
            setGroupId(groups[0].GroupID);
          }
        }
      } catch (e) {
        console.log('emoticon error !! :: ', e);
      }
    };
    getGroups();
  }, []);

  useEffect(() => {
    // groupId 값이 있을 경우에만
    if (groupId) {
      // emoticons 받아오기
      const getEmoticons = async () => {
        try {
          let response;
          if (IsSaaSClient == 'Y') {
            response = await emoticonApi.getEmoticonsWithSaaS({
              groupId,
              companyCode: userInfo.CompanyCode,
            });
          } else {
            response = await emoticonApi.getEmoticons({ groupId });
          }
          if (response.data.status == 'SUCCESS') {
            const emoticons = response.data.result;
            if (emoticons) {
              setEmoticons(emoticons);
            }
          }
        } catch (e) {}
      };

      getEmoticons();
    }
  }, [groupId]);

  useEffect(() => {
    dispatch(
      selectEmoticon({
        selectEmoticon: selectItem,
      }),
    );
  }, [selectItem]);

  const handleChangeGroup = gid => {
    if (groupId !== gid) {
      setEmoticons(null);
      setGroupId(gid);
    }
  };

  const handleSend = item => {
    const sendData = `eumtalk://emoticon.${item.GroupName}.${item.EmoticonName}.${item.EmoticonType}.${item.CompanyCode}`;
    onClick(sendData);
    setSelectItem(null);
  };

  const handleKeyDown = (e, item) => {
    console.log(e);
    console.log(item);
    if (!e.shiftKey && e.keyCode == 13) {
      console.log(item);
      if (item != null) {
        handleSend(item);
      }
    }
  };

  return (
    <div className="chat_sticker" style={{ overflow: 'visible' }}>
      {selectItem && (
        <div
          style={{
            width: '100%',
            height: '150px',
            marginTop: '-150px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            position: 'relative',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              top: '15px',
              right: '15px',
              position: 'absolute',
              cursor: 'pointer',
            }}
            onClick={e => {
              setSelectItem(null);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 16 16"
            >
              <g transform="translate(0.488)">
                <path
                  d="M8,0A8,8,0,1,1,0,8,8,8,0,0,1,8,0Z"
                  transform="translate(-0.488)"
                  fill="#999"
                ></path>
                <g transform="translate(4.513 5.224)">
                  <path
                    d="M128.407,133.742a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12l2.284-2.165,2.284,2.165a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12.39.39,0,0,0,0-.565l-2.277-2.158,2.277-2.165a.39.39,0,0,0,0-.564.437.437,0,0,0-.6,0l-2.277,2.165L129,128.3a.444.444,0,0,0-.6,0,.39.39,0,0,0,0,.564l2.284,2.158-2.277,2.165A.371.371,0,0,0,128.407,133.742Z"
                    transform="translate(-128.279 -128.173)"
                    fill="#fff"
                  ></path>
                </g>
              </g>
            </svg>
          </span>
          <div
            style={{
              width: '140px',
              height: '140px',
              margin: '0px auto',
              boxSizing: 'border-box',
              padding: '5px',
              position: 'relative',
            }}
          >
            <img
              style={{ width: '100%', height: '100%', borderRadius: '5px' }}
              src={
                IsSaaSClient == 'Y'
                  ? `${Config.ServerURL.HOST}${storagePrefix}emoticon/${
                      selectItem.CompanyCode
                    }/${selectItem.GroupName}/${selectItem.EmoticonName}.${
                      selectItem.EmoticonType === 'A' ? 'gif' : 'png'
                    }`
                  : `${Config.ServerURL.HOST}${storagePrefix}emoticon/${
                      selectItem.GroupName
                    }/${selectItem.EmoticonName}.${
                      selectItem.EmoticonType === 'A' ? 'gif' : 'png'
                    }`
              }
              onError={e => {
                e.target.src = `${Config.ServerURL.HOST}${storagePrefix}no_image.jpg`;
                e.target.onerror = null;
              }}
            />
          </div>
        </div>
      )}
      <div className="chat_sticker_tab">
        <ul className="chat_lst_sticker_set">
          {groups &&
            groups.map(item => {
              return (
                <li
                  key={item.GroupID}
                  className={item.GroupID == groupId ? 'on' : ''}
                >
                  <button
                    type="button"
                    className="stickerPackBtn"
                    onClick={e => {
                      handleChangeGroup(item.GroupID);
                    }}
                  >
                    <img
                      src={
                        IsSaaSClient == 'Y'
                          ? `${Config.ServerURL.HOST}${storagePrefix}emoticon/${item.CompanyCode}/${item.GroupName}/${item.GroupName}.png`
                          : `${Config.ServerURL.HOST}${storagePrefix}emoticon/${item.GroupName}/${item.GroupName}.png`
                      }
                      onError={e => {
                        e.target.src = `${Config.ServerURL.HOST}${storagePrefix}no_image.jpg`;
                        e.target.onerror = null;
                      }}
                    />
                  </button>
                </li>
              );
            })}
        </ul>
      </div>

      <div className="chat_sticker_list">
        <Scrollbars
          autoHide={true}
          style={{
            overflowX: 'hidden',
            boxSizing: 'border-box',
            height: '175px',
          }}
          renderTrackHorizontal={() => <div style={{ display: 'none' }} />}
        >
          <ul>
            {emoticons &&
              emoticons.map(item => {
                return (
                  <li key={item.EmoticonID}>
                    <a
                      onClick={e => {
                        setSelectItem(item);
                        emoticonRef.current.focus();
                      }}
                      onDoubleClick={e => {
                        handleSend(item);
                      }}
                      className="stickerBtn"
                    >
                      <img
                        src={
                          IsSaaSClient == 'Y'
                            ? `${Config.ServerURL.HOST}${storagePrefix}emoticon/${item.CompanyCode}/${item.GroupName}/${item.EmoticonName}.png`
                            : `${Config.ServerURL.HOST}${storagePrefix}emoticon/${item.GroupName}/${item.EmoticonName}.png`
                        }
                        onError={e => {
                          e.target.src = `${Config.ServerURL.HOST}${storagePrefix}no_image.jpg`;
                          e.target.onerror = null;
                        }}
                      />
                    </a>
                  </li>
                );
              })}
          </ul>
        </Scrollbars>
      </div>
      <input
        className="chat_focus"
        type="text"
        valiue=""
        ref={emoticonRef}
        onKeyDown={e => {
          handleKeyDown(e, selectItem);
        }}
        style={{ height: 0, width: 0 }}
      />
    </div>
  );
};

export default EmoticonLayer;
