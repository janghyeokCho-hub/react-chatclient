import { app } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import * as configSecure from './secureConfigUtils';
import { getAesUtilForLocalSetting } from '../utils/aesUtil';
import logger from '../utils/logger';

const rootPath = path.join(app.getPath('userData'), 'config');

class SecureConfigLoader {
  constructor(configPath, file, configData) {
    const fullPath = path.join(configPath, file);

    this.config = configData ? configData : {};
    this.AESUtil = getAesUtilForLocalSetting();

    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(
        fullPath,
        this.AESUtil.encrypt(JSON.stringify(this.config)),
      );
      this.initFile = true;
    } else {
      this.initFile = false;
    }

    this.file = fullPath;

    try {
      const encryptData = fs.readFileSync(fullPath);

      this.config = JSON.parse(this.AESUtil.decrypt(encryptData.toString()));

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
      logger.info('error => ' + e);
    }
  }

  all = () => {
    return this.config;
  };

  keys = key => {
    return Object.keys(
      key ? configSecure.search(this.config, key) : this.config,
    );
  };

  file = () => {
    return this.file;
  };

  has = key => {
    return configSecure.search(this.config, key) !== undefined;
  };

  get = (key, defaultValue) => {
    const value = configSecure.search(this.config, key);
    return value === undefined ? defaultValue : value;
  };

  delete = key => {
    configSecure.remove(this.config, key)();
    configSecure.sync(
      this.file,
      this.AESUtil.encrypt(JSON.stringify(this.config)),
    );
  };

  set = (key, value) => {
    configSecure.set(this.config, key)(value);
    configSecure.sync(
      this.file,
      this.AESUtil.encrypt(JSON.stringify(this.config)),
    );
  };

  setBulk = data => {
    this.config = data;
    try {
      configSecure.sync(
        this.file,
        this.AESUtil.encrypt(JSON.stringify(this.config)),
      );
    } catch (e) {
      logger.info('error => ' + e);
    }
  };

  purge = () => {
    this.config = {};
    try {
      configSecure.sync(
        this.file,
        this.AESUtil.encrypt(JSON.stringify(this.config)),
      );
    } catch (e) {
      logger.info('error => ' + e);
    }
  };

  append = (key, value) => {
    const tempValue = configSecure.search(this.config, key);

    if (tempValue === undefined) return;

    configSecure.remove(this.config, key)();
    configSecure.sync(
      this.file,
      this.AESUtil.encrypt(JSON.stringify(this.config)),
    );

    tempValue.push(value);

    configSecure.set(this.config, key)(tempValue);
    configSecure.sync(
      this.file,
      this.AESUtil.encrypt(JSON.stringify(this.config)),
    );
  };

  getDic = (key, defaultValue) => {
    const dic = this.config && this.config.dic;
    if (dic) {
      const value = configSecure.search(dic, key);

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
}

export const getSecureConfig = (file, configPath) => {
  const makePath = !configPath ? rootPath : path.join(rootPath, configPath);
  if (!fs.existsSync(makePath)) {
    fs.mkdirpSync(makePath);
  }

  const config = new SecureConfigLoader(makePath, file);
  return config;
};

export const getSecureConfigUsingExsistFile = async (file, configData) => {
  if (!fs.existsSync(rootPath)) {
    fs.mkdirpSync(rootPath);
  }

  const config = new SecureConfigLoader(rootPath, file, configData);

  return config;
};

export const removeExistFile = file => {
  const fullPath = rootPath + '/' + file;
  fs.access(fullPath, fs.constants.F_OK, err => {
    if (err) console.log(`${fullPath} cannot be access: ${err}`);
    fs.unlink(fullPath, () => {});
  });
};
