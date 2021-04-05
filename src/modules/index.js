import { combineReducers } from 'redux';
import { all } from 'redux-saga/effects';
import login, { loginSaga } from '@/modules/login';
import loading from '@/modules/loading';
import popup from '@/modules/popup';
import room, { roomSaga } from '@/modules/room';
import channel, { channelSaga } from '@/modules/channel';
import contact, { contactSaga } from '@/modules/contact';
import menu from '@/modules/menu';
import message, { messageSaga } from '@/modules/message';
import presence, { presenceSaga } from '@/modules/presence';
import mainlayer from '@/modules/mainlayer';
import error from '@/modules/error';
import { clearUserData } from '@/lib/util/localStorageUtil';

const appReducer = combineReducers({
  login,
  loading,
  popup,
  room,
  channel,
  contact,
  menu,
  message,
  presence,
  mainlayer,
  error,
});

const rootReducer = (state, action) => {
  if (action.type === 'login/LOGOUT') {
    clearUserData();

    state = undefined;
  }
  return appReducer(state, action);
};

export function* rootSaga() {
  // all 함수는 여러 사가를 합쳐 주는 역할을 함.
  yield all([
    loginSaga(),
    roomSaga(),
    channelSaga(),
    contactSaga(),
    messageSaga(),
    presenceSaga(),
  ]);
}

export default rootReducer;
