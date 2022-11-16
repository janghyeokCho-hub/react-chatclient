import { call, put } from 'redux-saga/effects';

import { evalConnector } from '@/lib/deviceConnector';
import { setUserDefinedSettings } from '@/lib/setting';
import { isEmptyValue, isSameValue } from '@/lib/validation';
import { create as openPopup } from '@/modules/popup';
import { getDic } from './util/configUtil';

export const getJobInfo = () => {
  let jobInfo;
  if (DEVICE_TYPE == 'd') {
    const appConfig = evalConnector({
      method: 'getGlobal',
      name: 'APP_SECURITY_SETTING',
    });
    jobInfo = appConfig.get('jobInfo');
  } else {
    jobInfo = localStorage.getItem('covi_user_jobInfo');
  }
  return jobInfo == 'NN' ? '' : jobInfo; //직무없음 ->빈값으로 보내도록(사이드이팩트방지)
};

/**
 * 2022.10.24
 * mismatchTrigger 우선순위
 * ex) fallback 트리거가 reload, restart인 설정값 불일치가 모두 발생한 경우, 최종적으로 restart를 실행함
 *
 * !! 설정값 불일치에 대한 fallback이 앱 라이프사이클과 관계없는 경우에는 priority와 관계없이 별도 로직으로 비교 && fallback 처리를 실행하면 됨 !!
 */
const TRIGGER_PRIORITY = {
  /* trigger list */
  restart: 10,
  /* invalid list */
  0: 0,
  null: -1,
  NaN: -2,
  undefined: -3,
};

/**
 * 2022.10.24
 * [SETTINGS_KEY]: {
 *    mismatchTrigger: 'restart' or null/undefined
 *    storageKey: [LOCALSTORAGE_KEY]
 * }
 * mismatchTrigger => 클라이언트 설정값과 서버측 설정값이 다를경우 실행할 fallback 트리거 명명
 * storageKey => 서버측 설정값 키(SETTINGS_KEY)에 대응하는 클라이언트측 설정값 key
 */
const USER_SETTINGS_MAP = {
  clientLang: {
    mismatchTrigger: 'restart',
    storageKey: {
      localStorage: 'covi_user_lang',
      desktop: 'lang',
    },
    async onUpdate(prev, next) {
      try {
        // @Todo Refresh dic
      } catch (err) {
        console.log('covi_user_lang error: ', err);
      }
    },
  },
  jobInfo: {
    mismatchTrigger: null,
    storageKey: {
      localStorage: 'covi_user_jobInfo',
      desktop: 'jobInfo',
    },
  },
};

function* restartAlert() {
  yield put(
    openPopup({
      type: 'Confirm',
      message: getDic('Msg_RestartSync'),
      callback: (response) => {
        if (!response) {
          return;
        }
        evalConnector({
          method: 'send',
          channel: 'reload-app',
          message: {
            clearConfigs: true,
            isLangChange: true,
          },
        });
      },
    }),
  );
}

export function* triggerUserDefinedSettingsFallback(trigger) {
  if (trigger <= TRIGGER_PRIORITY[0]) {
    return;
  }
  switch (trigger) {
    case TRIGGER_PRIORITY.restart:
      // 설정값 반영을 위해 재시작이 필요한 경우 Confirm 후 재시작 실행
      yield call(restartAlert);
      break;
    default:
      break;
  }
}

export function* syncUserDefinedSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return;
  }

  // client > server로 동기화 할 데이터 목록
  const updateList = {};
  const desktopUpdateList = {};
  let trigger = TRIGGER_PRIORITY[0];

  // eslint-disable-next-line no-unused-vars
  for (const serverSideKey in settings) {
    const settingInfo = USER_SETTINGS_MAP?.[serverSideKey];
    let serverSideValue = settings?.[serverSideKey];
    if (!serverSideValue || settingInfo) {
      continue;
    }
    const { mismatchTrigger, storageKey, onUpdate } = settingInfo;
    const clientSideValue = localStorage.getItem(storageKey.localStorage);
    const [serverSideEmpty, clientSideEmpty] = [
      isEmptyValue(serverSideValue),
      isEmptyValue(clientSideValue),
    ];

    if (serverSideEmpty && !clientSideEmpty) {
      // clientSideValue만 있고serverSideValue가 비어있는 경우,
      // updateList에 추가
      updateList[serverSideKey] = clientSideValue;
    } else if (
      !serverSideEmpty &&
      isSameValue(serverSideValue, clientSideValue) === false
    ) {
      // serverSideValue와 clientSideValue가 서로 다를 경우,
      // serverSideValue 값으로 localStorage 갱신
      try {
        localStorage.setItem(storageKey.localStorage, serverSideValue);
        desktopUpdateList[storageKey.desktop] = serverSideValue;
        yield call(onUpdate, clientSideValue, serverSideValue);
      } catch (err) {
        console.log(`Sync[${storageKey}] error: `, err);
      }
      trigger = Math.max(trigger, TRIGGER_PRIORITY[mismatchTrigger]);
    }
  }

  if (DEVICE_TYPE === 'd' && isEmptyValue(desktopUpdateList === false)) {
    evalConnector({
      method: 'sendSync',
      channel: 'save-static-config',
      message: desktopUpdateList,
    });
  }

  if (isEmptyValue(updateList) === false) {
    // updateList을 서버와 동기화
    yield call(setUserDefinedSettings, updateList);
  }
  yield call(triggerUserDefinedSettingsFallback, trigger);
}
