import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as emoticonApi from '@/lib/emoticon';
import Config from '@/config/config';
import Scrollbars from 'react-custom-scrollbars';
import { getConfig } from '@/lib/util/configUtil';

const EmoticonLayer = ({ onClick }) => {
  const { userInfo } = useSelector(({ login }) => ({
    userInfo: login.userInfo,
  }));

  const storagePrefix = getConfig('storePrefix', '/storage/');

  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState(null);
  const [emoticons, setEmoticons] = useState(null);
  const [selectItem, setSelectItem] = useState(null);

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

  const handleChangeGroup = gid => {
    if (groupId !== gid) {
      setEmoticons(null);
      setGroupId(gid);
    }
  };

  const handleSelect = item => {
    setSelectItem(item);
  };

  const handleSend = item => {
    const sendData = `eumtalk://emoticon.${item.GroupName}.${item.EmoticonName}.${item.EmoticonType}.${item.CompanyCode}`;
    onClick(sendData);
    setSelectItem(null);
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
              cursor: 'pointer',
            }}
            onClick={e => {
              handleSend(selectItem);
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
            <span
              style={{
                display: 'flex',
                position: 'absolute',
                bottom: '5px',
                right: '0px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#ECECEC',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20.066"
                height="25.802"
                viewBox="0 0 20.066 25.802"
              >
                <g transform="translate(7.704 -0.001) rotate(45)">
                  <g transform="translate(-0.001 0.002)">
                    <g transform="translate(0 0)">
                      <path
                        d="M.337,6.861A.537.537,0,0,0,.3,7.843l6.291,3.051L17.485,0Z"
                        transform="translate(0.001 -0.002)"
                        fill="#6d6d6d"
                      ></path>
                    </g>
                  </g>
                  <g transform="translate(7.352 0.761)">
                    <path
                      d="M206.344,32.2l3.051,6.291a.537.537,0,0,0,.483.3h.019a.537.537,0,0,0,.479-.337l6.859-17.148Z"
                      transform="translate(-206.344 -21.306)"
                      fill="#6d6d6d"
                    ></path>
                  </g>
                </g>
              </svg>
            </span>
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
                        handleSelect(item);
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
    </div>
  );
};

export default EmoticonLayer;
