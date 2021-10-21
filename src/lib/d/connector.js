import { ipcRenderer } from 'electron';
import * as remote from '@electron/remote';
import fs from 'fs';
import { getInitialBounds } from '@/lib/d/bound';

export const getEmitter = () => {
  return ipcRenderer;
};

export const getRemote = () => {
  return remote;
};

export const existsSync = path => {
  return fs.existsSync(path);
};

export const writeFile = (path, data, callback) => {
  fs.writeFile(path, data, callback);
};

export {
  getInitialBounds
}