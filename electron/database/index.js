import Knex from 'knex';
import path from 'path';
import exportProps from '../config/exportProps';
import { initializeDatabase, checkDatabaseExists } from './initialize';
import logger from '../utils/logger';
import { migrateDatabase } from './migration';

let dbCon = null;

const SQLITE_LIMIT_VARIABLES = 999;

export function getDatabaseFileName(dbName) {
  // db name 에 도메인 명칭 추가
  const openName = Buffer.from(`${DOMAIN}.${dbName}`, 'utf8').toString(
    'base64',
  );
  return `${openName}.db`;
}

export async function makeConnection(dbPath, fileName) {
  const isDatabaseExisting = await checkDatabaseExists(dbPath, fileName)
  const myDBConfig = {
    client: 'sqlite3',
    connection: {
      filename: path.join(dbPath, fileName),
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
  if (isDatabaseExisting === false) {
    logger.info(`[DB] Initialize ${fileName}`);
    await initializeDatabase(connection);
  }
  await migrateDatabase(connection, isDatabaseExisting);
  logger.info(`[DB] Create connection(${fileName}) success`);
  return connection;
}

export const getConnection = async (dbPath, dbName) => {
  const fileName = getDatabaseFileName(dbName);
  if (!dbCon) {
    const connection = await makeConnection(dbPath, fileName);
    dbCon = connection;
  }
  return dbCon;
};

export const getTransactionProvider = async (dbPath, openName) => {
  const dbCon = await getConnection(dbPath, openName);
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
    logger.info('database close exception: ' + JSON.stringify(e));
    dbCon = null;
  }
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
