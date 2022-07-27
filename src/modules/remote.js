import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';

const CHANGE_REMOTE_STATUS = 'remote/status/CHANGE';

export const changeRemoteStatus = createAction(CHANGE_REMOTE_STATUS);

const initialState = {
  onRemote: false,
};

const remote = handleActions(
  {
    [CHANGE_REMOTE_STATUS]: (state, action) => {
      return produce(state, draft => {
        draft.onRemote = action.payload;
      });
    },
  },
  initialState,
);

export default remote;
