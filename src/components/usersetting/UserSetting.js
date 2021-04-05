import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Scrollbars from 'react-custom-scrollbars';
import { format } from 'date-fns';
import SelectBox from '@COMMON/buttons/SelectBox';
import ColorBox from '@COMMON/buttons/ColorBox';
import {
  bound,
  setTopButton,
  changeTheme,
  changeFontSize,
} from '@/modules/menu';
import { changeMyPhotoPath, changeMyInfo, logout } from '@/modules/login';
import { getConfig } from '@/lib/util/configUtil';
import {
  modifyUserPassword,
  modifyUserProfileImage,
  modifyUserInfo,
} from '@/lib/setting';
import { openPopup, getJobInfo } from '@/lib/common';

import { getAesUtil } from '@/lib/aesUtil';
import {
  evalConnector,
  sendParent,
  themeChange,
  fontSizeChange,
  getDownloadDefaultPath,
  openDirectoryDialog,
} from '@/lib/deviceConnector';

import Config from '@/config/config';

const UserSetting = ({ history }) => {
  const { myInfo, syncDate } = useSelector(({ login }) => ({
    myInfo: login.userInfo,
    syncDate: login.registDate,
  }));

  const [activeSettingTab, setActiveSettingTab] = useState('');
  const [userProfileImage, setUserProfileImage] = useState(null);

  const [nowPassword, setNowPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rePassword, setRePassword] = useState('');

  const [email, setEmail] = useState(myInfo.mailAddress);
  const [phoneNumber, setPhoneNumber] = useState(myInfo.phoneNumber);
  const [work, setWork] = useState(myInfo.work);

  // 일반
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [idleTime, setIdleTime] = useState(900);
  const [firstMenu, setFirstMenu] = useState('contactlist');

  // 알림
  const [customAlarm, setCustomAlarm] = useState(false);
  const [desktopNoti, setDesktopNoti] = useState(false);
  const [showNotiContent, setShowNotiContent] = useState(false);

  // 색상 선택
  const [useEmoji, setUseEmoji] = useState(false);

  // 직무표시
  const [jobInfo, setJobInfo] = useState(
    (covi.settings && covi.settings.jobInfo) || 'PN',
  );

  // 다국어
  const [lang, setLang] = useState(
    (covi.settings && covi.settings.lang) || 'ko',
  );

  // 글씨크기
  const [fontSize, setFontSize] = useState(
    (covi.settings && covi.settings.fontSize) || 'm',
  );

  // 첨부파일 다운로드
  const [downloadPathCheck, setDownloadPathCheck] = useState(false);
  const [defaultDownloadPath, setDefaultDownloadPath] = useState('');

  const fileUploadControl = useRef(null);

  // componentDidMount
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bound({ name: '', type: '' }));
    dispatch(setTopButton(null));
    if (!activeSettingTab) {
      setActiveSettingTab('I');
    }

    if (DEVICE_TYPE == 'd') {
      const appConfig = evalConnector({
        method: 'getGlobal',
        name: 'APP_SETTING',
      });

      const userConfig = evalConnector({
        method: 'getGlobal',
        name: 'USER_SETTING',
      });

      const confFirstMenu = userConfig.get('firstMenu');

      setAutoLogin(appConfig.get('autoLogin') ? true : false);
      setAutoLaunch(appConfig.get('autoLaunch') ? true : false);
      setCustomAlarm(appConfig.get('customAlarm') ? true : false);
      setIdleTime(userConfig.get('idleTime'));
      setFirstMenu(confFirstMenu ? confFirstMenu : 'contactlist');
      setDesktopNoti(userConfig.get('desktopNoti'));
      setShowNotiContent(userConfig.get('showNotiContent'));

      setUseEmoji(appConfig.get('useEmoji') ? true : false);

      // download 관련
      const downloadPath = getDownloadDefaultPath();
      setDefaultDownloadPath(downloadPath);
      setDownloadPathCheck(appConfig.get('downloadPathCheck') ? true : false);

      // alarm config 변경 시 호출
      evalConnector({
        method: 'on',
        channel: 'onNotiConfigChange',
        callback: (event, data) => {
          setDesktopNoti(data.desktopNoti);
        },
      });
    }

    return () => {
      if (DEVICE_TYPE == 'd') {
        evalConnector({
          method: 'removeListener',
          channel: 'onNotiConfigChange',
        });
      }
    };
  }, []);

  const getInitTheme = () => {
    return (window.covi.settings && window.covi.settings.theme) || 'blue';
  };

  const handleConfig = data => {
    const result = evalConnector({
      method: 'sendSync',
      channel: 'save-static-config',
      message: data,
    });
  };

  const handleUserConfig = data => {
    const result = evalConnector({
      method: 'sendSync',
      channel: 'save-user-config',
      message: data,
    });

    // desktopNoti가 포함된경우 부모창에 전달
    if (data.desktopNoti !== undefined && data.desktopNoti !== null) {
      sendParent('onNotiConfigChange', 'usersetting', {
        desktopNoti: data.desktopNoti,
      });
    }
  };

  // 프로필 사진 변경
  const handleFileChange = e => {
    const target = e.target;

    if (target.files.length > 0) {
      const profileImage = target.files[0];

      // validation check
      if (
        !profileImage.type.startsWith('image/') ||
        !profileImage.name.match(/(.*?)\.jpg/)
      ) {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_ImageExtError'),
            callback: () => {},
          },
          dispatch,
        );
        return;
      }

      setUserProfileImage(profileImage);

      const data = new FormData();
      data.append('file', profileImage);
      modifyUserProfileImage(data).then(({ data }) => {
        if (data.status === 'SUCCESS') {
          // 프로필 사진 등록 성공
          dispatch(changeMyPhotoPath(data.result));

          // desktopNoti가 포함된경우 부모창에 전달
          if (DEVICE_TYPE == 'd') {
            sendParent('onChangeUserInfo', 'usersetting', {
              type: 'img',
              data: data.result,
            });
          }
        }
      });
    }
  };

  // 이메일, 연락처, 담당업무 변경
  const handleUserSettingSave = () => {
    if (
      work == myInfo.work &&
      email == myInfo.Email &&
      phoneNumber == myInfo.phoneNumber
    ) {
      return;
    }

    const changeData = {
      mailAddress: email,
      phoneNumber: phoneNumber,
      chargeBusiness: work,
    };
    modifyUserInfo(changeData).then(({ data }) => {
      if (data.status === 'SUCCESS') {
        // 정보 수정 성공
        dispatch(changeMyInfo(changeData));

        // desktopNoti가 포함된경우 부모창에 전달
        if (DEVICE_TYPE == 'd') {
          sendParent('onChangeUserInfo', 'usersetting', {
            type: 'info',
            data: changeData,
          });
        }

        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_UserInfoModify'),
            callback: () => {},
          },
          dispatch,
        );
      }
    });
  };

  // 비밀번호 변경
  const handleUserPasswordSave = () => {
    if (nowPassword === '' || newPassword === '' || rePassword === '') {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_MissingItems'),
          callback: () => {},
        },
        dispatch,
      );
      return;
    }

    if (newPassword != rePassword) {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_InputNewPasswordConfirm'),
          callback: () => {},
        },
        dispatch,
      );

      setNewPassword('');
      setRePassword('');
      return;
    }

    const AESUtil = getAesUtil();
    modifyUserPassword({
      nowPW: AESUtil.encrypt(nowPassword),
      newPW: AESUtil.encrypt(newPassword),
    }).then(({ data }) => {
      if (data.status === 'SUCCESS') {
        // 정보 수정 성공
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_ModifySuccess'),
            callback: () => {},
          },
          dispatch,
        );

        setNowPassword('');
        setNewPassword('');
        setRePassword('');
      } else if (data.status === 'Unauthorized') {
        // 현재 비밀번호 일치 x
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_WrongPassword'),
            callback: () => {},
          },
          dispatch,
        );

        setNowPassword('');
      }
    });
  };
  //

  const selectTheme = color => {
    // APP_SETTING 저장
    if (DEVICE_TYPE == 'd') {
      handleConfig({ theme: color });
    } else if (DEVICE_TYPE == 'b') {
      localStorage.setItem('covi_user_theme', color);
    }

    if (covi.settings) covi.settings.theme = color;

    dispatch(changeTheme(color));
    if (DEVICE_TYPE == 'd') {
      themeChange(color);
    }
  };

  const handleReSyncData = () => {
    openPopup(
      {
        type: 'Confirm',
        message: covi.getDic('Msg_reSyncConfirm'),
        callback: result => {
          if (result) {
            dispatch(logout());
            evalConnector({
              method: 'send',
              channel: 'req-init-room',
              message: {},
            });
            window.close();
          }
        },
      },
      dispatch,
    );
  };

  const handleDeleteTempData = () => {
    evalConnector({
      method: 'send',
      channel: 'clear-cache',
      message: {},
    });
  };

  const handleResetDomain = () => {
    evalConnector({
      method: 'send',
      channel: 'clear-domain',
      message: {},
    });
  };

  const handleChangeJobInfo = jobInfo => {
    openPopup(
      {
        type: 'Confirm',
        message: covi.getDic('Msg_ApplyAndRefresh'),
        callback: result => {
          if (result) {
            handleConfig({ jobInfo });
            setJobInfo(jobInfo);
            localStorage.setItem('covi_user_jobInfo', jobInfo);

            // 앱 새로고침
            if (DEVICE_TYPE == 'd') {
              evalConnector({
                method: 'send',
                channel: 'reload-app',
                message: {},
              });
            } else {
              location.reload();
              // history.push('/client');
            }
          }
        },
      },
      dispatch,
    );
  };

  const clientLangList = useMemo(() => {
    const langList = getConfig('ClientLangList');

    if (typeof langList == 'object') return langList;
    else return [{ name: '한국어', value: 'ko' }];
  }, []);

  const handleChangeFontSize = fontSize => {
    console.log(fontSize);
    if (fontSize == 's' || fontSize == 'm' || fontSize == 'l') {
      // APP_SETTING 저장
      if (DEVICE_TYPE == 'd') {
        handleConfig({ fontSize: fontSize });
      } else if (DEVICE_TYPE == 'b') {
        localStorage.setItem('covi_user_fontSize', fontSize);
      }

      if (covi.settings) covi.settings.fontSize = fontSize;

      dispatch(changeFontSize(fontSize));
      if (DEVICE_TYPE == 'd') {
        fontSizeChange(fontSize);
      }
    }
  };

  return (
    <div style={{ height: '100%' }}>
      <div className="modalheader">
        {DEVICE_TYPE == 'b' && (
          <a className="closebtn" onClick={() => history.goBack()} />
        )}
        <div className="modaltit">
          <p>{covi.getDic('UserSetting')}</p>
        </div>
      </div>
      <div className="container Config" style={{ height: 'calc(100% - 48px)' }}>
        <ul className="tab">
          <li
            className={activeSettingTab == 'I' ? 'active' : ''}
            onClick={e => {
              setActiveSettingTab('I');
            }}
            data-tab="tab1"
          >
            <a>{covi.getDic('MyInfo')}</a>
          </li>
          {myInfo.isHR === 'N' && (
            <li
              className={activeSettingTab == 'P' ? 'active' : ''}
              onClick={e => setActiveSettingTab('P')}
              data-tab="tab2"
            >
              <a>{covi.getDic('Password')}</a>
            </li>
          )}

          <li
            className={activeSettingTab == 'G' ? 'active' : ''}
            onClick={e => setActiveSettingTab('G')}
            data-tab="tab3"
          >
            <a>{covi.getDic('General')}</a>
          </li>
          {DEVICE_TYPE == 'd' && (
            <li
              className={activeSettingTab == 'N' ? 'active' : ''}
              onClick={e => setActiveSettingTab('N')}
              data-tab="tab4"
            >
              <a>{covi.getDic('Notification')}</a>
            </li>
          )}
          <li
            className={activeSettingTab == 'C' ? 'active' : ''}
            onClick={e => setActiveSettingTab('C')}
            data-tab="tab5"
          >
            <a>{covi.getDic('ChatSetting')}</a>
          </li>
        </ul>
        <div
          id="tab1"
          className={[
            'tabcontent',
            activeSettingTab == 'I' ? 'active' : '',
          ].join(' ')}
        >
          <div className="ChatConfigCon">
            <div className="Profile-edit-Con">
              <ul className="people">
                <li className="person" style={{ cursor: 'default' }}>
                  <a style={{ cursor: 'default' }}>
                    <img
                      className="profile-photo"
                      src={`${myInfo.photoPath}`}
                      onError={e => {
                        e.target.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
                        e.target.onerror = null;
                      }}
                    />
                    <span className="name" style={{ marginTop: 10 }}>
                      {getJobInfo(myInfo)}
                    </span>
                  </a>
                  {myInfo.isHR === 'N' && (
                    <a
                      onClick={e => {
                        fileUploadControl.current.click();
                      }}
                      className="config-profile-edit-btn"
                    >
                      {covi.getDic('Modify')}
                    </a>
                  )}
                </li>
              </ul>
              {myInfo.isHR === 'N' && (
                <div style={{ width: '0px', height: '0px' }}>
                  <input
                    ref={fileUploadControl}
                    type="file"
                    accept=".jpg"
                    style={{ opacity: '0.0' }}
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
            <div className="divide-grey-line"></div>
            <div className="Profile-info-input">
              <div className="input full">
                <label
                  style={{ cursor: 'default' }}
                  className="string optional"
                >
                  {covi.getDic('Email')}
                </label>
                {myInfo.isHR === 'N' ? (
                  <input
                    className="string optional"
                    placeholder={covi.getDic('Msg_InputEmail')}
                    type="text"
                    value={email}
                    onChange={e => {
                      if (myInfo.isExtUser != 'Y') setEmail(e.target.value);
                    }}
                    disabled={myInfo.isExtUser != 'Y' ? '' : 'disabled'}
                    readOnly={false}
                  />
                ) : (
                  <input
                    style={{ cursor: 'default' }}
                    className="string optional value"
                    placeholder={covi.getDic('Msg_modifyUserSetting')}
                    value={email}
                    readOnly={true}
                  />
                )}
              </div>
              <div style={{ cursor: 'default' }} className="input full">
                <label
                  style={{ cursor: 'default' }}
                  className="string optional"
                >
                  {covi.getDic('PhoneNumber')}
                </label>
                {myInfo.isHR === 'N' ? (
                  <input
                    className="string optional"
                    placeholder={covi.getDic('Msg_InputPhoneNumber')}
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    readOnly={false}
                  />
                ) : (
                  <input
                    style={{ cursor: 'default' }}
                    className="string optional value"
                    placeholder={covi.getDic('Msg_modifyUserSetting')}
                    value={phoneNumber}
                    readOnly={true}
                  />
                )}
              </div>
              <div className="input full">
                <label
                  style={{ cursor: 'default' }}
                  className="string optional"
                >
                  {covi.getDic('Work')}
                </label>
                {myInfo.isHR === 'N' ? (
                  <input
                    className="string optional"
                    placeholder={covi.getDic('Msg_modifyUserSetting')}
                    type="text"
                    value={work}
                    onChange={e => setWork(e.target.value)}
                    readOnly={false}
                  />
                ) : (
                  <input
                    style={{ cursor: 'default' }}
                    className="string optional value"
                    placeholder={covi.getDic('Msg_modifyUserSetting')}
                    value={work}
                    readOnly={true}
                  />
                )}
              </div>
            </div>
            {myInfo.isHR === 'N' && (
              <div className="Btn-con-wrap mt20">
                <button
                  onClick={handleUserSettingSave}
                  className="Config-save-btn"
                >
                  {covi.getDic('Save')}
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          id="tab2"
          className={[
            'tabcontent',
            activeSettingTab == 'P' ? 'active' : '',
          ].join(' ')}
        >
          <div className="ChatConfigCon">
            <div className="Profile-info-input">
              <div className="input full">
                <label className="string optional">
                  {covi.getDic('CurrentPassword')}
                </label>
                <input
                  className="string optional"
                  placeholder={covi.getDic('Msg_InputCurrentPassword')}
                  type="password"
                  value={nowPassword}
                  onChange={e => setNowPassword(e.target.value)}
                />
              </div>
              <div className="input full">
                <label className="string optional">
                  {covi.getDic('NewPassword')}
                </label>
                <input
                  className="string optional"
                  placeholder={covi.getDic('Msg_InputNewPassword')}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={nowPassword === '' ? true : false}
                  required={nowPassword === '' ? false : true}
                />
              </div>
              <div className="input full">
                <label className="string optional">
                  {covi.getDic('NewPasswordConfirm')}
                </label>
                <input
                  className="string optional"
                  placeholder={covi.getDic('Msg_InputNewPasswordConfirm')}
                  type="password"
                  value={rePassword}
                  onChange={e => setRePassword(e.target.value)}
                  disabled={newPassword === '' ? true : false}
                  required={newPassword === '' ? false : true}
                />
              </div>
            </div>
            <div className="Btn-con-wrap mt20">
              {myInfo.isHR === 'N' && (
                <button
                  onClick={handleUserPasswordSave}
                  className="Config-save-btn"
                >
                  {covi.getDic('Modify')}
                </button>
              )}
            </div>
          </div>
        </div>
        <div
          id="tab3"
          className={[
            'tabcontent',
            activeSettingTab == 'G' ? 'active' : '',
          ].join(' ')}
          style={{ height: '100%' }}
        >
          <Scrollbars
            autoHide={true}
            renderTrackVertical={() => <div style={{ display: 'none' }} />}
            className="ChatConfigCon"
          >
            <ul>
              {DEVICE_TYPE == 'd' && (
                <>
                  <li className="ChatConfig-list">
                    <div
                      className={[
                        'opt_setting',
                        autoLaunch === true ? 'on' : '',
                      ].join(' ')}
                    >
                      <span className="ctrl"></span>
                    </div>
                    <a
                      className="ChatConfig-menu"
                      onClick={e => {
                        handleConfig({
                          autoLaunch: !autoLaunch,
                        });
                        setAutoLaunch(!autoLaunch);
                      }}
                    >
                      <span>{covi.getDic('AutoLaunch')}</span>
                    </a>
                  </li>
                  <li className="ChatConfig-list">
                    <div
                      className={[
                        'opt_setting',
                        autoLogin === true ? 'on' : '',
                      ].join(' ')}
                    >
                      <span className="ctrl"></span>
                    </div>
                    <a
                      className="ChatConfig-menu"
                      onClick={e => {
                        handleConfig({
                          autoLogin: !autoLogin,
                        });
                        setAutoLogin(!autoLogin);
                      }}
                    >
                      <span>{covi.getDic('AutoLogin')}</span>
                    </a>
                  </li>
                  <li className="ChatConfig-list">
                    <SelectBox
                      items={[
                        { name: `15${covi.getDic('Minute')}`, value: 900 },
                        { name: `30${covi.getDic('Minute')}`, value: 1800 },
                      ]}
                      order={4}
                      defaultValue={idleTime}
                      onChange={item => {
                        handleUserConfig({ idleTime: parseInt(item.value) });
                        setIdleTime(item.value);
                      }}
                    ></SelectBox>
                    <span className="ChatConfig-menu">
                      <span>{covi.getDic('Msg_SetIdleTime')}</span>
                    </span>
                  </li>
                </>
              )}

              <li className="ChatConfig-list">
                <SelectBox
                  items={clientLangList}
                  order={3}
                  defaultValue={lang}
                  onChange={(item, canceled) => {
                    openPopup(
                      {
                        type: 'Confirm',
                        message: covi.getDic('Msg_ApplyAndRefresh'),
                        callback: result => {
                          if (result) {
                            localStorage.setItem('covi_user_lang', item.value);

                            if (DEVICE_TYPE == 'd') {
                              handleConfig({ lang: item.value });
                              evalConnector({
                                method: 'send',
                                channel: 'reload-app',
                                message: {
                                  clearConfigs: true,
                                  isLangChange: true,
                                },
                              });
                              // reload App
                            } else {
                              location.reload();
                            }
                          } else {
                            canceled();
                          }
                        },
                      },
                      dispatch,
                    );
                  }}
                ></SelectBox>
                <span className="ChatConfig-menu">
                  <span>{covi.getDic('ChangeLang')}</span>
                </span>
              </li>
              <li className="ChatConfig-list">
                <SelectBox
                  items={[
                    { name: covi.getDic('Hidden'), value: 'NN' },
                    { name: covi.getDic('JobPosition'), value: 'PN' },
                    { name: covi.getDic('JobLevel'), value: 'LN' },
                    { name: covi.getDic('JobTitle'), value: 'TN' },
                  ]}
                  order={2}
                  defaultValue={jobInfo}
                  onChange={item => {
                    handleChangeJobInfo(item.value);
                  }}
                ></SelectBox>
                <span className="ChatConfig-menu">
                  <span>{covi.getDic('JobName')}</span>
                </span>
              </li>
              {DEVICE_TYPE == 'd' && (
                <>
                  <li className="ChatConfig-list">
                    <SelectBox
                      items={[
                        { name: covi.getDic('Contact'), value: 'contactlist' },
                        { name: covi.getDic('Chat'), value: 'chatlist' },
                        { name: covi.getDic('Channel'), value: 'channellist' },
                      ]}
                      order={1}
                      defaultValue={firstMenu}
                      onChange={item => {
                        handleUserConfig({ firstMenu: item.value });
                        setFirstMenu(item.value);
                      }}
                      style={{ width: '150px' }}
                    ></SelectBox>
                    <span className="ChatConfig-menu">
                      <span>{covi.getDic('StartMenu')}</span>
                    </span>
                  </li>
                  <li className="ChatConfig-list">
                    <div
                      className={[
                        'opt_setting',
                        downloadPathCheck === true ? 'on' : '',
                      ].join(' ')}
                    >
                      <span className="ctrl"></span>
                    </div>
                    <a
                      className="ChatConfig-menu"
                      onClick={() => {
                        // app setting 처리
                        handleConfig({ downloadPathCheck: !downloadPathCheck });
                        setDownloadPathCheck(!downloadPathCheck);
                      }}
                    >
                      <span>{covi.getDic('DownloadPathCheck')}</span>
                    </a>
                  </li>
                  <li className="ChatConfig-list">
                    <a
                      className="ChatConfig-menu"
                      onClick={() => {
                        openDirectoryDialog(defaultDownloadPath, filePaths => {
                          if (filePaths && filePaths.length > 0) {
                            const selectedFilePath = filePaths[0];
                            setDefaultDownloadPath(selectedFilePath);
                            handleConfig({
                              defaultDownloadPath: selectedFilePath,
                            });
                          }
                        });
                      }}
                    >
                      <span>{covi.getDic('DownloadDeafultPath')}</span>
                      <span className="chat-sync-date">
                        {defaultDownloadPath}
                      </span>
                    </a>
                  </li>
                  <li className="ChatConfig-list">
                    <a className="ChatConfig-menu" onClick={handleResetDomain}>
                      <span>{covi.getDic('InitDomainInfo')}</span>
                    </a>
                  </li>
                </>
              )}
            </ul>
          </Scrollbars>
        </div>
        <div
          id="tab4"
          className={[
            'tabcontent',
            activeSettingTab == 'N' ? 'active' : '',
          ].join(' ')}
        >
          <div className="ChatConfigCon">
            <ul>
              <li className="ChatConfig-list">
                <div
                  className={[
                    'opt_setting',
                    desktopNoti === true ? 'on' : '',
                  ].join(' ')}
                >
                  <span className="ctrl"></span>
                </div>
                <a
                  className="ChatConfig-menu"
                  onClick={e => {
                    handleUserConfig({ desktopNoti: !desktopNoti });
                    setDesktopNoti(!desktopNoti);
                  }}
                >
                  <span>{covi.getDic('UseNoti')}</span>
                </a>
              </li>
              {desktopNoti && (
                <li className="ChatConfig-list-sub">
                  <div
                    className={[
                      'opt_setting',
                      customAlarm === true ? 'on' : '',
                    ].join(' ')}
                  >
                    <span className="ctrl"></span>
                  </div>
                  <a
                    className="ChatConfig-menu-subitem"
                    onClick={e => {
                      openPopup(
                        {
                          type: 'Confirm',
                          message: covi.getDic('Msg_ApplyAndRefresh'),
                          callback: result => {
                            if (result) {
                              handleConfig({ customAlarm: !customAlarm });
                              setCustomAlarm(!customAlarm);

                              // relaunch
                              evalConnector({
                                method: 'send',
                                channel: 'relaunch-app',
                              });
                            }
                          },
                        },
                        dispatch,
                      );
                    }}
                  >
                    <span>{covi.getDic('UseSelfNoti')}</span>
                  </a>
                </li>
              )}
              <li className="ChatConfig-list">
                <div
                  className={[
                    'opt_setting',
                    showNotiContent === true ? 'on' : '',
                  ].join(' ')}
                >
                  <span className="ctrl"></span>
                </div>
                <a
                  className="ChatConfig-menu"
                  onClick={e => {
                    handleUserConfig({ showNotiContent: !showNotiContent });
                    setShowNotiContent(!showNotiContent);
                  }}
                >
                  <span>{covi.getDic('ShowNoti')}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div
          id="tab5"
          className={[
            'tabcontent',
            activeSettingTab == 'C' ? 'active' : '',
          ].join(' ')}
        >
          <div className="ChatConfigCon">
            <ul>
              <li className="ChatConfig-list">
                <div className="color-box-wrap">
                  <ColorBox
                    items={covi.config.ClientThemeList}
                    defaultColor={getInitTheme()}
                    onChange={item => {
                      selectTheme(item.name);
                    }}
                  ></ColorBox>
                </div>
                <a className="ChatConfig-menu">
                  <span>{covi.getDic('ChangeTheme')}</span>
                </a>
              </li>

              <li className="ChatConfig-list">
                <SelectBox
                  items={[
                    { name: covi.getDic('Small'), value: 's' },
                    { name: covi.getDic('Medium'), value: 'm' },
                    { name: covi.getDic('Large'), value: 'l' },
                  ]}
                  order={2}
                  defaultValue={fontSize}
                  onChange={item => {
                    handleChangeFontSize(item.value);
                  }}
                ></SelectBox>
                <span className="ChatConfig-menu">
                  <span>{covi.getDic('FontSize')}</span>
                </span>
              </li>

              {DEVICE_TYPE == 'd' && (
                <>
                  <li className="ChatConfig-list">
                    <div
                      className={[
                        'opt_setting',
                        useEmoji === true ? 'on' : '',
                      ].join(' ')}
                    >
                      <span className="ctrl"></span>
                    </div>
                    <a
                      className="ChatConfig-menu"
                      onClick={e => {
                        handleConfig({ useEmoji: !useEmoji });
                        setUseEmoji(!useEmoji);
                        openPopup(
                          {
                            type: 'Alert',
                            message: covi.getDic('Msg_Apply'),
                          },
                          dispatch,
                        );
                      }}
                    >
                      <span>{covi.getDic('UseEmoji')}</span>
                    </a>
                  </li>
                  {/*
                  <li className="ChatConfig-list">
                    <a className="ChatConfig-menu">
                      <span>대화내용 백업</span>
                      <span className="chat-backup"></span>
                    </a>
                  </li>
                  */}
                  <li className="ChatConfig-list">
                    <a className="ChatConfig-menu" onClick={handleReSyncData}>
                      <span>{covi.getDic('DataSync')}</span>
                      <span className="chat-sync-date">
                        {format(new Date(syncDate), 'yyyy.MM.dd HH:mm')}
                      </span>
                    </a>
                  </li>
                  <li className="ChatConfig-list">
                    <a
                      className="ChatConfig-menu"
                      onClick={handleDeleteTempData}
                    >
                      <span>{covi.getDic('RemoveTempData')}</span>
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSetting;
