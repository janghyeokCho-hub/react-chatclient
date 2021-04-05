import { app } from 'electron';
import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import * as u from './configUtils';

const rootPath = path.join(app.getPath('userData'), 'config');

class ConfigLoader {
  constructor(configPath, file) {
    const fullPath = path.join(configPath, file);

    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, '{}');
      this.initFile = true;
    } else {
      this.initFile = false;
    }

    this.file = fullPath;

    try {
      this.config = JSON.parse(fs.readFileSync(fullPath));

      if (
        typeof this.config != 'object' ||
        (Object.keys(this.config).length === 0 &&
          JSON.stringify(this.config) === JSON.stringify({}))
      ) {
        this.initFile = true;
        this.purge();
      }
    } catch (e) {
      // error 발생 시 parsing 실패 및 JSON Type이 아닌경우
      this.initFile = true;
      this.purge();
    }
  }

  file = () => {
    return this.file;
  };

  has = key => {
    return u.search(this.config, key) !== undefined;
  };

  set = (key, value) => {
    u.set(this.config, key)(value);
    u.sync(this.file, this.config);
  };

  setBulk = items => {
    for (let key in items) {
      u.set(this.config, key)(items[key]);
    }
    u.sync(this.file, this.config);
  };

  get = (key, defaultValue) => {
    const value = u.search(this.config, key);
    return value === undefined ? defaultValue : value;
  };

  // 다국어 조회용
  getDic = (key, defaultValue) => {
    const dic = this.config && this.config.dic;
    if (dic) {
      const value = u.search(dic, key);

      if (value === undefined || value === null) {
        if (defaultValue !== undefined && defaultValue !== null)
          return defaultValue;
        else return key;
      }
      return value;
    } else {
      if (defaultValue !== undefined && defaultValue !== null)
        return defaultValue;
      else return key;
    }
  };

  keys = key => {
    return Object.keys(key ? u.search(this.config, key) : this.config);
  };

  all = () => {
    return this.config;
  };

  delete = key => {
    u.remove(this.config, key)();
    u.sync(this.file, this.config);
  };

  deleteBulk = keys => {
    for (let key of keys) {
      u.remove(this.config, key)();
    }
    u.sync(this.file, this.config);
  };

  purge = () => {
    this.config = {};
    u.sync(this.file, this.config);
  };
}

export const getConfig = (file, configPath) => {
  // root config folder 미생성시 생성
  const makePath = !configPath ? rootPath : path.join(rootPath, configPath);
  if (!fs.existsSync(makePath)) {
    mkdirp.sync(makePath);
  }

  const config = new ConfigLoader(makePath, file);
  return config;
};
