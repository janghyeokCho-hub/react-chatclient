import { leaveChannel, leaveChannelByAdmin } from '@/modules/channel';
import { openPopup } from '@/lib/common';

export const leaveChannelUtil = (
  dispatch,
  roomId,
  userId,
  callbackFun,
  isNewWin,
) => {
  openPopup(
    {
      type: 'Confirm',
      message: covi.getDic('Msg_ChannelLeave'),
      callback: result => {
        if (result) {
          if (!isNewWin) {
            leaveChannelUtilAfter(dispatch, roomId, userId);
          }
          if (callbackFun) callbackFun();
        }
      },
    },
    dispatch,
  );
};

export const leaveChannelUtilAfter = (dispatch, roomId, userId) => {
  dispatch(
    leaveChannel({
      roomId,
      userId,
      roomType: 'C',
    }),
  );
};

// 채널 내보내기
export const leaveChannelByAdminUtil = (
  dispatch,
  roomId,
  userId,
  callbackFun,
  isNewWin,
) => {
  openPopup(
    {
      type: 'Confirm',
      message: covi.getDic('Msg_DeportUser'),
      callback: result => {
        if (result) {
          if (!isNewWin) {
            leaveChannelByAdminUtilAfter(dispatch, roomId, userId);
          }
          if (callbackFun) callbackFun();
        }
      },
    },
    dispatch,
  );
};

/*
export const leaveChannelByAdminUtilAfter = (dispatch, roomId, userId) => {
  leaveChannelApi({
    roomId,
    userId,
    roomType: 'C',
    leave: 'Y',
  })
    .then(({ data }) => {
      if (data.status != 'SUCCESS') {
        openPopup(
          {
            type: 'Alert',
            message: '사용자 내보내기에 실패하였습니다.',
          },
          dispatch,
        );
        console.dir(data);
      }
    })
    .catch(err => {
      console.dir(err);
    });
};
 */
export const leaveChannelByAdminUtilAfter = (dispatch, roomId, userId) => {
  dispatch(
    leaveChannel({
      roomId,
      userId,
      roomType: 'C',
      leave: 'Y',
    }),
  );
};
