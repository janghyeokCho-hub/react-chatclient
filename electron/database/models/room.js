export function createRoomTable(table) {
  table.integer('roomId').primary();
  table.string('roomName', 255);
  table.string('roomType', 1);
  table.string('ownerCode', 50);
  table.string('targetCode', 50);
  table.bigInteger('registDate');
  table.bigInteger('deleteDate');
  table.bigInteger('updateDate');
  table.bigInteger('syncDate');
  table.json('setting');
  table.json('reserved');
}
