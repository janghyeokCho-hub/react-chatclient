import { createAction, handleActions } from 'redux-actions';
import { takeLatest, call, put } from 'redux-saga/effects';
import { startLoading, finishLoading } from '@/modules/loading';

import { setContacts } from '@/modules/contact';
import { setRooms } from '@/modules/room';
import createRequestSaga, {
  createRequestActionTypes,
  exceptionHandler,
} from '@/lib/createRequestSaga';

import { evalConnector, closeSocket, syncAppData, getEmitter } from '@/lib/deviceConnector';

import * as loginApi from '@/lib/login';
import * as presenceApi from '@/lib/presence';
import * as contactApi from '@/lib/contact';
import * as roomApi from '@/lib/room';
import { getFixedUserData } from '@/lib/presenceUtil';

import produce from 'immer';
import { setFixedUsers, addFixedUsers } from './presence';

// 채널
import { setChannels } from '@/modules/channel';
import * as channelApi from '@/lib/channel';

import { clearZoomData } from '@/lib/util/localStorageUtil';
import { refreshAccessToken, accessTokenExpired, startRefreshInterval } from '@/lib/zoomService';

const [
  LOGIN_REQUEST,
  LOGIN_REQUEST_SUCCESS,
  LOGIN_REQUEST_FAILURE,
] = createRequestActionTypes('login/REQUEST');

const [
  EXT_LOGIN_REQUEST,
  EXT_LOGIN_REQUEST_SUCCESS,
  EXT_LOGIN_REQUEST_FAILURE,
] = createRequestActionTypes('login/EXT_REQUEST');

const [
  LOGOUT_REQUEST,
  LOGOUT_REQUEST_SUCCESS,
  LOGOUT_REQUEST_FAILURE,
] = createRequestActionTypes('login/LOGOUT_REQUEST');

const LOGOUT = 'login/LOGOUT';

const LOGIN_INIT = 'login/INITIALIZE';
const LOGIN_TOKENAUTH = 'login/TOKENAUTH';
const SET_MYPRESENCE = 'login/SET_MYPRESENCE';
const SET_LOCALSTORAGE = 'login/SET_LOCALSTORAGE';

const CHANGE_MYPHOTOPATH = 'login/CHANGE_MYPHOTOPATH';
const CHANGE_MYINFO = 'login/CHANGE_MYINFO';

const SYNC = 'login/SYNC';

const [
  SYNC_TOKEN_REQUEST,
  SYNC_TOKEN_REQUEST_SUCCESS,
  SYNC_TOKEN_REQUEST_FAILURE,
] = createRequestActionTypes('login/SYNC_TOKEN_REQUEST');

const CHANGE_SOCKETCONNECT = 'login/CHANGE_SOCKETCONNECT';

const RESYNC = 'login/RESYNC';

export const loginRequest = createAction(LOGIN_REQUEST);
export const extLoginRequest = createAction(EXT_LOGIN_REQUEST);
export const loginInit = createAction(LOGIN_INIT);
export const logoutRequest = createAction(LOGOUT_REQUEST);
export const loginTokenAuth = createAction(LOGIN_TOKENAUTH);
export const setMyPresence = createAction(SET_MYPRESENCE);
export const setLocalStorage = createAction(SET_LOCALSTORAGE);

export const logout = createAction(LOGOUT);
export const syncTokenRequest = createAction(SYNC_TOKEN_REQUEST);

export const changeSocketConnect = createAction(CHANGE_SOCKETCONNECT);

export const changeMyPhotoPath = createAction(CHANGE_MYPHOTOPATH);
export const changeMyInfo = createAction(CHANGE_MYINFO);

export const reSync = createAction(RESYNC);

//loginApi.loginRequest

function createLoginRequestSaga(loginType, syncType) {
  const SUCCESS = `${loginType}_SUCCESS`;
  const FAILURE = `${loginType}_FAILURE`;

  return function* (action) {
    if (action.payload) {
      try {
        yield put(startLoading(loginType));
        const response = yield call(loginApi.loginRequest, action.payload);
        // macAddr 체크 (서버로 macAddr 보내지 않고 서버에서 받은 white list와 직접 비교)
        //TODO: 한국투자공사 :: macaddress capture 불가 이슈
        /*
        if (DEVICE_TYPE === 'd') {
          const macAddr = yield call(evalConnector, {
            method: 'sendSync',
            channel: 'req-get-macaddr',
            message: {},
          });

          if (typeof macAddr === 'object' && macAddr !== null) {
            for (const [key, values] of Object.entries(macAddr)) {
              console.log(`${key}:: ${values.mac}`);
            }
          }
        }
         */

        yield put(finishLoading(loginType));
        if (response.data.status == 'SUCCESS') {
          if (response.data.result && response.data.token) {
            yield put(setLocalStorage(response.data));
            /**
             * 2020.12.30
             * SaaS 버전 대응
             * request header에 추가할 user id를 localStorage에 저장
             */
            // localStorage.setItem('covi_user_access_id', response.data.result.id);
            // // localStorage에 token 세팅
            // localStorage.setItem('covi_user_access_token', response.data.token);
            // login 후처리 시작
            // 동기화 시작
            yield put(startLoading(syncType));
            // 1. presence online 처리
            if (DEVICE_TYPE == 'd') {
              yield call(presenceApi.pubPresence, {
                userId: action.payload.id,
                state: response.data.result.presence,
                type: 'LOGIN',
              });
              yield put(setMyPresence(response.data.result.presence));
              yield call(evalConnector, {
                method: 'send',
                channel: 'set-before-presence',
                message: response.data.result.presence,
              });
            }
            yield put(
              addFixedUsers([
                {
                  id: response.data.result.id,
                  presence: response.data.result.presence,
                },
              ]),
            );

            // 2. 동기화 정보 세팅
            // TODO: AppData 저장 여부값 조건 추가 필요
            if (DEVICE_TYPE == 'd') {
              // 동기화
              yield call(syncAppData, response.data);

              // AppData 에서 조회하여 store에 세팅
              const rooms = yield call(evalConnector, {
                method: 'sendSync',
                channel: 'req-get-room',
                message: {},
              });
              yield put(setRooms(rooms));

              const users = yield call(getFixedUserData, {
                array: rooms.rooms,
                key: 'members',
              });
              yield put(setFixedUsers(users));
            } else {
              // 2-1 채팅방 정보 불러오기
              const rooms = yield call(roomApi.getRoomList, {});
              if (rooms.data.status == 'SUCCESS') {
                yield put(setRooms(rooms.data));

                const users = yield call(getFixedUserData, {
                  array: rooms.data.rooms,
                  key: 'members',
                });
                yield put(setFixedUsers(users));
              }
            }

            // 2-2 연락처 정보 불러오기
            const contacts = yield call(
              contactApi.getContactList,
              response.data.result.DeptCode,
            );
            if (contacts.data.status == 'SUCCESS') {
              yield put(setContacts(contacts.data));

              const users = yield call(getFixedUserData, {
                array: contacts.data.result,
                key: 'sub',
              });
              yield put(setFixedUsers(users));
            }

            // 채널
            const channels = yield call(channelApi.getChannelList, {
              userId: response.data.result.id,
              members: [response.data.result.id],
            });
            if (channels.data.status == 'SUCCESS') {
              yield put(setChannels(channels.data));
            }

            // 동기화 끝
            yield put(finishLoading(syncType));

            // 로그인 완료처리
            yield put({
              type: SUCCESS,
              payload: response.data,
            });
          } else {
            // Response Data 또는 Token이 비어있을 경우 FAILURE
            yield put({
              type: FAILURE,
              payload: action.payload,
            });
          }
        } else {
          /**
           * 2021.01.20
           * 로그인 실패시 FAILURE
           * 
           * 로그인 실패 유형에 따른 response.data.result 값
           * 1. 서버 에러       '[EE-CRLAC1] Exception'
           * 2. id/pw 불일치    '[EF-CRLAC8] No User data'
           * 
           * 에러코드 파싱
           * const match = /\[([a-zA-Z0-9]*\-[a-zA-Z0-9]*)/g.exec(err)[1];
           * getDic('Msg_wrongLoginInfo')
           */
          yield put({
            type: FAILURE,
            payload: action.payload,
            errMessage: response.data.result,
            errStatus: response.data.status,
          });
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: true });

        yield put({
          type: FAILURE,
          payload: action.payload,
          error: true,
        });
      } finally {
        // loading state가 해제되지 않는 현상 수정
        yield put(finishLoading(loginType));
        yield put(finishLoading(syncType));
      }
    }
  };
}

const loginRequestSaga = createLoginRequestSaga(LOGIN_REQUEST, SYNC);

function createExtLoginRequestSaga(loginType, syncType) {
  const SUCCESS = `${loginType}_SUCCESS`;
  const FAILURE = `${loginType}_FAILURE`;

  return function* (action) {
    if (action.payload) {
      try {
        yield put(startLoading(loginType));
        const response = yield call(loginApi.extLoginRequest, action.payload);
        yield put(finishLoading(loginType));
        if (response.data.status == 'SUCCESS') {
          if (response.data.result && response.data.token) {
            // localStorage에 token 세팅
            localStorage.setItem('covi_user_access_token', response.data.token);
            localStorage.setItem('covi_user_access_id', response.data.result.id);
            // login 후처리 시작
            // 동기화 시작
            yield put(startLoading(syncType));
            // 1. presence online 처리
            if (DEVICE_TYPE == 'd') {
              yield call(presenceApi.pubPresence, {
                userId: action.payload.id,
                state: response.data.result.presence,
                type: 'LOGIN',
              });
              yield put(setMyPresence(response.data.result.presence));
              yield call(evalConnector, {
                method: 'send',
                channel: 'set-before-presence',
                message: response.data.result.presence,
              });
            }
            yield put(
              addFixedUsers([
                {
                  id: response.data.result.id,
                  presence: response.data.result.presence,
                },
              ]),
            );

            // 2. 동기화 정보 세팅
            // TODO: AppData 저장 여부값 조건 추가 필요
            if (DEVICE_TYPE == 'd') {
              // 동기화
              yield call(syncAppData, response.data);

              // AppData 에서 조회하여 store에 세팅
              const rooms = yield call(evalConnector, {
                method: 'sendSync',
                channel: 'req-get-room',
                message: {},
              });
              yield put(setRooms(rooms));

              const users = yield call(getFixedUserData, {
                array: rooms.rooms,
                key: 'members',
              });
              yield put(setFixedUsers(users));
            } else {
              // 2-1 채팅방 정보 불러오기
              const rooms = yield call(roomApi.getRoomList, {});
              if (rooms.data.status == 'SUCCESS') {
                yield put(setRooms(rooms.data));

                const users = yield call(getFixedUserData, {
                  array: rooms.data.rooms,
                  key: 'members',
                });
                yield put(setFixedUsers(users));
              }
            }

            // 채널
            const channels = yield call(channelApi.getChannelList, {
              userId: response.data.result.id,
              members: [response.data.result.id],
            });
            if (channels.data.status == 'SUCCESS') {
              yield put(setChannels(channels.data));
            }

            // 동기화 끝
            yield put(finishLoading(syncType));

            // 로그인 완료처리
            yield put({
              type: SUCCESS,
              payload: response.data,
            });
          } else {
            yield put({
              type: FAILURE,
              payload: action.payload,
            });
          }
        } else {
          yield put({
            type: FAILURE,
            payload: action.payload,
          });
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: true });

        yield put({
          type: FAILURE,
          payload: action.payload,
          error: true,
        });
      } finally {
        // loading state가 해제되지 않는 현상 수정
        yield put(finishLoading(loginType));
        yield put(finishLoading(syncType));
      }
    }
  };
}

const extLoginRequestSaga = createExtLoginRequestSaga(EXT_LOGIN_REQUEST, SYNC);

function createLogoutRequestSaga(type, api) {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;

  return function* (action) {
    if (action.payload) {
      try {
        if (DEVICE_TYPE == 'd') {
          // db close
          const returnVal = yield call(evalConnector, {
            method: 'sendSync',
            channel: 'req-logout',
            message: '',
          });
        }

        const response = yield call(api, action.payload);
        // logout event trigger
        if (DEVICE_TYPE == 'd') {
          // socket close
          yield closeSocket(true);
        }
        yield put(logout());
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });

        yield put({
          type: FAILURE,
          payload: action.payload,
          error: true,
        });
      }
    }
  };
}

const logoutRequestSaga = createLogoutRequestSaga(
  LOGOUT_REQUEST,
  loginApi.logoutRequest,
);

function createSyncTokenRequestSaga(type) {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;

  return function* (action) {
    if (action.payload.result) {
      try {
        const result = action.payload.result;
        if (result.status == 'SUCCESS') {
          const authData = result.userInfo;
          // login 후처리 시작

          if (action.payload.sync) {
            // Store 세팅
            yield put(startLoading(type));

            yield put(
              addFixedUsers([
                {
                  id: authData.id,
                  presence: authData.presence,
                },
              ]),
            );

            // 1 채팅방 정보 불러오기
            // TODO: AppData 저장 여부값 조건 추가 필요
            if (DEVICE_TYPE == 'd') {
              const rooms = yield call(evalConnector, {
                method: 'sendSync',
                channel: 'req-get-room',
                message: {},
              });
              yield put(setRooms(rooms));

              const users = yield call(getFixedUserData, {
                array: rooms.rooms,
                key: 'members',
              });
              yield put(setFixedUsers(users));
            } else {
              const rooms = yield call(roomApi.getRoomList, {});
              if (rooms.data.status == 'SUCCESS') {
                yield put(setRooms(rooms.data));

                const users = yield call(getFixedUserData, {
                  array: rooms.data.rooms,
                  key: 'members',
                });
                yield put(setFixedUsers(users));
              }
            }

            // 2 연락처 정보 불러오기
            const contacts = yield call(
              contactApi.getContactList,
              authData.DeptCode,
            );
            if (contacts.data.status == 'SUCCESS') {
              yield put(setContacts(contacts.data));

              const users = yield call(getFixedUserData, {
                array: contacts.data.result,
                key: 'sub',
              });
              yield put(setFixedUsers(users));
            }

            // 채널
            const channels = yield call(channelApi.getChannelList, {
              userId: authData.id,
              members: [authData.id],
            });
            if (channels.data.status == 'SUCCESS') {
              yield put(setChannels(channels.data));
            }

            // Store 세팅 끝
            yield put(finishLoading(type));
          }
        }
        else {
          /// result.status === 'fail
        }
        yield put(loginTokenAuth(result));
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: true });

        yield put({
          type: FAILURE,
          payload: action.payload.result,
          error: true,
        });
      }
    }
  };
}

const syncTokenRequestSaga = createSyncTokenRequestSaga(SYNC_TOKEN_REQUEST);

function createReSyncRequestSaga() {
  return function* (action) {
    try {
      // 1 채팅방 정보 불러오기
      // TODO: AppData 저장 여부값 조건 추가 필요
      if (DEVICE_TYPE == 'd') {
        const rooms = yield call(evalConnector, {
          method: 'sendSync',
          channel: 'req-get-room',
          message: {},
        });
        yield put(setRooms(rooms));

        const users = yield call(getFixedUserData, {
          array: rooms.rooms,
          key: 'members',
        });
        yield put(setFixedUsers(users));
      }
    } catch (e) {
      console.dir(e);
      yield call(exceptionHandler, { e: e, redirectError: true });
    }
  };
}

const reSyncRequestSaga = createReSyncRequestSaga();

export function* loginSaga() {
  yield takeLatest(LOGIN_REQUEST, loginRequestSaga);
  yield takeLatest(EXT_LOGIN_REQUEST, extLoginRequestSaga);
  yield takeLatest(LOGOUT_REQUEST, logoutRequestSaga);
  yield takeLatest(SYNC_TOKEN_REQUEST, syncTokenRequestSaga);
  yield takeLatest(RESYNC, reSyncRequestSaga);
}

const initialState = {
  id: '',
  token: null,
  userInfo: null,
  registDate: null,
  authFail: false,
  errMessage: null,
  errStatus: null,
  socketConnect: 'NC',
};

const login = handleActions(
  {
    [LOGIN_REQUEST_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.status === 'SUCCESS') {
          draft.authFail = false;
          draft.userInfo = action.payload.result;
          draft.token = action.payload.token;
          // SaaS버전 대응을 위해 token에서 id값 추출->result.id로 대체
          draft.id = action.payload.result.id; //draft.id = action.payload.token.split('^')[0];
          draft.registDate = action.payload.createDate;
        } else {
          console.log('Requesst Login Error ', action.payload);
          draft.authFail = true;
          draft.token = initialState.token;
        }
      });
    },
    [LOGIN_REQUEST_FAILURE]: (state, action) => {
      console.log('Request Login Failure ', action);
      return {
        ...state,
        authFail: true,
        ...(action.errMessage && { errMessage: action.errMessage }),
        ...(action.errStatus && { errStatus: action.errStatus }),
        token: initialState.token,
      }
    },
    [EXT_LOGIN_REQUEST_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.status === 'SUCCESS') {
          draft.authFail = false;
          draft.userInfo = action.payload.result;
          draft.token = action.payload.token;
          // SaaS버전 대응을 위해 token에서 id값 추출->result.id로 대체
          draft.id = action.payload.result.id; //draft.id = action.payload.token.split('^')[0];
          draft.registDate = action.payload.createDate;
        } else {
          draft.authFail = true;
          draft.token = initialState.token;
        }
      });
    },
    [EXT_LOGIN_REQUEST_FAILURE]: (state, action) => ({
      ...state,
      authFail: true,
      token: initialState.token,
    }),
    [LOGIN_INIT]: (state, action) => ({
      ...initialState,
    }),

    [LOGOUT_REQUEST_SUCCESS]: (state, action) => ({
      ...initialState,
    }),

    [LOGOUT_REQUEST_FAILURE]: (state, action) => ({
      ...initialState,
    }),
    [LOGIN_TOKENAUTH]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.status === 'SUCCESS') {
          draft.authFail = false;
          draft.userInfo = action.payload.userInfo;
          draft.token = action.payload.token;
          // SaaS버전 대응을 위해 token에서 id값 추출->userInfo.id로 대체
          draft.id = action.payload.userInfo.id; //draft.id = action.payload.token.split('^')[0];
          draft.registDate = action.payload.createDate;
        } else {
          draft.authFail = true;
          draft.token = '';
        }
      });
    },
    [SET_MYPRESENCE]: (state, action) => ({
      ...state,
      userInfo: {
        ...state.userInfo,
        presence: action.payload,
      },
    }),

    [SET_LOCALSTORAGE]: (state, action) => {
      /**
       * 2020.12.31
       * SaaS 대응 패치
       * 
       * state 업데이트 이외의 Side-Effect가 포함되어 있음
       * 추후 리팩토링 필요
       */
      // `payload.id` or `payload.result.id`

      /**
       * 2021.03.23
       * 현재 로그인한 유저가 zoom 토큰을 발급했던 유저와 다를경우 zoom 토큰데이터 clear
       */
      localStorage.setItem('covi_user_access_id', action.payload.result.id);
      localStorage.setItem('covi_user_access_token', action.payload.token);

      if(action.payload.result.id !== localStorage.getItem('covi_user_access_zoom_user')) {
        clearZoomData();
      } else {
        // 재로그인시 미리 refresh 수행
        if(accessTokenExpired() === true) {
          DEVICE_TYPE === 'd' && getEmitter().send('log-info', { message: `Refresh ZoomToken on login: user ${action.payload.result.id}`});
          refreshAccessToken();
        }
        // 자동 refresh interval 시작
        startRefreshInterval();
      }
  
      return state;
    },
    [CHANGE_SOCKETCONNECT]: (state, action) => {
      return produce(state, draft => {
        draft.socketConnect = action.payload;
      });
    },
    [CHANGE_MYPHOTOPATH]: (state, action) => {
      return produce(state, draft => {
        draft.userInfo.photoPath = action.payload;
      });
    },
    [CHANGE_MYINFO]: (state, action) => {
      return produce(state, draft => {
        draft.userInfo.mailAddress = action.payload.mailAddress;
        draft.userInfo.phoneNumber = action.payload.phoneNumber;
        draft.userInfo.work = action.payload.chargeBusiness;
      });
    },
  },
  initialState,
);

export default login;
