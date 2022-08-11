// Init table
export function createMessageTable(table) {
  table.integer('messageId').primary();
  table.integer('roomId').index();
  table.text('context');
  table.string('sender', 50);
  table.bigInteger('sendDate');
  table.string('roomType', 1);
  table.string('receiver', 255)
  table.string('messageType', 1);
  table.integer('unreadCnt');
  table.string('isSyncUnread', 1);
  table.string('readYN', 1);
  table.string('isMine', 1);
  table.integer('tempId');
  table.string('fileInfos', 255);
  table.string('linkInfo', 255);
  table.string('tagInfo', 255);
  table.json('senderInfo');
  table.json('reserved');
  // 챗봇
  table.json('botInfo');
  // 답장
  table.json('replyInfo');
  table.integer('replyID');
}
