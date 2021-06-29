import { createAction, handleActions } from 'redux-actions';
import { takeLatest, call, put, takeEvery } from 'redux-saga/effects';
import * as messageApi from '@/lib/message';

import createRequestSaga, {
  createRequestActionTypes,
  exceptionHandler,
} from '@/lib/createRequestSaga';
import produce from 'immer';

const [SEND_MESSAGE, SEND_MESSAGE_SUCCESS, SEND_MESSAGE_FAILURE] =
  createRequestActionTypes('message/SEND_MESSAGE');

const RESEND_MESSAGE = 'message/RESEND_MESSAGE';

const UPDATE_TEMPMESSAGE = 'message/UPDATE_TEMPMESSAGE';
const REMOVE_TEMPMESSAGE = 'message/REMOVE_TEMPMESSAGE';

// FILE 부분 시작
const CHANGE_FILES = 'message/CHANGE_FILES';
const CLEAR_FILES = 'message/CLEAR_FILES';
const DELETE_FILE = 'message/DELETE_FILE';

const INIT = 'message/INIT';
const SET_MOVE_VIEW = 'message/SET_MOVE_VIEW';

// 채널
const [
  SEND_CHANNEL_MESSAGE,
  SEND_CHANNEL_MESSAGE_SUCCESS,
  SEND_CHANNEL_MESSAGE_FAILURE,
] = createRequestActionTypes('message/SEND_CHANNEL_MESSAGE');

const UPDATE_CHANNEL_TEMPMESSAGE = 'message/UPDATE_CHANNEL_TEMPMESSAGE';
const REMOVE_CHANNEL_TEMPMESSAGE = 'message/REMOVE_CHANNEL_TEMPMESSAGE';

export const init = createAction(INIT);
export const sendMessage = createAction(SEND_MESSAGE);
export const reSendMessage = createAction(RESEND_MESSAGE);
export const updateTempMessage = createAction(UPDATE_TEMPMESSAGE);
export const removeTempMessage = createAction(REMOVE_TEMPMESSAGE);
export const changeFiles = createAction(CHANGE_FILES);
export const clearFiles = createAction(CLEAR_FILES);
export const deleteFile = createAction(DELETE_FILE);
export const setMoveView = createAction(SET_MOVE_VIEW);

// 채널
export const sendChannelMessage = createAction(SEND_CHANNEL_MESSAGE);
export const updateChannelTempMessage = createAction(
  UPDATE_CHANNEL_TEMPMESSAGE,
);
export const removeChannelTempMessage = createAction(
  REMOVE_CHANNEL_TEMPMESSAGE,
);

function createSendMessageSaga(request, fileRequest, linkRequest) {
  const SUCCESS = `message/SEND_MESSAGE_SUCCESS`;
  const FAILURE = `message/SEND_MESSAGE_FAILURE`;

  return function* (action) {
    try {
      let messageParams = {
        context: action.payload.context,
        roomID: action.payload.roomID,
        roomType: action.payload.roomType,
        status: action.payload.status,
        tempId: action.payload.tempId,
        messageType: action.payload.messageType,
      };
      if (action.payload.sendFileInfo) {
        const responseFile = yield call(fileRequest, action.payload);

        if (responseFile.data.state == 'SUCCESS') {
          messageParams.fileInfos = JSON.stringify(responseFile.data.result);
        } else {
          yield put({
            type: FAILURE,
            payload: action.payload,
          });
        }
      }

      if (action.payload.linkInfo) {
        messageParams.linkInfo = JSON.stringify(action.payload.linkInfo);
      }

      if (action.payload.tagInfo) {
        messageParams.tagInfo = JSON.stringify(action.payload.tagInfo);
      }

      const response = yield call(request, messageParams);

      if (response.data.status == 'SUCCESS') {
        if (action.payload.linkInfo && action.payload.linkInfo.url != '') {
          const linkParams = {
            roomId: action.payload.roomID,
            messageId: response.data.result.messageID,
            url: action.payload.linkInfo.url,
          };
          yield call(linkRequest, linkParams);
        }
      } else {
        yield put({
          type: FAILURE,
          payload: action.payload,
        });
      }
    } catch (e) {
      console.dir(e);
      yield call(exceptionHandler, { e: e, redirectError: false });

      yield put({
        type: FAILURE,
        payload: action.payload,
        error: true,
      });
    }
  };
}

// 채널
function createSendChannelMessageSaga(request, fileRequest, linkRequest) {
  const SUCCESS = `message/SEND_MESSAGE_SUCCESS`;
  const FAILURE = `message/SEND_MESSAGE_FAILURE`;

  return function* (action) {
    try {
      let messageParams = {
        context: action.payload.context,
        roomID: action.payload.roomID,
        roomType: action.payload.roomType,
        status: action.payload.status,
        tempId: action.payload.tempId,
        messageType: action.payload.messageType,
      };
      if (action.payload.sendFileInfo) {
        const responseFile = yield call(fileRequest, action.payload);

        if (responseFile.data.state == 'SUCCESS') {
          messageParams.fileInfos = JSON.stringify(responseFile.data.result);
        } else {
          yield put({
            type: FAILURE,
            payload: action.payload,
          });
        }
      }

      if (action.payload.linkInfo) {
        messageParams.linkInfo = JSON.stringify(action.payload.linkInfo);
      }

      if (action.payload.tagInfo) {
        messageParams.tagInfo = JSON.stringify(action.payload.tagInfo);
      }

      if (action.payload.mentionInfo) {
        messageParams.targetArr = action.payload.mentionInfo;
      } else {
        messageParams.targetArr = [];
      }

      const response = yield call(request, messageParams);

      if (response.data.status == 'SUCCESS') {
        /*
        yield put({
          type: SUCCESS,
          payload: action.payload,
        });
        */

        if (action.payload.linkInfo && action.payload.linkInfo.url != '') {
          const linkParams = {
            roomId: action.payload.roomID,
            messageId: response.data.result.messageID,
            url: action.payload.linkInfo.url,
          };
          yield call(linkRequest, linkParams);
        }
      } else {
        yield put({
          type: FAILURE,
          payload: action.payload,
        });
      }
    } catch (e) {
      console.dir(e);
      yield call(exceptionHandler, { e: e, redirectError: false });

      yield put({
        type: FAILURE,
        payload: action.payload,
        error: true,
      });
    }
  };
}

const sendMessageSaga = createSendMessageSaga(
  messageApi.sendMessage,
  messageApi.uploadFile,
  messageApi.getURLThumbnail,
);
const reSendMessageSaga = createSendMessageSaga(
  messageApi.sendMessage,
  messageApi.uploadFile,
  messageApi.getURLThumbnail,
);

// 채널
const sendChannelMessageSaga = createSendChannelMessageSaga(
  messageApi.sendChannelMessage,
  messageApi.uploadFile,
  messageApi.getURLThumbnail,
);

export function* messageSaga() {
  yield takeEvery(SEND_MESSAGE, sendMessageSaga);
  yield takeLatest(RESEND_MESSAGE, reSendMessageSaga);

  // 채널
  yield takeEvery(SEND_CHANNEL_MESSAGE, sendChannelMessageSaga);
}

const initialState = {
  tempMessage: [],
  tempFiles: [],
  moveId: -1,
  moveRoomID: -1,
  moveVisible: false,
  // 채널
  tempChannelMessage: [],
};

let tempId = 0;

const message = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [UPDATE_TEMPMESSAGE]: (state, action) => {
      return produce(state, draft => {
        const currentTempMsgIndex = state.tempMessage.map((tempMsg, index) => {
          const matched = tempMsg.sendFileInfo.files.map(item => {
            if (item.tempId == action.payload.tempId) return true;
          });
          if (matched) return index;
        });
        draft.tempMessage[currentTempMsgIndex] = {
          ...state.tempMessage[currentTempMsgIndex],
          inprogress: action.payload.inprogress,
          total: action.payload.total,
        };
      });
    },
    [UPDATE_CHANNEL_TEMPMESSAGE]: (state, action) => {
      return produce(state, draft => {
        const currentTempMsgIndex = state.tempChannelMessage.map(
          (tempMsg, index) => {
            const matched = tempMsg.sendFileInfo.files.map(item => {
              if (item.tempId == action.payload.tempId) return true;
            });
            if (matched) return index;
          },
        );
        draft.tempChannelMessage[currentTempMsgIndex] = {
          ...state.tempChannelMessage[currentTempMsgIndex],
          inprogress: action.payload.inprogress,
          total: action.payload.total,
        };
      });
    },
    [SEND_MESSAGE]: (state, action) => {
      return produce(state, draft => {
        // 해당 메시지를 tempMessage에 넣고 상태를 send으로 지정
        const sendData = action.payload;
        sendData.status = 'send';
        sendData.tempId = tempId++;
        draft.tempMessage.push(sendData);
      });
    },
    [SEND_MESSAGE_SUCCESS]: (state, action) => {
      return produce(state, draft => {});
    },
    [SEND_MESSAGE_FAILURE]: (state, action) => {
      return produce(state, draft => {
        // 해당 메시지의 상태를 fail로 변경
        const sendData = draft.tempMessage.find(
          m => m.tempId === action.payload.tempId,
        );
        sendData.status = 'fail';
      });
    },
    [REMOVE_TEMPMESSAGE]: (state, action) => {
      return produce(state, draft => {
        // const sendData = draft.tempMessage.find(
        //   m => m.tempId === action.payload,
        // );
        // console.dir(sendData);
        // if (sendData.sendFileInfo) {
        //   console.dir(sendData.sendFileInfo.files);
        //   for (let pair of sendData.sendFileInfo.files.entries()) {
        //     console.log(pair[0] + ', ' + pair[1]);
        //     console.dir(pair[1]);
        //   }
        // }
        draft.tempMessage.splice(
          draft.tempMessage.findIndex(m => m.tempId === action.payload),
          1,
        );
      });
    },
    [RESEND_MESSAGE]: (state, action) => {
      return produce(state, draft => {
        // 해당 메시지를 tempMessage에 넣고 상태를 send으로 지정
        const sendData = draft.tempMessage.find(
          m => m.tempId === action.payload.tempId,
        );

        sendData.status = 'send';
      });
    },
    [CHANGE_FILES]: (state, action) => {
      return produce(state, draft => {
        draft.tempFiles = [...action.payload.files];
      });
    },
    [CLEAR_FILES]: (state, action) => {
      return produce(state, draft => {
        draft.tempFiles = [];
      });
    },
    [DELETE_FILE]: (state, action) => {
      return produce(state, draft => {
        const delIndex = draft.tempFiles.findIndex(
          item => item.tempId == action.payload,
        );
        draft.tempFiles.splice(delIndex, 1);
      });
    },
    [SET_MOVE_VIEW]: (state, action) => {
      return produce(state, draft => {
        draft.moveRoomID = action.payload.roomID;
        draft.moveId = action.payload.moveId;
        draft.moveVisible = action.payload.visible;
      });
    },
    // 채널
    [SEND_CHANNEL_MESSAGE]: (state, action) => {
      return produce(state, draft => {
        // 해당 채널 메시지를 tempMessage에 넣고 상태를 send으로 지정
        const sendData = action.payload;
        sendData.status = 'send';
        sendData.tempId = tempId++;
        draft.tempChannelMessage.push(sendData);
      });
    },
    [SEND_CHANNEL_MESSAGE_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        /*
        // 해당 채널 메시지 메시지 ID 매핑
        console.log('sendChannelMessageSuccess: ');
        console.dir(action.payload);
        const tempChannelMessage = draft.tempChannelMessage.find(
          m => m.tempId === action.payload.tempId,
        );
        */
      });
    },
    [SEND_CHANNEL_MESSAGE_FAILURE]: (state, action) => {
      return produce(state, draft => {
        // 해당 채널 메시지의 상태를 fail로 변경
        const sendData = draft.tempChannelMessage.find(
          m => m.tempId === action.payload.tempId,
        );

        sendData.status = 'fail';
      });
    },
    [REMOVE_CHANNEL_TEMPMESSAGE]: (state, action) => {
      return produce(state, draft => {
        // const sendData = draft.tempMessage.find(
        //   m => m.tempId === action.payload,
        // );
        // console.dir(sendData);
        // if (sendData.sendFileInfo) {
        //   console.dir(sendData.sendFileInfo.files);
        //   for (let pair of sendData.sendFileInfo.files.entries()) {
        //     console.log(pair[0] + ', ' + pair[1]);
        //     console.dir(pair[1]);
        //   }
        // }
        draft.tempChannelMessage.splice(
          draft.tempChannelMessage.findIndex(m => m.tempId === action.payload),
          1,
        );
      });
    },
  },
  initialState,
);

export default message;
