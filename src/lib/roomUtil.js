import {
  openRoom,
  newWinRoom,
  setInitCurrentRoom,
  leaveRoom,
} from '@/modules/room';
import { openPopup } from '@/lib/common';
import { mappingUserChatRoom } from '@/modules/contact';
import { newChatRoom, makeChatRoom } from '@/lib/deviceConnector';
import { getAllUserWithGroup } from '@/lib/room';

export const openChatRoomView = (
  dispatch,
  viewType,
  rooms,
  selectId,
  userInfo,
  myInfo,
  isDoubleClick,
) => {
  let members = [
    {
      id: myInfo.id,
      name: myInfo.name,
      dept: myInfo.dept,
      presence: myInfo.presence,
      PN: myInfo.PN,
      LN: myInfo.LN,
      TN: myInfo.TN,
      photoPath: myInfo.photoPath,
    },
  ];
  if (userInfo.type == 'U' && myInfo.id == userInfo.id) {
    // 20200720 - 자기자신과 대화 추가
    // userInfo.type == U && userInfo.id == myInfo.id 자기 자신과 대화
    openMemoViewCallback(
      dispatch,
      myInfo.id,
      viewType,
      rooms,
      selectId,
      members,
      isDoubleClick,
    );
  } else if (userInfo.type == 'G' || userInfo.type == 'M') {
    getAllUserWithGroup(userInfo.id).then(({ data }) => {
      members = members.concat(data.result);

      if (members.length == 0) {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_EmptyChatMember'),
          },
          dispatch,
        );
      } else {
        openChatRoomViewCallback(
          dispatch,
          myInfo.id,
          viewType,
          rooms,
          selectId,
          userInfo.id,
          userInfo.type,
          members,
          isDoubleClick,
        );
      }
    });
  } else if (userInfo.type == 'F' || userInfo.type == 'C') {
    members = members.concat(userInfo.sub);

    openChatRoomViewCallback(
      dispatch,
      myInfo.id,
      viewType,
      rooms,
      selectId,
      userInfo.id,
      userInfo.type,
      members,
      isDoubleClick,
    );
  } else {
    members.push({
      id: userInfo.id,
      name: userInfo.name,
      presence: userInfo.presence,
      PN: userInfo.PN,
      LN: userInfo.LN,
      TN: userInfo.TN,
      photoPath: userInfo.photoPath,
    });

    openChatRoomViewCallback(
      dispatch,
      myInfo.id,
      viewType,
      rooms,
      selectId,
      userInfo.id,
      userInfo.type,
      members,
      isDoubleClick,
    );
  }
};

const openChatRoomViewCallback = (
  dispatch,
  userId,
  viewType,
  rooms,
  selectId,
  targetId,
  targetType,
  members,
  isDoubleClick,
) => {
  console.log("openChatRoomViewCallback")
  let roomId;
  if (userId != targetId) {
    const room = rooms.find(
      item =>
        item.roomType == 'M' &&
        (item.ownerCode == targetId || item.targetCode == targetId),
    );
    if (room) roomId = room.roomID;
  }

  const makeInfoObj = {
    roomName: '',
    roomType: targetType === 'U' ? 'M' : 'G',
    members: members,
    memberType: targetType,
  };

  if (
    viewType == 'S' &&
    SCREEN_OPTION != 'G' &&
    (isDoubleClick || isDoubleClick == undefined)
  ) {
    // Room이 있는 사용자는 기존 대화방 Open
    const roomID = parseInt(roomId);
    if (targetType === 'U' && roomID) {
      dispatch(
        openRoom({
          roomID: roomID,
        }),
      );

      let selectedRoom = null;
      rooms.forEach(item => {
        if (item.roomID == roomID) {
          selectedRoom = item;
          return false;
        }
      });

      // 해당 방이 존재하지 않거나 (아직 로드되지 않음), 새창으로 열려있지 않은경우만 새창으로 오픈

      if (selectedRoom && selectedRoom.newWin) {
        if (DEVICE_TYPE == 'd') {
          if (selectedRoom.winObj) {
            try {
              if (selectedRoom.winObj) {
                if (selectedRoom.winObj.isMinimized()) {
                  selectedRoom.winObj.restore();
                }

                selectedRoom.winObj.focus();
              }
            } catch (e) {
              // console.log('No Such Window');
              // no windows - window 재 맵핑
              const winName = `wrf${room.roomID}`;
              const openURL = `${
                DEVICE_TYPE == 'd' ? '#' : ''
              }/client/nw/chatroom/${room.roomID}`;
              const roomObj = newChatRoom(winName, roomID, openURL);
              dispatch(newWinRoom({ id: roomID, obj: roomObj, name: winName }));
            }
          }
        }
      } else if (!selectedRoom || !selectedRoom.newWin) {
        const winName = `wrf${roomID}`;
        const openURL = `${
          DEVICE_TYPE == 'd' ? '#' : ''
        }/client/nw/chatroom/${roomID}`;
        const roomObj = newChatRoom(winName, roomID, openURL);

        dispatch(newWinRoom({ id: roomID, obj: roomObj, name: winName }));
      }
    } else {
      if (targetId != userId) {
        const makeData = {
          newRoom: true,
          makeInfo: makeInfoObj,
        };

        // 팝업을 만들고 자식창에 makeInfo 전달

        const winName = `wmr_${targetType}_${targetId}`;

        const openURL = `${DEVICE_TYPE == 'd' ? '#' : ''}/client/nw/makeroom`;

        makeChatRoom(winName, makeData, openURL);
      }
    }
  } else if (
    (viewType == 'M' || SCREEN_OPTION == 'G') &&
    (!isDoubleClick || isDoubleClick == undefined)
  ) {
    let openRoomParam;
    if (targetType === 'U' && roomId) {
      if (selectId != roomId) {
        openRoomParam = {
          roomID: roomId,
        };
      }
    } else {
      if (targetId != userId) {
        openRoomParam = {
          newRoom: true,
          makeInfo: makeInfoObj,
        };
      } else {
        dispatch(setInitCurrentRoom());
      }
    }

    if (openRoomParam) dispatch(openRoom(openRoomParam));
  }
};

export const leaveRoomUtil = (
  dispatch,
  room,
  userId,
  callbackFun,
  isNewWin,
) => {
  openPopup(
    {
      type: 'Confirm',
      message: covi.getDic('Msg_ConfirmLeave'),
      callback: result => {
        if (result) {
          if (!isNewWin) {
            leaveRoomUtilAfter(dispatch, room, userId);
          }
          if (callbackFun) callbackFun();
        }
      },
    },
    dispatch,
  );
};

export const leaveRoomUtilAfter = (dispatch, room, userId) => {
  dispatch(
    leaveRoom({
      roomID: room.roomID,
      userID: userId,
      roomType: room.roomType,
    }),
  );

  // target과의 연락처 맵핑 해제
  if (room.roomType == 'M') {
    const filterMember = room.members.filter(item => {
      if (item.id === userId) return false;
      return true;
    });
    const target = filterMember[0];

    dispatch(
      mappingUserChatRoom({
        id: target.id,
        roomID: null,
      }),
    );
  }
};

export const openMemoViewCallback = (
  dispatch,
  userId,
  viewType,
  rooms,
  selectId,
  members,
  isDoubleClick,
) => {
  let roomId;
  const room = rooms.find(
    item => item.roomType == 'O' && item.ownerCode == userId,
  );

  if (room) roomId = room.roomID;

  const makeInfoObj = {
    roomName: '',
    roomType: 'O',
    members: members,
    memberType: 'U',
  };

  if (
    viewType == 'S' &&
    SCREEN_OPTION != 'G' &&
    (isDoubleClick || isDoubleClick == undefined)
  ) {
    // Room이 있는 사용자는 기존 대화방 Open
    const roomID = parseInt(roomId);
    if (roomID) {
      dispatch(
        openRoom({
          roomID: roomID,
        }),
      );

      let selectedRoom = null;
      rooms.forEach(item => {
        if (item.roomID == roomID) {
          selectedRoom = item;
          return false;
        }
      });

      // 해당 방이 존재하지 않거나 (아직 로드되지 않음), 새창으로 열려있지 않은경우만 새창으로 오픈

      if (selectedRoom && selectedRoom.newWin) {
        if (DEVICE_TYPE == 'd') {
          if (selectedRoom.winObj) {
            try {
              if (selectedRoom.winObj) {
                if (selectedRoom.winObj.isMinimized()) {
                  selectedRoom.winObj.restore();
                }

                selectedRoom.winObj.focus();
              }
            } catch (e) {
              // console.log('No Such Window');
              // no windows - window 재 맵핑
              const winName = `wrf${room.roomID}`;
              const openURL = `${
                DEVICE_TYPE == 'd' ? '#' : ''
              }/client/nw/chatroom/${room.roomID}`;
              const roomObj = newChatRoom(winName, roomID, openURL);
              dispatch(newWinRoom({ id: roomID, obj: roomObj, name: winName }));
            }
          }
        }
      } else if (!selectedRoom || !selectedRoom.newWin) {
        const winName = `wrf${roomID}`;
        const openURL = `${
          DEVICE_TYPE == 'd' ? '#' : ''
        }/client/nw/chatroom/${roomID}`;
        const roomObj = newChatRoom(winName, roomID, openURL);

        dispatch(newWinRoom({ id: roomID, obj: roomObj, name: winName }));
      }
    } else {
      const makeData = {
        newRoom: true,
        makeInfo: makeInfoObj,
      };

      // 팝업을 만들고 자식창에 makeInfo 전달
      const winName = `wmr_U_${userId}`;

      const openURL = `${DEVICE_TYPE == 'd' ? '#' : ''}/client/nw/makeroom`;

      makeChatRoom(winName, makeData, openURL);
    }
  } else if (
    (viewType == 'M' || SCREEN_OPTION == 'G') &&
    (!isDoubleClick || isDoubleClick == undefined)
  ) {
    let openRoomParam;
    if (roomId) {
      if (selectId != roomId) {
        openRoomParam = {
          roomID: roomId,
        };
      }
    } else {
      openRoomParam = {
        newRoom: true,
        makeInfo: makeInfoObj,
      };
    }

    if (openRoomParam) dispatch(openRoom(openRoomParam));
  }
};
