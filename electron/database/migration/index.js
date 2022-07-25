import logger from '../../utils/logger';
import migrateChatbot from './migrations/1_chatbot';

export const migrationPlans = {
  '1-chatbot': migrateChatbot,
};

export class MigrationSource {
  constructor(initialized) {
    this.initialized = Boolean(initialized);
  }
  getMigrationName(migration) {
    return migration;
  }
  getMigration(migration) {
    // DB 최초 생성시점에 migration 호출시 모든 migration 스킵
    if (this.initialized === true) {
      return {
        async up(knex) {
          logger.info(`[DB-migration] Skip migration-upgrade ${migration}`);
          return knex;
        },
        async down(knex) {
          logger.info(`[DB-migration] Skip migration-downgrade ${migration}`);
          return knex;
        },
      };
    }
    return migrationPlans[migration];
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
