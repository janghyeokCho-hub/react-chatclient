import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import exportProps from '../config/exportProps';
import logger from './logger';
import { managesvr } from './api';
import * as window from './window';

let updater = null;

class Updater {
  win = null;
  updateInfo = null;
  downloadModal = null;
  constructor(win) {
    autoUpdater.autoDownload = false; // autoDownload 여부
    autoUpdater.allowDowngrade = false; // 하위 버전 업데이트 여부 (서버 데이터가 하위더라도 자동 업데이트 방지)

    this.win = win;
    this.registListener();
  }

  check = async () => {
    const response = await managesvr(
      'get',
      `/na/nf/updates/latest?v=${exportProps.version}&p=${exportProps.platform}&a=${exportProps.arch}`,
    );

    //
    if (response.data.status == 'SUCCESS') {
      // server에 update check 성공 시 electron-updater 호출하여 latest.yml 파일 대조
      this.updateInfo = response.data;
      autoUpdater.setFeedURL({
        url: response.data.url,
        provider: 'generic',
      });

      autoUpdater.currentVersion = exportProps.version; // 현재버전
      autoUpdater.checkForUpdates();
    }

    // autoUpdater.checkForUpdatesAndNotify();
    // autoUpdater.checkForUpdates();
  };

  registListener = () => {
    autoUpdater.on('update-available', (info) => {
      logger.info(`[${exportProps.version}] A new update is available: ` + JSON.stringify(info));
      const message =
        this.updateInfo.forceUpdate == 'Y'
          ? SERVER_SECURITY_SETTING.getDic('Msg_UpdateForceConfirm')
          : SERVER_SECURITY_SETTING.getDic('Msg_UpdateConfirm');

      window.showModalDialog(this.win, {
        type: 'confirm',
        width: 300,
        height: this.updateInfo.forceUpdate == 'Y' ? 140 : 120,
        message,
        confirm: () => {
          this.download();
        },
        cancel: () => {
          if (this.updateInfo.forceUpdate == 'Y') {
            this.win.close();
            app.quit();
            app.exit();
          }
        },
      });
    });

    autoUpdater.on('update-not-available', () => {
      // update 불필요 ( server에서는 update 정보를 제공했으나 latest.yml 파일 대조에 실패한 경우 )
      logger.info('update-not-available :: checked update server');
    });

    autoUpdater.on('error', error => {
      logger.info(error);
    });

    autoUpdater.on('download-progress', progress => {
      // progress info 전송
      this.downloadModal.webContents.send(
        'modal-progress-change',
        Math.round(progress.percent * 10) / 10,
      );

      this.win.setProgressBar(Math.round(progress.percent / 10) / 10);
    });

    autoUpdater.on('update-downloaded', event => {
      logger.info('update-downloaded');

      this.downloadModal.webContents.send('modal-progress-change', '100');

      this.downloadModal.webContents.send(
        'modal-change-message',
        SERVER_SECURITY_SETTING.getDic(
          'Msg_ReInstallApp',
          '잠시후 앱이 재설치 됩니다.',
        ),
      );

      if (this.updateInfo.deleteLocalData == 'Y') {
        // local database 초기화 여부 적용
        APP_SECURITY_SETTING.set('clearLocalData', true);
      }

      setTimeout(() => {
        if (process.platform == 'darwin') {
          app.removeAllListeners('window-all-closed');
          const browserWindows = BrowserWindow.getAllWindows();
          browserWindows.forEach(browserWindow => {
            browserWindow.removeAllListeners('close');
          });
          app.once('before-quit', () => {
            logger.info('before quit');
            app.quit();
            app.exit();
          });
        }

        autoUpdater.quitAndInstall(false, false);
      }, 3000);
    });
  };

  download = () => {
    // 앱 update 다운로드 수행
    this.downloadModal = window.showModalProgress(this.win, {
      message: SERVER_SECURITY_SETTING.getDic('Msg_DownloadInstaller'),
    });

    this.downloadModal.once('show', () => {
      autoUpdater.downloadUpdate();
    });
  };
}

export const getUpdater = win => {
  if (updater == null) {
    updater = new Updater(win);
  }

  return updater;
};

export default getUpdater;
