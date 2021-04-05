import { createAction, handleActions } from 'redux-actions';
import { takeLatest, call, put } from 'redux-saga/effects';
import * as presenceApi from '@/lib/presence';
import {
  createRequestActionTypes,
  exceptionHandler,
} from '@/lib/createRequestSaga';
import produce from 'immer';
import { evalConnector } from '@/lib/deviceConnector';

const SET_FIXEDUSERS = 'presence/SET_FIXEDUSER';
const ADD_FIXEDUSERS = 'presence/ADD_FIXEDUSERS';
const ADD_TARGETUSER = 'presence/ADD_TARGETUSER';
const ADD_TARGETUSERLIST = 'presence/ADD_TARGETUSERLIST';
const DEL_TARGETUSER = 'presence/DEL_TARGETUSER';
const DEL_TARGETUSERLIST = 'presence/DEL_TARGETUSERLIST';
const INIT = 'presence/INIT';

const [
  SET_TARGETUSER,
  SET_TARGETUSER_SUCCESS,
  SET_TARGETUSER_FAILURE,
] = createRequestActionTypes('presence/SET_TARGETUSER');

const SET_USERSPRESENCE = 'presence/SET_USERSPRESENCE';

export const init = createAction(INIT);
export const setFixedUsers = createAction(SET_FIXEDUSERS);
export const addFixedUsers = createAction(ADD_FIXEDUSERS);
export const addTargetUser = createAction(ADD_TARGETUSER);
export const addTargetUserList = createAction(ADD_TARGETUSERLIST);
export const delTargetUser = createAction(DEL_TARGETUSER);
export const delTargetUserList = createAction(DEL_TARGETUSERLIST);
export const setTargetUser = createAction(SET_TARGETUSER);
export const setUsersPresence = createAction(SET_USERSPRESENCE);

function createSetTargetUserSaga() {
  return function*(action) {
    if (action.payload) {
      try {
        const response = yield call(
          presenceApi.setPresenceTargetUser,
          action.payload,
        );
        yield put({
          type: 'presence/SET_TARGETUSER_SUCCESS',
          payload: response.data.result,
        });

        // TODO: AppData 저장 여부값 조건 추가 필요
        if (DEVICE_TYPE == 'd') {
          if (response.data.result && response.data.result.length > 0)
            yield call(evalConnector, {
              method: 'send',
              channel: 'req-save-presence',
              message: {
                params: response.data.result,
              },
            });
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'presence/SET_TARGETUSER_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}

const setTargetUserSaga = createSetTargetUserSaga();

export function* presenceSaga() {
  yield takeLatest(SET_TARGETUSER, setTargetUserSaga);
}

const initialState = {
  fixedUsers: {},
  users: {},
  viewList: [],
  actionQue: [],
};

const presence = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [SET_FIXEDUSERS]: (state, action) => {
      return produce(state, draft => {
        Object.keys(action.payload).forEach(item => {
          if (action.payload[item] && action.payload[item] != '') {
            if (!draft.fixedUsers[item])
              draft.actionQue.push({
                type: 'add',
                userId: item,
              });

            draft.fixedUsers[item] = action.payload[item];
          }
        });
      });
    },
    [ADD_FIXEDUSERS]: (state, action) => {
      return produce(state, draft => {
        action.payload.forEach(item => {
          if (item.presence && item.presence != '') {
            if (!draft.fixedUsers[item.id])
              draft.actionQue.push({
                type: 'add',
                userId: item.id,
              });

            draft.fixedUsers[item.id] = item.presence;
          }
        });
      });
    },
    [ADD_TARGETUSER]: (state, action) => {
      return produce(state, draft => {
        if (
          action.payload.state &&
          action.payload.state != '' &&
          !draft.fixedUsers[action.payload.userId]
        ) {
          draft.viewList.push(action.payload);
          draft.viewList.forEach(item => {
            draft.users[item.userId] = item.state;
          });

          draft.actionQue.push({
            type: 'add',
            userId: action.payload.userId,
          });
        }
      });
    },
    [ADD_TARGETUSERLIST]: (state, action) => {
      return produce(state, draft => {
        action.payload.forEach(item => {
          if (
            item.state &&
            item.state != '' &&
            !draft.fixedUsers[item.userId]
          ) {
            draft.viewList.push(item);

            draft.actionQue.push({
              type: 'add',
              userId: item.userId,
            });
          }
        });

        draft.viewList.forEach(item => {
          draft.users[item.userId] = item.state;
        });
      });
    },
    [DEL_TARGETUSER]: (state, action) => {
      return produce(state, draft => {
        if (!draft.fixedUsers[action.payload]) {
          draft.viewList.splice(
            draft.viewList.findIndex(item => item.userId === action.payload),
            1,
          );

          draft.actionQue.push({
            type: 'del',
            userId: action.payload,
          });

          delete draft.users[action.payload];
        }
      });
    },
    [DEL_TARGETUSERLIST]: (state, action) => {
      return produce(state, draft => {
        action.payload.forEach(param => {
          if (!draft.fixedUsers[param]) {
            draft.viewList.splice(
              draft.viewList.findIndex(item => item.userId === param),
              1,
            );

            draft.actionQue.push({
              type: 'del',
              userId: param,
            });

            delete draft.users[param];
          }
        });
      });
    },
    [SET_TARGETUSER]: (state, action) => {
      return produce(state, draft => {
        let prevActionQue = [];

        draft.actionQue.forEach(item => {
          if (prevActionQue.length == 0) {
            prevActionQue.push(JSON.parse(JSON.stringify(item)));
          } else {
            let prevLength = prevActionQue.length;
            for (let i = 0; i < prevLength; i++) {
              let prev = prevActionQue[i];
              if (prev.userId === item.userId) {
                prev.type = item.type;
                break;
              } else if (i == prevLength - 1) {
                prevActionQue.push(JSON.parse(JSON.stringify(item)));
              }
            }
          }
        });

        action.payload = prevActionQue;
      });
    },
    [SET_TARGETUSER_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload && action.payload.length > 0) {
          action.payload.forEach(item => {
            if (draft.users[item.userId]) draft.users[item.userId] = item.state;
            if (draft.fixedUsers[item.userId])
              draft.fixedUsers[item.userId] = item.state;
          });
        }

        draft.actionQue = [];
      });
    },
    [SET_USERSPRESENCE]: (state, action) => {
      return produce(state, draft => {
        const userId = action.payload.userId;
        const presence = action.payload.state;

        draft.viewList.forEach(item => {
          if (item.userId === userId) item.state = presence;
        });

        if (draft.users[userId]) draft.users[userId] = presence;
        if (draft.fixedUsers[userId]) draft.fixedUsers[userId] = presence;
      });
    },
  },
  initialState,
);

export default presence;
