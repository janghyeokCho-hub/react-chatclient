import { setMyPresence } from '@/modules/login';
import { pubPresence } from '@/lib/presence';
import { evalConnector } from '@/lib/deviceConnector';
import { setFixedUsers } from '@/modules/presence';

export const updateMyPresence = (dispatch, userId, presence, type) => {
  if (DEVICE_TYPE == 'd' && type != 'A') {
    evalConnector({
      method: 'send',
      channel: 'set-before-presence',
      message: presence,
    });
  }
  pubPresence({ userId: userId, state: presence, type: type });
  dispatch(setMyPresence(presence));
};

export const getFixedUserData = param => {
  let users = {};

  param.array.forEach(item => {
    if (item[param.key])
      users = item[param.key].reduce((acc, current) => {
        acc[current.id] = current.presence;
        return acc;
      }, users);
  });

  return users;
};
