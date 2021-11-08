import { createAction, handleActions } from 'redux-actions';

import produce from 'immer';

const INIT = 'extension/INIT';

const ADD = 'extension/ADD';
const DELETE = 'extension/DELETE';
const UPDATE = 'extension/UPDATE';

export const extensionInit = createAction(INIT);

export const extensionAdd = createAction(ADD);
export const extensionDelete = createAction(DELETE);
export const extensionUpdate = createAction(UPDATE);

const initialState = {
  extension: [],
  currentExtension: {
    extensionId: -1,
    title: null,
    description: null,
    createDate: null,
    updateDate: null,
    owner: null,
    version: null,
  },
};

const extension = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [ADD]: (state, action) => {
      return produce(state, draft => {
        draft.extension.push(action.payload);
      });
    },
  },
  initialState,
);

export default extension;
