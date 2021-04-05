import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';
import qs from 'qs';

import { openToast, openPopup } from '@/lib/common';
import { requestAccessToken, startRefreshInterval } from '@/lib/zoomService';

const ZoomOAuthSuccess = ({ history, location }) => {
    const dispatch = useDispatch();
    const userInfo = useSelector(({ login }) => login.userInfo);
    const [code ,setCode] = useState('');

    useEffect(() => {
        // query string로부터 Authorization code 파싱
        // location.search에서 '?'를 위해 slice 사용
        const urlParams = qs.parse(location.search.slice(1));
        if(urlParams && urlParams.code) {
            const { code } = urlParams;
            console.log('Code : ', code);
            setCode(code);

            // 백엔드에 Authorization code 전송
            requestAccessToken(code).then(({ data }) => {
                let message = null;
                console.log('Token Response ::  ', data);
                if(data.status === 'FAIL') {
                    message = 'Zoom 연동에 실패했습니다.<br />다시 시도해주세요.';
                }

                const { access_token, refresh_token } = data.data;
                if(access_token && refresh_token) {
                    localStorage.setItem('covi_user_access_zoom_user', userInfo.id);
                    localStorage.setItem('covi_user_access_zoom_iat', Date.now());
                    localStorage.setItem('covi_user_access_zoom_token', access_token);
                    localStorage.setItem('covi_user_access_zoom_refresh', refresh_token);
                    startRefreshInterval();
                    // message = 'Zoom 연동이 완료되었습니다.';
                }
                if(message !== null) {
                    openPopup({
                        type: 'Alert',
                        message,
                        callback() {
                            window.close();
                        }
                    }, dispatch);
                } else {
                    window.close();
                }
            }).catch(err => {
                console.log('Zoom Error ', err);
                openPopup({
                    type: 'Alert',
                    message: 'Zoom 연동에 실패했습니다.<br />다시 시도해주세요.',
                    callback() {
                        window.close();
                    }
                }, dispatch);
            });
        } else {
            openPopup({
                type: 'Alert',
                message: 'Authorization Code가 필요합니다.<br />다시 시도해주세요.',
                callback() {
                    window.close();
                }
            }, dispatch);
        }
        // history.push('/cliant/main/contactlist');
    }, []);
    return <>
        Example OAuth Success Page<br />
        { code !== '' && `Your Code: ${code}`}
    </>
}

export default withRouter(ZoomOAuthSuccess);