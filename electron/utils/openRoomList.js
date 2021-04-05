class RoomList {
  constructor() {
    if (!openRoomList) {
      this.openRoomList = [];
      openRoomList = this.openRoomList;
    }

    return openRoomList;
  }
}

let openRoomList = null;

export const getData = () => {
  openRoomList = new RoomList();
  return openRoomList;
};

export const pushRoom = roomId => {
  openRoomList = new RoomList();
  openRoomList.push(roomId);
};

export const isNoRoomID = roomId => {
  openRoomList = new RoomList();
  return openRoomList.find(item => item == roomId) == undefined;
};

export const clearData = () => {
  if (openRoomList) openRoomList = null;
};
