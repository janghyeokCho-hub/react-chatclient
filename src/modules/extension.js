import { createAction, handleActions } from 'redux-actions';

import produce from 'immer';

const INIT = 'extension/INIT';

const ADD = 'extension/ADD';
const DELETE = 'extension/DELETE';
const UPDATE = 'extension/UPDATE';

const SET_CURRENT_EXTENSION = 'extension/current/SET';

export const extensionInit = createAction(INIT);

export const extensionAdd = createAction(ADD);
export const extensionDelete = createAction(DELETE);
export const extensionUpdate = createAction(UPDATE);

export const setCurrentExtension = createAction(SET_CURRENT_EXTENSION);

const initialState = {
  extensions: [],
  currentExtension: {
    extensionId: -1,
    title: null,
    type: null,
    downloadURL: null,
    description: null,
    createDate: null,
    updateDate: null,
    owner: null,
    version: null,
    icon: null,
  },
};

const extension = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [ADD]: (state, action) => {
      return produce(state, draft => {
        draft.extensions.push(action.payload);
      });
    },
    [SET_CURRENT_EXTENSION]: (state, action) => {
      return produce(state, draft => {
        if (action.payload.extensionId > 0) {
          draft.currentExtension.extensionId = action.payload.extensionId;
          draft.currentExtension.title = action.payload.title;
          draft.currentExtension.type = action.payload.type;
          draft.currentExtension.downloadURL = action.payload.downloadURL;
          draft.currentExtension.description = action.payload.description;
          draft.currentExtension.createDate = action.payload.createDate;
          draft.currentExtension.updateDate = action.payload.updateDate;
          draft.currentExtension.owner = action.payload.owner;
          draft.currentExtension.version = action.payload.version;
          draft.currentExtension.icon = action.payload.icon;
        }
      });
    },
  },
  initialState,
);

export default extension;
