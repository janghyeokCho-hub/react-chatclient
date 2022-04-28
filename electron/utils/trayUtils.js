import { Tray, BrowserWindow, Menu, app } from 'electron';
import logger from './logger';
import path from 'path';
import exportProps from '../config/exportProps';
import {
  showVersionInfo,
  clearCache,
  initApp,
  lockApp,
  showConnectInfo,
  getDictionary,
} from './commonUtils';
import { chatsvr } from './api';
import { getData } from './loginInfo';

let trayInstance = null;

export const getTray = parentWin => {
  if (trayInstance != null) return trayInstance;
  else if (trayInstance == null && parentWin != null) {
    // new Tray(path.join(__static, "favicon08.ico")); 아이콘 입력 필요
    logger.info('make tray instance');
    trayInstance = new Tray(
      path.join(exportProps.resourcePath, 'icons', exportProps.trayName),
    );

    //메인 BrowserWindow에서 닫기를 누를시 히든처리가 선행되어야함.
    parentWin.on('close', event => {
      event.preventDefault();
      parentWin.hide();
    });

    trayInstance.on('click', () => {
      parentWin.show();
    });

    setContextMenu(parentWin);
    trayInstance.setToolTip(exportProps.appName);
  }

  return trayInstance;
};

export const setContextMenu = parentWin => {
  const useLockApp = SERVER_SECURITY_SETTING?.config?.config?.UseLockApp || false;
  // tray 생성
  const contextMenu = Menu.buildFromTemplate([
    {
      label: getDictionary('열기;Open;Open;Open;Open;Open;Open;Open;Open;'), // MacOS 활성화 처리용
      click: () => {
        if (parentWin) {
          if (parentWin.isMinimized()) {
            parentWin.restore();
          } else if (!parentWin.isVisible()) {
            parentWin.show();
          }
          parentWin.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: getDictionary(
        '앱 관리;Manage;Manage;Manage;Manage;Manage;Manage;Manage;Manage;',
      ),
      submenu: [
        {
          label: `eumtalk v${exportProps.version}`,
          click: showVersionInfo,
        },
        {
          label: getDictionary(
            '임시 데이터 삭제;Delete Temp Data;Delete Temp Data;Delete Temp Data;Delete Temp Data;Delete Temp Data;Delete Temp Data;Delete Temp Data;Delete Temp Data;',
          ),
          click: clearCache,
        },
        {
          label: getDictionary(
            '앱 초기화;Init App;Init App;Init App;Init App;Init App;Init App;Init App;Init App;',
          ),
          click: initApp,
        },
        ...(useLockApp
          ? [
              {
                label: getDictionary(
                  '앱 잠금;Lock App;Lock App;Lock App;Lock App;Lock App;Lock App;Lock App;Lock App;',
                ),
                click: lockApp,
              },
            ]
          : []),
        {
          label: getDictionary(
            '상태확인;Check Status;Check Status;Check Status;Check Status;Check Status;Check Status;Check Status;Check Status',
          ),
          click: showConnectInfo,
        },
      ],
    },
    { type: 'separator' },
    {
      label: getDictionary('종료;Exit;Exit;Exit;Exit;Exit;Exit;Exit;Exit'),
      click: async () => {
        try {
          const data = getData();
          if (data && data.id) {
            const response = await chatsvr('put', '/presence', {
              userId: data.id,
              state: 'offline',
              type: 'A',
            });
            logger.info(
              '[4] Exit program. update presence offline ',
              response.data,
            );
            console.log(response.data);
          }
        } catch (err) {
          logger.info('Error when updating presnce offline', err);
          console.log(err);
        }
        parentWin.close();
        app.quit();
        app.exit();
      },
    },
  ]);

  trayInstance.setContextMenu(contextMenu);
};

export const setHot = isHot => {
  if (trayInstance != null) {
    if (isHot) {
      trayInstance.setImage(
        path.join(exportProps.resourcePath, 'icons', exportProps.trayHotName),
      );
      BrowserWindow.fromId(1).setOverlayIcon(
        path.join(exportProps.resourcePath, 'icons', 'overlay.png'),
        'new messages',
      );
    } else {
      trayInstance.setImage(
        path.join(exportProps.resourcePath, 'icons', exportProps.trayName),
      );
      BrowserWindow.fromId(1).setOverlayIcon(null, '');
    }
  }
};
