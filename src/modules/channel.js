// modules\room.js

import { createAction, handleActions } from 'redux-actions';
import { takeLatest, call, put, throttle } from 'redux-saga/effects';

import * as messageApi from '@/lib/message';
import * as channelApi from '@/lib/channel';
import { modifyRoomSetting } from '@/lib/room';
import {
  createRequestActionTypes,
  exceptionHandler,
} from '@/lib/createRequestSaga';
import produce from 'immer';
import { removeChannelTempMessage, setMoveView } from '@/modules/message';
import { setCurrentChannel } from '@/modules/menu';
import {
  isMainWindow,
  resetParentUnreadCount,
  sendMain,
} from '@/lib/deviceConnector';
import { startLoading, finishLoading } from '@/modules/loading';
import { changeOpenRoom } from '@/modules/room';
import { set } from '@/modules/error';
import { get } from '@/lib/util/storageUtil';
import { isJSONStr } from '@/lib/common';

const INIT = 'channel/INIT';
const SET_CHANNELS = 'channel/SET_CHANNELS';
const [GET_CHANNELS, GET_CHANNELS_SUCCESS, GET_CHANNELS_FAILURE] =
  createRequestActionTypes('channel/GET_CHANNELS');

const [UPDATE_CHANNELS, UPDATE_CHANNELS_SUCCESS, UPDATE_CHANNELS_FAILURE] =
  createRequestActionTypes('channel/UPDATE_CHANNELS');

const [
  GET_CHANNEL_CATEGORIES,
  GET_CHANNEL_CATEGORIES_SUCCESS,
  GET_CHANNEL_CATEGORIES_FAILURE,
] = createRequestActionTypes('channel/GET_CHANNEL_CATEGORIES');
const [GET_CHANNEL_INFO, GET_CHANNEL_INFO_SUCCESS, GET_CHANNEL_INFO_FAILURE] =
  createRequestActionTypes('channel/GET_CHANNEL_INFO');
const [
  GET_CHANNEL_NOTICE,
  GET_CHANNEL_NOTICE_SUCCESS,
  GET_CHANNEL_NOTICE_FAILURE,
] = createRequestActionTypes('channel/GET_CHANNEL_NOTICE');

const [LEAVE_CHANNEL, LEAVE_CHANNEL_SUCCESS, LEAVE_CHANNEL_FAILURE] =
  createRequestActionTypes('channel/LEAVE_CHANNEL');

const [INVITE_MEMBER, INVITE_MEMBER_SUCCESS, INVITE_MEMBER_FAILURE] =
  createRequestActionTypes('channel/INVITE_MEMBER');

const [
  UPLOAD_CHANNELICON,
  UPLOAD_CHANNELICON_SUCCESS,
  UPLOAD_CHANNELICON_FAILURE,
] = createRequestActionTypes('channel/UPLOAD_CHANNELICON');

const [
  MODIFY_CHANNELINFO,
  MODIFY_CHANNELINFO_SUCCESS,
  MODIFY_CHANNELINFO_FAILURE,
] = createRequestActionTypes('channel/MODIFY_CHANNELINFO');

const [
  MODIFY_CHANNEL_MEMBER_AUTH,
  MODIFY_CHANNEL_MEMBER_AUTH_SUCCESS,
  MODIFY_CHANNEL_MEMBER_AUTH_FAILURE,
] = createRequestActionTypes('channel/MODIFY_CHANNEL_MEMBER_AUTH');

const [
  SET_CHANNEL_NOTICE,
  SET_CHANNEL_NOTICE_SUCCESS,
  SET_CHANNEL_NOTICE_FAILURE,
] = createRequestActionTypes('channel/SET_CHANNEL_NOTICE');

const [
  REMOVE_CHANNEL_NOTICE,
  REMOVE_CHANNEL_NOTICE_SUCCESS,
  REMOVE_CHANNEL_NOTICE_FAILURE,
] = createRequestActionTypes('channel/REMOVE_CHANNEL_NOTICE');

const RECEIVE_MESSAGE = 'channel/RECEIVE_MESSAGE';
const DELETE_MESSAGE = 'channel/DELETE_MESSAGE';
const RECEIVE_DELETED_MESSAGE = 'channel/RECEIVE_DELETED_MESSAGE';
const RECEIVE_NOTICE = 'channel/RECEIVE_NOTICE';
const RECEIVE_DELETED_NOTICE = 'channel/RECEIVE_DELETED_NOTICE';

const OPEN_CHANNEL = 'channel/OPEN_CHANNEL';
const CHANGE_OPEN_CHANNEL = 'channel/CHANGE_OPEN_CHANNEL';
const INIT_OPEN_CHANNEL = 'channel/INIT_OPEN_CHANNEL';

const NEW_WIN_CHANNEL = 'channel/NEW_WIN_CHANNEL';
const CLOSE_WIN_CHANNEL = 'channel/CLOSE_WIN_CHANNEL';

const RESET_UNREAD_COUNT = 'channel/RESET_UNREAD_COUNT';

const SET_MESSAGES = 'channel/SET_MESSAGES';
const SET_MESSAGES_SYNC = 'channel/SET_MESSAGES_SYNC';
const INIT_MESSAGES = 'channel/INIT_MESSAGES';

const SET_MESSAGE_LINKINFO = 'channel/SET_MESSAGE_LINKINFO';

const CHANNEL_MESSAGE_ADD = 'channel/CHANNEL_MESSAGE_ADD';

const READ_MESSAGE = 'channel/READ_MESSAGE';
const READ_MESSAGE_FOCUS = 'channel/READ_MESSAGE_FOCUS';
const READ_CHANNEL_NOTICE = 'channel/READ_CHANNEL_NOTICE';

const NEW_CHANNEL = 'channel/NEW_CHANNEL';

const CHECK_CHANNEL_MOVE = 'channel/CHECK_CHANNEL_MOVE';

const CHANNEL_INVITE_MESSAGE_ADD = 'channel/CHANNEL_INVITE_MESSAGE_ADD';
const CHANNEL_LEAVE_MESSAGE_ADD = 'channel/CHANNEL_LEAVE_MESSAGE_ADD';
const CHANGE_VIEW_TYPE = 'channel/CHANGE_VIEW_TYPE';

const SET_SEARCH_KEYWORD = 'channel/SET_SEARCH_KEYWORD';

const SET_CHANNEL_INFO = 'channel/SET_CHANNEL_INFO';

const SET_CHANNEL_CLOSURE = 'channel/SET_CHANNEL_CLOSURE';
const CHANNEL_LEAVE_OTHER_DEVICE = 'channel/CHANNEL_LEAVE_OTHER_DEVICE';

const SET_BACKGROUND = 'channel/SET_BACKGROUND';

const MESSAGE_CURRENT_TYPING = 'room/MESSAGE_CURRENT_TYPING';

const SELECT_EMOTICON = 'channel/SELECT_EMOTICON';
const CLEAR_EMOTICON = 'channel/CLEAR_EMOTICON';

const UPDATE_LAST_MESSAGE = 'channel/UPDATE_LAST_MESSAGE';

const [
  MODIFY_CHANNELSETTING,
  MODIFY_CHANNELSETTING_SUCCESS,
  MODIFY_CHANNELSETTING_FAILURE,
] = createRequestActionTypes('channel/MODIFY_CHANNELSETTING');

const CHANNEL_AUTH_CHANGED = 'channel/AUTH_CHANGED';

const RECEIVE_CHANNELSETTING = 'channel/RECEIVE_CHANNELSETTING';

export const channelClosure = createAction(SET_CHANNEL_CLOSURE);

export const setChannels = createAction(SET_CHANNELS);
export const init = createAction(INIT);
export const getChannels = createAction(GET_CHANNELS);
export const updateChannels = createAction(UPDATE_CHANNELS);
export const getChannelCategories = createAction(GET_CHANNEL_CATEGORIES);
export const receiveMessage = createAction(RECEIVE_MESSAGE);
export const receiveDeletedMessage = createAction(RECEIVE_DELETED_MESSAGE);
export const receiveNotice = createAction(RECEIVE_NOTICE);
export const receiveDeletedNotice = createAction(RECEIVE_DELETED_NOTICE);

export const deleteMessage = createAction(DELETE_MESSAGE);

export const openChannel = createAction(OPEN_CHANNEL);
export const changeOpenChannel = createAction(CHANGE_OPEN_CHANNEL);
export const initOpenChannel = createAction(INIT_OPEN_CHANNEL);

export const newWinChannel = createAction(NEW_WIN_CHANNEL);
export const closeWinChannel = createAction(CLOSE_WIN_CHANNEL);
export const getChannelInfo = createAction(GET_CHANNEL_INFO);
export const getChannelNotice = createAction(GET_CHANNEL_NOTICE);
export const resetUnreadCount = createAction(RESET_UNREAD_COUNT);
export const setMessages = createAction(SET_MESSAGES);
export const setMessagesForSync = createAction(SET_MESSAGES_SYNC);
export const initMessages = createAction(INIT_MESSAGES);
export const setMessageLinkInfo = createAction(SET_MESSAGE_LINKINFO);

export const channelMessageAdd = createAction(CHANNEL_MESSAGE_ADD);

export const readMessage = createAction(READ_MESSAGE);
export const readMessageFocus = createAction(READ_MESSAGE_FOCUS);
export const readChannelNotice = createAction(READ_CHANNEL_NOTICE);

export const inviteMember = createAction(INVITE_MEMBER);
export const leaveChannel = createAction(LEAVE_CHANNEL);

export const newChannel = createAction(NEW_CHANNEL);
export const modifyChannelInfo = createAction(MODIFY_CHANNELINFO);
export const uploadChannelIcon = createAction(UPLOAD_CHANNELICON);
export const modifyChannelMemberAuth = createAction(MODIFY_CHANNEL_MEMBER_AUTH);

export const channelInviteMessageAdd = createAction(CHANNEL_INVITE_MESSAGE_ADD);
export const channelLeaveMessageAdd = createAction(CHANNEL_LEAVE_MESSAGE_ADD);

export const changeViewType = createAction(CHANGE_VIEW_TYPE);
export const setChannelNotice = createAction(SET_CHANNEL_NOTICE);
export const removeChannelNotice = createAction(REMOVE_CHANNEL_NOTICE);

export const checkChannelMove = createAction(CHECK_CHANNEL_MOVE);

export const setChannelInfo = createAction(SET_CHANNEL_INFO);

export const channelLeaveOtherDevice = createAction(CHANNEL_LEAVE_OTHER_DEVICE);

export const setBackground = createAction(SET_BACKGROUND);
export const modifyChannelSetting = createAction(MODIFY_CHANNELSETTING);

export const changeChannelAuth = createAction(CHANNEL_AUTH_CHANGED);

export const messageCurrentTyping = createAction(MESSAGE_CURRENT_TYPING);

export const selectEmoticon = createAction(SELECT_EMOTICON);
export const clearEmoticon = createAction(CLEAR_EMOTICON);

export const updateLastMessage = createAction(UPDATE_LAST_MESSAGE);

export const receiveChannelSetting = createAction(RECEIVE_CHANNELSETTING);

function createGetChannelsSaga() {
  return function* (action) {
    yield put(startLoading('channel/GET_CHANNELS'));
    if (action.payload) {
      try {
        let data = {};
        // TODO: AppData ?????? ????????? ?????? ?????? ??????

        const response = yield call(channelApi.getChannelList, action.payload);
        data = response.data;

        if (data.status == 'SUCCESS') {
          yield put({
            type: 'channel/GET_CHANNELS_SUCCESS',
            payload: data,
          });
        }
      } catch (e) {
        console.log(e);
        yield put({
          type: 'channel/GET_CHANNELS_FAIL',
          payload: e,
          error: true,
        });
      }
    }
    yield put(finishLoading('channel/GET_CHANNELS'));
  };
}

const getChannelsSaga = createGetChannelsSaga();

function createUpdateChannelsSaga() {
  return function* (action) {
    yield put(startLoading('channel/UPDATE_CHANNELS'));
    if (action.payload) {
      try {
        const response = yield call(
          channelApi.getChannelUpdateList,
          action.payload,
        );
        yield put({
          type: 'channel/UPDATE_CHANNELS_SUCCESS',
          payload: response.data,
        });
      } catch (e) {
        console.log(e);
        yield put({
          type: 'channel/UPDATE_CHANNELS_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
    yield put(finishLoading('channel/UPDATE_CHANNELS'));
  };
}

const updateChannelsSaga = createUpdateChannelsSaga();

function createGetChannelCategoriesSaga() {
  return function* (action) {
    yield put(startLoading('channel/GET_CHANNEL_CATEGORIES'));
    try {
      let data = {};
      let response;

      if (action.payload) {
        response = yield call(channelApi.getChannelCategoryList, {
          companyCode: action.payload.companyCode,
        });
      } else {
        response = yield call(channelApi.getChannelCategoryList);
      }

      data = response.data;

      yield put({
        type: 'channel/GET_CHANNEL_CATEGORIES_SUCCESS',
        payload: data,
      });
    } catch (e) {
      console.log(e);
      yield put({
        type: 'channel/GET_CHANNEL_CATEGORIES_FAIL',
        payload: e,
        error: true,
      });
    }
    yield put(finishLoading('channel/GET_CHANNEL_CATEGORIES'));
  };
}

const getChannelCategoriesSaga = createGetChannelCategoriesSaga();

function createReceiveMessageSaga() {
  // roomID
  return function* (action) {
    if (action.payload) {
      try {
        // ??????????????? ???????????? tempMessage??? ?????? ????????? ?????? ??????
        if (action.payload.isMine == 'Y') {
          yield put(removeChannelTempMessage(action.payload.tempId));
        } else {
          //yield put(changeNewMark(action.payload.roomID));
        }
        // TODO: Current Room ??? ????????? ???????????? ?????? newMark ???????????? ????????? ??????

        yield put(channelMessageAdd(action.payload));

        if (
          action.payload.isCurrentChannel &&
          window.document.hasFocus() &&
          action.payload.isMine != 'Y'
        ) {
          yield put(
            readMessageFocus({
              roomID: action.payload.roomID,
              messageID: action.payload.messageID,
            }),
          );
        }
      } catch (e) {
        yield put({
          type: 'channel/RECEIVE_MESSAGE_FAILURE',
          payload: action.payload,
          error: true,
        });
      }
    }
  };
}

const deleteMessageSaga = createDeleteMessageSaga();
function createDeleteMessageSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const lastMessage = action.payload.lastMessage;
        if (lastMessage) {
          yield put(updateLastMessage(lastMessage));
        }
      } catch (e) {
        yield put({
          type: 'channel/DELETE_MESSAGE_FAILURE',
          payload: action.payload,
          error: true,
        });
      }
    }
  };
}

const receiveMessageSaga = createReceiveMessageSaga();

function createCheckChannelMoveSaga() {
  return function* (action) {
    if (action.payload) {
      yield put(
        setMoveView({
          roomID: action.payload.roomId,
          moveId: action.payload.moveId,
          visible: true,
        }),
      );
    }
  };
}
const checkChannelMoveSaga = createCheckChannelMoveSaga();

function createOpenChannelSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        // ??????????????? ???????????? tempMessage??? ?????? ????????? ?????? ??????
        if (action.payload.roomId) {
          yield put(setCurrentChannel(action.payload.roomId));
          // mjseo
          yield put(newChannel(action.payload));
        }
        // move view ?????????
        yield put(
          setMoveView({
            roomID: -1,
            moveId: -1,
            visible: false,
          }),
        );
        yield put(changeOpenChannel(action.payload));

        // mjseo
        yield put(changeOpenRoom({ newChannel: true }));
      } catch (e) {
        console.dir(e);
      }
    }
  };
}
const openChannelSaga = createOpenChannelSaga();

function createGetChannelInfoSaga() {
  return function* (action) {
    yield put(startLoading('channel/GET_CHANNEL_INFO'));
    try {
      let data = {};

      const response = yield call(channelApi.getChannelInfo, action.payload);
      data = response.data;

      if (DEVICE_TYPE == 'd') {
        if (data?.status !== 'SUCCESS') {
          throw data;
        }
        if (data.room) {
          let background = yield call(roomID => {
            return new Promise((resolve, reject) => {
              get('backgrounds', roomID, result => {
                if (result.status == 'SUCCESS') {
                  resolve(result.data.background);
                } else {
                  resolve(null);
                }
              });
            });
          }, action.payload.roomId);

          data.room.background = background;
        }
      }

      let type = 'channel/GET_CHANNEL_INFO_SUCCESS';
      if (data.status != 'SUCCESS') {
        type = 'channel/GET_CHANNEL_INFO_FAILURE';
      }

      yield put({
        type,
        payload: data,
      });
      yield put(finishLoading('channel/GET_CHANNEL_INFO'));
    } catch (e) {
      console.log(e);
      yield put({
        type: 'channel/GET_CHANNEL_INFO_FAILURE',
        payload: e,
        error: true,
      });
      yield put(finishLoading('channel/GET_CHANNEL_INFO'));
      yield put(set({ error: true, object: e }));
    }
  };
}

const getChannelInfoSaga = createGetChannelInfoSaga();

function createGetChannelNoticeSaga() {
  return function* (action) {
    yield put(startLoading('channel/GET_CHANNEL_NOTICE'));
    try {
      const response = yield call(channelApi.getChannelNotice, action.payload);
      const { data } = response;
      let type = 'channel/GET_CHANNEL_NOTICE_SUCCESS';
      if (data.status != 'SUCCESS' || !data.notice) {
        type = 'channel/GET_CHANNEL_NOTICE_FAILURE';
      }
      yield put({
        type,
        payload: data,
      });
      yield put(finishLoading('channel/GET_CHANNEL_NOTICE'));
    } catch (e) {
      console.log(e);
      yield put({
        type: 'channel/GET_CHANNEL_NOTICE_FAILURE',
        payload: e,
        error: true,
      });
      yield put(finishLoading('channel/GET_CHANNEL_NOTICE'));
    }
  };
}

const getChannelNoticeSaga = createGetChannelNoticeSaga();

function createReadMessageSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        // READ_MESSAGE_SUCCESS ?????? ????????? COUNT ?????? ??????
        const response = yield call(messageApi.readChannelMessage, {
          roomID: action.payload.roomID,
          messageID: action.payload.messageID,
        });

        if (response.data.status == 'SUCCESS') {
          if (DEVICE_TYPE == 'b') {
            // ??????????????? ?????? ??????
            if (
              window.opener &&
              typeof window.opener.parent.newWinReadMessageCallback ==
                'function'
            ) {
              window.opener.parent.newWinReadMessageCallback(
                action.payload.roomID,
              );
            }
            yield put(resetUnreadCount(action.payload.roomID));
          } else {
            if (isMainWindow()) {
              yield put(resetUnreadCount(action.payload.roomID));
            } else {
              resetParentUnreadCount({
                roomID: action.payload.roomID,
                isChannel: true,
              });
              // TODO:
            }
          }
        }
      } catch (e) {
        console.dir(e);
      }
    }
  };
}

const readMessageSaga = createReadMessageSaga();
const readMessageFocusSaga = createReadMessageSaga();

function createLeaveChannelSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const response = yield call(channelApi.leaveChannel, action.payload);
        let type = 'channel/LEAVE_CHANNEL_SUCCESS';
        if (response.data.status != 'SUCCESS') {
          type = 'channel/LEAVE_CHANNEL_FAILURE';
        }
        yield put({
          type,
          payload: {
            ...response.data,
            leave: action.payload.leave ? action.payload.leave : '',
          },
        });
      } catch (e) {
        console.log(e);
        yield put({
          type: 'channel/LEAVE_CHANNEL_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}

const leaveChannelSaga = createLeaveChannelSaga();

function createInviteMemberSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const targetArr = [];
        const memberIds = action.payload.members.reduce((arr, member) => {
          targetArr.push({ targetCode: member.id, targetType: 'UR' });
          return arr.concat(member.id);
        }, []);
        const data = {
          roomId: action.payload.roomId,
          members: memberIds,
          targetArr,
        };

        const response = yield call(channelApi.inviteMember, data);
        yield put({
          type: 'channel/INVITE_MEMBER_SUCCESS',
          payload: action.payload,
        });
      } catch (e) {
        console.log(e);
        yield put({
          type: 'channel/INVITE_MEMBER_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}

const inviteMemberSaga = createInviteMemberSaga();

function createModifyChannelInfoSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const response = yield call(
          channelApi.modifyChannelInfo,
          action.payload,
        );

        yield put({
          type: 'channel/MODIFY_CHANNELINFO_SUCCESS',
          payload: response.data,
        });
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'channel/MODIFY_CHANNELINFO_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}
const modifyChannelInfoSaga = createModifyChannelInfoSaga();

function createUploadChannelIconSaga() {
  return function* (action) {
    if (action.payload) {
      const roomId = action.payload.get('roomId');
      try {
        const response = yield call(
          channelApi.uploadChannelIcon,
          action.payload,
        );
        yield put({
          type: 'channel/UPLOAD_CHANNELICON_SUCCESS',
          payload: {
            ...response.data,
            roomId,
          },
        });
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'channel/UPLOAD_CHANNELICON_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}
const uploadChannelIconSaga = createUploadChannelIconSaga();

function createModifyChannelMemberAuthSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const response = yield call(
          channelApi.modifyMemberAuth,
          action.payload,
        );
        yield put({
          type: 'channel/MODIFY_CHANNEL_MEMBER_AUTH_SUCCESS',
          payload: {
            ...response.data,
            ...action.payload,
          },
        });
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'channel/MODIFY_CHANNEL_MEMBER_AUTH_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}
const modifyChannelMemberAuthSaga = createModifyChannelMemberAuthSaga();

function createSetChannelNoticeSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const response = yield call(
          channelApi.setChannelNotice,
          action.payload,
        );
        let type = 'channel/SET_CHANNEL_NOTICE_SUCCESS';
        if (response.data.status != 'SUCCESS' || !response.data.notice) {
          type = 'channel/SET_CHANNEL_NOTICE_FAILURE';
        }
        yield put({
          type,
          payload: {
            ...response.data,
            ...action.payload,
          },
        });
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'channel/SET_CHANNEL_NOTICE_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}
const setChannelNoticeSaga = createSetChannelNoticeSaga();

function createRemoveChannelNoticeSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const response = yield call(messageApi.removeNotice, action.payload);
        let type = 'channel/REMOVE_CHANNEL_NOTICE_SUCCESS';
        if (response.data.status != 'SUCCESS') {
          type = 'channel/REMOVE_CHANNEL_NOTICE_FAILURE';
        }
        yield put({
          type,
          payload: {
            ...response.data,
            ...action.payload,
          },
        });
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'channel/REMOVE_CHANNEL_NOTICE_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}
const removeChannelNoticeSaga = createRemoveChannelNoticeSaga();

function createModifyChannelSettingSaga() {
  return function* (action) {
    if (action.payload) {
      // loading ?????? ??????
      yield put(startLoading('room/MODIFY_ROOMSETTING'));
      try {
        const response = yield call(modifyRoomSetting, {
          roomID: action.payload.roomID,
          key: action.payload.key,
          value: action.payload.value,
        });

        if (response.data.status == 'SUCCESS') {
          yield put({
            type: 'channel/MODIFY_CHANNELSETTING_SUCCESS',
            payload: {
              roomID: action.payload.roomID,
              setting: action.payload.setting,
            },
          });
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'channel/MODIFY_CHANNELSETTING_FAILURE',
          payload: e,
          error: true,
        });
      }

      yield put(finishLoading('room/MODIFY_ROOMSETTING'));
    }
  };
}

const modifyChannelSettingSaga = createModifyChannelSettingSaga();

export function* channelSaga() {
  yield takeLatest(GET_CHANNELS, getChannelsSaga);
  yield takeLatest(UPDATE_CHANNELS, updateChannelsSaga);
  yield takeLatest(GET_CHANNEL_CATEGORIES, getChannelCategoriesSaga);
  yield takeLatest(RECEIVE_MESSAGE, receiveMessageSaga);
  yield takeLatest(DELETE_MESSAGE, deleteMessageSaga);
  yield takeLatest(OPEN_CHANNEL, openChannelSaga);
  yield takeLatest(GET_CHANNEL_INFO, getChannelInfoSaga);
  yield takeLatest(GET_CHANNEL_NOTICE, getChannelNoticeSaga);
  yield takeLatest(CHECK_CHANNEL_MOVE, checkChannelMoveSaga);
  yield takeLatest(READ_MESSAGE, readMessageSaga);
  yield takeLatest(LEAVE_CHANNEL, leaveChannelSaga);
  yield takeLatest(INVITE_MEMBER, inviteMemberSaga);
  yield takeLatest(MODIFY_CHANNELINFO, modifyChannelInfoSaga);
  yield takeLatest(UPLOAD_CHANNELICON, uploadChannelIconSaga);
  yield takeLatest(MODIFY_CHANNEL_MEMBER_AUTH, modifyChannelMemberAuthSaga);
  yield takeLatest(SET_CHANNEL_NOTICE, setChannelNoticeSaga);
  yield takeLatest(REMOVE_CHANNEL_NOTICE, removeChannelNoticeSaga);
  yield takeLatest(MODIFY_CHANNELSETTING, modifyChannelSettingSaga);
  yield throttle(1000, READ_MESSAGE_FOCUS, readMessageFocusSaga);
}

const initialState = {
  viewType: 'S',
  selectId: -1,
  currentChannel: null,
  channels: [],
  categories: [],
  messages: [],
  makeChannel: false,
  makeInfo: null,
  typing: false,
  selectEmoticon: '',
};

const channel = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [UPDATE_LAST_MESSAGE]: (state, action) => {
      return produce(state, draft => {
        const channel = draft.channels.find(
          c => c.roomId == action.payload.roomID,
        );
        if (channel) {
          channel.lastMessage = JSON.stringify({
            Message: action.payload.context,
            File: action.payload.fileInfos,
            companyCode: action.payload.companyCode,
            deptCode: action.payload.deptCode,
            sender: action.payload.sender,
          });
          channel.lastMessageDate = action.payload.sendDate;
          channel.lastMessageType = action.payload.messageType;
        }
      });
    },
    [SET_CHANNEL_CLOSURE]: (state, action) => {
      return produce(state, draft => {
        // ?????? ??????
        if (draft.currentChannel.roomId == action.payload.roomID) {
          draft.currentChannel.disabled = true;
        }
        const channel = draft.channels.find(
          c => c.roomId == action.payload.roomID,
        );
        if (channel) {
          channel.disabled = true;
        }
      });
    },
    [SET_CHANNELS]: (state, action) => {
      return produce(state, draft => {
        // login ????????? ??????
        // filter ??????: ????????? ????????? ????????? ??????
        draft.channels = action.payload.result.filter(
          channel => channel.lastMessageDate,
        );
      });
    },
    [GET_CHANNELS_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (draft.channels.length > 0) {
          // ?????? ????????? ?????? action??? ?????? ????????? ?????? ???????????? ?????? update???????????? ??????
          action.payload.result.forEach(item => {
            const channel = draft.channels.find(c => c.roomId == item.roomId);

            // ?????? channel ?????? ??????
            if (channel) {
              item.newWin = channel.newWin;
              item.winObj = channel.winObj;
              item.winName = channel.winName;
              // ?????? ?????????
              if (channel.iconPath && !item.iconPath) {
                item.iconPath = channel.iconPath;
              }
            }
          });
        }
        draft.channels = action.payload.result;
      });
    },
    [UPDATE_CHANNELS_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (draft.channels.length > 0) {
          // ?????? ????????? ?????? action??? ?????? ????????? ?????? ???????????? ?????? update???????????? ??????
          action.payload.rooms.forEach(item => {
            if (item.roomID && !item.roomId) {
              item.roomId = item.roomID;
            }

            const channelIdx = draft.channels.findIndex(
              c => c.roomId == item.roomId,
            );

            const channel = channelIdx > -1 ? draft.channels[channelIdx] : null;
            // ?????? channel ?????? ??????
            if (channel) {
              item.newWin = channel.newWin;
              item.winObj = channel.winObj;
              item.winName = channel.winName;
              item.settingJSON = isJSONStr(channel.settingJSON)
                ? JSON.parse(channel.settingJSON)
                : channel.settingJSON;

              // ?????? ?????????
              if (channel.iconPath && !item.iconPath) {
                item.iconPath = channel.iconPath;
              }

              draft.channels[channelIdx] = item;
            } else {
              draft.channels.unshift(item);
            }
          });
        }
      });
    },
    [GET_CHANNEL_CATEGORIES_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.status == 'SUCCESS') {
          draft.categories = action.payload.result;
        }
      });
    },
    [CHANNEL_MESSAGE_ADD]: (state, action) => {
      // roomID
      return produce(state, draft => {
        const channel = draft.channels.find(
          c => c.roomId == action.payload.roomID,
        );
        // channel ?????? ??????
        const lastMessageData = {
          Message:
            action.payload.messageType === 'I'
              ? covi.getDic(
                  'Msg_newNoticeRegistered',
                  '????????? ????????? ?????????????????????.',
                )
              : action.payload.context,
          File: action.payload.fileInfos,
          sender: action.payload.sender || '',
          companyCode: action.payload.senderInfo?.companyCode || '',
          deptCode: action.payload.senderInfo?.deptCode || '',
        };

        if (channel) {
          channel.lastMessage = lastMessageData;
          channel.lastMessageDate = action.payload.sendDate;

          draft.channels.splice(
            draft.channels.findIndex(c => c.roomId == action.payload.roomID),
            1,
          );
          draft.channels.unshift(channel);

          if (
            draft.currentChannel &&
            channel.roomId == draft.currentChannel.roomId
          ) {
            // ?????? ???????????? ??????????????? ?????? ?????? ??? ??????
            // ????????? ????????? ?????? ????????? ??????????????????.
            const idx = draft.messages.findIndex(
              m => m.messageID == action.payload.messageID,
            );

            const lastMessageID =
              draft.messages.length > 0
                ? draft.messages[draft.messages.length - 1].messageID
                : 0;

            if (idx < 0) {
              // push ????????? sendTime??? ???????????? YYYYMMDDHHmm ??????????????? ???????????? update
              const size = draft.messages.length;
              const checkTimeStamp = Math.floor(
                action.payload.sendDate / 60000,
              );

              for (let i = size - 1; i >= 0; i--) {
                const compMessage = draft.messages[i];
                const compTimeStamp = Math.floor(compMessage.sendDate / 60000);
                // ????????? ?????? ??????????????? update ???????????? ??????
                if (compTimeStamp == checkTimeStamp) {
                  // ?????? state??? ????????? ?????? props??? ????????? ???????????? ??????
                  compMessage.updateIndex = action.payload.messageID;
                } else {
                  break;
                }
              }

              if (action.payload.messageID > lastMessageID) {
                draft.messages.push(action.payload);
              } else {
                let afterMessageIdx = draft.messages.length - 1;
                // ????????? ???????????? ????????? ??????????????? ???????????? ????????? ??????
                for (let i = afterMessageIdx; i >= 0; i--) {
                  const item = draft.messages[i];
                  if (item.messageID < action.payload.messageID) {
                    afterMessageIdx = i;
                    break;
                  }
                }

                draft.messages.splice(afterMessageIdx + 1, 0, action.payload);
              }
            }

            // ?????????????????? ??????????????? --- ????????? focus??? ???????????? unreadCnt??? ??????????????? ??????
            if (action.payload.isMine != 'Y') {
              if (!channel.unreadCnt) channel.unreadCnt = 0;
              channel.unreadCnt = channel.unreadCnt + 1;
            }

            action.payload.isCurrentChannel = true;
          } else {
            if (action.payload.isMine != 'Y') {
              if (!channel.unreadCnt) channel.unreadCnt = 0;
              channel.unreadCnt = channel.unreadCnt + 1;
            }
          }
        } else {
          // channel ????????? ?????????????????? channel ??????
          draft.channels.unshift({
            roomId: action.payload.roomID,
            updateDate: null,
            lastMessage: lastMessageData,
            lastMessageDate: action.payload.sendDate,
            unreadCnt: action.payload.isMine != 'Y' ? 1 : 0,
          });
        }
      });
    },
    [CHANGE_OPEN_CHANNEL]: (state, action) => {
      return produce(state, draft => {
        if (!action.payload.newChannel) {
          const channel = draft.channels.find(
            c => c.roomId == action.payload.roomId,
          );
          let changeChannel = null;

          if (channel) {
            if (channel.newWin && channel.winObj) {
              if (channel.winObj.closed) {
                // ???????????? ??????????????? ?????? ??????????????????
                channel.newWin = false;
                channel.winObj = null;
                channel.winName = '';
              }
            }
            channel.channelUnlock = 'Y';

            changeChannel = channel;
          } else {
            changeChannel = {
              roomId: action.payload.roomId,
            };
          }

          if (draft.viewType != 'S' || SCREEN_OPTION == 'G') {
            if (
              !draft.currentChannel ||
              draft.currentChannel.roomId != changeChannel.roomId
            ) {
              // MultiView????????? CurrentRoom ?????? ??????
              draft.selectId = action.payload.roomId;
              draft.currentChannel = changeChannel;
              draft.messages = [];
            }

            // currentRoom ??? ?????? setting ????????? object??? ??????????????? ??????
            if (draft.currentChannel) {
              try {
                draft.currentChannel.setting = isJSONStr(changeChannel.setting)
                  ? JSON.parse(changeChannel.setting)
                  : changeChannel.setting;
              } catch (e) {
                draft.currentChannel.setting = null;
              }
            }
          }

          draft.makeInfo = null;
        } else {
          draft.currentChannel = {
            newChannel: action.payload.newChannel,
          };

          draft.makeInfo = action.payload.makeInfo;

          draft.selectId = -1;
          draft.messages = [];
        }

        if (action.payload.newChatRoom) {
          // ?????? ??? ?????????
          draft.currentChannel = null;
          draft.makeInfo = null;
          draft.messages = [];
          draft.selectId = -1;
        }
        draft.makeChannel = false;
      });
    },
    [INIT_OPEN_CHANNEL]: (state, action) => ({
      ...state,
      selectId: initialState.selectId,
      currentChannel: initialState.currentChannel,
    }),
    [GET_CHANNEL_INFO_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        let newChannel = action.payload.room;

        const channelIdx = draft.channels.findIndex(
          c => c.roomId == action.payload.room.roomId,
        );

        const channel = channelIdx > -1 ? draft.channels[channelIdx] : null;

        // console.log('==========================================')
        // if(newChannel.lastViewedAt !== null && newChannel.lastViewedAt !== undefined ){
        //   console.log('||  newChannel.lastViewedAt ::', format(new Date(newChannel.lastViewedAt), 'yyyy/MM/dd - HH:mm ss'))
        // }
        // if(channel.updateDate !== null && channel.updateDate !== undefined && newChannel.updateDate !== null && newChannel.updateDate !== undefined ){
        //   console.log('||  CHANNEL UPDATE :: ', format(new Date(channel.updateDate), 'yyyy/MM/dd - HH:mm ss'),'  NEWCHANNEL :: ', format(new Date(newChannel.updateDate), 'yyyy/MM/dd - HH:mm ss'))
        // }
        // if(draft.currentChannel.lastViewedAt !== null && draft.currentChannel.lastViewedAt !== undefined )
        // {
        // console.log('||  currentChannel.lastViewedAt ::', format(new Date(draft.currentChannel.lastViewedAt), 'yyyy/MM/dd - HH:mm ss'))
        // }
        // console.log('||  null??? ???????????? ????????????', '(', channel.updateDate ? format(new Date(channel.updateDate), 'yyyy/MM/dd - HH:mm ss') : channel.updateDate,') :: (', draft.currentChannel.lastViewedAt ? format(new Date(draft.currentChannel.lastViewedAt), 'yyyy/MM/dd - HH:mm ss') : draft.currentChannel.lastViewedAt,')')
        // console.log('==========================================')

        if (channel) {
          // update ??????????????? ?????? - channel member ??????????????? update date ??????
          if (
            channel.updateDate !== newChannel.updateDate ||
            draft.currentChannel.lastViewedAt !== newChannel.lastViewedAt ||
            channel.updateDate !== newChannel.lastViewedAt
          ) {
            /*
            newChannel.newWin = channel.newWin;
            newChannel.winObj = channel.winObj;
            newChannel.winName = channel.winName; 
            
            draft.channels[channelIdx] = newChannel; 
            
            // ????????? ?????? ????????????
            draft.currentChannel = newChannel;
            */
            const updateChannel = {
              ...channel,
              roomName: newChannel.roomName,
              roomType: newChannel.roomType,
              ownerCode: newChannel.ownerCode,
              updateDate: newChannel.updateDate,
              lastMessage: newChannel.lastMessage,
              lastMessageDate: newChannel.lastMessageDate,
              unreadCnt: newChannel.unreadCnt,
              members: newChannel.members,
              realMemberCnt: newChannel.realMemberCnt,
              categoryCode: newChannel.categoryCode,
              categoryName: newChannel.categoryName,
              description: newChannel.description,
              iconPath: newChannel.iconPath || newChannel.iConPath,
              lastViewedAt: newChannel.lastViewedAt,
              background: newChannel.background,
              disabled: newChannel.disabled,
            };
            draft.channels[channelIdx] = updateChannel;
            draft.currentChannel = updateChannel;
          } else {
            channel.background = newChannel.background;
            draft.currentChannel = channel;
          }
        } else {
          draft.channels.push(newChannel);
          draft.currentChannel = newChannel;
        }

        draft.messages = action.payload.messages;

        // current channel ?????? setting ??? Object type?????? ??????
        if (draft.currentChannel) {
          try {
            draft.currentChannel.setting = isJSONStr(newChannel.setting)
              ? JSON.parse(newChannel.setting)
              : newChannel.setting;
          } catch (e) {
            draft.currentChannel.setting = null;
          }
        }
      });
    },
    [GET_CHANNEL_NOTICE_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload && action.payload.status == 'SUCCESS') {
          const { notice } = action.payload;
          const channelIdx = draft.channels.findIndex(
            c => c.roomId == notice.roomID,
          );
          if (channelIdx > -1) {
            draft.channels[channelIdx].notice = notice;
          }
          if (
            draft.currentChannel &&
            draft.currentChannel.roomId == notice.roomID
          ) {
            draft.currentChannel.notice = notice;
          }
        }
      });
    },
    [MODIFY_CHANNEL_MEMBER_AUTH_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.status == 'SUCCESS') {
          const channel = draft.channels.find(
            c => c.roomId == action.payload.roomId,
          );
          if (channel) {
            channel.members.map(cm => {
              const memberIdx = action.payload.members.findIndex(
                memberId => memberId == cm.id,
              );
              if (memberIdx > -1) {
                cm.channelAuth = action.payload.auth;
              }
            });
          }

          if (draft.currentChannel.roomId == action.payload.roomId) {
            draft.currentChannel.members.map(cm => {
              const memberIdx = action.payload.members.findIndex(
                memberId => memberId == cm.id,
              );
              if (memberIdx > -1) {
                cm.channelAuth = action.payload.auth;
              }
            });
          }
        }
      });
    },
    [NEW_WIN_CHANNEL]: (state, action) => {
      return produce(state, draft => {
        const channel = draft.channels.find(c => c.roomId == action.payload.id);
        const currentChannel = draft.currentChannel;

        if (currentChannel) {
          if (currentChannel.roomId == action.payload.id) {
            currentChannel.newWin = true;
            currentChannel.winObj = action.payload.obj;
            currentChannel.winName = action.payload.name;
          }
        }

        if (channel) {
          channel.newWin = true;
          channel.winObj = action.payload.obj;
          channel.winName = action.payload.name;
          draft.currentChannel = channel;
        } else {
          draft.channels.push({
            roomId: action.payload.id,
            newWin: true,
            winObj: action.payload.obj,
            winName: action.payload.name,
            updateDate: null,
          });
        }
      });
    },
    [CLOSE_WIN_CHANNEL]: (state, action) => {
      return produce(state, draft => {
        const channel = draft.channels.find(c => c.roomId == action.payload);

        const currentChannel = draft.currentChannel;

        if (currentChannel) {
          if (currentChannel.roomId == action.payload) {
            currentChannel.newWin = false;
            currentChannel.winObj = null;
            currentChannel.winName = '';
          }
        }

        if (channel) {
          channel.newWin = false;
          channel.winObj = null;
          channel.winName = '';
        } else {
          draft.channels.push({
            roomId: action.payload,
            newWin: false,
            winObj: null,
            winName: '',
            updateDate: null,
          });
        }
      });
    },
    [CHANGE_VIEW_TYPE]: (state, action) => {
      return produce(state, draft => {
        draft.viewType = action.payload ? 'M' : 'S';

        // single view??? ??????????????? ????????? ???????????? currentChannel ??????
        if (!action.payload) {
          draft.selectId = -1;
          draft.currentChannel = null;
          draft.messages = [];
          draft.makeInfo = null;
        }
      });
    },
    [RESET_UNREAD_COUNT]: (state, action) => {
      return produce(state, draft => {
        const channel = draft.channels.find(c => c.roomId == action.payload);
        if (channel) {
          channel.unreadCnt = 0;
        }
      });
    },
    [READ_CHANNEL_NOTICE]: (state, action) => {
      return produce(state, draft => {
        if (draft.currentChannel.roomId == action.payload) {
          if (draft.currentChannel.notice) {
            draft.currentChannel.notice.isNew = false;
          }
        }
      });
    },
    [SET_MESSAGES]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.dist == 'BEFORE') {
          draft.messages = [...draft.messages, ...action.payload.messages];
        } else {
          if (
            draft.messages?.at(0)?.messageID ===
            action.payload?.messages?.at(0)?.messageID
          ) {
            return;
          }

          draft.messages = [...action.payload.messages, ...draft.messages];
        }
      });
    },
    [SET_MESSAGES_SYNC]: (state, action) => {
      return produce(state, draft => {
        draft.messages = action.payload;
      });
    },
    [INIT_MESSAGES]: (state, action) => {
      return produce(state, draft => {
        const startIdx =
          draft.messages.length - 100 >= 0 ? draft.messages.length - 100 : 0;
        // ?????? 100?????? ???????????? ??????
        draft.messages = draft.messages.splice(startIdx, 100);
      });
    },
    [SET_MESSAGE_LINKINFO]: (state, action) => {
      return produce(state, draft => {
        if (
          draft.currentChannel &&
          draft.currentChannel.roomId == action.payload.roomId
        ) {
          const message = draft.messages.find(
            m => m.messageID == action.payload.messageId,
          );
          if (message) {
            message.linkInfo = action.payload.linkInfo;
          }
        }
      });
    },
    [CHANNEL_INVITE_MESSAGE_ADD]: (state, action) => {
      return produce(state, draft => {
        const channel = draft.channels.find(
          c => c.roomId == action.payload.roomID,
        );

        if (channel) {
          // member ??????
          /* action.payload.inviteMember.forEach(i => {
            const idx = channel.members.findIndex(m => m.id == i.id);
            if (idx == -1) channel.members.push(i);
          }); */
          // member ?????? ?????? ????????????
          channel.updateDate = null;

          // ???????????? ???????????? ?????? ????????? ??????
          if (
            draft.currentChannel &&
            action.payload.roomID == draft.currentChannel.roomId
          ) {
            // ?????? ???????????? ??????????????? ??????
            const idx = draft.messages.findIndex(
              m => m.messageID == action.payload.messageID,
            );

            // ????????? ???????????????
            const lastMessageID =
              draft.messages.length > 0
                ? draft.messages[draft.messages.length - 1].messageID
                : 0;

            if (idx < 0 && action.payload.messageID > lastMessageID)
              draft.messages.push(action.payload);

            const members = channel.members;
            draft.currentChannel.members = members;
          }
        } else {
          // channel ????????? ?????????????????? channel ??????
          draft.channels.unshift({
            roomId: action.payload.roomID,
            updateDate: null,
            unreadCnt: 0,
            roomName: '',
            categoryName: '',
            channelUnlock: 'N',
          });
        }
      });
    },
    [CHANNEL_LEAVE_MESSAGE_ADD]: (state, action) => {
      return produce(state, draft => {
        const channel = draft.channels.find(
          c => c.roomId == action.payload.roomID,
        );

        if (channel) {
          // ????????? ??????
          channel.members &&
            channel.members.splice(
              channel.members.findIndex(
                m => m.id == action.payload.leaveMember,
              ),
              1,
            );

          // ???????????? ????????? ????????? ?????? ??????
          if (
            draft.currentChannel &&
            action.payload.roomID == draft.currentChannel.roomId
          ) {
            // ?????? ???????????? ??????????????? ??????
            const idx = draft.messages.findIndex(
              m => m.messageID == action.payload.messageID,
            );

            // ????????? ???????????????
            const lastMessageID =
              draft.messages.length > 0
                ? draft.messages[draft.messages.length - 1].messageID
                : 0;

            if (idx < 0 && action.payload.messageID > lastMessageID)
              draft.messages.push({
                ...action.payload,
                sendDate: new Date().getTime(), // TODO: ???????????? ?????? ????????? ?????? ?????? ?????? ??????
              });

            const members = channel.members;
            draft.currentChannel.members = members;
          }
        } else {
          // channel ????????? ?????????????????? channel ??????
          draft.channels.unshift({
            roomId: action.payload.roomID,
            updateDate: null,
            unreadCnt: 0,
          });
        }
      });
    },
    [LEAVE_CHANNEL_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload) {
          if (!action.payload.leave || action.payload.leave != 'Y') {
            // channel??? member?????? update
            let roomInd = draft.channels.findIndex(
              c => c.roomId == action.payload.roomID,
            );
            if (roomInd != -1) {
              // findIndex??? ???????????????.
              draft.channels.splice(roomInd, 1);
            }

            if (
              draft.currentChannel &&
              draft.currentChannel.roomId == action.payload.roomID
            ) {
              draft.currentChannel = null;
              draft.selectId = -1;
            }
          }
        }
      });
    },
    [INVITE_MEMBER_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        // channel??? member?????? update
        const channel = draft.channels.find(
          c => c.roomId == action.payload.roomId,
        );
        if (channel) {
          action.payload.members.forEach(i => {
            const idx = channel.members.findIndex(m => m.id == i.id);
            if (idx == -1) channel.members.push(i);
          });

          // currentChannel??? member?????? update
          if (
            draft.currentChannel &&
            draft.currentChannel.roomId == channel.roomId
          ) {
            draft.currentChannel = channel;
          }
        }
      });
    },
    [NEW_CHANNEL]: (state, action) => {
      // ?????? ????????? ?????? ??????
      return produce(state, draft => {
        const { roomId, iconPath } = action.payload;
        if (roomId) {
          const channelIdx = draft.channels.findIndex(c => c.roomId == roomId);

          const channel = channelIdx > -1 ? draft.channels[channelIdx] : null;

          if (!channel) {
            const data = {
              ...action.payload,
              updateDate: null,
              lastMessageDate: Date.now(),
            };
            if (iconPath) {
              data.iconPath = iconPath;
            }
            draft.channels.unshift(data);
          } else {
            if (!channel.iconPath && iconPath) {
              const updateChannel = {
                ...channel,
                unreadCnt: 0,
                iconPath,
              };
              draft.channels[channelIdx] = updateChannel;
              draft.currentChannel = updateChannel;
            }
          }
        }
      });
    },
    [MODIFY_CHANNELINFO_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        const roomId = parseInt(action.payload.result.roomID);
        const channelIdx = draft.channels.findIndex(c => c.roomId == roomId);

        if (channelIdx > -1) {
          const { result } = action.payload;

          const categoryIdx = draft.categories.findIndex(
            c => c.categoryCode == result.categoryCode,
          );

          let categoryCode = result.categoryCode;
          let categoryName = '';
          if (categoryIdx > -1) {
            categoryName = draft.categories[categoryIdx].categoryName;
          } else {
            // invalid
            categoryCode = '';
          }

          const newChannel = {
            ...draft.channels[channelIdx],
            roomName: result.roomName,
            description: result.description,
            categoryCode,
            categoryName,
          };

          draft.channels[channelIdx] = newChannel;

          if (draft.currentChannel && draft.currentChannel.roomId == roomId) {
            // draft.currentChannel.roomName = action.payload.result.roomName;
            draft.currentChannel = newChannel;
          }

          if (DEVICE_TYPE == 'd') {
            if (!isMainWindow()) {
              sendMain('onModifyChannelInfo', newChannel);
            }
          }
        }
      });
    },
    [UPLOAD_CHANNELICON_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.flag) {
          const roomId = parseInt(action.payload.roomId);
          const channelIdx = draft.channels.findIndex(c => c.roomId == roomId);
          if (channelIdx > -1) {
            draft.channels[channelIdx].iconPath = action.payload.photoPath;
          }

          if (draft.currentChannel.roomId == roomId) {
            draft.currentChannel.iconPath = action.payload.photoPath;
          }
        }
      });
    },
    [READ_MESSAGE]: (state, action) => {
      return produce(state, draft => {
        if (!action.payload.messageID) {
          action.payload.messageID =
            draft.messages.length > 0
              ? draft.messages[draft.messages.length - 1].messageID
              : 0;
        }
      });
    },
    [RECEIVE_DELETED_MESSAGE]: (state, action) => {
      return produce(state, draft => {
        if (action.payload) {
          const { payload } = action;
          if (!payload?.deleteMessage || !payload?.lastMessage) {
            return;
          }
          const mid = payload.lastMessage.messageID;
          // ????????? ???????????? ????????? ???????????????, ?????? ????????? ?????? ????????? ?????? ?????????
          const originMsg = draft.messages.filter(msg => msg.replyID === mid);

          if (originMsg?.length) {
            for (const msg of originMsg) {
              msg.replyInfo = null;
            }
          }

          const idx = draft.messages?.findIndex(
            msg => msg.messageID === payload.deleteMessage?.messageID,
          );
          // ?????? ????????? ????????? ???????????? ??????
          if (idx !== -1) {
            draft.messages.splice(idx, 1);
          }

          // lastMessage ??????
          const channel = draft.channels.find(
            r => r.roomId == action.payload.roomID,
          );
          if (!channel) {
            return;
          }
          const lastMessage = {
            Message: payload.lastMessage.context,
            File: payload.lastMessage.fileInfos,
            companyCode: payload.lastMessage.companyCode,
            deptCode: payload.lastMessage.deptCode,
            sender: payload.lastMessage.sender,
          };
          channel.lastMessage = lastMessage;
          channel.lastMessageDate = payload.lastMessage.sendDate;
        }
      });
    },
    [RECEIVE_NOTICE]: (state, action) => {
      return produce(state, draft => {
        if (action.payload) {
          const noticeMessage = {
            ...action.payload,
            isNew: true,
          };

          const channelIdx = draft.channels.findIndex(
            c => c.roomId == noticeMessage.roomID,
          );
          if (channelIdx > -1) {
            draft.channels[channelIdx].notice = noticeMessage;
          }
          if (
            draft.currentChannel &&
            draft.currentChannel.roomId == noticeMessage.roomID
          ) {
            draft.currentChannel.notice = noticeMessage;
          }
        }
      });
    },
    [RECEIVE_DELETED_NOTICE]: (state, action) => {
      return produce(state, draft => {
        if (action.payload) {
          if (draft.currentChannel.roomId == action.payload.roomID) {
            delete draft.currentChannel.notice;
          }
        }
      });
    },
    [SET_CHANNEL_NOTICE_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        const { result } = action.payload;
        const channelIdx = draft.channels.findIndex(
          c => c.roomId == result.roomID,
        );
        if (channelIdx > -1) {
          draft.channels[channelIdx].notice = result;
        }
        if (draft.currentChannel.roomId == result.roomID) {
          draft.currentChannel.notice = result;
        }
      });
    },
    [REMOVE_CHANNEL_NOTICE_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload) {
          if (draft.currentChannel.roomId == action.payload.roomId) {
            delete draft.currentChannel.notice;
          }
        }
      });
    },
    [SET_CHANNEL_INFO]: (state, action) => {
      return produce(state, draft => {
        if (action.payload) {
          const channelIdx = draft.channels.findIndex(
            c => c.roomId == action.payload.roomId,
          );

          if (channelIdx > -1) {
            draft.channels[channelIdx] = action.payload;
          }
        }
      });
    },
    [CHANNEL_LEAVE_OTHER_DEVICE]: (state, action) => {
      return produce(state, draft => {
        let roomInd = draft.channels.findIndex(
          c => c.roomId == action.payload.roomID,
        );
        if (roomInd != -1) {
          // findIndex??? ???????????????.
          draft.channels.splice(roomInd, 1);
        }

        if (
          draft.currentChannel &&
          draft.currentChannel.roomId == action.payload.roomID
        ) {
          draft.currentChannel = null;
          draft.selectId = -1;
        }
      });
    },
    [SET_BACKGROUND]: (state, action) => {
      return produce(state, draft => {
        const channel = draft.channels.find(
          r => r.roomId == action.payload.roomID,
        );
        if (channel) {
          channel.background = action.payload.background;

          if (
            draft.currentChannel &&
            draft.currentChannel.roomId == channel.roomId
          ) {
            draft.currentChannel.background = action.payload.background;
          }
        }
      });
    },

    [MESSAGE_CURRENT_TYPING]: (state, action) => {
      return produce(state, draft => {
        draft.typing = action.payload.typing;
      });
    },

    [SELECT_EMOTICON]: (state, action) => {
      return produce(state, draft => {
        draft.selectEmoticon = action.payload.selectEmoticon;
      });
    },

    [CLEAR_EMOTICON]: (state, action) => {
      return produce(state, draft => {
        draft.selectEmoticon = '';
      });
    },

    [MODIFY_CHANNELSETTING_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.roomID) {
          const channel = draft.channels.find(
            item => item.roomId === action.payload.roomID,
          );
          channel.settingJSON = action.payload.setting;

          if (
            !!draft.currentChannel &&
            draft.currentChannel.roomId === action.payload.roomID
          ) {
            // currentRoom ??? ?????? setting ????????? object??? ??????????????? ??????
            try {
              draft.currentChannel.settingJSON = isJSONStr(
                action.payload.setting,
              )
                ? JSON.parse(action.payload.setting)
                : action.payload.setting;
            } catch (e) {
              draft.currentChannel.settingJSON = null;
            }
          }
        }
      });
    },
    [CHANNEL_AUTH_CHANGED]: (state, action) => {
      return produce(state, draft => {
        const channel = draft.channels.find(
          c => c.roomId == action.payload.roomId,
        );
        if (channel) {
          channel.members.map(cm => {
            const memberIdx = action.payload.members.findIndex(
              memberId => memberId == cm.id,
            );
            if (memberIdx > -1) {
              cm.channelAuth = action.payload.auth;
            }
          });
        }

        if (draft.currentChannel.roomId == action.payload.roomId) {
          draft.currentChannel.members.map(cm => {
            const memberIdx = action.payload.members.findIndex(
              memberId => memberId == cm.id,
            );
            if (memberIdx > -1) {
              cm.channelAuth = action.payload.auth;
            }
          });
        }
      });
    },
    [RECEIVE_CHANNELSETTING]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.roomID) {
          const getSetting = item => {
            if (!item) {
              return {};
            } else {
              if (typeof item === 'object') {
                return item;
              } else {
                return isJSONStr(item) ? JSON.parse(item) : item;
              }
            }
          };
          const roomID = Number(action.payload.roomID);
          const channel = draft.channels.find(c => c.roomId == roomID);
          let originSetting = getSetting(channel.settingJSON);
          let setting = getSetting(action.payload.setting);

          for (const [_, key] of Object.keys(setting).entries()) {
            originSetting[key] = setting[key];
          }
          channel.settingJSON = originSetting;

          if (
            !!draft.currentChannel &&
            draft.currentChannel.roomId === roomID
          ) {
            try {
              for (const [_, key] of Object.keys(setting).entries()) {
                draft.currentChannel.settingJSON[key] = setting[key];
              }
            } catch (e) {
              draft.currentChannel.settingJSON = null;
            }
          }
        }
      });
    },
  },

  initialState,
);

export default channel;
