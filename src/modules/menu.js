import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';

const BOUND = 'menu/BOUND';
const SET_TOPBUTTON = 'menu/SET_TOPBUTTON';
//const CHANGE_NEW_MARK = 'menu/CHANGE_NEW_MARK';
const SET_CURRENT_ROOM = 'menu/SET_CURRENT_ROOM';
const SET_CURRENT_CHANNEL = 'menu/SET_CURRENT_CHANNEL';
const INIT = 'menu/INIT';
const CHANGE_THEME = 'menu/CHANGE_THEME';
const CHANGE_FONT_SIZE = 'menu/CHANGE_FONT_SIZE';
const CHANGE_MYCHAT_COLOR = 'menu/CHANGE_MYCHAT_COLOR';

export const init = createAction(INIT);
export const bound = createAction(BOUND);
export const setTopButton = createAction(SET_TOPBUTTON);
//export const changeNewMark = createAction(CHANGE_NEW_MARK);
export const setCurrentRoom = createAction(SET_CURRENT_ROOM);
export const setCurrentChannel = createAction(SET_CURRENT_CHANNEL);
export const changeTheme = createAction(CHANGE_THEME);
export const changeFontSize = createAction(CHANGE_FONT_SIZE);
export const changeMychatColor = createAction(CHANGE_MYCHAT_COLOR);

const initialState = {
  menu: '',
  activeType: '',
  topButton: [],
  //newPush: [],
  currentRoomID: -1,
  currentChannelId: -1,
  theme: null
};

const menu = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [BOUND]: (state, action) => {
      return produce(state, draft => {
        draft.menu = action.payload.name;
        draft.activeType = action.payload.type;

        /*if (action.payload.type == 'chatlist') {
          draft.newPush = [];
        }*/
      });
    },
    [SET_CURRENT_ROOM]: (state, action) => {
      return produce(state, draft => {
        draft.currentRoomID = action.payload;
        /*const indexPush = draft.newPush.findIndex(i => i == action.payload);
        if (indexPush > -1) {
          draft.newPush.splice(indexPush, 1);
        }*/
      });
    },
    [SET_CURRENT_CHANNEL]: (state, action) => {
      return produce(state, draft => {
        draft.currentChannelId = action.payload;
        /*const indexPush = draft.newPush.findIndex(i => i == action.payload);
        if (indexPush > -1) {
          draft.newPush.splice(indexPush, 1);
        }*/
      });
    },
    [SET_TOPBUTTON]: (state, action) => ({
      ...state,
      topButton: action.payload,
    }),
    /*[CHANGE_NEW_MARK]: (state, action) => {
      return produce(state, draft => {
        if (
          draft.activeType != 'chatlist' &&
          draft.currentRoomID != action.payload
        ) {
          if (draft.newPush.findIndex(i => i == action.payload) == -1)
            draft.newPush.push(action.payload);
        }
      });
    },*/
    [CHANGE_THEME]: (state, action) => {
      return produce(state, draft => {
        draft.theme = action.payload;
      });
    }
  },
  initialState,
);

export default menu;
