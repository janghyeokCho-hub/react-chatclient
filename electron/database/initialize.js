import fs from 'fs-extra';
import { join } from 'path';

import logger from '../utils/logger';
import {
  createAccessTable,
  createMessageTable,
  createRoomTable,
  createRoomMemberTable,
  createUserTable,
} from './models';

export async function checkDatabaseExists(dbPath, fileName) {
  const filePath = join(dbPath, fileName);
  try {
    await fs.ensureDir(dbPath);
    const fileStat = await fs.stat(filePath);
    return fileStat.isFile();
  } catch (err) {
    logger.info(`[DB] Check '${filePath}': ${err?.code}`);
    return false;
  }
}

export async function initializeDatabase(conn) {
  logger.info(`[DB] Initialize ${fileName}`);
  const res = await Promise.allSettled([
    conn.schema.createTable('access', createAccessTable),
    conn.schema.createTable('message', createMessageTable),
    conn.schema.createTable('room', createRoomTable),
    conn.schema.createTable('room_member', createRoomMemberTable),
    conn.schema.createTable('users', createUserTable),
  ]);
  return res;
}
