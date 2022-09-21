import { app, dialog } from 'electron';
import path from 'path';

import exportProps from '../../config/exportProps';
import logger from '../logger';
import * as loginInfo from '../loginInfo';
import * as localDic from './_dic.local';
import { openChannel, openChatroom, registDomain } from './command';

/**
 * Custom protocol examples are shown at tests/protocol/testProtocolURL.html
 *
 */

export function parseCommandFromURL(url) {
  if (typeof url !== 'string') {
    return null;
  }
  const parsed = new URL(url);
  return {
    command: parsed.host,
    path: parsed.pathname,
    param: parsed.searchParams,
  };
}

/* 현재 앱에 사용자가 로그인되어 있는지 검사 & 미로그인시 경고창 */
function requireAuth(loginId, { alert = false }) {
  const isLoggedIn = Boolean(loginId);
  if (isLoggedIn === false && alert) {
    dialog.showMessageBox({
      type: 'info',
      message: localDic.LOGIN_REQUIRED,
    });
  }
  return isLoggedIn;
}

function requireDomainUnset({ alert = false }) {
  const domainInfo = APP_SECURITY_SETTING.get('domain');
  const isDomainSet = Boolean(domainInfo);
  if (isDomainSet === true && alert) {
    dialog.showMessageBox({
      type: 'info',
      message: localDic.DOMAIN_SET_ALREADY + '\n' + domainInfo,
    });
  }
  return !isDomainSet;
}

export async function handleOpenURL(url) {
  logger.info('[Protocol] open-url ' + url);
  const command = parseCommandFromURL(url);
  const loginId = loginInfo.getData()?.id;

  if (command.command === 'open') {
    if (command.path === '/chat' && requireAuth(loginId, { alert: true })) {
      /**
       * Command: open chatroom by target user id
       * protocol://open/chat?targetid={roomId}
       */
      await openChatroom(loginId, command.param.get('targetId'));
    } else if (
      /**
       * Command: open channel by channel id
       * protocol://open/channel?roomId={roomId}
       */
      command.path === '/channel' &&
      requireAuth(loginId, { alert: true })
    ) {
      await openChannel(command.param.get('roomId'));
    }
  } else if (
    command.command === 'domainRegist' &&
    requireDomainUnset({ alert: true })
  ) {
    /**
     * Command: register domain
     * protocol://registDomain?domain={domain}
     */
    const domain = decodeURIComponent(command.param.get('domain'));
    await registDomain(domain);
  }
}

export const protocolName = exportProps.isDev ? 'eumtalkdev' : 'eumtalk';

export function registerEumtalkProtocol() {
  let registerResult;
  if (process.defaultApp) {
    const argPath = path.resolve(process.argv[1]);
    if (process.argv.length >= 2) {
      app.removeAsDefaultProtocolClient(protocolName, process.execPath, [
        argPath,
      ]);
      registerResult = app.setAsDefaultProtocolClient(
        protocolName,
        process.execPath,
        [argPath],
      );
    }
  } else {
    app.removeAsDefaultProtocolClient(protocolName);
    registerResult = app.setAsDefaultProtocolClient(protocolName);
  }
  logger.info(
    `[Protocol] Register Application Protocol "${protocolName}" : ${
      registerResult ? 'Success' : 'Fail'
    }`,
  );
}
