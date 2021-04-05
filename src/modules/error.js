import { createAction, handleActions } from 'redux-actions';

import produce from 'immer';

const SET = 'error/SET';
const INIT = 'error/INIT';

export const init = createAction(INIT);
export const set = createAction(SET);

const initialState = {
  error: false,
  object: null,
};

const menu = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [set]: (state, action) => {
      return produce(state, draft => {
        draft.error = action.payload.error;
        draft.object = action.payload.object;
      });
    },
  },
  initialState,
);

export default menu;
