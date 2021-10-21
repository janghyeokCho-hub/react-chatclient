import { session } from 'electron';
import qs from 'qs';

import { getConfig } from '@/lib/util/configUtil';
import { getRemote, getEmitter } from '@/lib/deviceConnector';
import { requestAccessToken, startRefreshInterval } from '@/lib/zoomService';

export function requestOAuth() {
    const zoomMeet = getConfig('ZoomMeet');
    const remote = getRemote();
    const redirectUri = covi.baseURL + '/client/main/oauth2/zoom/success';
    const OAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomMeet.client_id}&redirect_uri=${redirectUri}`;
    
    /* Electron window */
    const filter = {
        urls: [redirectUri + '*']
    };
    const window = new remote.BrowserWindow({
        width: 550,
        height: 750,
        // frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false
        }
    });

    // frame:true일시 default 메뉴바가 노출되므로 메뉴바만 비활성화
    window.setMenuBarVisibility(false);

    window.webContents.session.webRequest.onBeforeRequest(filter, async(details, cb) => {
        const url = details.url;
        const paramsWithoutDomain = url.slice(url.indexOf("?") + 1);
        const urlParams = qs.parse(paramsWithoutDomain);

        if(urlParams && urlParams.code) {
            const { code } = urlParams;
            console.log('Auth Code : ', code);
            try {
                const { data } = await requestAccessToken(code);
                if(data.status  === 'SUCCESS') {
                    const { access_token, refresh_token } = data.data;
                    if(access_token && refresh_token) {
                        const _userid = localStorage.getItem('covi_user_access_id');
                        localStorage.setItem('covi_user_access_zoom_user', _userid);
                        localStorage.setItem('covi_user_access_zoom_iat', Date.now());
                        localStorage.setItem('covi_user_access_zoom_token', access_token);
                        localStorage.setItem('covi_user_access_zoom_refresh', refresh_token);

                        getEmitter().send('log-info', { message: `ZoomLogin Success: user ${_userid}`});
                        startRefreshInterval();
                    } else {
                        console.log('No tokens in result data:  ', data);
                    }
                }
            } catch(err) {
                console.log('RequestAccessToken Error  ', err);
            }
        }
        window.close();
    });
    window.loadURL(OAuthUrl, { userAgent: 'Chrome' });
}