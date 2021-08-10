import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { clearLayer, appendLayer, openPopup } from '@/lib/common';
import { Scrollbars } from 'react-custom-scrollbars';

import InviteMember from '@/components/channels/channel/layer/InviteMember';
import PhotoSummary from '@/components/chat/chatroom/layer/PhotoSummary'; // 그대로 사용
import FileSummary from '@/components/chat/chatroom/layer/FileSummary'; // 그대로 사용
import ChatSettingBox from '@/components/chat/chatroom/layer/ChatSettingBox';
import { modifyChannelMemberAuth, setBackground } from '@/modules/channel';

import {
  leaveChannelUtil,
  leaveChannelByAdminUtil,
  leaveChannelByAdminUtilAfter,
} from '@/lib/channelUtil';
import { downloadMessageData } from '@/lib/fileUpload/coviFile';
import { evalConnector, bindLeaveChannel } from '@/lib/deviceConnector';
import ChannelUserInfoBox from '../ChannelUserInfoBox';
import InviteExtUser from './InviteExtUser';
import { getConfig } from '@/lib/util/configUtil';
import ColorBox from '@COMMON/buttons/ColorBox';
import { insert, remove } from '@/lib/util/storageUtil';
import { closureChannel } from '@/lib/channel';
import useOffset from '@/hooks/useOffset';

const enabledExtUser = getConfig('EnabledExtUser', 'Y');
const SMTPConfig = getConfig('SMTPConfig', 'Y');
const autoHide = getConfig('AutoHide_ChatMemberScroll', 'Y') === 'Y';

const ChannelMenuBox = ({ channelInfo, isNewWin }) => {
  const { id } = useSelector(({ login }) => ({
    id: login.id,
  }));

  const [isNoti, setIsNoti] = useState(true);
  const [channelAuth, setChannelAuth] = useState(false);
  const [channelAdminMembers, setChannelAdminMembers] = useState([]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (DEVICE_TYPE == 'd') {
      const userConfig = evalConnector({
        method: 'getGlobal',
        name: 'USER_SETTING',
      });

      // notiExRooms에 없거나 등록된경우에도 false로 등록됨으로 not 연산자 처리
      const notiExRooms = userConfig.get(`notiExRooms.${channelInfo.roomId}`);
      setIsNoti(!notiExRooms);
    }
  }, []);

  useEffect(() => {
    if (channelInfo) {
      const tempAdmin = [];
      channelInfo.members.forEach(item => {
        if (item.channelAuth == 'Y') {
          tempAdmin.push(item);

          if (item.id == id) {
            setChannelAuth(true);
          }
        }
      });

      setChannelAdminMembers(tempAdmin);
    }
  }, [channelInfo]);

  const handleInvite = () => {
    appendLayer(
      {
        component: (
          <InviteMember
            headerName={covi.getDic('AddChatMembers')}
            roomId={channelInfo.roomId}
            openType={channelInfo.openType}
            isNewRoom={false}
            oldMemberList={channelInfo.members}
          />
        ),
      },
      dispatch,
    );
  };

  const handleExtUsrInvite = () => {
    appendLayer(
      {
        component: (
          <InviteExtUser
            headerName={covi.getDic('InviteExUser')}
            roomId={channelInfo.roomId}
          />
        ),
      },
      dispatch,
    );
  };

  const handleLeaveChannel = () => {
    // 3. 1명이 일반회원, 1명이 채널관리자인 방에서는
    // 채널관리자가 탈퇴를 위해서는 일반회원에 관리자 위임후 탈퇴가능
    if (channelAdminMembers.length === 1 && channelAuth) {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_DelChannelAdmin'),
        },
        dispatch,
      );
      return;
    }

    leaveChannelUtil(
      dispatch,
      channelInfo.roomId,
      id,
      () => {
        if (isNewWin) {
          window.onunload = null;
          if (DEVICE_TYPE == 'b') {
            if (
              window.opener &&
              typeof window.opener.parent.newWinChannelLeaveCallback ==
              'function'
            ) {
              window.opener.parent.newWinChannelLeaveCallback(
                channelInfo.roomId,
                id,
              );
            }
            window.close();
          } else {
            bindLeaveChannel(channelInfo.roomId, id);
          }
        } else {
          clearLayer(dispatch);
        }
      },
      isNewWin,
    );
  };

  const handleAlarm = () => {
    if (DEVICE_TYPE == 'd') {
      const result = evalConnector({
        method: 'sendSync',
        channel: 'room-noti-setting',
        message: { type: 'noti', roomID: channelInfo.roomId, noti: !isNoti },
      });

      setIsNoti(!isNoti);
    }
  };

  const handleModifyChannelnfo = useCallback(() => {
    /* openPopup(
      {
        type: 'Prompt',
        title: '채널 이름 바꾸기',
        message: '채널 이름을 입력해 주세요',
        initValue: channelInfo.roomName,
        callback: result => {
          dispatch(
            modifyChannelName({
              roomId: channelInfo.roomId,
              roomName: result,
            }),
          );
          clearLayer(dispatch);
        },
      },
      dispatch,
    ); */
  }, [channelInfo]);

  const handlePhotoSummary = () => {
    appendLayer(
      {
        component: <PhotoSummary roomId={channelInfo.roomId} />,
      },
      dispatch,
    );
  };

  const handleFileSummary = () => {
    appendLayer(
      {
        component: <FileSummary roomId={channelInfo.roomId} />,
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
            const fileName = channelInfo.roomName + '_channel.txt';
            downloadMessageData(channelInfo.roomId, fileName);
          }
        },
      },
      dispatch,
    );
  };

  const handleClose = () => {
    clearLayer(dispatch);
  };

  const handleLeaveChannelByAdmin = (dispatch, userId) => {
    leaveChannelByAdminUtil(
      dispatch,
      channelInfo.roomId,
      userId,
      () => {
        if (isNewWin) {
          if (DEVICE_TYPE == 'b') {
            window.onunload = null;
            if (
              typeof window.opener.parent.newWinChannelLeaveByAdminCallback ==
              'function'
            ) {
              window.opener.parent.newWinChannelLeaveByAdminCallback(
                channelInfo.roomId,
                userId,
              );
            }
          } else {
            leaveChannelByAdminUtilAfter(dispatch, channelInfo.roomId, userId);
          }
        }
        clearLayer(dispatch);
      },
      isNewWin,
    );
  };

  const getMenuData = (dispatch, userInfo, roomId) => {
    const menus = [
      {
        code: 'removeChannelMember',
        isline: false,
        onClick: () => {
          handleLeaveChannelByAdmin(dispatch, userInfo.id);
        },
        name: covi.getDic('Deport'),
      },
      {
        code: 'modifyChannelMemberAuth',
        isline: false,
        onClick: () => {
          // 2. 모든 회원이 전부 일반회원으로 전환 불가 / 단 한명의 채널관리자가 무조건 존재해야 됨.
          if (channelAdminMembers.length === 1 && userInfo.channelAuth == 'Y') {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic('Msg_MinAdminCnt'),
              },
              dispatch,
            );
          } else {
            openPopup(
              {
                type: 'Confirm',
                message:
                  userInfo.channelAuth == 'Y'
                    ? userInfo.id === id
                      ? covi.getDic('Msg_SelfDemotion')
                      : covi.getDic('Msg_Demotion')
                    : covi.getDic('Msg_SelAdmin'),
                callback: result => {
                  if (result) {
                    dispatch(
                      modifyChannelMemberAuth({
                        roomId: channelInfo.roomId,
                        auth: userInfo.channelAuth == 'Y' ? 'N' : 'Y',
                        members: [userInfo.id],
                      }),
                    );
                    clearLayer(dispatch);
                  }
                },
              },
              dispatch,
            );
          }
        },
        name:
          userInfo.channelAuth == 'Y'
            ? covi.getDic('GeneralDemotion')
            : covi.getDic('SelectAdmin'),
      },
    ];
    return menus;
  };

  const handleBackground = useCallback(
    item => {
      // 삭제 후 재세팅
      remove('backgrounds', channelInfo.roomId, () => {
        if (item != null) {
          insert(
            'backgrounds',
            { roomID: channelInfo.roomId, background: item },
            result => {
              dispatch(
                setBackground({ roomID: channelInfo.roomId, background: item }),
              );
            },
          );
        } else {
          dispatch(
            setBackground({ roomID: channelInfo.roomId, background: item }),
          );
        }
      });
    },
    [dispatch, channelInfo],
  );

  const handleClosureChannel = () => {
    openPopup(
      {
        type: 'Confirm',
        message: covi.getDic('Msg_ClosureChannel'),
        callback: result => {
          if (result) {
            closureChannel(
              {
                roomId: channelInfo.roomId,
                roomType: 'C',
                roomName: channelInfo.roomName,
              }, // 채널 페쇄에 대한 후처리는 웹소켓에서.....
              // Admin에서 채널 폐쇄시와 동일하게 처리.
            ).then(response => {
              if (response.data.status != 'SUCCESS') {
                openPopup(
                  {
                    type: 'Alert',
                    message: covi.getDic('Msg_Error'),
                  },
                  dispatch,
                );
              }
            });
          }
        },
      },
      dispatch,
    );
  };

  const handleSetting = useCallback(() => {
    appendLayer(
      {
        component: <ChatSettingBox info={channelInfo} isChannel={true} />,
      },
      dispatch,
    );
  }, [dispatch, channelInfo]);

  const RENDER_UNIT = 8;
  const { isDone, nextStep, list, handleScrollUpdate } = useOffset(channelInfo.members, { renderPerBatch: RENDER_UNIT });
  const handleUpdate = handleScrollUpdate({
    threshold: 0.9
  });

  /* 
    채널권한 존재시
    - 외부사용자초대, 대화상대추가 버튼에 따른 높이조정
   */
  const scrollHeight = useMemo(()=>{
    let useInviteExtUser = enabledExtUser === 'Y' && SMTPConfig === 'Y';
    let addLayoutHeight = channelAuth ? (useInviteExtUser ? 180 : 120) : 70;
    return 'calc(100% - ' + String(addLayoutHeight) + 'px)'
  }, [channelAuth, enabledExtUser, SMTPConfig])

  return (
    <div className="innerbox">
      <div className="modalheader">
        <a className="closebtn" onClick={handleClose}></a>
        {channelInfo && (
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
      <div className="MenuList">
        <ul>
          {DEVICE_TYPE != 'b' && (
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
          <li className="divideline">
            <a
              onClick={() => {
                openPopup(
                  {
                    type: 'ChannelInfo',
                  },
                  dispatch,
                );
              }}
            >
              <span className="c_menu_ico c_menu_ico_06"></span>
              <span>{covi.getDic('ShowChannelInfo')}</span>
            </a>
          </li>
          {channelInfo && channelAuth && (
            <li className="divideline">
              <a
                onClick={() => {
                  openPopup(
                    {
                      type: 'ChannelInfoModify',
                    },
                    dispatch,
                  );
                }}
              >
                <span className="c_menu_ico c_menu_ico_06"></span>
                <span>{covi.getDic('ModChannelInfo')}</span>
              </a>
            </li>
          )}
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
          {/*<li className="divideline">
                <a onClick={handleDeleteChat}>
                  <span className="c_menu_ico c_menu_ico_05"></span>대화내용
                  삭제
                </a>
              </li>*/}
        </ul>
      </div>
      {channelInfo && channelInfo.members && (
        <div
          className="AddnPersonlist"
          style={{
            // height: '100%'
            height:
              DEVICE_TYPE == 'd'
                ? channelAuth
                  ? 'calc(100% - 400px)'
                  : 'calc(100% - 350px)'
                : channelAuth
                  ? 'calc(100% - 350px)'
                  : 'calc(100% - 300px)',

            // ? channelAuth
            //   ? 'calc(100% - 460px)'
            //   : 'calc(100% - 420px)'
            // : channelAuth
            // ? 'calc(100% - 405px)'
            // : 'calc(100% - 385px)',
          }}
        >
          <span className="titletype01 mb10">
            {covi.getDic('ChatMembers')}
            <span className="colortxt-point ml5">
              {channelInfo.members.length}
            </span>
          </span>
          <div className="InviteUser" style={{ height: '100%' }}>
            {channelAuth && (
              <>
                <a onClick={handleInvite}>
                  <div className="AddBoxIco mr15"></div>
                  <span className="Addusertxt">
                    {covi.getDic('AddChatMembers')}
                  </span>
                </a>
                {enabledExtUser === 'Y' && SMTPConfig === 'Y' && (
                  <a onClick={handleExtUsrInvite}>
                    <div className="Extuserbox mr15">
                      <div className="ExtuserImg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="25.083"
                          height="25.071"
                          viewBox="0 0 25.083 25.071"
                        >
                          <g transform="translate(-3.375 -3.375)">
                            <path
                              d="M17.357,22.416l-.072.006a1,1,0,0,0-.579.271l-3.893,3.893a4.389,4.389,0,0,1-6.207-6.207l4.134-4.134a4.363,4.363,0,0,1,.687-.56,4.43,4.43,0,0,1,.892-.452,4.22,4.22,0,0,1,.9-.223,4.273,4.273,0,0,1,.615-.042c.084,0,.169.006.277.012a4.377,4.377,0,0,1,2.82,1.266,4.321,4.321,0,0,1,1.031,1.645.949.949,0,0,0,1.163.609c.006,0,.012-.006.018-.006s.012,0,.012-.006a.941.941,0,0,0,.633-1.151,5.461,5.461,0,0,0-1.483-2.471A6.344,6.344,0,0,0,14.838,13.1c-.115-.018-.229-.036-.344-.048a6.22,6.22,0,0,0-.669-.036c-.157,0-.313.006-.464.018a6.078,6.078,0,0,0-.976.151c-.066.012-.127.03-.193.048a6.269,6.269,0,0,0-1.175.44,6.191,6.191,0,0,0-1.669,1.2L5.213,19.005A6.357,6.357,0,0,0,3.375,23.5a6.337,6.337,0,0,0,10.812,4.478l3.935-3.935A.954.954,0,0,0,17.357,22.416Z"
                              transform="translate(0 -1.377)"
                              fill="#999"
                            />
                            <path
                              d="M28.038,5.225a6.351,6.351,0,0,0-8.962,0L15.237,9.064a.969.969,0,0,0,.609,1.651.979.979,0,0,0,.765-.277l3.845-3.833a4.389,4.389,0,0,1,6.207,6.207l-4.134,4.134a4.363,4.363,0,0,1-.687.56,4.43,4.43,0,0,1-.892.452,4.22,4.22,0,0,1-.9.223,4.273,4.273,0,0,1-.615.042c-.084,0-.175-.006-.277-.012a4.331,4.331,0,0,1-3.809-2.8.963.963,0,0,0-1.151-.591.974.974,0,0,0-.681,1.235,5.505,5.505,0,0,0,1.428,2.26h0l.012.012a6.345,6.345,0,0,0,3.815,1.814,6.219,6.219,0,0,0,.669.036q.235,0,.47-.018a6.89,6.89,0,0,0,1.163-.193,6.269,6.269,0,0,0,1.175-.44,6.191,6.191,0,0,0,1.669-1.2l4.134-4.134a6.344,6.344,0,0,0-.012-8.968Z"
                              transform="translate(-1.442)"
                              fill="#999"
                            />
                          </g>
                        </svg>
                      </div>
                    </div>
                    <span className="Addusertxt">
                      {covi.getDic('InviteExUser')}
                    </span>
                  </a>
                )}
              </>
            )}
            <Scrollbars
              style={{
                height: scrollHeight,
                boxSizing: 'border-box',
              }}
              autoHide={autoHide}
              onUpdate={handleUpdate}
              className="AddnPersonlist"
            >
              <ul className="people">
                {channelInfo.members.length > 0 && (
                  list((member, index) => {
                    return <ChannelUserInfoBox
                      key={`channelmember_${member.id}`}
                      userId={id}
                      userInfo={member}
                      getMenuData={getMenuData}
                      channelAuth={channelAuth}
                    />
                  }))
                }
                  
                {
                  /**
                   * 2020.12.22
                   * 대화상대 더 보기 버튼 구현
                   * 더 가져올 리스트가 남아있을 경우에만 버튼 렌더링
                   */
                  isDone === false && (
                    <li className="person">
                      <a onClick={() => nextStep()}>{"...대화상대 더 보기"}</a>
                    </li>
                  )}
              </ul>
            </Scrollbars>
          </div>
        </div>
      )}

      <div className="BottomContent">
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <a
            className="ico_chatout"
            onClick={() => handleLeaveChannel()}
            alt={covi.getDic('LeaveChat')}
            title={covi.getDic('LeaveChat')}
          ></a>
          {channelAuth && (
            <a
              className="ico_chatclosure"
              onClick={() => handleClosureChannel()}
              alt={covi.getDic('Close')}
              title={covi.getDic('Close')}
            ></a>
          )}
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
                  channelInfo.background
                    ? channelInfo.background.replace('#', '')
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
    </div>
  );
};

export default ChannelMenuBox;
