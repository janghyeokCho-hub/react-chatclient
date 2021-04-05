import React from 'react';
import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';

const SET_VISIABLE = 'mainlayer/SET_VISIABLE';
const SET_CHILDREN = 'mainlayer/SET_CHILDREN';
const INIT = 'mainlayer/INIT';
const SET_LAYER = 'mainlayer/SET_LAYER';
const PUSH_LAYER = 'mainlayer/PUSH_LAYER';
const POP_LAYER = 'mainlayer/POP_LAYER';

export const setVisiable = createAction(SET_VISIABLE);
export const setChildren = createAction(SET_CHILDREN);
export const init = createAction(INIT);
export const setLayer = createAction(SET_LAYER);
export const pushLayer = createAction(PUSH_LAYER);
export const popLayer = createAction(POP_LAYER);

const initialState = {
  visiable: false,
  children: <></>,
  layer: [],
};

const mainlayer = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [SET_VISIABLE]: (state, action) => {
      return produce(state, draft => {
        draft.visiable = action.payload;

        if (!action.payload) draft.children = initialState.children;
      });
    },
    [SET_CHILDREN]: (state, action) => ({
      ...state,
      children: action.payload,
    }),
    [SET_LAYER]: (state, action) => {
      return produce(state, draft => {
        draft.layer = [action.payload];
      });
    },
    [PUSH_LAYER]: (state, action) => {
      return produce(state, draft => {
        draft.layer.push(action.payload);
      });
    },
    [POP_LAYER]: (state, action) => {
      return produce(state, draft => {
        draft.layer.splice(draft.layer.length - 1, 1);
      });
    },
  },
  initialState,
);

export default mainlayer;
