import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';

const CREATE = 'popup/CREATE';
const FRONT_CREATE = 'popup/FRONT_CREATE';
const CLOSE = 'popup/CLOSE';

const CREATE_TOAST = 'popup/CREATE_TOAST';
const CLOSE_TOAST = 'popup/CLOSE_TOAST';

export const create = createAction(CREATE);
export const createToFront = createAction(FRONT_CREATE);
export const close = createAction(CLOSE);

export const createToast = createAction(CREATE_TOAST);
export const closeToast = createAction(CLOSE_TOAST);

let id = 0;
let toastId = 0;

const initialState = {
  popups: [],
  toasts: [],
};

const popup = handleActions(
  {
    [CREATE]: (state, action) => {
      action.payload.id = ++id;
      return produce(state, draft => {
        draft.popups.push(action.payload);
      });
    },
    [FRONT_CREATE]: (state, action) => {
      action.payload.id = ++id;
      return produce(state, draft => {
        draft.popups.unshift(action.payload);
      });
    },
    [CLOSE]: state => {
      return produce(state, draft => {
        draft.popups.shift();
      });
    },
    [CREATE_TOAST]: (state, action) => {
      action.payload.id = ++toastId;
      return produce(state, draft => {
        draft.toasts.push(action.payload);
      });
    },
    [CLOSE_TOAST]: state => {
      return produce(state, draft => {
        draft.toasts.shift();
      });
    },
  },
  initialState,
);

export default popup;
