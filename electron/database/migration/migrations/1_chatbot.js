export const migrateChatbot = {
  async up(knex) {
    const isBotInfoExists = await knex.schema.hasColumn('message', 'botInfo');
    if (isBotInfoExists) {
      return;
    }
    const result = await knex.schema.table('message', table => {
      table.json('botInfo');
    });
    return result;
  },
  down() {
    return true;
  },
};

export default migrateChatbot;
