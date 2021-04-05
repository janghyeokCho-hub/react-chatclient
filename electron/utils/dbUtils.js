import Knex from 'knex';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import sqlite3 from '@journeyapps/sqlcipher';
import exportProps from '../config/exportProps';
import logger from './logger';

let dbCon = null;

const SQLITE_LIMIT_VARIABLES = 999;

export const open = async (dbPath, dbName) => {
  // db name 에 도메인 명칭 추가
  const openName = Buffer.from(`${DOMAIN}.${dbName}`, 'utf8').toString(
    'base64',
  );
  let connection = dbCon;
  if (connection == null) {
    // DB 파일이 없는경우 파일 생성 후 connection return
    if (!fs.existsSync(path.join(dbPath, `${openName}.db`))) {
      logger.info(
        'make database file : ' + path.join(dbPath, `${openName}.db`),
      );
      const resultMakeFile = await makeLocalDatabaseFile(dbPath, openName);
    }

    const makeConnection = () => {
      return new Promise((resolve, reject) => {
        const myDBConfig = {
          client: 'sqlite3',
          connection: {
            filename: path.join(dbPath, `${openName}.db`),
          },
          pool: {
            afterCreate: function (conn, done) {
              if (exportProps.isAppDataCipher) {
                logger.info('knex :: app data cipher');
                conn.run('PRAGMA cipher_compatibility = 3');
                conn.run(`PRAGMA key = '${exportProps.appDataCipherKey}'`);
              }
              done();
            },
          },
          useNullAsDefault: true,
        };

        const connection = Knex(myDBConfig);
        resolve(connection);
      });
    };

    connection = await makeConnection();
    logger.info('knex :: connection create success');
  }

  return connection;
};

export const getConnection = async (dbPath, openName) => {
  if (dbCon == null) {
    dbCon = await open(dbPath, openName);
  }
  return dbCon;
};

export const getTransactionProvider = async (dbPath, openName) => {
  if (dbCon == null) {
    dbCon = await open(dbPath, openName);
  }
  const txProvider = dbCon.transactionProvider();

  return txProvider;
};

export const closeConnection = async () => {
  try {
    if (dbCon != null) {
      await dbCon.destroy();
      dbCon = null;
    }
  } catch (e) {
    logger.info('database close exception');
    dbCon = null;
  }
};

const makeLocalDatabaseFile = async (dbPath, openName) => {
  if (!fs.existsSync(dbPath)) {
    mkdirp.sync(dbPath);
  }

  // fs.writeFileSync(path.join(dbPath, `${openName}.db`), '');
  // db initialize
  const db = new sqlite3.Database(path.join(dbPath, `${openName}.db`));

  const initialize = () => {
    return new Promise((resolve, reject) => {
      db.serialize(function () {
        // Required to open a database created with SQLCipher 3.x
        logger.info('local database file create');
        if (exportProps.isAppDataCipher) {
          db.run('PRAGMA cipher_compatibility = 3');
          db.run(`PRAGMA key = '${exportProps.appDataCipherKey}'`);
        }
        db.run(
          'CREATE TABLE access (id varchar(50), token varchar(255), userinfo json, registDate bigint, roomSyncDate bigint, reserved json, primary key (id))',
        );
        db.run(
          'CREATE TABLE message (messageId integer, context TEXT, sender varchar(50), sendDate bigint, roomId integer, roomType CHARACTER(1), receiver varchar(255), messageType CHARACTER(1), unreadCnt integer, isSyncUnread CHARACTER(1), readYN CHARACTER(1), isMine CHARACTER(1), tempId integer, fileInfos varchar(255), linkInfo varchar(255), tagInfo varchar(255), senderInfo json, reserved json, primary key (messageId))',
        );
        db.run(
          'CREATE TABLE room (roomId integer, roomName varchar(255), roomType CHARACTER(1), ownerCode varchar(50), targetCode varchar(50), registDate bigint, deleteDate bigint, updateDate bigint, syncDate bigint, setting json, reserved json, primary key (roomId))',
        );
        db.run(
          'CREATE TABLE room_member (roomId integer, userId varchar(50), registDate bigint, reserved json)',
        );
        db.run(
          'CREATE TABLE users (id varchar(50), name varchar(255), isMobile CHARACTER(1), PN varchar(200), LN varchar(200), TN varchar(200), dept varchar(50),presence varchar(50), photoPath varchar(255),  work varchar(255), sortKey integer, reserved1 json, primary key (id))',
        );
        db.run(
          'CREATE UNIQUE INDEX room_member_roomid_userid_unique on room_member (roomId, userId)',
        );
        db.run(
          'CREATE INDEX message_roomid on message (roomId)',
        );
        db.run(
          'CREATE INDEX room_member_roomId ON room_member(roomId)',
        )

        resolve(true);
      });
    });
  };

  const result = await initialize();

  logger.info('initialize result :: ' + result);
  logger.info('initialize file close');

  const close = () => {
    return new Promise((resolve, reject) => {
      db.close(() => {
        // callback
        logger.info('initialize file close success');
        resolve(true);
      });
    });
  };

  return close();
};

export const selectExecuter = async (func, param) => {
  if (param.length <= SQLITE_LIMIT_VARIABLES) {
    const result = await func(param);
    return result;
  } else {
    let result = [];
    let splitLength = Math.ceil(param.length / SQLITE_LIMIT_VARIABLES);
    for (let i = 0; i < splitLength; i++) {
      const unitResult = await func(param.splice(0, SQLITE_LIMIT_VARIABLES));

      if (unitResult.length > 0) {
        result = result.concat(unitResult);
      }
    }

    return result;
  }
};
