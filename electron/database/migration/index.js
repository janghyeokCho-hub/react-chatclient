import logger from '../../utils/logger';
import migrateChatbot from './migrations/1_chatbot';

export const migrationPlans = {
  '1-chatbot': migrateChatbot,
};

export class MigrationSource {
  getMigrationName(migration) {
    return migration;
  }
  getMigration(migration) {
    return migrationPlans?.[migration];
  }
  async getMigrations() {
    return Object.keys(migrationPlans);
  }
}

export async function migrateDatabase(conn, initialized = false) {
  const currentMigrationversion = await conn.migrate.currentVersion();
  logger.info(
    `[DB-migration] Checking database migration from version '${currentMigrationversion}'`,
  );
  // console.log('Hello ', await conn.migrate.status());
  await conn.migrate.latest({
    migrationSource: new MigrationSource(initialized),
  });

  logger.info(
    `[DB-migration] The current version of database is now '${await conn.migrate.currentVersion()}'`,
  );
}
