let loginInfo;

class LoginInfo {
  constructor(id, token, userInfo) {
    if (!loginInfo) {
      this.id = id;
      this.token = token;
      this.userInfo = userInfo;

      loginInfo = this;
    }

    return loginInfo;
  }
}

export const getData = () => {
  return loginInfo;
};

export const setData = (id, token, userInfo) => {
  clearData();
  loginInfo = new LoginInfo(id, token, userInfo);
};

export const isNull = () => {
  return loginInfo == undefined;
};

export const clearData = () => {
  if (loginInfo) loginInfo = null;
};
