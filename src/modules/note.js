import { createAction, handleActions } from 'redux-actions';
import { takeLatest, call, put, throttle } from 'redux-saga/effects';
import { changeOpenChannel } from '@/modules/channel';
import { changeOpenRoom } from '@/modules/room';

const CLOSE_ROOMS = 'note/CLOSE_ROOMS';

export const closeRooms = createAction(CLOSE_ROOMS);

function createCloseRoomsSaga() {
    return function* (action) {
        // if(action.payload) {
            yield put(changeOpenChannel({
                newChatRoom: true
            }));
            yield put(changeOpenRoom({
                newChannel: true
            }));
        // }
    }
}

export const closeRoomsSaga = createCloseRoomsSaga();

export function* noteSaga() {
    yield takeLatest(CLOSE_ROOMS, closeRoomsSaga);
}

// newChatRoom: true