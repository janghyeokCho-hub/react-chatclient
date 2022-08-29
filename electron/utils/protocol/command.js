import axios from 'axios';
import validator from 'validator';
import { app, BrowserWindow, dialog } from 'electron';
import LRU from 'lru-cache';

import { getRoomInfoByTargetUserId, getUserFromId } from '../../event/appData';
import logger from '../logger';
import * as fileUtil from '../fileUtils';
import { setConfig } from '../../config/config';
import * as localDic from './_dic.local';
import { managesvr } from '../api';
import { reqMakeRoom } from '../../event/common';

const profileCache = new LRU({
  max: 20,
  ttl: 1000 * 60 * 3, // cache data every 3min
});

async function getUserProfile(userId) {
  const cached = profileCache.get(userId);
  if (cached) {
    // step 1: Cache hit
    logger.info('getUserProfile(from cache): ' + userId);
    return cached;
  }
  // step 2: Select profile data from DB
  let profileData = await getUserFromId(userId);
  if (!profileData) {
    // step 3: Fetch profile data from server
    const response = await managesvr('GET', `/profile/${userId}`);
    if (response.data?.status === 'SUCCESS') {
      logger.info('getUserProfile(from server): ' + userId);
      profileData = response.data?.result;
    }
  } else {
    logger.info('getUserProfile(from local DB): ' + userId);
  }
  if (profileData) {
    profileCache.set(userId, profileData);
    return profileData;
  }
}

const dialogUserNotFound = userId => {
  dialog.showMessageBox({
    type: 'info',
    message: localDic.USER_NOTFOUND + '\n' + userId,
  });
};

export const openChatroom = async (loginId, targetId) => {
  const targetRoom = await getRoomInfoByTargetUserId({ userId: targetId });
  const roomID = targetRoom?.roomId;

  if (roomID) {
    /* Open chatroom */
    logger.info(`[Protocol] Open Chatroom "${roomID}"`);
    BrowserWindow.fromId(1)?.webContents.send('onAlarmClick', {
      isChannel: false,
      roomID: roomID,
    });
  } else {
    /* Open makeroom */
    logger.info(`[Protocol] Open Makeroom with user "${targetId}"`);
    const myInfo = await getUserProfile(loginId);
    if (!myInfo) {
      // Handle not found (current user)
      dialogUserNotFound(loginId);
      return;
    }
    const targetInfo = await getUserProfile(targetId);
    if (!targetInfo) {
      // Handle not found (target user)
      dialogUserNotFound(targetId);
      return;
    }
    // Open makeroom window via existing IPC handler
    reqMakeRoom(null, {
      path: '#/client/nw/makeroom',
      makeData: {
        newRoom: true,
        makeInfo: {
          roomName: '',
          roomType: 'M',
          memberType: 'U',
          members: [myInfo, targetInfo],
        },
        winName: `wmr_U_${targetInfo.id}`,
      },
    });
  }
};

export async function openChannel(roomID) {
  if (!roomID) {
    return;
  }
  logger.info(`[Protocol] Open Channel "${roomID}"`);
  BrowserWindow.fromId(1)?.webContents.send('onAlarmClick', {
    isChannel: true,
    roomID,
  });
}

async function validateDomain(url = '', { alert = false }) {
  let isValidUrl = url && validator.isURL(url);
  try {
    if (isValidUrl) {
      const response = await axios.get(`${url}/restful/na/test`, {
        timeout: 15000,
      });
      isValidUrl = response.statusText === 'OK' || response.status === 200;
    }
  } catch (err) {
    isValidUrl = false;
  }
  if (!isValidUrl && alert) {
    dialog.showMessageBox({
      type: 'info',
      message: localDic.INVALID_DOMAIN + '\n' + url,
    });
  }
  return isValidUrl;
}

export async function registDomain(inputDomain = '') {
  const isValidDomain = await validateDomain(inputDomain, { alert: true });
  if (isValidDomain) {
    const answer = await dialog.showMessageBox({
      type: 'info',
      message: localDic.CONFIRM_DOMAIN + '\n' + inputDomain,
      buttons: ['Cancel', 'OK'],
      cancelId: 0,
      defaultId: 1,
    });
    // Set domain && restart app on OK
    if (answer.response === 1) {
      APP_SECURITY_SETTING.set('domain', inputDomain);
      fileUtil.makeIndexFile(inputDomain, () => {
        setConfig(inputDomain);
        app.relaunch();
        app.exit();
      });
    }
  }
}
