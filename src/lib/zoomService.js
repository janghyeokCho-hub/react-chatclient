import axios from 'axios';
import qs from 'qs';
import Config from '@/config/config';
import { getConfig } from '@/lib/util/configUtil';
import { getAesUtil } from '@/lib/aesUtil';
import { evalConnector, getEmitter } from '@/lib/deviceConnector';
import { clearZoomData } from '@/lib/util/localStorageUtil';

const { requestOAuth } = require(`@/lib/${DEVICE_TYPE}/OAuthZoom`);

export const REFRESH_THRESHOLD = 1000*60*55;    // ZoomToken refresh 기준시간
// export const REFRESH_THRESHOLD = 1000*15;    // ZoomToken refresh 기준시간 test
export const REFRESH_INTERVAL = 1000*60*5;       // ZoomToken refresh interval 주기
// export const REFRESH_INTERVAL = 1000*10;       // ZoomToken refresh interval 주기 test

function zoomsvr(method, url, params, headers) {
    const ZOOM_SERVER = `${Config.ServerURL.MANAGE}/na/nf/zoom`;
    const accessToken = localStorage.getItem('covi_user_access_token');
    const accessId = localStorage.getItem('covi_user_access_id');
    const zoomToken = localStorage.getItem('covi_user_access_zoom_token');
    const zoomRefreshToken = localStorage.getItem('covi_user_access_zoom_refresh');
    const withToken = zoomToken && zoomRefreshToken;

    const reqOptions = {
        method,
        url: `${ZOOM_SERVER}${url}`,
        data: {
            // localStorage에 값이 존재할 경우에만 body에 토큰 전송
            ...(withToken && {
                access_token: zoomToken,
                refresh_token: zoomRefreshToken
            }),
            ...params,
        },
        headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json; charset=utf-8',
            'Covi-User-Access-Version': APP_VERSION,
            'Covi-User-Device-Type':
                DEVICE_TYPE === 'd' ? 'covision.desktop.app' : 'covision.web.app',
            'Covi-User-Access-Token': accessToken,
            'Covi-User-Access-ID': accessId,
            ...headers,
        },
    };
    return axios(reqOptions);
}

function getMeetingInfo(roomId) {
    return zoomsvr('POST', `/users/${roomId}/meetings`);
}

function getUserInfo() {
    const access_token = localStorage.getItem('covi_user_access_zoom_token');
    // return zoomsvr('GET', `/users/${email}`);
    return zoomsvr('GET', `/users?access_token=${access_token}&email=me`);
    // return zoomsvr('GET', `/users/me?access_token=${access_token}`);
}

function initializeZoomUser(email) {
    if(getUseZoomFlag() === false) {
        return;
    }
    getUserInfo(email);
}

function getUseZoomFlag() {
    if(DEVICE_TYPE === 'd') {
        const userConfig = evalConnector({
            method: 'getGlobal',
            name: 'USER_SETTING',
        });
        console.log(userConfig);
        console.log(userConfig.get('useZoom'));
    }
    return localStorage.getItem('covi_user_zoom_activation') === 'true';
};

async function requestAccessToken(code) {
    const zoomConfig = getConfig('ZoomMeet');
    let redirect_uri;
    if(DEVICE_TYPE === 'b') {
        const { origin, pathname } = window.location;
        redirect_uri = encodeURIComponent(origin + pathname);
    } else {
        redirect_uri = encodeURIComponent(covi.baseURL + '/client/main/oauth2/zoom/success');
    }
    const urlParams = (zoomConfig.client_secret) ? `?client_id=${zoomConfig.client_id}&secret=${zoomConfig.client_secret}&redirect_uri=${redirect_uri}&code=${code}` : '';
    return zoomsvr('POST', '/oauth/token' + urlParams);
}

let refreshInterval = null;

async function refreshAccessToken() {
    const zoomConfig = getConfig('ZoomMeet');
    try {
        const accessToken = localStorage.getItem('covi_user_access_zoom_token');
        const refreshToken = localStorage.getItem('covi_user_access_zoom_refresh');
        const urlParams = {
            access_token: accessToken,
            refresh_token: refreshToken,
            client_id: zoomConfig.client_id,
            secret: zoomConfig.client_secret
        };
        const response = await zoomsvr('POST', '/oauth/token?' + qs.stringify(urlParams));
        if(response.data.status === 'SUCCESS') {
            const { access_token, refresh_token } = response.data.data;
            if(access_token && refresh_token) {
                const _userid = localStorage.getItem('covi_user_access_id');
                localStorage.setItem('covi_user_access_zoom_user', _userid);
                localStorage.setItem('covi_user_access_zoom_iat', Date.now());
                localStorage.setItem('covi_user_access_zoom_token', access_token);
                localStorage.setItem('covi_user_access_zoom_refresh', refresh_token);
                DEVICE_TYPE === 'd' && getEmitter().send('log-info', { message: `Refresh ZoomToken on userid ${_userid}`});
            }
        }
        // token refresh 요청이 error라면 (즉, data.reason에 에러 메시지가 있는 경우)
        // zoom token 데이터를 리셋함 (재연동 필요)
        if(response.data.data && response.data.data.reason) {
            clearZoomData();
        }
        return response;
    } catch(err) {
        return err.data;
    }
}

function accessTokenExpired() {
    const issuedAt = localStorage.getItem('covi_user_access_zoom_iat');
    const current = Date.now();
    return current - issuedAt > REFRESH_THRESHOLD;
}

function startRefreshInterval() {
    if(refreshInterval !== null) {
        // 이전 interval이 지워지지 않았을 경우 초기화
        stopRefreshInterval();
    }

    refreshInterval = setInterval(() => {
        if(localStorage.getItem('covi_user_access_token') === null || localStorage.getItem('covi_user_access_zoom_token') === null) {
            // interval 시점에 로그아웃 상태 or 토큰이 없다면 interval 중단
            console.log('Stop Zoom Interval');
            stopRefreshInterval();
        } else {
            if(accessTokenExpired() === true) {
                // 토큰 발급시점이 55분 지났다면 ZoomToken refresh
                refreshAccessToken();
            }
        }
    }, REFRESH_INTERVAL);

    DEVICE_TYPE === 'd' && getEmitter().send('log-info', { message: `Start ZoomToken Refresh Interval: intervalId ${refreshInterval} user ${localStorage.getItem('covi_user_access_id')}` });
    
    return refreshInterval;
}

function stopRefreshInterval() {
    clearInterval(refreshInterval);
    refreshInterval = null;
}

export {
    requestOAuth,
    zoomsvr,
    requestAccessToken,
    refreshAccessToken,
    accessTokenExpired,
    startRefreshInterval,
    stopRefreshInterval,
    getUserInfo,
    getMeetingInfo,
    initializeZoomUser,
    getUseZoomFlag
}