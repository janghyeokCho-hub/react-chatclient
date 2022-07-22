// Init table
export function createAccessTable(table) {
  table.string('id', 50).primary();
  table.string('token', 255);
  table.json('userInfo');
  table.bigInteger('registDate');
  table.bigInteger('roomSyncDate');
  table.json('reserved');
}
