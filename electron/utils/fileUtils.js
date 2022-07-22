import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import logger from './logger';
import * as db from '../database';
import exportProps from '../config/exportProps';

export const makeLocalDatabaseFile = (dbPath, dbName) => {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirpSync(dbPath);
  }

  if (!fs.existsSync(path.join(dbPath, `${dbName}.sqlite`))) {
    fs.writeFileSync(path.join(dbPath, `${dbName}.sqlite`), '');
  }
};

export const removeLocalDatabaseDir = async () => {
  let returnVal = true;

  try {
    await db.closeConnection();

    const dbPath = path.join(app.getPath('userData'), 'userdata');

    if (fs.existsSync(dbPath)) {
      const files = fs.readdirSync(dbPath);

      for (const file of files) {
        console.log(path.join(dbPath, file));
        fs.unlinkSync(path.join(dbPath, file));
      }
    }
  } catch (e) {
    logger.info(e.stack);
    returnVal = false;
  }

  return returnVal;
};

export const makeIndexFile = (domain, callback) => {
  fs.readFile(
    path.join(exportProps.resourcePath, 'renderer', 'index.html'),
    { encoding: 'utf8' },
    (err, data) => {
      let templateData = data;
      templateData = templateData.replace(
        /(<link\s+rel="stylesheet"[\s|\S]+?href=")(.*)(\/chatStyle\/.*\.css)(\s*?"\s*?\/>)/gim,
        `$1${domain}$3$4`,
      );

      const indexData = templateData.replace(
        /(window.covi\s*?=\s*?)({.*})/gim,
        `$1{baseURL : '${domain}'}`,
      );

      fs.writeFile(
        path.join(exportProps.resourcePath, 'renderer', 'index.html'),
        indexData,
        () => {
          callback();
        },
      );
    },
  );
};

export const checkIndexFile = (domain, callback) => {
  fs.readFile(
    path.join(exportProps.resourcePath, 'renderer', 'index.html'),
    { encoding: 'utf8' },
    (err, data) => {
      let templateData = data;
      const regExStyle = new RegExp(
        `<link\\s+rel="stylesheet"[\\s|\\S]+?href=".*${domain}/chatStyle/.*\\.css\\s*?"\\s*?\/>`,
        'gim',
      );
      const regExURL = new RegExp(
        `window.covi\\s*?=\\s*?{\\s?baseURL\\s?:\\s?'${domain}'\\s?}`,
        'gim',
      );

      const styleCheck = regExStyle.test(templateData);
      const baseURLCheck = regExURL.test(templateData);

      logger.info(
        `check index.html file :: ${domain} :: style : ${styleCheck}, url : ${baseURLCheck}`,
      );

      if (styleCheck && baseURLCheck) {
        callback();
      } else {
        logger.info(`replace index.html file :: ${domain}`);

        templateData = templateData.replace(
          /(<link\s+rel="stylesheet"[\s|\S]+?href=")(.*)(\/chatStyle\/.*\.css)(\s*?"\s*?\/>)/gim,
          `$1${domain}$3$4`,
        );

        const indexData = templateData.replace(
          /(window.covi\s*?=\s*?)({.*})/gim,
          `$1{baseURL : '${domain}'}`,
        );

        fs.writeFile(
          path.join(exportProps.resourcePath, 'renderer', 'index.html'),
          indexData,
          () => {
            callback();
          },
        );
      }
    },
  );
};
