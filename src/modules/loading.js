import { createAction, handleActions } from 'redux-actions';

// Loding 상태 공통 Component
// 특정 Redux Action type에 따라 Loading 여부 관리
// type = action type

const START_LOADING = 'loading/START_LOADING';
const FINISH_LOADING = 'loading/FINISH_LOADING';
const INIT = 'loading/INIT';

export const startLoading = createAction(START_LOADING, reqType => reqType);
export const finishLoading = createAction(FINISH_LOADING, reqType => reqType);
export const init = createAction(INIT);

const initialState = {};

const loading = handleActions(
  {
    [INIT]: (state, action) => ({
      ...initialState,
    }),
    [START_LOADING]: (state, { payload: type }) => ({
      ...state,
      [type]: true,
    }),
    [FINISH_LOADING]: (state, { payload: type }) => ({
      ...state,
      [type]: false,
    }),
  },
  initialState,
);

export default loading;
