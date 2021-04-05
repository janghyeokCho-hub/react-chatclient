let ConfigObject = null;

export const setConfig = domain => {
  ConfigObject = {
    ServerURL: {
      HOST: domain,
      CHAT: `${domain}/server`,
      MANAGE: `${domain}/restful`,
      EVENT: domain,
    },
  };

  const regexProtocol = /http(s)?:\/\//i;
  const regexExChar = /[\\\\\/:*?"<>|]/i;
  let replaceDomain = domain.replace(regexProtocol, '');
  replaceDomain = replaceDomain.replace(regexExChar, '_');
  global.DOMAIN = replaceDomain;
};

const Config = () => {
  return ConfigObject;
};

export default Config;
