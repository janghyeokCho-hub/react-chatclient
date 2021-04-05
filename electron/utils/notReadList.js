class NotReadList {
  constructor() {
    if (!notReadList) {
      this.notReadList = [];
      notReadList = this.notReadList;
    }

    return notReadList;
  }
}

let notReadList = null;

export const getData = () => {
  notReadList = new NotReadList();
  return notReadList;
};

export const setData = notReadArrs => {
  clearData();
  notReadList = new NotReadList();
  notReadList = notReadArrs;
};

export const clearData = () => {
  if (notReadList) notReadList = null;
};
