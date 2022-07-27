// Init table
export function createUserTable(table) {
  table.string('id', 50).primary();
  table.string('name', 255);
  table.string('isMobile', 1);
  table.string('PN', 200);
  table.string('LN', 200);
  table.string('TN', 200);
  table.string('dept', 50);
  table.string('presence', 50);
  table.string('photoPath', 255);
  table.string('work', 255);
  table.integer('sortKey');
  table.json('reserved1');
}
