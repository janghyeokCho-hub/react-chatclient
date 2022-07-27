export function createRoomMemberTable(table) {
  table.integer('roomId').index();
  table.string('userId', 50);
  table.bigInteger('registDate');
  table.json('reserved');
  table.unique(['roomId', 'userId']);
}
