import React, { useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loginTokenAuth, loginInit, syncTokenRequest } from '@/modules/login';
import SyncWrap from '@C/login/SyncWrap';
import * as api from '@/lib/login';
import { evalConnector } from '@/lib/deviceConnector';
import { clearUserData } from '@/lib/util/localStorageUtil';
import { getChineseWall } from '@/lib/orgchart';
import { getConfig } from '@/lib/util/configUtil';

const TokenChecker = ({ history, returnURL }) => {
  // localStorage에 존재하는 token을 검증하고 검증성공시 login처리 수행
  const { token, authFail, sync } = useSelector(({ login, loading }) => ({
    token: login.token,
    authFail: login.authFail,
    sync: loading['login/SYNC_TOKEN_REQUEST'],
  }));

  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) {
      // 새창은 sync 제외
      const sync = !(returnURL.indexOf('/nw/') > -1);

      api.tokencheckRequest().then(async ({ data }) => {
        if (data && data.userInfo) {
          /**
           * 2020.12.30
           * SaaS 대응버전을 위한 access_id 저장
           * 토큰인증 성공시 response로부터 id를 얻어 localStorage에 저장
           */
          localStorage.setItem('covi_user_access_id', data.userInfo.id);
          // 차이니즈월 default value
          data.chineseWall = [];
          data.blockList = [];
          const useChineseWall = getConfig('UseChineseWall', 'N') === 'Y';
          if (useChineseWall) {
            const { result, status, blockList } = await getChineseWall({
              userId: data.userInfo.id,
            });

            if (status === 'SUCCESS') {
              data.chineseWall = result || [];
              data.blockList = blockList || [];
            }
          }
        }

        dispatch(
          syncTokenRequest({
            sync: sync,
            result: data,
          }),
        );
        //TODO: auth success 시 login 정보 맵핑 전에 data sync 수행 -- 이부분은 server 요청보다는 local db 요청으로 전환

        // dispatch(loginTokenAuth(data));
      });
    }
  }, []);

  useEffect(() => {
    if (authFail) {
      if (returnURL.indexOf('/nw/') > -1) {
        window.close();
      } else {
        // 실패
        dispatch(loginInit());
        clearUserData();

        if (DEVICE_TYPE == 'd') {
          const appConfig = evalConnector({
            method: 'getGlobal',
            name: 'APP_SECURITY_SETTING',
          });
          if (
            appConfig.get('autoLogin') &&
            appConfig.get('tk') &&
            appConfig.get('autoLoginId') &&
            appConfig.get('autoLoginPw') // 자동로그인 설정일 경우,
          ) {
            history.push('/client/autoLogin');
          } else {
            history.push('/client');
          }
        } else {
          history.push('/client');
        }
      }
    } else {
      // 성공
      if (
        returnURL === '/client' ||
        returnURL === '/client/' ||
        returnURL.indexOf('/client/login') > -1 ||
        returnURL.indexOf('/client/autoLogin') > -1
      ) {
        history.push('/client/main/contactlist');
      }
    }
  }, [token, authFail]);

  return (
    <>
      {(sync && (
        <div style={{ width: '100%', height: '100%' }}>
          <SyncWrap></SyncWrap>
        </div>
      )) || <></>}
    </>
  );
};

export default withRouter(TokenChecker);
