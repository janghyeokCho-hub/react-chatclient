import { call, put } from 'redux-saga/effects';
import { startLoading, finishLoading } from '@/modules/loading';
import { set } from '@/modules/error';
import { evalConnector } from '@/lib/deviceConnector';

export const createRequestActionTypes = type => {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;
  return [type, SUCCESS, FAILURE];
};

export default function createRequestSaga(type, request, redirectError) {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;

  return function*(action) {
    yield put(startLoading(type));
    try {
      const response = yield call(request, action.payload);
      yield put({
        type: SUCCESS,
        payload: response.data,
      });
    } catch (e) {
      console.dir(e);
      yield call(exceptionHandler, { e: e, redirectError: redirectError });

      yield put({
        type: FAILURE,
        payload: e,
        error: true,
      });
    }
    yield put(finishLoading(type));
  };
}

export const exceptionHandler = function*({ e, redirectError }) {
  if (redirectError) {
    yield put(
      set({
        error: true,
        object: e,
      }),
    );
  } else {
    if (DEVICE_TYPE == 'd') {
      yield call(evalConnector, {
        method: 'send',
        channel: 'req-save-error',
        message: (e && e.stack) || 'empty message',
      });
    } else {
      console.dir(e);
    }
  }
};
