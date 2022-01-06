import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import url from 'url';
import exportProps from '../config/exportProps';

export const showModalDialog = (parent, option) => {
  let modalDialog = new BrowserWindow({
    // parent: parent,
    modal: true,
    show: false,
    // center: true,
    frame: false,
    resizable: false,
    width: option.width,
    height: option.height,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInSubFrames: true,
    },
  });

  modalDialog.loadFile(path.join(DIR_NAME, 'templates', `${option.type}.html`));

  modalDialog.webContents.once('did-finish-load', () => {
    let code = `var messageBox = document.getElementById("message");
    messageBox.innerHTML = '${option.message}'
    var confirmBtn = document.getElementById("btnConfirm");
    confirmBtn.addEventListener("click", () => {
        const currentWindow = getCurrentWindow();
        ipcRenderer.send('modal-callback', true);
        currentWindow.close();
    });

    ${
      option.type == 'confirm'
        ? `var cancelBtn = document.getElementById("btnCancel");
        cancelBtn.addEventListener("click", () => {
            const currentWindow = getCurrentWindow();
            ipcRenderer.send('modal-callback', false);
            currentWindow.close();
    })`
        : ''
    }
    `;
    modalDialog.webContents.executeJavaScript(code);

    // modalDialog.webContents.openDevTools();
  });

  modalDialog.once('ready-to-show', () => {
    ipcMain.once('modal-callback', (event, args) => {
      if (option.type == 'alert') {
        typeof option.confirm == 'function' && option.confirm();
      } else {
        if (args) {
          typeof option.confirm == 'function' && option.confirm();
        } else {
          typeof option.cancel == 'function' && option.cancel();
        }
      }
    });
    modalDialog.show();
  });

  modalDialog.on('close', () => {
    ipcMain.removeAllListeners('modal-callback');
  });
};

export const showModalProgress = (parent, option) => {
  let modalDialog = new BrowserWindow({
    parent: parent,
    modal: true,
    show: false,
    frame: false,
    resizable: false,
    width: 300,
    height: 150,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInSubFrames: true,
    },
  });

  modalDialog.loadFile(path.join(DIR_NAME, 'templates', 'progress.html'));

  modalDialog.webContents.once('did-finish-load', () => {
    let code = `var messageBox = document.getElementById("message");
      messageBox.innerHTML = '${option.message}'
      `;

    modalDialog.webContents.executeJavaScript(code);
  });

  modalDialog.once('ready-to-show', () => {
    modalDialog.show();
  });

  return modalDialog;
};

export const showVersionInformation = () => {
  let modalDialog = new BrowserWindow({
    show: false,
    frame: false,
    resizable: false,
    width: 620,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInSubFrames: true,
      webviewTag: true,
    },
  });

  let loadURL = '';

  loadURL = url.format({
    pathname: path.join(exportProps.resourcePath, 'renderer', 'index.html'),
    protocol: 'file:',
    slashes: true,
  });

  modalDialog.loadURL(
    `${loadURL}#/client/nw/versions/${exportProps.platform}/${exportProps.arch}`,
  );

  modalDialog.once('ready-to-show', () => {
    modalDialog.show();
  });

  modalDialog.on('close', () => {
    modalDialog = null;
  });
};

export const showConnectInformation = () => {
  let modalDialog = new BrowserWindow({
    modal: false,
    show: false,
    frame: true,
    resizable: false,
    width: 300,
    height: 220,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegrationInSubFrames: true,
    },
  });

  modalDialog.setMenu(null);

  modalDialog.loadFile(path.join(DIR_NAME, 'templates', 'checkConnect.html'));

  modalDialog.once('ready-to-show', () => {
    modalDialog.show();
  });

  // modalDialog.webContents.openDevTools();
};
