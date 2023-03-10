import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
  addTargetUser,
  delTargetUser,
  setUsersPresence,
} from '@/modules/presence';
import { getDictionary } from '@/lib/common';
import { getConfig } from '@/lib/util/configUtil';
const presenceText = code => {
  const findPr = getConfig('Presence', []).find(item => item.code == code);

  if (findPr) {
    return getDictionary(findPr.name);
  } else {
    return getDictionary(
      '오프라인;offline;offline;offline;offline;offline;offline;offline;offline;',
    );
  }
};

const getPresenceStyle = code => {
  const presence = getConfig('Presence', []).find(item => item.code == code);
  if (presence) {
    let style = {};
    if (typeof presence.mobileStyle == 'string') {
      style = JSON.parse(presence.mobileStyle);
    } else {
      style = presence.mobileStyle;
    }
    if (style?.borderColor) {
      style['border'] = `1px solid ${style.borderColor}`;
    }
    return style;
  } else {
    return { backgroundColor: '#cacaca' };
  }
};

const PresenceButton = ({ userId, state, isInherit }) => {
  const presence = useSelector(
    ({ presence }) =>
      presence.fixedUsers[userId]
        ? presence.fixedUsers[userId]
        : presence.users[userId],
    shallowEqual,
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (isInherit != true || presence == undefined) {
      dispatch(
        addTargetUser({
          userId: userId,
          state: presence ? presence : state,
        }),
      );

      return () => {
        dispatch(delTargetUser(userId));
      };
    }
  }, []);

  useEffect(() => {
    if (isInherit != true && presence && state && presence != state) {
      dispatch(setUsersPresence({ userId, state }));
    }
  }, [state]);

  const drawPresence = useMemo(() => {
    if ((isInherit == true && presence) || (state != null && state != '')) {
      const value = presence ? presence : state;
      const presenceStyle = getPresenceStyle(value);

      return (
        <div
          title={presenceText(value)}
          style={presenceStyle}
          className="status"
        ></div>
      );
    }

    return <></>;
  }, [presence, state, isInherit]);

  return drawPresence;
};

export default React.memo(PresenceButton);
