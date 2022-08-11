export const migrateReplyChat = {
  /**
   * @param {Knex} knex
   * @returns
   */
  async up(knex) {
    const isColumnExists = await knex.schema.hasColumn('message', 'replyID');
    if (isColumnExists) {
      return;
    }
    const result = await knex.schema.table('message', table => {
      table.integer('replyID');
      table.json('replyInfo');
    });
    return result;
  },
  down() {
    return true;
  },
};

export default migrateReplyChat;
