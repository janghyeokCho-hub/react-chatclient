import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';
import { takeLatest, call, put } from 'redux-saga/effects';
import { getDocList, getDocItem, updateDocument } from '@/lib/document';
import createRequestSaga, {
  createRequestActionTypes,
  exceptionHandler,
} from '@/lib/createRequestSaga';
import { getJobInfo } from '@/lib/common';
import { create } from '@/modules/popup';
import { getRoomInfo } from '@/lib/room';
import { getChannelInfo } from '@/lib/channel';
import { isJSONStr } from '@/lib/common';

const [GET_DOCUMENTS, GET_DOCUMENTS_SUCCESS, GET_DOCUMENTS_FAILURE] =
  createRequestActionTypes('document/GET_DOCUMENTS');

const [
  SET_CURRENT_DOCUMENT,
  SET_CURRENT_DOCUMENT_SUCCESS,
  SET_CURRENT_DOCUMENT_FAILURE,
] = createRequestActionTypes('document/SET_CURRENT_DOCUMENT');

const [
  MODIFY_DOCUMENTSETTING,
  MODIFY_DOCUMENTSETTING_SUCCESS,
  MODIFY_DOCUMENTSETTING_FAILURE,
] = createRequestActionTypes('document/MODIFY_DOCUMENTSETTING');

const SET_CURRENT_DOCUMENT_INIT = 'document/SET_CURRENT_DOCUMENT_INIT';

const INIT = 'document/INIT';

const RECEIVE_DOCUMENT = 'document/RECEIVE_DOCUMENT';

export const getDocuments = createAction(GET_DOCUMENTS);
export const setCurrentDocument = createAction(SET_CURRENT_DOCUMENT);
export const setCurrentDocumentInit = createAction(SET_CURRENT_DOCUMENT_INIT);
export const modifyDocumentSetting = createAction(MODIFY_DOCUMENTSETTING);
export const receiveDocument = createAction(RECEIVE_DOCUMENT);
export const init = createAction(INIT);

function createGetDocumentsSaga(type) {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;
  return function* (action) {
    if (!action.payload) return;
    try {
      const response = yield call(getDocList, action.payload);
      const isSuccess = response.data.status === 'SUCCESS';
      if (isSuccess) {
        console.log('type : ', SUCCESS);
        yield put({
          type: SUCCESS,
          payload: response.data,
        });
      }
    } catch (err) {
      yield put({
        type: FAILURE,
        payload: action.payload,
        error: true,
        errMessage: err,
      });
    }
  };
}
const getDocumentsSaga = createGetDocumentsSaga(GET_DOCUMENTS);

function createSetCurrnetDocumentSaga(type) {
  const SUCCESS = `${type}_SUCCESS`;
  const FAILURE = `${type}_FAILURE`;
  return function* (action) {
    if (!action.payload) return;
    try {
      const response = yield call(getDocItem, action.payload);
      const isSuccess = response.data.status === 'SUCCESS';
      if (isSuccess) {
        const { result } = response?.data;
        const isChannel = result.roomType === 'C';
        let room;
        if (isChannel) {
          const channel = yield call(getChannelInfo, {
            roomId: result.roomID,
          });
          console.log(channel);
          room = channel?.data?.room;
        } else {
          const chatRoom = yield call(getRoomInfo, {
            roomID: result.roomID,
          });
          room = chatRoom?.data?.room;
        }
        yield put({
          type: SUCCESS,
          payload: { ...result, room: room },
        });
      }
    } catch (err) {
      yield put({
        type: FAILURE,
        payload: action.payload,
        error: true,
        errMessage: err,
      });
    }
  };
}
const setCurrentDocumentSaga =
  createSetCurrnetDocumentSaga(SET_CURRENT_DOCUMENT);

function createModifyDocumentSettingSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const response = yield call(updateDocument, action.payload);

        if (response?.data?.status === 'SUCCESS') {
          yield put({
            type: 'document/MODIFY_DOCUMENTSETTING_SUCCESS',
            payload: response.data,
          });
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'document/MODIFY_DOCUMENTSETTING_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}

const modifyDocumentSettingSaga = createModifyDocumentSettingSaga();

export function* documentSaga() {
  yield takeLatest(GET_DOCUMENTS, getDocumentsSaga);
  yield takeLatest(SET_CURRENT_DOCUMENT, setCurrentDocumentSaga);
  yield takeLatest(MODIFY_DOCUMENTSETTING, modifyDocumentSettingSaga);
}

const initialState = {
  documents: [],
  currentDocument: null,
};

const document = handleActions(
  {
    [INIT]: (state, action) => {
      return {
        ...initialState,
      };
    },
    [GET_DOCUMENTS_SUCCESS]: (state, action) => {
      return {
        ...state,
        documents: action.payload?.result || [],
      };
    },
    [SET_CURRENT_DOCUMENT_SUCCESS]: (state, action) => {
      return {
        ...state,
        currentDocument: action.payload || null,
      };
    },
    [SET_CURRENT_DOCUMENT_INIT]: (state, action) => {
      return produce(state, draft => {
        draft.currentDocument = null;
      });
    },
    [MODIFY_DOCUMENTSETTING_SUCCESS]: (state, action) => {
      // setting 만 변경한 경우
      return produce(state, draft => {
        const result = action.payload.result;
        const document = draft.documents.find(
          item => item.docID === result.docID,
        );
        document.setting = isJSONStr(result.setting)
          ? JSON.parse(result.setting)
          : result.setting;
        document.pinTop = result.pinTop;
        document.category = result.category;
      });
    },
    [RECEIVE_DOCUMENT]: (state, action) => {
      // docTitle 또는 description 이 변경 될 때에만 사용됨.
      return produce(state, draft => {
        draft.documents.push(action.payload);
      });
    },
  },
  initialState,
);
export default document;
