
import { getConfig } from '@/lib/util/configUtil';

export function requestOAuth() {
    const zoomMeet = getConfig('ZoomMeet');
    /**
    * 2021.02.02
    * 
    * ngrok 테스트용 url이 localStorage에 저장되어 있을 경우 해당 경로로 대체
    * 
    * =ngrok url로 테스트 방법=
    * 1. ngrok cli로 localhost:3000에 대한 프록시 url 생성 (ex: ngrok http --host-header=rewrite 3000)
    * 2. Zoom 사이트 OAuth 관리메뉴 들어가서 생성한 url을 whitelist에 추가
    * 3. 실행한 페이지에서 localStorage의 'redirect_ngrok' 키에 ngrok url 저장
    * 4. 테스트 진행
    * 
    * =ngrok url로 redirect 이후에 http request 오류 해결 (크롬 기준)=
    * 1. 상단 바에서 url 옆의 버튼으로 사이트 설정 열기
    * 2. 권한 - '팝업 및 리디렉션'과 '안전하지 않은 콘텐츠' 허용으로 변경
    * 3. 다시 테스트 진행
    * 
    * */
    const redirectUri = encodeURIComponent(window.location.origin + '/client/main/oauth2/zoom/success');
    const OAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomMeet.client_id}&redirect_uri=${redirectUri}`;
    // Zoom OAuth 인증페이지로 이동
    window.open(OAuthUrl);
    // window.location.assign(OAuthUrl);
}