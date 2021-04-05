import { Tray, BrowserWindow, Menu, app } from 'electron';
import logger from './logger';
import path from 'path';
import exportProps from '../config/exportProps';
import {
  showVersionInfo,
  clearCache,
  initApp,
  showConnectInfo,
  getDictionary,
} from './commonUtils';

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
      click: () => {
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
