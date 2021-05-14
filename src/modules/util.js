import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';

const COPY_SET = 'util/copy/SET';
const COPY_CLEAR = 'util/copy/CLEAR';

export const setCopy = createAction(COPY_SET);
export const clearCopy = createAction(COPY_CLEAR);

const initialState = {
  copyMessage: null,
  startId: -1,
  endId: -1,
};

const util = handleActions(
  {
    [COPY_SET]: (state, action) => {
      return produce(state, draft => {
        draft.copyMessage = action.payload.copyMessage;
        draft.startId = action.payload.startId;
        draft.endId = action.payload.endId;
      });
    },
    [COPY_CLEAR]: state => {
      return produce(state, draft => {
        draft.currentCopy = false;
        draft.copyMessage = null;
        draft.startId = -1;
        draft.endId = -1;
      });
    },
  },
  initialState,
);

export default util;
