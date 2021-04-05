import { managesvr } from '@/lib/api';
import { evalConnector } from '@/lib/deviceConnector';
export const setInitConfig = callback => {
  // 전역함수 등록
  window.covi.getDic = (key, defaultValue) => {
    const searchConfig = search(covi.dic, key);
    if (searchConfig != undefined) return searchConfig;
    else if (defaultValue) return defaultValue;
    else return key;
  };

  window.covi.getConfig = (key, defaultValue) => {
    const searchConfig = search(covi.config, key);
    if (searchConfig != undefined) return searchConfig;
    else return defaultValue;
  };

  // 1day
  if (DEVICE_TYPE == 'b') {
    managesvr(
      'get',
      `/na/nf/config?lang=${localStorage.getItem('covi_user_lang')}`,
      {},
      {
        'Cache-Control': 'public, max-age=86400',
      },
      false
    )
      .then(({ data }) => {
        if (data.status == 'SUCCESS') {
          callback(data.result);
        } else {
          callback({});
        }
      })
      .catch(e => {
        console.log('error');
        console.log(e);
        console.dir(e);
        callback({});
      });
  } else {
    const globalConfigs = evalConnector({
      method: 'getGlobal',
      name: 'SERVER_SETTING',
    });

    if (globalConfigs.has('config')) {
      callback(globalConfigs.config);
    } else {
      const serverConfigs = evalConnector({
        method: 'sendSync',
        channel: 'get-server-configs',
        message: {},
      });

      callback(serverConfigs.config);
    }
  }
};

export const getInitSettings = () => {
  // lang 값이 없는경우
  let lang =
    window.covi.config && window.covi.config.DefaultClientLang
      ? window.covi.config.DefaultClientLang
      : 'ko'; // ko - default

  // theme 값이 없는경우
  let theme =
    window.covi.config && window.covi.config.DefaultTheme
      ? window.covi.config.DefaultTheme
      : 'blue'; // blue - default

  // jobInfo 값이 없는경우
  let jobInfo =
    window.covi.config && window.covi.config.DefaultClientJobInfo
      ? window.covi.config.DefaultClientJobInfo
      : 'PN'; // PN - default

  let fontSize =
    window.covi.config && window.covi.config.DefaultFontSize
      ? window.covi.config.DefaultFontSize
      : 'm';

  let setLang = null;
  let setTheme = null;
  let setJobInfo = null;
  let setFontSize = null;

  if (DEVICE_TYPE == 'b') {
    setLang = localStorage.getItem('covi_user_lang');
    setTheme = localStorage.getItem('covi_user_theme');
    setJobInfo = localStorage.getItem('covi_user_jobInfo');
    setFontSize = localStorage.getItem('covi_user_fontSize');
  } else {
    const appConfig = evalConnector({
      method: 'getGlobal',
      name: 'APP_SETTING',
    });

    setLang = appConfig.get('lang');
    setTheme = appConfig.get('theme');
    setJobInfo = appConfig.get('jobInfo');
    setFontSize = appConfig.get('fontSize');
  }

  const resultSetting = {
    lang: setLang ? setLang : lang,
    theme: setTheme ? setTheme : theme,
    jobInfo: setJobInfo ? setJobInfo : jobInfo,
    fontSize: setFontSize ? setFontSize : fontSize,
  };

  if (DEVICE_TYPE == 'b') {
    //result 로 덮어씀
    localStorage.setItem('covi_user_lang', resultSetting.lang);
    localStorage.setItem('covi_user_theme', resultSetting.theme);
    localStorage.setItem('covi_user_jobInfo', resultSetting.jobInfo);
    localStorage.setItem('covi_user_fontSize', resultSetting.fontSize);
  }

  return resultSetting;
};

export const getConfig = (key, defaultValue) => {
  const searchConfig = search(covi.config, key);
  if (searchConfig != undefined) return searchConfig;
  else return defaultValue;
};

export const getDic = (key, defaultValue) => {
  const searchConfig = search(covi.dic, key);
  if (searchConfig != undefined) return searchConfig;
  else if (defaultValue) return defaultValue;
  else return key;
};

const search = (object, key) => {
  let path = key.split('.');
  try {
    for (let i = 0; i < path.length; i++) {
      if (object[path[i]] === undefined) {
        return undefined;
      }
      object = object[path[i]];
    }
    return object;
  } catch (e) {}

  return undefined;
};
