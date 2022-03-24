import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import { getAesUtil } from '@/lib/aesUtil';
import { getDictionary, getJobInfo, openPopup } from '@/lib/common';

import * as loginApi from '@/lib/login';

const SecondLockWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 14px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  transition: 0.3s;
  z-index: 650;
`;

const SecondInputBox = styled.input`
  width: 250px;
  border: 1px solid #ddd;
  padding: 8px 12px;
  font-size: 12pt;
  text-align: center;
`;

const SecondLockTitle = styled.p`
  font-size: 14pt;
  font-weight: bold;
  margin: 12px;
`;

const SecondLockSubTitle = styled.p`
  font-size: 12pt;
  margin: 12px;
`;

const SecondPasswordConfirmBox = styled.button`
  width: 276px;
  padding: 8px 12px;
  font-size: 12pt;
  background: #fff;
  border: 1px solid #ddd;
`;

const SecondLockContainer = ({ theme, secondLockHandler }) => {
  const userInfo = useSelector(({ login }) => login.userInfo);
  const userId = useSelector(({ login }) => login.id);

  const [password, setPassword] = useState('');
  const [viewImage, setViewImage] = useState(true);

  const handleUnlockWithLoginAPI = async pw => {
    const AESUtil = getAesUtil();

    const inputPW = AESUtil.encrypt(pw);

    const reqData = {
      id: userId,
      pw: inputPW,
      dp: process.platform,
      da: process.arch,
      al: 'N',
      isAuto: false,
    };

    const response = await loginApi.loginValidationRequest(reqData);

    if (response?.data?.status === 'SUCCESS') {
      secondLockHandler();
    } else {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_WrongPasswordInput'),
        },
        dispatch,
      );
    }
  };

  const dispatch = useDispatch();

  const profileBox = useMemo(() => {
    if (userInfo?.photoPath) {
      let photoSrc = '';
      try {
        const urlParts = userInfo.photoPath.split('?');
        /* query string에 't' 타임스탬프 추가 */
        if (Array.isArray(urlParts) && urlParts.length >= 2) {
          /* query string '?' identifier 중복처리 */
          const urlBase = urlParts.shift();
          photoSrc = new URL(urlBase + '?' + urlParts.join('&'));
          photoSrc.searchParams.append('t', timestamp);
        } else {
          photoSrc = new URL(userInfo.photoPath);
          photoSrc.searchParams.append('t', timestamp);
        }
      } catch (err) {
        try {
          // url이 relative path인 경우 catch error
          photoSrc = new URL(userInfo.profilePath, window.covi.baseURL);
          photoSrc.searchParams.append('t', timestamp);
        } catch (err) {
          photoSrc = userInfo.photoPath;
        }
      }
      return (
        <img
          src={decodeURIComponent(photoSrc.toString())}
          onError={e => {
            setViewImage(false);
          }}
          style={{ width: 92, height: 96, marginBottom: 12, borderRadius: 14 }}
        ></img>
      );
    } else {
      const convertUserName =
        (userInfo?.name && getDictionary(userInfo?.name)) || 'N';

      return (
        <div className="spare-text">
          {(convertUserName && convertUserName[0]) || 'N'}
        </div>
      );
    }
  }, [userInfo]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme != null ? theme : '#ddd',
        width: '100%',
        height: '100%',
        zIndex: 600,
      }}
    >
      <SecondLockWrap
        style={{
          background: '#fff',
          width: '320px',
          height: '450px',
        }}
      >
        {userInfo && viewImage && profileBox}
        {userInfo && (
          <SecondLockSubTitle>{getJobInfo(userInfo)}</SecondLockSubTitle>
        )}
        <SecondLockTitle>잠금 상태 입니다</SecondLockTitle>
        <SecondInputBox
          placeholder="비밀번호를 입력해주세요"
          type="password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleUnlockWithLoginAPI(password);
            }
          }}
        />
        <SecondPasswordConfirmBox
          onClick={() => {
            handleUnlockWithLoginAPI(password);
          }}
          style={
            password?.length > 0
              ? {
                  background: theme != null ? theme : '#ddd',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                }
              : {}
          }
        >
          {covi.getDic('confirm', '확인')}
        </SecondPasswordConfirmBox>
      </SecondLockWrap>
    </div>
  );
};

export default SecondLockContainer;
