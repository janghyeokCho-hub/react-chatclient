import { app } from 'electron';
import os from 'os';
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const exportProps = {
  platform: process.platform,
  arch: process.arch,
  osversion: os.release(),
  version: APP_VERSION,
  isDev: process.argv[2] == 'dev',
  isAppDataCipher: process.argv[2] != 'dev',
  appDataCipherKey: 'cov1$ecr2t',
  isRelaunch: process.argv[3] == 'relaunch',
  isAutoLogin: process.argv[4] == 'login',
  isWin: process.platform === 'win32',
  trayName: 'tray.png',
  trayHotName: 'tray_hot.png',
  resourcePath: process.argv[2] == 'dev' ? __dirname : process.resourcesPath,
  appName: process.argv[2] == 'dev' ? 'eumtalk' : app.getName(),
  appId: APP_ID,
};

export default exportProps;
