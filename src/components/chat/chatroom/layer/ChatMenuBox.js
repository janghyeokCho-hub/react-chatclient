import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import InviteMember from '@/components/chat/chatroom/layer/InviteMember';
import UserInfoBox from '@/components/common/UserInfoBox';
import { clearLayer, appendLayer, openPopup, getDictionary } from '@/lib/common';
import { Scrollbars } from 'react-custom-scrollbars';
import PhotoSummary from '@/components/chat/chatroom/layer/PhotoSummary';
import FileSummary from '@/components/chat/chatroom/layer/FileSummary';
import ChatSettingBox from '@/components/chat/chatroom/layer/ChatSettingBox';
import { leaveRoomUtil } from '@/lib/roomUtil';
import { modifyRoomName, setBackground } from '@/modules/room';
import { downloadMessageData } from '@/lib/fileUpload/coviFile';
import { bindLeaveChatRoom } from '@/lib/deviceConnector';
import { evalConnector } from '@/lib/deviceConnector';
import ColorBox from '@COMMON/buttons/ColorBox';
import { insert, remove } from '@/lib/util/storageUtil';
import { getConfig } from '@/lib/util/configUtil';
import useOffset from '@/hooks/useOffset';

const autoHide = getConfig('AutoHide_ChatMemberScroll', 'Y') === 'Y';

const ChatMenuBox = ({ roomInfo, isMakeRoom, isNewWin }) => {
  const { id, makeInfo, viewType } = useSelector(({ login, room }) => ({
    id: login.id,
    makeInfo: room.makeInfo,
    viewType: room.viewType,
  }));
  const isExtUser = useSelector(({ login }) => login.userInfo.isExtUser);

  const [isNoti, setIsNoti] = useState(true);
  const [isFix, setIsFix] = useState(false);
  const RENDER_INIT = 10;
  const RENDER_UNIT = 8;
  const { isDone, nextStep, list, handleScrollUpdate } = useOffset(roomInfo.members, { initialNumToRender: RENDER_INIT, renderPerBatch: RENDER_UNIT });
  const handleUpdate = handleScrollUpdate({
    threshold: 0.9
  });
  const forceDisableNoti = getConfig('ForceDisableNoti', 'N') === 'Y';

  const dispatch = useDispatch();

  useEffect(() => {
    if (DEVICE_TYPE == 'd' && !isMakeRoom) {
      const userConfig = evalConnector({
        method: 'getGlobal',
        name: 'USER_SETTING',
      });

      if (userConfig && userConfig.config) {
        // notiExRooms에 없거나 등록된경우에도 false로 등록됨으로 not 연산자 처리
        const notiExRooms = userConfig.get(`notiExRooms.${roomInfo.roomID}`);
        setIsNoti(!notiExRooms);

        if (roomInfo && roomInfo.roomType == 'A') {
          // fix 정보 조회
          const notiFixRooms = userConfig.get(
            `notiFixRooms.${roomInfo.roomID}`,
          );

          // default가 꺼짐
          setIsFix(notiFixRooms);
        }
      }
    }
  }, []);

  const handleInvite = () => {
    appendLayer(
      {
        component: (
          <InviteMember
            headerName={covi.getDic('AddChatMembers')}
            roomId={roomInfo.roomID}
            roomType={roomInfo.roomType}
            isNewRoom={false}
            oldMemberList={roomInfo.members}
          />
        ),
      },
      dispatch,
    );
  };

  const handleLeaveRoom = () => {
    leaveRoomUtil(
      dispatch,
      roomInfo,
      id,
      () => {
        if (isNewWin) {
          if (DEVICE_TYPE == 'b') {
            window.onunload = null;
            if (typeof window.opener.parent.newWinLeaveCallback == 'function') {
              window.opener.parent.newWinLeaveCallback(roomInfo, id);
            }
            window.close();
          } else {
            bindLeaveChatRoom(roomInfo, id);
          }
        } else {
          clearLayer(dispatch);
        }
      },
      isNewWin,
    );
  };

  const handleCreateInvite = () => {
    appendLayer(
      {
        component: (
          <InviteMember
            headerName={covi.getDic('AddChatMembers')}
            roomId={roomInfo.roomID}
            roomType={roomInfo.roomType}
            isNewRoom={true}
            oldMemberList={makeInfo.members}
          />
        ),
      },
      dispatch,
    );
  };

  const handleCreateLeaveRoom = () => {
    // TODO: 보완필요
    if (isNewWin) {
      if (DEVICE_TYPE == 'b') {
        window.close();
      }
    } else {
      clearLayer(dispatch);
    }
  };

  const handleAlarm = () => {
    if (DEVICE_TYPE == 'd') {
      const result = evalConnector({
        method: 'sendSync',
        channel: 'room-noti-setting',
        message: { type: 'noti', roomID: roomInfo.roomID, noti: !isNoti },
      });

      setIsNoti(!isNoti);
    }
  };

  const handleFixAlarm = () => {
    if (DEVICE_TYPE == 'd') {
      openPopup(
        {
          type: 'Confirm',
          message:
            '알림이 켜져있는경우 사용자가 직접 닫지 않을경우 알림은 사라지지 않고 고정됩니다.',
          callback: result => {
            if (result) {
              const result = evalConnector({
                method: 'sendSync',
                channel: 'room-noti-setting',
                message: { type: 'fix', roomID: roomInfo.roomID, fix: !isFix },
              });

              setIsFix(!isFix);
            }
          },
        },
        dispatch,
      );
    }
  };

  const handleModifyRoomName = () => {
    openPopup(
      {
        type: 'Prompt',
        title: covi.getDic('ChangeRoomName'),
        message: covi.getDic('Msg_InputRoomName'),
        initValue: roomInfo.roomName,
        callback: result => {
          dispatch(
            modifyRoomName({
              roomId: roomInfo.roomID,
              roomName: result,
              viewType: viewType,
            }),
          );
          clearLayer(dispatch);
        },
      },
      dispatch,
    );
  };

  const handlePhotoSummary = () => {
    appendLayer(
      {
        component: <PhotoSummary roomId={roomInfo.roomID} />,
      },
      dispatch,
    );
  };

  const handleFileSummary = () => {
    appendLayer(
      {
        component: <FileSummary roomId={roomInfo.roomID} />,
      },
      dispatch,
    );
  };

  const handleSaveChat = () => {
    openPopup(
      {
        type: 'Confirm',
        message: covi.getDic('Msg_SaveChat'),
        callback: result => {
          if (result) {
            let fileName = roomInfo.roomName;

            if (fileName == '') {
              if (roomInfo.roomType == 'G') {
                fileName = `groupchat_(${roomInfo.members.length})`;
              }
              else if (roomInfo.roomType == 'M') {
                const userName = roomInfo.members.find(item => item.id != id).name;
                fileName = getDictionary(userName) || userName;
              }
            }
            fileName = fileName + '_chat.txt';
            downloadMessageData(roomInfo.roomID, fileName);
          }
        },
      },
      dispatch,
    );
  };

  const handleClose = () => {
    clearLayer(dispatch);
  };

  const handleBackground = useCallback(
    item => {
      // 삭제 후 재세팅
      remove('backgrounds', roomInfo.roomID, () => {
        if (item != null) {
          insert(
            'backgrounds',
            { roomID: roomInfo.roomID, background: item },
            result => {
              dispatch(
                setBackground({ roomID: roomInfo.roomID, background: item }),
              );
            },
          );
        } else {
          dispatch(
            setBackground({ roomID: roomInfo.roomID, background: item }),
          );
        }
      });
    },
    [dispatch, roomInfo],
  );

  const handleSetting = useCallback(() => {
    appendLayer(
      {
        component: <ChatSettingBox info={roomInfo} isChannel={false} />,
      },
      dispatch,
    );
  }, [dispatch, roomInfo]);

  return (
    <div className="innerbox">
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        {!isMakeRoom && roomInfo && roomInfo.roomType != 'A' && (
          <a
            style={{
              float: 'right',
              height: '48px',
              width: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={handleSetting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 57.102 56.844"
            >
              <g transform="translate(0 0)">
                <path
                  d="M4.06,35.54l2.658,1.218a2.339,2.339,0,0,1,1.218,2.916L6.9,42.406a6.554,6.554,0,0,0,.775,6.164,6.665,6.665,0,0,0,5.537,2.916,6.734,6.734,0,0,0,2.4-.443l2.731-1.033a1.986,1.986,0,0,1,.812-.148,2.3,2.3,0,0,1,2.1,1.366l1.218,2.658a6.728,6.728,0,0,0,12.254,0l1.218-2.658a2.319,2.319,0,0,1,2.1-1.366,2.1,2.1,0,0,1,.812.148L41.6,51.08a6.778,6.778,0,0,0,2.4.48h0a6.9,6.9,0,0,0,5.537-2.953,6.745,6.745,0,0,0,.775-6.2l-1.033-2.731a2.339,2.339,0,0,1,1.218-2.916l2.658-1.218a6.728,6.728,0,0,0,0-12.255l-2.658-1.218a2.339,2.339,0,0,1-1.218-2.916L50.31,16.42a6.554,6.554,0,0,0-.775-6.164A6.665,6.665,0,0,0,44,7.34a6.734,6.734,0,0,0-2.4.443L38.867,8.816a1.986,1.986,0,0,1-.812.148,2.3,2.3,0,0,1-2.1-1.366L34.733,4.941A6.676,6.676,0,0,0,28.606.991a6.868,6.868,0,0,0-6.238,3.986L21.15,7.635A2.319,2.319,0,0,1,19.046,9a2.1,2.1,0,0,1-.812-.148L15.5,7.82a6.733,6.733,0,0,0-2.4-.443,6.861,6.861,0,0,0-5.537,2.916,6.684,6.684,0,0,0-.775,6.164l1.033,2.731A2.339,2.339,0,0,1,6.607,22.1L3.949,23.322A6.662,6.662,0,0,0,4.06,35.54Zm1.809-8.231,2.658-1.218a6.74,6.74,0,0,0,3.507-8.49L11,14.87a2.2,2.2,0,0,1,.258-2.1,2.254,2.254,0,0,1,2.731-.849l2.731,1.033a6.537,6.537,0,0,0,2.362.443h0a6.777,6.777,0,0,0,6.127-3.95l1.218-2.658a2.265,2.265,0,0,1,2.1-1.366,2.3,2.3,0,0,1,2.1,1.366l1.218,2.658a6.777,6.777,0,0,0,6.127,3.95,6.537,6.537,0,0,0,2.362-.443l2.731-1.033a2.365,2.365,0,0,1,2.731.849,2.2,2.2,0,0,1,.258,2.1L45.032,17.6a6.775,6.775,0,0,0,3.507,8.49L51.2,27.309a2.265,2.265,0,0,1,1.366,2.1,2.3,2.3,0,0,1-1.366,2.1l-2.658,1.218a6.74,6.74,0,0,0-3.507,8.49l1.033,2.731a2.2,2.2,0,0,1-.258,2.1,2.254,2.254,0,0,1-2.731.849l-2.731-1.033a6.537,6.537,0,0,0-2.362-.443,6.777,6.777,0,0,0-6.127,3.95L30.636,52.04a2.265,2.265,0,0,1-2.1,1.366,2.3,2.3,0,0,1-2.1-1.366L25.21,49.382a6.777,6.777,0,0,0-6.127-3.95,6.537,6.537,0,0,0-2.362.443l-2.731,1.033a2.365,2.365,0,0,1-2.731-.849,2.2,2.2,0,0,1-.258-2.1l1.033-2.731a6.775,6.775,0,0,0-3.507-8.49L5.869,31.517a2.265,2.265,0,0,1-1.366-2.1A2.3,2.3,0,0,1,5.869,27.309Z"
                  transform="translate(0 -0.991)"
                  fill="#222"
                />
                <path
                  d="M154.663,164.685a9.6,9.6,0,1,0-9.6-9.6A9.625,9.625,0,0,0,154.663,164.685Zm0-14.764a5.168,5.168,0,1,1-5.168,5.168A5.183,5.183,0,0,1,154.663,149.921Z"
                  transform="translate(-126.167 -126.666)"
                  fill="#222"
                />
              </g>
            </svg>
          </a>
        )}
      </div>
      <Scrollbars
        style={{
          height: 'calc(100% - 46px)',
          boxSizing: 'border-box',
        }}
        autoHide={autoHide}
        onUpdate={handleUpdate}
        className="AddnPersonlist"
      >
        {!isMakeRoom && (
          <>
            <div className="MenuList">
              <ul>
                {DEVICE_TYPE != 'b' && forceDisableNoti === false && (
                  <li className="divideline">
                    <a onClick={handleAlarm}>
                      <span className="c_menu_ico c_menu_ico_01"></span>
                      <span>{covi.getDic('Notification')}</span>
                      <span className="colortxt-point control-loc-right">
                        {(isNoti && covi.getDic('On')) || covi.getDic('Off')}
                      </span>
                    </a>
                  </li>
                )}
                {roomInfo && roomInfo.roomType == 'G' && (
                  <li className="divideline">
                    <a onClick={handleModifyRoomName}>
                      <span className="c_menu_ico c_menu_ico_06"></span>
                      <span>{covi.getDic('ChangeRoomName')}</span>
                    </a>
                  </li>
                )}
                {roomInfo && roomInfo.roomType != 'A' && (
                  <>
                    <li>
                      <a onClick={handlePhotoSummary}>
                        <span className="c_menu_ico c_menu_ico_02"></span>
                        {covi.getDic('PhotoSummary')}
                      </a>
                    </li>
                    <li className="divideline">
                      <a onClick={handleFileSummary}>
                        <span className="c_menu_ico c_menu_ico_03"></span>
                        {covi.getDic('FileSummary')}
                      </a>
                    </li>
                    {getConfig('UseMsgExport', false) && (
                      <li>
                        <a onClick={handleSaveChat}>
                          <span className="c_menu_ico c_menu_ico_04"></span>
                          {covi.getDic('SaveChat')}
                        </a>
                      </li>
                    )}
                  </>
                )}
                {/*<li className="divideline">
                <a onClick={handleDeleteChat}>
                  <span className="c_menu_ico c_menu_ico_05"></span>대화내용
                  삭제
                </a>
              </li>*/}

                {/*개발되면 오픈 필요*/}
                {/*DEVICE_TYPE != 'b' &&
                roomInfo &&
                roomInfo.roomType == 'A' && (
                  <li className="divideline">
                    <a onClick={handleFixAlarm}>
                      <span className="c_menu_ico c_menu_ico_01"></span>
                      <span>알림고정</span>
                      <span className="colortxt-point control-loc-right">
                        {(isFix && covi.getDic('On')) || covi.getDic('Off')}
                      </span>
                    </a>
                  </li>
                )*/}
              </ul>
            </div>
          </>
        )}
        {roomInfo && roomInfo.roomType != 'A' && roomInfo.members && (
          <div
            className="AddnPersonlist"
          >
            <span className="titletype01 mb10">
              {covi.getDic('ChatMembers')}
              <span className="colortxt-point ml5">
                {roomInfo.members.length}
              </span>
            </span>
            <div className="InviteUser" style={{ height: '100%' }}>
              {roomInfo && (
                <>
                  {isExtUser !== 'Y' && (
                    <a onClick={isMakeRoom ? handleCreateInvite : handleInvite}>
                      <div className="AddBoxIco mr15"></div>
                      <span className="Addusertxt">
                        {covi.getDic('AddChatMembers')}
                      </span>
                    </a>
                  )}
                  <ul className="people">
                    {
                      roomInfo.members && (
                        list((member, _) => {
                          return (
                            <UserInfoBox
                              key={member.id}
                              userInfo={member}
                              isInherit={true}
                              isClick={false}
                              isMine={id === member.id}
                            />
                          )
                        })
                      )
                    }
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        <div className="BottomContent" style={{ position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <a
              className="ico_chatout"
              onClick={isMakeRoom ? handleCreateLeaveRoom : handleLeaveRoom}
              alt={covi.getDic('LeaveChat')}
              title={covi.getDic('LeaveChat')}
            ></a>
            {DEVICE_TYPE == 'd' && (
              <div
                style={{
                  position: 'absolute',
                  right: '10px',
                  width: '18px',
                  height: '18px',
                  zIndex: '10',
                  top: '50%',
                  transform: 'translate(0px, -50%)',
                }}
              >
                <ColorBox
                  items={covi.config.ClientBackgroundList}
                  defaultColor={
                    roomInfo.background
                      ? roomInfo.background.replace('#', '')
                      : null
                  }
                  onChange={item => {
                    // db에 저장 필요
                    (item && handleBackground(item.value)) ||
                      handleBackground(null);
                  }}
                  empty={true}
                  horizontal={true}
                ></ColorBox>
              </div>
            )}
          </div>
        </div>
      </Scrollbars>
    </div>
  );
};

export default ChatMenuBox;
