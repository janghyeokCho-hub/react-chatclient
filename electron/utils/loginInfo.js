let loginInfo;

class LoginInfo {
  constructor(id, token, userInfo, chineseWall) {
    if (!loginInfo) {
      this.id = id;
      this.token = token;
      this.userInfo = userInfo;
      this.chineseWall = chineseWall;

      loginInfo = this;
    }

    return loginInfo;
  }
}

export const getData = () => {
  return loginInfo;
};

export const setData = (id, token, userInfo, chineseWall = []) => {
  clearData();
  loginInfo = new LoginInfo(id, token, userInfo, chineseWall);
};

export const isNull = () => {
  return loginInfo == undefined;
};

export const clearData = () => {
  if (loginInfo) loginInfo = null;
};
