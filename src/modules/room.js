import { createAction, handleActions } from 'redux-actions';
import { takeLatest, call, put, throttle } from 'redux-saga/effects';
import * as roomApi from '@/lib/room';
import * as messageApi from '@/lib/message';
import createRequestSaga, {
  createRequestActionTypes,
  exceptionHandler,
} from '@/lib/createRequestSaga';
import produce from 'immer';
import { removeTempMessage, setMoveView, sendMessage } from '@/modules/message';
import { changeNewMark, setCurrentRoom } from '@/modules/menu';
import {
  evalConnector,
  resetParentUnreadCount,
  isMainWindow,
} from '@/lib/deviceConnector';
import { startLoading, finishLoading } from '@/modules/loading';
import { changeOpenChannel } from '@/modules/channel'; // 채널
import { addFixedUsers } from '@/modules/presence';
import { get } from '@/lib/util/storageUtil';

const [
  GET_ROOMS,
  GET_ROOMS_SUCCESS,
  GET_ROOMS_FAILURE,
] = createRequestActionTypes('room/GET_ROOMS');

const [
  GET_ROOM_INFO,
  GET_ROOM_INFO_SUCCESS,
  GET_ROOM_INFO_FAILURE,
] = createRequestActionTypes('room/GET_ROOM_INFO');

const [
  UPDATE_ROOMS,
  UPDATE_ROOMS_SUCCESS,
  UPDATE_ROOMS_FAILURE,
] = createRequestActionTypes('room/UPDATE_ROOMS');

const ROOM_MESSAGE_ADD = 'room/ROOM_MESSAGE_ADD';

const OPEN_ROOM = 'room/OPEN_ROOM';
const CHANGE_OPEN_ROOM = 'room/CHANGE_OPEN_ROOM';

const NEW_WIN_ROOM = 'room/NEW_WIN_ROOM';
const CLOSE_WIN_ROOM = 'room/CLOSE_WIN_ROOM';
const CHANGE_VIEW_TYPE = 'room/CHANGE_VIEW_TYPE';
const MAKE_ROOM_VIEW = 'room/MAKE_ROOM_VIEW';
const RESET_UNREAD_COUNT = 'room/RESET_UNREAD_COUNT';

const ROOM_INVITE_MESSAGE_ADD = 'room/ROOM_INVITE_MESSAGE_ADD';
const ROOM_LEAVE_MESSAGE_ADD = 'room/ROOM_LEAVE_MESSAGE_ADD';

const READ_MESSAGE = 'room/READ_MESSAGE';
const READ_MESSAGE_FOCUS = 'room/READ_MESSAGE_FOCUS';
const MESSAGE_READ_COUNT_CHANGED = 'room/MESSAGE_READ_COUNT_CHANGED';
const MESSAGE_READ_OTHER_DEVICE = 'room/MESSAGE_READ_OTHER_DEVICE';

const [
  REMATCHING_MEMBER,
  REMATCHING_MEMBER_SUCCESS,
  REMATCHING_MEMBER_FAILURE,
] = createRequestActionTypes('room/REMATCHING_MEMBER');

const [
  INVITE_MEMBER,
  INVITE_MEMBER_SUCCESS,
  INVITE_MEMBER_FAILURE,
] = createRequestActionTypes('room/INVITE_MEMBER');

const [
  LEAVE_ROOM,
  LEAVE_ROOM_SUCCESS,
  LEAVE_ROOM_FAILURE,
] = createRequestActionTypes('room/LEAVE_ROOM');

const RECEIVE_MESSAGE = 'room/RECEIVE_MESSAGE';

const SET_MESSAGE_LINKINFO = 'room/SET_MESSAGE_LINKINFO';

const SET_ROOMS = 'room/SET_ROOMS';
const INIT = 'room/INIT';

const SET_INIT_CURRENTROOM = 'room/SET_CURRENT_INIT';

const MODIFY_ROOMNAME_LIST = 'room/MODIFY_ROOMNAME_LIST';
const [
  MODIFY_ROOMNAME,
  MODIFY_ROOMNAME_SUCCESS,
  MODIFY_ROOMNAME_FAILURE,
] = createRequestActionTypes('room/MODIFY_ROOMNAME');

const [
  MODIFY_ROOMSETTING,
  MODIFY_ROOMSETTING_SUCCESS,
  MODIFY_ROOMSETTING_FAILURE,
] = createRequestActionTypes('room/MODIFY_ROOMSETTING');

const SET_MESSAGES = 'room/SET_MESSAGES';
const SET_MESSAGES_SYNC = 'room/SET_MESSAGES_SYNC';
const UPDATE_MESSAGE_UNREADCNT = 'room/UPDATE_MESSAGE_UNREADCNT';

const INIT_MESSAGES = 'room/INIT_MESSAGES';

const CHECK_ROOM_MOVE = 'room/CHECK_ROOM_MOVE';
const SET_MESSAGE_UNREADCNT_SYNC = 'message/SET_MESSAGE_UNREADCNT_SYNC';

const ROOM_LEAVE_OTHER_DEVICE = 'room/ROOM_LEAVE_OTHER_DEVICE';
const ROOM_LEAVE_TARGET_USER = 'room/ROOM_LEAVE_TARGET_USER';

const SET_BACKGROUND = 'room/SET_BACKGROUND';

const MESSAGE_READ_COUNT_FIXED = 'room/MESSAGE_READ_COUNT_FIXED';
const MESSAGE_CURRENT_TYPING = 'room/MESSAGE_CURRENT_TYPING';

export const getRooms = createAction(GET_ROOMS);
export const updateRooms = createAction(UPDATE_ROOMS);
export const getRoomInfo = createAction(GET_ROOM_INFO);
export const roomMessageAdd = createAction(ROOM_MESSAGE_ADD);
export const changeOpenRoom = createAction(CHANGE_OPEN_ROOM);
export const newWinRoom = createAction(NEW_WIN_ROOM);
export const closeWinRoom = createAction(CLOSE_WIN_ROOM);
export const changeViewType = createAction(CHANGE_VIEW_TYPE);
export const makeRoomView = createAction(MAKE_ROOM_VIEW);
export const resetUnreadCount = createAction(RESET_UNREAD_COUNT);
export const rematchingMember = createAction(REMATCHING_MEMBER);
export const inviteMember = createAction(INVITE_MEMBER);
export const leaveRoom = createAction(LEAVE_ROOM);
export const roomInviteMessageAdd = createAction(ROOM_INVITE_MESSAGE_ADD);
export const roomLeaveMessageAdd = createAction(ROOM_LEAVE_MESSAGE_ADD);

export const readMessage = createAction(READ_MESSAGE);
export const readMessageFocus = createAction(READ_MESSAGE_FOCUS);
export const messageReadCountChanged = createAction(MESSAGE_READ_COUNT_CHANGED);
export const messageReadOtherDevice = createAction(MESSAGE_READ_OTHER_DEVICE);

export const receiveMessage = createAction(RECEIVE_MESSAGE);
export const openRoom = createAction(OPEN_ROOM);

export const setMessageLinkInfo = createAction(SET_MESSAGE_LINKINFO);
export const setRooms = createAction(SET_ROOMS);
export const init = createAction(INIT);
export const setInitCurrentRoom = createAction(SET_INIT_CURRENTROOM);
export const modifyRoomNameList = createAction(MODIFY_ROOMNAME_LIST);
export const modifyRoomName = createAction(MODIFY_ROOMNAME);
export const modifyRoomSetting = createAction(MODIFY_ROOMSETTING);

export const setMessages = createAction(SET_MESSAGES);
export const setMessagesForSync = createAction(SET_MESSAGES_SYNC);
export const updateMessageUnreadCount = createAction(UPDATE_MESSAGE_UNREADCNT);
export const initMessages = createAction(INIT_MESSAGES);

export const checkRoomMove = createAction(CHECK_ROOM_MOVE);
export const setUnreadCountForSync = createAction(SET_MESSAGE_UNREADCNT_SYNC);

export const roomLeaveOtherDevice = createAction(ROOM_LEAVE_OTHER_DEVICE);
export const roomLeaveTargetUser = createAction(ROOM_LEAVE_TARGET_USER);

export const setBackground = createAction(SET_BACKGROUND);
export const messageReadCountFixed = createAction(MESSAGE_READ_COUNT_FIXED);
export const messageCurrentTyping = createAction(MESSAGE_CURRENT_TYPING);

const inviteMemberSaga = createRequestSaga(INVITE_MEMBER, roomApi.inviteMember);

function createGetRoomsSaga() {
  return function* (action) {
    yield put(startLoading('room/GET_ROOMS'));
    try {
      let data = {};

      // TODO: AppData 저장 여부값 조건 추가 필요
      if (DEVICE_TYPE == 'd') {
        data = yield call(evalConnector, {
          method: 'sendSync',
          channel: 'req-get-room',
          message: {},
        });
      } else {
        const response = yield call(roomApi.getRoomList, action.payload);
        data = response.data;
      }

      yield put({
        type: 'room/GET_ROOMS_SUCCESS',
        payload: data,
      });
    } catch (e) {
      console.dir(e);
      yield call(exceptionHandler, { e: e, redirectError: false });
      yield put({
        type: 'room/GET_ROOMS_FAILURE',
        payload: e,
        error: true,
      });
    }
    yield put(finishLoading('room/GET_ROOMS'));
  };
}

const getRoomsSaga = createGetRoomsSaga(GET_ROOMS, roomApi.getRoomList);

function createGetRoomInfoSaga() {
  return function* (action) {
    yield put(startLoading('room/GET_ROOM_INFO'));
    try {
      let data = {};

      // TODO: AppData 저장 여부값 조건 추가 필요
      if (DEVICE_TYPE == 'd') {
        data = yield call(evalConnector, {
          method: 'sendSync',
          channel: 'req-get-roomInfo',
          message: { roomId: action.payload.roomID },
        });

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
          }, action.payload.roomID);

          data.room.background = background;
        }
      } else {
        const response = yield call(roomApi.getRoomInfo, action.payload);
        data = response.data;
      }
      let roomList = [];
      if (data.room.members.length > 2) {
        const roomListResponse = yield call(roomApi.getRoomList);
        roomList = roomListResponse.data.rooms;
      }

      yield put({
        type: 'room/GET_ROOM_INFO_SUCCESS',
        payload: { ...data, rooms: roomList },
      });

      // desktop의 경우 unread cnt sync 이후 read message 처리 수행
      if (data.messages.length > 0) {
        yield put(
          readMessage({
            roomID: action.payload.roomID,
            messageID: data.messages[data.messages.length - 1].messageID,
            isNotice: data.room.roomType == 'A',
          }),
        );
      }
    } catch (e) {
      console.dir(e);
      yield call(exceptionHandler, { e: e, redirectError: false });
      yield put({
        type: 'room/GET_ROOM_INFO_FAILURE',
        payload: e,
        error: true,
      });
    }
    yield put(finishLoading('room/GET_ROOM_INFO'));
  };
}

const getRoomInfoSaga = createGetRoomInfoSaga();

function createOpenRoomSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        // 자기자신이 보낸경우 tempMessage에 있는 데이터 먼저 삭제
        if (action.payload.roomID) {
          yield put(setCurrentRoom(action.payload.roomID));
        }
        // move view 초기화
        yield put(setMoveView({ roomID: -1, moveId: -1, visible: false }));
        yield put(changeOpenRoom(action.payload));
        // mjseo
        yield put(changeOpenChannel({ newChatRoom: true }));
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
      }
    }
  };
}

const openRoomSaga = createOpenRoomSaga();

function createReceiveMessageSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        // 자기자신이 보낸경우 tempMessage에 있는 데이터 먼저 삭제
        if (action.payload.isMine == 'Y') {
          yield put(removeTempMessage(action.payload.tempId));
        } else {
          //yield put(changeNewMark(action.payload.roomID));
        }
        // TODO: Current Room 에 발생한 메시지의 경우 newMark 발생하지 않도록 처리

        yield put(roomMessageAdd(action.payload));

        if (
          action.payload.isCurrentRoom &&
          window.document.hasFocus() &&
          action.payload.isMine != 'Y'
        ) {
          // 자기가 보낸 메시지가 아닌경우 창의 focus 를 체크하여 읽음처리
          /*
          const response = yield call(messageApi.readMessage, {
            roomID: action.payload.roomID,
          });
          if (response.data.status == 'SUCCESS') {
            if (response.data.result) {
              yield put({
                type: MESSAGE_READ_COUNT_CHANGED,
                payload: response.data.result,
              });
            }
          }
          */

          yield put(
            readMessageFocus({
              roomID: action.payload.roomID,
              messageID: action.payload.messageID,
              isNotice: action.payload.isNotice,
            }),
          );
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'room/RECEIVE_MESSAGE_FAILURE',
          payload: action.payload,
          error: true,
        });
      }
    }
  };
}

const receiveMessageSaga = createReceiveMessageSaga();

function createCheckRoomMoveSaga() {
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
const checkRoomMoveSaga = createCheckRoomMoveSaga();

function createUpdateRoomsSaga() {
  return function* (action) {
    yield put(startLoading('room/UPDATE_ROOMS'));
    if (action.payload) {
      try {
        const response = yield call(roomApi.getRoomList, action.payload);

        if (response.data.status == 'SUCCESS') {
          yield put({
            type: 'room/UPDATE_ROOMS_SUCCESS',
            payload: response.data,
          });

          let members = [];
          response.data.rooms.forEach(item => {
            members = members.concat(
              item.members.map(member => {
                return { id: member.id, presence: member.presence };
              }),
            );
          });
          yield put(addFixedUsers(members));

          // TODO: AppData 저장 여부값 조건 추가 필요
          if (DEVICE_TYPE == 'd') {
            yield call(evalConnector, {
              method: 'send',
              channel: 'req-save-rooms',
              message: { rooms: response.data.rooms },
            });
          }
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'room/UPDATE_ROOMS_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
    yield put(finishLoading('room/UPDATE_ROOMS'));
  };
}

const updateRoomsSaga = createUpdateRoomsSaga();

function createLeaveRoomsSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const response = yield call(roomApi.leaveRoom, action.payload);

        if (response.data.status == 'SUCCESS') {
          yield put({
            type: 'room/LEAVE_ROOM_SUCCESS',
            payload: response.data,
          });

          // TODO: AppData 저장 여부값 조건 추가 필요
          if (DEVICE_TYPE == 'd') {
            yield call(evalConnector, {
              method: 'send',
              channel: 'req-delete-room',
              message: { roomId: action.payload.roomID },
            });
          }
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'room/LEAVE_ROOM_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}

const leaveRoomSaga = createLeaveRoomsSaga();

function createModifyRoomNameSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const response = yield call(roomApi.modifyRoomName, action.payload);

        if (response.data.status == 'SUCCESS') {
          yield put({
            type: 'room/MODIFY_ROOMNAME_SUCCESS',
            payload: response.data,
          });

          if (DEVICE_TYPE == 'd') {
            if (action.payload.viewType == 'S') {
              yield call(evalConnector, {
                method: 'send',
                channel: 'modify-roomname-list',
                message: {
                  roomId: action.payload.roomId,
                  roomName: action.payload.roomName,
                },
              });
            }

            // TODO: AppData 저장 여부값 조건 추가 필요
            yield call(evalConnector, {
              method: 'send',
              channel: 'req-modify-roomname',
              message: {
                roomId: action.payload.roomId,
                roomName: action.payload.roomName,
              },
            });
          }
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'room/MODIFY_ROOMNAME_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}

const modifyRoomNameSaga = createModifyRoomNameSaga();

function createModifyRoomSettingSaga() {
  return function* (action) {
    if (action.payload) {
      yield put(startLoading('room/MODIFY_ROOMSETTING'));
      try {
        const response = yield call(roomApi.modifyRoomSetting, {
          roomID: action.payload.roomID,
          key: action.payload.key,
          value: action.payload.value,
        });

        if (response.data.status == 'SUCCESS') {
          yield put({
            type: 'room/MODIFY_ROOMSETTING_SUCCESS',
            payload: {
              roomID: action.payload.roomID,
              setting: action.payload.setting,
            },
          });

          if (DEVICE_TYPE == 'd') {
            // TODO: AppData 저장 여부값 조건 추가 필요
            yield call(evalConnector, {
              method: 'send',
              channel: 'req-modify-roomsetting',
              message: {
                roomID: action.payload.roomID,
                setting: action.payload.setting,
              },
            });
          }
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'room/MODIFY_ROOMSETTING_FAILURE',
          payload: e,
          error: true,
        });
      }

      yield put(finishLoading('room/MODIFY_ROOMSETTING'));
    }
  };
}

const modifyRoomSettingSaga = createModifyRoomSettingSaga();

function createRematchingMemberSaga() {
  return function* (action) {
    if (action.payload) {
      try {
        const response = yield call(roomApi.rematchMember, {
          roomID: action.payload.roomID,
        });

        if (response.data.status == 'SUCCESS') {
          yield put({
            type: 'room/REMATCHING_MEMBER_SUCCESS',
            payload: response.data,
          });

          // TODO: AppData 저장 여부값 조건 추가 필요
          if (DEVICE_TYPE == 'd') {
            yield call(evalConnector, {
              method: 'send',
              channel: 'req-rematch-member',
              message: {
                roomId: response.data.roomID,
                members: response.data.members,
              },
            });
          }

          yield put(sendMessage(action.payload));
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
        yield put({
          type: 'room/REMATCHING_MEMBER_FAILURE',
          payload: e,
          error: true,
        });
      }
    }
  };
}

const rematchingMemberSaga = createRematchingMemberSaga();

function createReadMessageSaga() {
  return function* (action) {
    if (action.payload.roomID && action.payload.messageID) {
      try {
        if (DEVICE_TYPE == 'b') {
          // 새창인경우 본창 전파
          if (
            window.opener &&
            typeof window.opener.parent.newWinReadMessageCallback == 'function'
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
              isChannel: false,
            });
          }
        }

        const response = yield call(messageApi.readMessage, {
          roomID: action.payload.roomID,
          messageID: action.payload.messageID,
          isNotice: action.payload.isNotice,
        });

        if (response.data.status == 'SUCCESS') {
          if (response.data.result) {
            // READ_MESSAGE_SUCCESS 에서 화면단 COUNT 감소 처리

            if (DEVICE_TYPE == 'd') {
              yield call(evalConnector, {
                method: 'send',
                channel: 'req-read-message',
                message: response.data.result,
              });
            }

            yield put({
              type: MESSAGE_READ_COUNT_CHANGED,
              payload: response.data.result,
            });

            // check fix read cnt ( read cnt 오류 보정 )
            yield put({
              type: MESSAGE_READ_COUNT_FIXED,
              payload: response.data.result,
            });
          }
        }
      } catch (e) {
        console.dir(e);
        yield call(exceptionHandler, { e: e, redirectError: false });
      }
    }
  };
}

const readMessageSaga = createReadMessageSaga();
const readMessageFocusSaga = createReadMessageSaga();

export function* roomSaga() {
  yield takeLatest(GET_ROOMS, getRoomsSaga);
  yield takeLatest(UPDATE_ROOMS, updateRoomsSaga);
  yield takeLatest(GET_ROOM_INFO, getRoomInfoSaga);
  yield takeLatest(REMATCHING_MEMBER, rematchingMemberSaga);
  yield takeLatest(INVITE_MEMBER, inviteMemberSaga);
  yield takeLatest(LEAVE_ROOM, leaveRoomSaga);
  yield takeLatest(RECEIVE_MESSAGE, receiveMessageSaga);
  yield takeLatest(OPEN_ROOM, openRoomSaga);
  yield takeLatest(MODIFY_ROOMNAME, modifyRoomNameSaga);
  yield takeLatest(CHECK_ROOM_MOVE, checkRoomMoveSaga);
  yield takeLatest(READ_MESSAGE, readMessageSaga);
  yield takeLatest(MODIFY_ROOMSETTING, modifyRoomSettingSaga);
  yield throttle(1000, READ_MESSAGE_FOCUS, readMessageFocusSaga);
}

const initialState = {
  viewType: 'S',
  selectId: -1,
  currentRoom: null,
  rooms: [],
  messages: [],
  makeRoom: false,
  makeInfo: null,
  typing: false,
};

const room = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [SET_ROOMS]: (state, action) => {
      return produce(state, draft => {
        // login 시에만 사용
        if (!draft.rooms || draft.rooms.length == 0) {
          draft.rooms = action.payload.rooms;
        } else {
          //newWin 관련 정보 merge
          const newWinRooms = draft.rooms.filter(item => item.newWin);
          action.payload.rooms.forEach(item => {
            const room = newWinRooms.find(r => r.roomID == item.roomID);
            if (room) {
              item.newWin = room.newWin;
              item.winObj = room.winObj;
              item.winName = room.winName;
            }
          });

          draft.rooms = action.payload.rooms;
        }
      });
    },
    [GET_ROOMS_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (draft.rooms.length > 0) {
          // 기존 새창과 같은 action에 따라 변동된 값을 유지하기 위해 update형식으로 적용
          action.payload.rooms.forEach(item => {
            const room = draft.rooms.find(r => r.roomID == item.roomID);

            // 기존 room 내용 복사
            if (room) {
              item.newWin = room.newWin;
              item.winObj = room.winObj;
              item.winName = room.winName;
            }
          });
        }

        draft.rooms = action.payload.rooms;
      });
    },
    [UPDATE_ROOMS_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (draft.rooms.length > 0) {
          // 기존 새창과 같은 action에 따라 변동된 값을 유지하기 위해 update형식으로 적용
          action.payload.rooms.forEach(item => {
            const idx = draft.rooms.findIndex(r => r.roomID == item.roomID);
            if (idx > -1) {
              draft.rooms[idx] = item;
            }
          });
        }
      });
    },
    [GET_ROOM_INFO_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        let newRoom = action.payload.room;

        const roomIdx = draft.rooms.findIndex(
          r => r.roomID == action.payload.room.roomID,
        );

        const room = roomIdx > -1 ? draft.rooms[roomIdx] : null;
        // members room
        const members = newRoom.members;
        const memberIds = newRoom.members.map(member => member.id);

        if (room) {
          // update 필요내용만 변경 - room member 변경시에도 update date 처리
          if (room.updateDate != newRoom.updateDate) {
            newRoom.newWin = room.newWin;
            newRoom.winObj = room.winObj;
            newRoom.winName = room.winName;

            draft.rooms[roomIdx] = newRoom;

            // 나머지 속성 매핑필요
            draft.currentRoom = newRoom;
          } else {
            // background 정보 설정
            room.background = newRoom.background;
            draft.currentRoom = room;
          }
        } else {
          draft.rooms.push(newRoom);
          if (members.length > 2) {
            let re = action.payload.rooms.filter(
              room =>
                (memberIds.find(id => id == room.ownerCode) ||
                  memberIds.find(id => id == room.targetCode)) &&
                room.members.length == 2,
            );
            // draft.rooms.concat(re);
            re.map(r => draft.rooms.push(r));
          }
          draft.currentRoom = newRoom;
        }

        draft.messages = action.payload.messages;

        // current room 내의 setting 은 Object type으로 처리
        try {
          draft.currentRoom.setting = JSON.parse(newRoom.setting);
        } catch (e) {
          draft.currentRoom.setting = null;
        }
      });
    },
    [ROOM_MESSAGE_ADD]: (state, action) => {
      return produce(state, draft => {
        const room = draft.rooms.find(r => r.roomID == action.payload.roomID);
        // room 순서 변경

        const lastMessageData = {
          Message: action.payload.context,
          File: action.payload.fileInfos,
        };

        if (room) {
          room.lastMessage = lastMessageData;
          room.lastMessageDate = action.payload.sendDate;

          draft.rooms.splice(
            draft.rooms.findIndex(r => r.roomID == action.payload.roomID),
            1,
          );
          draft.rooms.unshift(room);

          if (draft.currentRoom && room.roomID == draft.currentRoom.roomID) {
            // 이미 존재하는 메시지인지 한번 체크 후 입력
            // 메시지 순서에 대한 보장도 확인해봐야함.
            const idx = draft.messages.findIndex(
              m => m.messageID == action.payload.messageID,
            );

            const lastMessageID =
              draft.messages.length > 0
                ? draft.messages[draft.messages.length - 1].messageID
                : 0;

            // 이미 추가된 메시지가 아닌경우
            if (idx < 0) {
              // push 하기전 sendTime을 비교해서 YYYYMMDDHHmm 같은애들은 한꺼번에 update
              const size = draft.messages.length;
              const checkTimeStamp = Math.floor(
                action.payload.sendDate / 60000,
              );

              for (let i = size - 1; i >= 0; i--) {
                const compMessage = draft.messages[i];
                const compTimeStamp = Math.floor(compMessage.sendDate / 60000);
                // 시간이 같은 메시지까지 update 대상으로 포함
                if (compTimeStamp == checkTimeStamp) {
                  // 해당 state에 강제로 추가 props를 추가해 업데이트 유도
                  compMessage.updateIndex = action.payload.messageID;
                } else {
                  break;
                }
              }

              // 메시지 읽음 카운트 확인
              let notReadArr = draft.currentRoom.notReadArr;
              if (notReadArr) {
                const preReadCnt = notReadArr.reduce((acc, current) => {
                  if (acc[current]) {
                    acc[current] = acc[current] + 1;
                  } else {
                    acc[current] = 1;
                  }
                  return acc;
                }, {});

                let filterArray = [];

                Object.keys(preReadCnt).forEach(key => {
                  const message = draft.messages.find(
                    item => item.messageID == key,
                  );

                  if (message) {
                    message.unreadCnt = message.unreadCnt - preReadCnt[key];
                  } else {
                    for (let i = 0; i < preReadCnt[key]; i++) {
                      filterArray.push(key);
                    }
                  }
                });

                draft.currentRoom.notReadArr = filterArray;
              }

              if (action.payload.messageID > lastMessageID) {
                draft.messages.push(action.payload);
              } else {
                let afterMessageIdx = draft.messages.length - 1;
                // 마지막 메시지와 가까울 경우의수가 높으므로 역으로 조회
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

            // 활성창이지만 새창인경우 --- 본창도 focus가 있을때만 unreadCnt를 증가시키지 않음
            if (action.payload.isMine != 'Y') {
              room.unreadCnt = room.unreadCnt + 1;
            }

            action.payload.isCurrentRoom = true;
          } else {
            if (action.payload.isMine != 'Y')
              room.unreadCnt = room.unreadCnt + 1;
          }
        } else {
          // room 정보를 받아와야하는 room 추가
          draft.rooms.unshift({
            roomID: action.payload.roomID,
            updateDate: null,
            lastMessage: lastMessageData,
            lastMessageDate: action.payload.sendDate,
            unreadCnt: action.payload.isMine != 'Y' ? 1 : 0,
          });
        }
      });
    },
    [CHANGE_OPEN_ROOM]: (state, action) => {
      return produce(state, draft => {
        if (!action.payload.newRoom) {
          const room = draft.rooms.find(r => r.roomID == action.payload.roomID);
          let changeRoom = null;

          if (room) {
            // room 새창여부 및 닫힘여부 체크
            if (room.newWin && room.winObj) {
              if (room.winObj.closed) {
                // 상태값은 새창이지만 창이 닫혀있는경우
                room.newWin = false;
                room.winObj = null;
                room.winName = '';
              }
            }

            changeRoom = room;
          } else {
            changeRoom = {
              roomID: action.payload.roomID,
            };
          }

          if (draft.viewType != 'S' || SCREEN_OPTION == 'G') {
            if (
              !draft.currentRoom ||
              draft.currentRoom.roomID != changeRoom.roomID
            ) {
              // MultiView일때만 CurrentRoom 변경 가능
              draft.selectId = action.payload.roomID;
              draft.currentRoom = changeRoom;
              draft.messages = [];
            }

            // currentRoom 의 경우 setting 정보가 object로 변환되도록 작업
            try {
              draft.currentRoom.setting = JSON.parse(changeRoom.setting);
            } catch (e) {
              draft.currentRoom.setting = null;
            }
          }

          draft.makeInfo = null;
        } else {
          draft.currentRoom = {
            newRoom: action.payload.newRoom,
          };

          draft.makeInfo = action.payload.makeInfo;

          draft.selectId = -1;
          draft.messages = [];
        }

        // mjseo
        if (action.payload.newChannel) {
          // 채팅 값 초기화
          draft.currentRoom = null;
          draft.makeInfo = null;
          draft.messages = [];
          draft.selectId = -1;
        }
        //

        draft.makeRoom = false;
      });
    },
    [NEW_WIN_ROOM]: (state, action) => {
      if(action.payload.obj === null) {
        return state;
      }
      return produce(state, draft => {
        const room = draft.rooms.find(r => r.roomID == action.payload.id);
        const currentRoom = draft.currentRoom;

        if (currentRoom) {
          if (currentRoom.roomID == action.payload.id) {
            currentRoom.newWin = true;
            currentRoom.winObj = action.payload.obj;
            currentRoom.winName = action.payload.name;
          }
        }

        if (room) {
          room.newWin = true;
          room.winObj = action.payload.obj;
          room.winName = action.payload.name;
        } else {
          draft.rooms.push({
            roomID: action.payload.id,
            newWin: true,
            winObj: action.payload.obj,
            winName: action.payload.name,
            updateDate: null,
          });
        }
      });
    },
    [CLOSE_WIN_ROOM]: (state, action) => {
      if(action.payload.obj === null) {
        return state;
      }
      return produce(state, draft => {
        const room = draft.rooms.find(r => r.roomID == action.payload);

        const currentRoom = draft.currentRoom;

        if (currentRoom) {
          if (currentRoom.roomID == action.payload) {
            currentRoom.newWin = false;
            currentRoom.winObj = null;
            currentRoom.winName = '';
          }
        }

        if (room) {
          room.newWin = false;
          room.winObj = null;
          room.winName = '';
        } else {
          draft.rooms.push({
            roomID: action.payload,
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

        // single view로 변경된경우 기존의 갖고있던 currentRoom정보 삭제
        if (!action.payload) {
          draft.selectId = -1;
          draft.currentRoom = null;
          draft.messages = [];
          draft.makeRoom = false;
          draft.makeInfo = null;
        }
      });
    },
    [MAKE_ROOM_VIEW]: (state, action) => ({
      ...state,
      makeRoom: true,
      makeInfo: action.payload,
    }),
    [RESET_UNREAD_COUNT]: (state, action) => {
      return produce(state, draft => {
        const room = draft.rooms.find(r => r.roomID == action.payload);
        if (room) room.unreadCnt = 0;
      });
    },
    [REMATCHING_MEMBER_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        // room의 member정보 update
        const room = draft.rooms.find(r => r.roomID == action.payload.roomID);
        room.members = action.payload.members;
      });
    },
    [INVITE_MEMBER_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        // room의 member정보 update
        const room = draft.rooms.find(r => r.roomID == action.payload.roomID);
        action.payload.members.forEach(i => {
          const idx = room.members.findIndex(m => m.id == i.id);
          if (idx == -1) room.members.push(i);
        });
      });
    },
    [LEAVE_ROOM_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        // room의 member정보 update
        const roomIdx = draft.rooms.findIndex(
          r => r.roomID == action.payload.roomID,
        );
        const room = draft.rooms[roomIdx];

        if (room.newWin && room.winObj) {
          if (!room.winObj.closed) {
            if (DEVICE_TYPE == 'd') {
              !room.winObj.isDestroyed() && room.winObj.close();
            } else {
              room.winObj.close();
            }
          }
        }

        draft.rooms.splice(roomIdx, 1);

        if (
          draft.currentRoom &&
          draft.currentRoom.roomID == action.payload.roomID
        ) {
          draft.currentRoom = null;
          draft.selectId = -1;
        }
      });
    },
    [ROOM_INVITE_MESSAGE_ADD]: (state, action) => {
      return produce(state, draft => {
        const room = draft.rooms.find(r => r.roomID == action.payload.roomID);

        if (room) {
          // member 적용
          action.payload.inviteMember.forEach(i => {
            const idx = room.members.findIndex(m => m.id == i.id);
            if (idx == -1) room.members.push(i);
          });

          // 활성화된 채팅방의 경우 메시지 적용
          if (
            draft.currentRoom &&
            action.payload.roomID == draft.currentRoom.roomID
          ) {
            // 이미 존재하는 메시지인지 확인
            const idx = draft.messages.findIndex(
              m => m.messageID == action.payload.messageID,
            );

            // 메시지 순서확인용
            const lastMessageID =
              draft.messages.length > 0
                ? draft.messages[draft.messages.length - 1].messageID
                : 0;

            if (idx < 0 && action.payload.messageID > lastMessageID)
              draft.messages.push(action.payload);

            const members = room.members;
            draft.currentRoom.members = members;
          }
        } else {
          // room 정보를 받아와야하는 room 추가
          draft.rooms.push({
            roomID: action.payload.roomID,
            updateDate: null,
            unreadCnt: 0,
          });
        }
      });
    },
    [ROOM_LEAVE_MESSAGE_ADD]: (state, action) => {
      return produce(state, draft => {
        const room = draft.rooms.find(r => r.roomID == action.payload.roomID);

        if (room) {
          // 사용자 제거
          room.members.splice(
            room.members.findIndex(m => m.id == action.payload.leaveMember),
            1,
          );

          // 활성화된 채팅방의 경우만 바로 적용
          if (
            draft.currentRoom &&
            action.payload.roomID == draft.currentRoom.roomID
          ) {
            // 이미 존재하는 메시지인지 확인
            const idx = draft.messages.findIndex(
              m => m.messageID == action.payload.messageID,
            );

            // 메시지 순서확인용
            const lastMessageID =
              draft.messages.length > 0
                ? draft.messages[draft.messages.length - 1].messageID
                : 0;

            if (idx < 0 && action.payload.messageID > lastMessageID)
              draft.messages.push(action.payload);

            const members = room.members;
            draft.currentRoom.members = members;
          }
        } else {
          // room 정보를 받아와야하는 room 추가
          draft.rooms.unshift({
            roomID: action.payload.roomID,
            updateDate: null,
            unreadCnt: 0,
          });
        }
      });
    },
    [MESSAGE_READ_COUNT_CHANGED]: (state, action) => {
      return produce(state, draft => {
        console.log('call read count changed -- store :: ');
        if (
          draft.currentRoom &&
          draft.currentRoom.roomID == action.payload.roomID
        ) {
          action.payload.messageIDs.forEach(id => {
            const message = draft.messages.find(m => m.messageID == id);
            if (message) {
              message.unreadCnt = message.unreadCnt - 1;
            } else {
              if (!draft.currentRoom.notReadArr)
                draft.currentRoom.notReadArr = [];
              draft.currentRoom.notReadArr = [
                ...draft.currentRoom.notReadArr,
                id,
              ];
            }
          });
        }
      });
    },
    [SET_MESSAGE_UNREADCNT_SYNC]: (state, action) => {
      return produce(state, draft => {
        if (
          draft.currentRoom &&
          draft.currentRoom.roomID == action.payload.roomID
        ) {
          action.payload.unreadCnts.forEach(item => {
            const messageIds = item.messageId.split(',');
            messageIds.forEach(id => {
              const message = draft.messages.find(m => id == m.messageID);
              if (message) {
                if (message.unreadCnt > item.unreadCnt)
                  message.unreadCnt = item.unreadCnt;
              }
            });
          });
        }
      });
    },
    [SET_MESSAGE_LINKINFO]: (state, action) => {
      return produce(state, draft => {
        if (
          draft.currentRoom &&
          draft.currentRoom.roomID == action.payload.roomId
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
    [SET_INIT_CURRENTROOM]: (state, action) => ({
      ...state,
      selectId: initialState.selectId,
      currentRoom: initialState.currentRoom,
    }),
    [MODIFY_ROOMNAME_LIST]: (state, action) => {
      return produce(state, draft => {
        const room = draft.rooms.find(
          r => r.roomID == parseInt(action.payload.roomId),
        );

        if (room) room.roomName = action.payload.roomName;
      });
    },
    [MODIFY_ROOMNAME_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        const roomId = parseInt(action.payload.result.roomId);
        const room = draft.rooms.find(r => r.roomID == roomId);

        if (room) {
          room.roomName = action.payload.result.roomName;

          if (draft.currentRoom && draft.currentRoom.roomID == roomId) {
            draft.currentRoom.roomName = action.payload.result.roomName;
          }
        }
      });
    },
    [SET_MESSAGES]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.dist == 'BEFORE') {
          draft.messages = [...draft.messages, ...action.payload.messages];
        } else {
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
        // 최근 100개의 메시지만 남김
        draft.messages = draft.messages.splice(startIdx, 100);
      });
    },
    [ROOM_LEAVE_OTHER_DEVICE]: (state, action) => {
      return produce(state, draft => {
        // room의 member정보 update
        draft.rooms.splice(
          draft.rooms.findIndex(r => r.roomID == action.payload.roomID),
          1,
        );

        if (
          draft.currentRoom &&
          draft.currentRoom.roomID == action.payload.roomID
        ) {
          draft.currentRoom = null;
          draft.selectId = -1;
        }
      });
    },
    [ROOM_LEAVE_TARGET_USER]: (state, action) => {
      return produce(state, draft => {
        // room의 member정보 update
        const room = draft.rooms.find(r => r.roomID == action.payload.roomID);
        if (room) {
          room.realMemberCnt = 1;

          if (
            draft.currentRoom &&
            action.payload.roomID == draft.currentRoom.roomID
          ) {
            draft.currentRoom.realMemberCnt = 1;
          }
        }
      });
    },
    [MESSAGE_READ_OTHER_DEVICE]: (state, action) => {
      return produce(state, draft => {
        // room의 member정보 update
        const room = draft.rooms.find(r => r.roomID == action.payload.roomID);
        if (room) {
          room.unreadCnt = 0;

          if (
            draft.currentRoom &&
            action.payload.roomID == draft.currentRoom.roomID
          ) {
            draft.currentRoom.unreadCnt = 0;
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
    [SET_BACKGROUND]: (state, action) => {
      return produce(state, draft => {
        const room = draft.rooms.find(r => r.roomID == action.payload.roomID);
        if (room) {
          room.background = action.payload.background;

          if (draft.currentRoom && draft.currentRoom.roomID == room.roomID) {
            draft.currentRoom.background = action.payload.background;
          }
        }
      });
    },
    // 20200713 읽음 안읽음 카운트 방어코드
    [MESSAGE_READ_COUNT_FIXED]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.messageIDs.length > 0) {
          const changeIdx = draft.messages.findIndex(
            m => m.messageID == action.payload.messageIDs[0],
          );

          // 첫번째 메시지면 굳이 할필요 없음.
          if (changeIdx > 0) {
            const changeUnreadCnt = draft.messages[changeIdx].unreadCnt;

            for (let i = changeIdx - 1; i >= 0; i--) {
              // 상위의 있는 메시지의 읽음 카운트가 더 클경우 ( 수정 필요한 오차 발생 시 ) 한꺼번에 update 적용
              // 하위 메시지의 unread cnt는 상위 메시지의 unread cnt 보다 클 수 없음.
              if (
                draft.messages[i] &&
                changeUnreadCnt < draft.messages[i].unreadCnt
              ) {
                draft.messages[i].unreadCnt = changeUnreadCnt;
              } else {
                // 상위 1개 메시지에 대해서 일치할 시 수행 중지
                break;
              }
            }
          }
        }
      });
    },
    [MESSAGE_CURRENT_TYPING]: (state, action) => {
      return produce(state, draft => {
        draft.typing = action.payload.typing;
      });
    },
    [MODIFY_ROOMSETTING_SUCCESS]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.roomID) {
          const room = draft.rooms.find(
            item => item.roomID === action.payload.roomID,
          );
          room.setting = action.payload.setting;

          if (draft.currentRoom.roomID === action.payload.roomID) {
            // currentRoom 의 경우 setting 정보가 object로 변환되도록 작업
            try {
              draft.currentRoom.setting = JSON.parse(action.payload.setting);
            } catch (e) {
              draft.currentRoom.setting = null;
            }
          }
        }
      });
    },
    [UPDATE_MESSAGE_UNREADCNT]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.roomID) {
          // 1. roomID가 일치하는 현재 방 탐색
          // 2. 해당 방의 메시지 중 payload에 있는 messageId 탐색
          // 3. 해당 메시지가 존재 한다면 해당 메시지만 업데이트 처리
        }
      });
    },
  },
  initialState,
);

export default room;
