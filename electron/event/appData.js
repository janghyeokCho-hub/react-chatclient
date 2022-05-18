import { app, BrowserWindow } from 'electron';
import * as db from '../utils/dbUtils';
import url from 'url';
import path from 'path';
import logger from '../utils/logger';
import { managesvr, chatsvr } from '../utils/api';
import * as loginInfo from '../utils/loginInfo';
import * as openRoomList from '../utils/openRoomList';
import * as notReadList from '../utils/notReadList';
import exportProps from '../config/exportProps';

const dbPath = path.join(app.getPath('userData'), 'userdata');

// 로그인
export const reqLogin = async (event, args) => {
  logger.info('reqLogin');

  const txProvider = await db.getTransactionProvider(dbPath, args.id);
  const tx = await txProvider();

  try {
    const where = { id: args.id };

    // select
    const result = await tx('access')
      .count({ count: ['id'] })
      .where(where);

    if (result[0].count == 0) {
      await tx('access').insert({
        id: args.id,
        token: args.token,
        registDate: args.createDate,
        userinfo: JSON.stringify(args.userInfo),
      });
    } else {
      await tx('access')
        .where(where)
        .update({
          token: args.token,
          registDate: args.createDate,
          userinfo: JSON.stringify(args.userInfo),
        });
    }

    await tx.commit();
  } catch (e) {
    logger.info(e.stack);
    await tx.rollback();
  }

  return true;
};

// 로그아웃
export const reqLogout = (event, args) => {
  // user logout
  logger.info('user logout');
  db.closeConnection();

  const win = BrowserWindow.fromId(1);
  // child window close
  BrowserWindow.getAllWindows().forEach(child => {
    if (win != child) child.close();
  });

  event.returnValue = 'logout success';
};

// 동기화 날짜 세팅
const setSyncDate = (dbCon, key, date) => {
  return dbCon('sync_date')
    .count({ count: '*' })
    .then(result => {
      if (result[0].count == 0) {
        return dbCon('sync_date').insert({
          [key]: date,
        });
      } else {
        return dbCon('sync_date').update({
          [key]: date,
        });
      }
    });
};

// 내 부서 하위 사용자
export const reqMyDeptMemberForSync = async (event, args) => {
  logger.info('reqMyDeptMemberForSync');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );

    const response = await managesvr('get', `/sync/mydeptMember`);
    if (response.data.status == 'SUCCESS') {
      const result = response.data.result;
      const tx = await txProvider();

      try {
        const deleteFN = tx('mydept_member').del();
        const insertFN = tx('mydept_member').insert(result);

        await deleteFN;
        await insertFN;
        await tx.commit();
      } catch (e) {
        logger.info(e.stack);
        await tx.rollback();
      }
    }

    return true;
  } else return false;
};

// 연락처 조회
export const reqContactForSync = async (event, args) => {
  logger.info('reqContactForSync');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const tx = await txProvider();

    try {
      let result = await tx.select('contactSyncDate').from('sync_date');
      if (result.length == 0) {
        result = 0;
      } else {
        if (result[0].contactSyncDate) {
          result = result[0].contactSyncDate;
        } else {
          result = 0;
        }
      }

      const response = await managesvr(
        'get',
        `/sync/contact?syncDate=${result}`,
      );
      if (
        response.data.status == 'SUCCESS' &&
        response.data.result.updateDate
      ) {
        const data = response.data.result;

        // TODO: merge 하는 로직으로 개선 필요
        const deleteFDFn = tx('contact_folder').del();
        const deleteITFn = tx('contact_item').del();
        const insertFDFn = tx('contact_folder').insert(data.contact_folder);
        const insertITFn = tx('contact_item').insert(data.contact_item);
        const setSyncDateFn = setSyncDate(
          tx,
          'contactSyncDate',
          data.updateDate,
        );

        await deleteFDFn;
        await deleteITFn;
        await insertFDFn;
        await insertITFn;
        await setSyncDateFn;
      }
      await tx.commit();
    } catch (e) {
      logger.info(e.stack);
      await tx.rollback();
    }

    return true;
  } else return false;
};

// 채팅방 조회
export const reqRoomForSync = async (event, args) => {
  logger.info('reqRoomForSync');

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);
    const txProvider = await dbCon.transactionProvider();

    dbCon
      .select('roomSyncDate')
      .from('access')
      .then(result => {
        if (result.length == 0) {
          result = 0;
        } else {
          if (result[0].roomSyncDate) {
            result = result[0].roomSyncDate;
          } else {
            result = 0;
          }
        }

        managesvr('get', `/sync/room?syncDate=${result}`)
          .then(async response => {
            if (
              response.data.status == 'SUCCESS' &&
              response.data.result.updateDate
            ) {
              const tx = await txProvider();
              try {
                const selectRoomID = await tx.select('roomId').from('room');
                const selectMember = await tx
                  .select('roomId', 'userId')
                  .from('room_member');
                let dbRoomIds = {};
                if (selectRoomID.length > 0) {
                  dbRoomIds = selectRoomID.reduce((acc, curr) => {
                    acc[curr.roomId] = true;
                    return acc;
                  }, dbRoomIds);
                }
                let dbMembers = {};
                if (selectMember.length > 0) {
                  dbMembers = selectMember.reduce((acc, curr) => {
                    if (!acc[curr.roomId]) acc[curr.roomId] = {};
                    acc[curr.roomId][curr.userId] = true;
                    return acc;
                  }, dbMembers);
                }

                const data = response.data.result;

                const updateNameFn = [];
                const deleteR = [];
                const deleteM = [];
                const deleteRM = [];

                const insertR = [];
                const insertRM = [];

                let serverMembers = data.room_member.reduce((acc, curr) => {
                  acc[curr.roomId] = JSON.parse(curr.members);
                  return acc;
                }, {});

                data.room.forEach(serverRoom => {
                  const roomId = serverRoom.roomId;

                  if (dbRoomIds[roomId]) {
                    // update name
                    updateNameFn.push(
                      tx('room')
                        .update({
                          roomName: serverRoom.roomName,
                          setting: serverRoom.setting,
                        })
                        .where('roomId', roomId),
                    );

                    delete dbRoomIds[roomId];

                    // 기존 멤버 비교
                    serverMembers[roomId].forEach(member => {
                      if (dbMembers[roomId][member.userId]) {
                        delete dbMembers[roomId][member.userId];
                      } else {
                        insertRM.push(tx('room_member').insert(member));
                      }
                    });
                    Object.keys(dbMembers[roomId]).forEach(userId => {
                      deleteRM.push(
                        tx('room_member').del().where({ roomId, userId }),
                      );
                    });
                  } else {
                    // insert room
                    insertR.push(tx('room').insert(serverRoom));

                    insertRM.push(
                      tx('room_member').insert(serverMembers[roomId]),
                    );
                  }
                });

                Object.keys(dbRoomIds).forEach(roomId => {
                  // delete room
                  deleteR.push(tx('room').del().where('roomId', roomId));

                  // delete message
                  deleteM.push(tx('message').del().where('roomId', roomId));

                  // delete room_member
                  deleteRM.push(
                    tx('room_member').del().where('roomId', roomId),
                  );
                });

                //const setSyncDateFn = setSyncDate(tx, 'roomSyncDate', data.updateDate);
                const setSyncDateFn = tx('access').update({
                  roomSyncDate: data.updateDate,
                });

                await Promise.all(updateNameFn);
                await Promise.all([...insertR, ...insertRM]);
                await Promise.all([...deleteR, ...deleteRM, ...deleteM]);
                await setSyncDateFn;
                await tx.commit();
              } catch (e) {
                logger.info(e.stack);
                await tx.rollback();
              }
            }
          })
          .catch(err => {
            console.log(err);
          });
      });

    return true;
  } else return false;
};

// 사용자 조회
export const reqUsersForSync = async (event, args) => {
  logger.info('reqUsersForSync');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );

    const response = await managesvr('get', '/sync/users');

    if (response.data.status == 'SUCCESS') {
      let data = response.data.result;
      const tx = await txProvider();

      try {
        const deleteFN = tx('users').del();
        const insertFN = [];

        data.forEach(item => {
          insertFN.push(
            tx('users').insert({
              id: item.id,
              name: item.name,
              PN: item.PN != null ? item.PN : '',
              LN: item.LN != null ? item.LN : '',
              TN: item.TN != null ? item.TN : '',
              dept: item.dept != null ? item.dept : '',
              presence: item.presence != null ? item.presence : '',
              isMobile: item.isMobile != null ? item.isMobile : '',
              photoPath: item.photoPath != null ? item.photoPath : '',
            }),
          );
        });

        await deleteFN;
        await Promise.all(insertFN);
        await tx.commit();
      } catch (e) {
        logger.info(e.stack);
        await tx.rollback();
      }
    }

    return true;
  }
  return false;
};

export const reqInitRoom = async (event, args) => {
  logger.info('reqInitRoomSync');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const tx = await txProvider();

    try {
      const updateA = tx('access')
        .update('roomSyncDate', null)
        .where('id', loginInfo.getData().id);

      const deleteR = tx('room').del();
      const deleteRM = tx('room_member').del();

      await updateA;
      await deleteR;
      await deleteRM;
      await tx.commit();
    } catch (e) {
      logger.info(e.stack);
      await tx.rollback();
    }
    reqLogout(event, args);

    const mainWin = BrowserWindow.fromId(1);

    const firstPage = '#/client/autoLogin';
    const loadURL = url.format({
      pathname: path.join(exportProps.resourcePath, 'renderer', 'index.html'),
      protocol: 'file:',
      slashes: true,
    });

    logger.info(`load URL : ${loadURL}${firstPage}`);
    mainWin.loadURL(`${loadURL}${firstPage}?refresh=true`);
  }
};

// 채팅방 마지막 메시지 조회
export const reqRoomMessageForSync = (event, args) => {
  logger.info('reqRoomMessageForSync');

  if (loginInfo.getData()) {
    managesvr('get', '/sync/room/message').then(async ({ data }) => {
      const txProvider = await db.getTransactionProvider(
        dbPath,
        loginInfo.getData().id,
      );
      const tx = await txProvider();

      try {
        const deleteFN = tx('room_message').del();
        const insertFN = tx('room_message').insert(data.result);

        await deleteFN;
        await insertFN;
        await tx.commit();
      } catch (e) {
        logger.info(e.stack);
        await tx.rollback();
      }
    });
  }
};

// 채팅방 접속 시 메시지 조회
export const checkSyncMessages = (event, args) => {
  return openRoomList.isNoRoomID(args.roomId);
};

export const checkUnreadCntMessages = (event, args) => {
  // 1. 특정 방의 메세지 목록 호출 args.roomId
  // 2. 역순으로 탐색(마지막 메시지 -> 첫번째 메시지)하면서 만약 maxUnreadCnt보다 높은
  logger.info('APPDATA :: ', event);
  logger.info('APPDATA :: ', args);
};

export const reqMessagesForSync = async (event, args) => {
  logger.info('reqMessagesForSync');

  const roomId = args.roomId;
  const isNotice = Boolean(args.isNotice);
  let syncDate = null;

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

    const result = await dbCon
      .select('syncDate')
      .from('room')
      .where('roomId', roomId);

    if (result.length > 0) syncDate = result[0].syncDate;

    managesvr('post', '/sync/messages', {
      roomId,
      syncDate,
      isNotice,
    }).then(async response => {
      if (response.data.status == 'SUCCESS') {
        try {
          const txProvider = await dbCon.transactionProvider();
          const tx = await txProvider();

          let messages = response.data.result;

          const totalMessageIds = messages.map(item => item.messageId);

          if (messages.length > 0) {
            const syncDate = messages[messages.length - 1].sendDate;
            const notInMessages = await db.selectExecuter(param => {
              return tx
                .select('messageId')
                .from('message')
                .whereIn('messageId', param);
            }, totalMessageIds);

            messages = messages.filter(item => {
              if (
                !notInMessages.find(
                  message => item.messageId == message.messageId,
                )
              )
                return item;
            });

            let insertArr = [];
            const messagesLen = messages.length;
            if (messagesLen > 0) {
              const splitCnt = 50; // INFO: message column cnt 14 ::: SQLITE LIMIT VARIABLE COUNT 999
              for (let i = 0; i < Math.ceil(messagesLen / splitCnt); i++) {
                const tempMessages = messages.splice(0, splitCnt);
                //await tx('message').insert(tempMessages);
                insertArr.push(tx('message').insert(tempMessages));
              }
            }

            for (let i = 0; i < insertArr.length; i++) await insertArr[i];

            // 동기화 시간 Update
            const updateFn = await tx('room')
              .update({
                syncDate: syncDate,
              })
              .where('roomId', roomId);

            await updateFn;
          }

          await tx.commit();

          openRoomList.pushRoom(roomId);
          await event.sender.send('onSyncMessageSuccess', roomId);
        } catch (e) {
          logger.info(e.stack);
          await tx.rollback();
        }
        // let txProvider = null;
        // let tx = null;
        // let messages = response.data.result;

        // if (messages.length > 0) {
        //   const totalMessageIds = messages.map(item => item.messageId);
        //   const splitCnt = 50;

        //   // 1. splitCnt개 만큼 먼저 로딩 후 채팅방을 오픈
        //   txProvider = await dbCon.transactionProvider();
        //   tx = await txProvider();

        //   try {
        //     const notInMessages = await db.selectExecuter(param => {
        //       return tx
        //         .select('messageId')
        //         .from('message')
        //         .whereIn('messageId', param);
        //     }, totalMessageIds);

        //     messages = messages.filter(item => {
        //       if (
        //         !notInMessages.find(
        //           message => item.messageId == message.messageId,
        //         )
        //       )
        //         return item;
        //     });

        //     messages.reverse();

        //     if (messages[0] !== undefined && messages[0].sendDate !== undefined)
        //       syncDate = messages[0].sendDate;

        //     const tempMessages = messages.splice(0, splitCnt);

        //     // 빈 배열을 insert할 경우 SQLite 에러(errno: 21, code: 'SQLITE_MISUSE') 발생
        //     if (tempMessages.length !== 0)
        //       await tx('message').insert(tempMessages);

        //     // sync up-to-date
        //     if (syncDate !== null) {
        //       const updateFn = tx('room')
        //         .update({
        //           syncDate: syncDate,
        //         })
        //         .where('roomId', roomId);

        //       // sync commit
        //       await updateFn;
        //     }

        //     await tx.commit();

        //     // room render
        //     openRoomList.pushRoom(roomId);
        //     await event.sender.send('onSyncMessageSuccess', roomId);
        //   } catch (e) {
        //     logger.error(e.stack);
        //     await tx.rollback();
        //   }

        //   // 2. 이후 작업은 비동기로 백그라운드 작업 진행
        //   let insertArr = [];
        //   txProvider = await dbCon.transactionProvider();
        //   tx = await txProvider();
        //   try {
        //     for (let i = 0; i < Math.ceil(messages.length / splitCnt); i++) {
        //       const tempMessages = messages.splice(0, splitCnt);
        //       insertArr.push(tx('message').insert(tempMessages));
        //     }
        //     for (let i = 0; i < insertArr.length; i++) await insertArr[i];
        //     await tx.commit();
        //   } catch (e) {
        //     logger.error(e.stack);
        //     await tx.rollback();
        //   }
        // } else {
        //   openRoomList.pushRoom(roomId);
        //   await event.sender.send('onSyncMessageSuccess', roomId);
        // }
      }
    });
  }
};

export const reqUnreadCountForMessagesSync = async (event, args) => {
  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

    const roomId = args.roomId;
    const roomType = args.type;

    if (roomType && roomType === 'M') {
      let lastUnreadMessagesIdx = await dbCon
        .select('messageId')
        .from('message')
        .where('roomId', roomId)
        .andWhere('unreadCnt', 1)
        .andWhere('isMine', 'N')
        .orderBy('messageId', 'desc')
        .limit(1);

      if (lastUnreadMessagesIdx.length > 0) {
        let updateMesssages = await dbCon
          .select('messageId')
          .from('message')
          .where('roomId', roomId)
          .andWhere('unreadCnt', '>', 0)
          .andWhere('messageId', '<=', lastUnreadMessagesIdx[0].messageId)
          .andWhere('isMine', 'N');

        if (updateMesssages.length > 0) {
          updateMesssages.forEach(async data => {
            await dbCon('message')
              .update({ unreadCnt: 0, isSyncUnRead: 'Y' })
              .where('messageId', data.messageId);
          });

          const winId = ROOM_WIN_MAP[roomId] || 1;
          const roomWin = BrowserWindow.fromId(winId);

          if (roomWin)
            roomWin.send('onSyncUnreadCountMessages', {
              messageIds: updateMesssages,
            });
        }
      }

      let unreadMessageIdx = await dbCon
        .select('messageId')
        .from('message')
        .where('roomId', roomId)
        .andWhere('unreadCnt', 0)
        .orderBy('messageId', 'desc')
        .limit(1);

      if (unreadMessageIdx.length > 0) {
        let updateMesssages = await dbCon
          .select('messageId')
          .from('message')
          .where('roomId', roomId)
          .andWhere('unreadCnt', '>', 0)
          .andWhere('messageId', '<', unreadMessageIdx[0].messageId);

        if (updateMesssages.length > 0) {
          updateMesssages.forEach(async data => {
            await dbCon('message')
              .update({ unreadCnt: 0, isSyncUnRead: 'Y' })
              .where('messageId', data.messageId);
          });

          const winId = ROOM_WIN_MAP[roomId] || 1;
          const roomWin = BrowserWindow.fromId(winId);

          if (roomWin)
            roomWin.send('onSyncUnreadCountMessages', {
              messageIds: updateMesssages,
            });
        }
      }
    } else if (args.type && args.type === 'G') {
      // message 역순으로 읽어옴
      let messages = await dbCon
        .select(['messageId', 'unreadCnt'])
        .from('message')
        .where('roomId', roomId)
        .andWhere('isMine', 'N')
        .orderBy('messageId', 'desc');

      if (messages.length > 0) {
        let pivotUnreadCount = messages[0].unreadCnt;
        await messages.forEach(async data => {
          if (data.unreadCnt < pivotUnreadCount) {
            pivotUnreadCount = data.unreadCnt;
          } else if (data.unreadCnt > pivotUnreadCount) {
            await dbCon('message')
              .update({ unreadCnt: pivotUnreadCount, isSyncUnRead: 'Y' })
              .where('messageId', data.messageId);
          }
        });

        const winId = ROOM_WIN_MAP[roomId] || 1;
        const roomWin = BrowserWindow.fromId(winId);

        if (roomWin)
          roomWin.send('onSyncUnreadCountMessages', {
            messageIds: messages,
          });
      }
    }
  }
};

// 모든 방의 채팅 메시지 동기화
export const syncAllRoomsMessages = async (event, args) => {
  logger.info('syncAllRoomsMessages');

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);
    dbCon
      .select('roomSyncDate')
      .from('access')
      .then(result => {
        if (result.length == 0) {
          result = 0;
        } else {
          if (result[0].roomSyncDate) {
            result = result[0].roomSyncDate;
          } else {
            result = 0;
          }
        }

        chatsvr('get', '/rooms', null, null, true)
          .then(res => {
            let updateRooms = res.data.rooms.filter(
              (room, index) => room.unreadCnt > 0,
            );
            updateRooms.map(async udtRoom => {
              const roomId = udtRoom.roomID;
              const response = await managesvr('post', '/sync/messages', {
                roomId,
                syncDate: null,
                isNotice: udtRoom.roomType == 'A' ? true : false,
              });

              if (response.data.status == 'SUCCESS') {
                try {
                  const txProvider = await dbCon.transactionProvider();
                  const tx = await txProvider();

                  let messages = response.data.result;

                  const totalMessageIds = messages.map(item => item.messageId);

                  if (messages.length > 0) {
                    const syncDate = messages[messages.length - 1].sendDate;
                    const notInMessages = await db.selectExecuter(param => {
                      return tx
                        .select('messageId')
                        .from('message')
                        .whereIn('messageId', param);
                    }, totalMessageIds);

                    messages = messages.filter(item => {
                      if (
                        !notInMessages.find(
                          message => item.messageId == message.messageId,
                        )
                      )
                        return item;
                    });

                    let insertArr = [];
                    const messagesLen = messages.length;
                    if (messagesLen > 0) {
                      const splitCnt = 50; // INFO: message column cnt 14 ::: SQLITE LIMIT VARIABLE COUNT 999
                      for (
                        let i = 0;
                        i < Math.ceil(messagesLen / splitCnt);
                        i++
                      ) {
                        const tempMessages = messages.splice(0, splitCnt);
                        //await tx('message').insert(tempMessages);
                        insertArr.push(tx('message').insert(tempMessages));
                      }
                    }

                    for (let i = 0; i < insertArr.length; i++)
                      await insertArr[i];

                    // 동기화 시간 Update
                    const updateFn = await tx('room')
                      .update({
                        syncDate: syncDate,
                      })
                      .where('roomId', roomId);

                    await updateFn;
                  }

                  openRoomList.pushRoom(roomId);
                  await tx.commit();

                  // 업데이트 된 방 기준으로 성공 여부 전달 및 re-rendering
                  // const winId = ROOM_WIN_MAP[roomId] || 1;
                  // const roomWin = BrowserWindow.fromId(winId);
                  // if (roomWin) roomWin.send('onSyncMessageSuccess' + roomId);
                } catch (e) {
                  logger.info(e.stack);
                  await tx.rollback();
                }
              }
            });
          })
          .catch(err => console.log(`err::::::::::: ${err}`));
      });
  }
};

export const reqUnreadCountForSync = async (event, args) => {
  logger.info('reqUnreadCountForSync');

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

    const roomId = args.roomId;
    const isNotice = Boolean(args.isNotice);

    let messageIds = await dbCon
      .select('messageId')
      .from('message')
      .where('roomId', roomId)
      .whereBetween('messageId', [args.startId, args.endId])
      .whereNull('isSyncUnread');

    if (messageIds.length > 0) {
      messageIds = messageIds.map(item => item.messageId);

      managesvr('post', '/sync/message/unreadcount', {
        roomId: roomId,
        messageIds: messageIds,
        isNotice: isNotice,
      }).then(async response => {
        if (response.data.status == 'SUCCESS') {
          const txProvider = await dbCon.transactionProvider();
          const tx = await txProvider();

          try {
            let updateArr = [];
            const unreadCnts = response.data.result;
            unreadCnts.forEach(item => {
              let messageIdArr = item.messageId.split(',');
              const messageIdLen = messageIdArr.length;

              const splitCnt = 50;

              for (let i = 0; i < Math.ceil(messageIdLen / splitCnt); i++) {
                const tempMessageIds = messageIdArr.splice(0, messageIdLen);

                let updateParam = {
                  unreadCnt: item.unreadCnt,
                };

                if (item.unreadCnt == 0) {
                  updateParam.isSyncUnRead = 'Y';
                }

                updateArr.push(
                  tx('message')
                    .update(updateParam)
                    .whereIn('messageId', tempMessageIds),
                );
              }
            });

            for (let i = 0; i < updateArr.length; i++) await updateArr[i];
            await tx.commit();

            const winId = ROOM_WIN_MAP[roomId] || 1;
            const roomWin = BrowserWindow.fromId(winId);

            if (roomWin)
              roomWin.send('onSyncUnreadCount', {
                unreadCnts,
                sync: args.isSync,
              });
          } catch (e) {
            logger.info(e.stack);
            await tx.rollback();
          }
        }
      });
    } else {
      const winId = ROOM_WIN_MAP[roomId] || 1;
      const roomWin = BrowserWindow.fromId(winId);
      if (roomWin)
        roomWin.send('onSyncUnreadCount', {
          unreadCnts: [],
          sync: args.isSync,
        });
    }
  }
};

export const reqGetRoom = async (event, args) => {
  logger.info('reqGetRoom');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const rooms = [];

    const response = await managesvr('get', '/sync/room/message');
    if (response.data.status == 'SUCCESS') {
      const tx = await txProvider();
      const data = response.data.result;

      try {
        const roomID = tx.raw('??', ['r.roomId']);
        const realMemberCnt = tx('room_member')
          .count('*')
          .where('roomId', roomID)
          //.whereNotNull('registDate')
          .as('realMemberCnt');

        const selectRoom = tx
          .select(
            'r.roomId as roomID',
            'r.roomName',
            'r.roomType',
            'r.ownerCode',
            'r.targetCode',
            'r.registDate',
            'r.deleteDate',
            'r.updateDate',
            'r.setting',
            realMemberCnt,
          )
          .from('room as r');

        const selectMember = tx
          .select('a.*')
          .from(function () {
            this.select(
              'rm.roomId',
              'u.id',
              'u.name',
              'u.dept',
              'u.PN',
              'u.LN',
              'u.TN',
              'u.presence',
              'u.isMobile',
              'u.photoPath',
              'rm.registDate',
            )
              .from('room_member as rm')
              .join('room as r', 'r.roomId', 'rm.roomId')
              .join('users as u', 'u.id', 'rm.userId')
              .andWhere('r.roomType', '!=', 'M')
              .unionAll([
                tx
                  .select(
                    'r.roomId',
                    'u.id',
                    'u.name',
                    'u.dept',
                    'u.PN',
                    'u.LN',
                    'u.TN',
                    'u.presence',
                    'u.isMobile',
                    'u.photoPath',
                    tx.raw('null as registDate'),
                  )
                  .from('room as r')
                  .join('users as u', 'r.targetCode', 'u.id')
                  .andWhere('r.roomType', 'M'),
                tx
                  .select(
                    'r.roomId',
                    'u.id',
                    'u.name',
                    'u.dept',
                    'u.PN',
                    'u.LN',
                    'u.TN',
                    'u.presence',
                    'u.isMobile',
                    'u.photoPath',
                    tx.raw('null as registDate'),
                  )
                  .from('room as r')
                  .join('users as u', 'r.ownerCode', 'u.id')
                  .andWhere('r.roomType', 'M'),
              ])
              .as('a');
          })
          .orderBy('registDate');

        const roomResult = await selectRoom;
        const members = await selectMember;
        const outdatedRooms = [];

        for await (const item of data) {
          const room = roomResult.find(room => room.roomID == item.roomId);
          if (room) {
            room.members = members.filter(
              member => member.roomId == item.roomId,
            );
            if (item.lastMessageDate === null) {
              /**
               * 2021.06.14
               * lastMessageDate가 null인 경우: 서버 측에서 대화기록 사라짐(메시지 삭제 주기)
               * => local db 조회하여 lastMessage / lastMessageDate 획득
               *
               * Future work (TODO)
               * 건당 select 대신 whereIn으로 쿼리 호출횟수 최적화 필요
               */
              try {
                const lastMessage = await tx
                  .select('m.context', 'm.fileInfos', 'm.sendDate')
                  .from('message as m')
                  .where('m.roomId', item.roomId)
                  .orderBy('m.sendDate', 'desc')
                  .limit(1);
                if (lastMessage && lastMessage.length > 0) {
                  const message = lastMessage[0];
                  room.lastMessage = {
                    Message: message.context || '',
                    File: message.fileInfos || '',
                  };
                  room.lastMessageDate = message.sendDate;
                  room.unreadCnt = item.unreadCnt;
                  outdatedRooms.push(room);
                }
              } catch (err) {
                logger.info(
                  `An error occured when selecting lastMessage in outdated room(${
                    item.roomId || 'UNKNOWN'
                  }) `,
                  err,
                );
              }
            } else {
              // lastMssageDate 값이 있을 경우 마지막 동기화된 값을 그대로 사용함
              room.lastMessage = JSON.parse(item.lastMessage);
              room.lastMessageDate = item.lastMessageDate;
              room.unreadCnt = item.unreadCnt;
              rooms.push(room);
            }
          } else {
            throw { stack: `reqGetRoom - There is no room, '${item.roomId}'` };
          }
        }
        //
        await tx.commit();

        /**
         * 2021.06.14
         * tx.select 비동기 호출이 먼저 끝난 순서대로 데이터가 push되므로 시간순 내림차순 정렬 처리
         */
        outdatedRooms.sort((a, b) => b.lastMessageDate - a.lastMessageDate);
        rooms.push(...outdatedRooms);
      } catch (e) {
        logger.info(e.stack);
        await tx.rollback();
      }
    }

    return { rooms: rooms };
  } else return { rooms: [] };
};

export const reqGetRoomInfo = async (event, args) => {
  logger.info('reqGetRoomInfo');

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

    const roomId = args.roomId;
    let room = {};
    let messages = [];

    try {
      const selectRoomID = dbCon.raw('??', ['r.roomId']);
      const realMemberCnt = dbCon('room_member')
        .count('*')
        .where('roomId', selectRoomID)
        //.whereNotNull('registDate')
        .as('realMemberCnt');

      const selectRoom = await dbCon
        .select(
          'r.roomId as roomID',
          'r.roomName',
          'r.roomType',
          'r.ownerCode',
          'r.targetCode',
          'r.registDate',
          'r.deleteDate',
          'r.updateDate',
          'r.setting',
          realMemberCnt,
        )
        .where({ roomId: roomId })
        .from('room as r');

      if (selectRoom.length == 0) {
        const response = await chatsvr('get', `/room/${roomId}`);
        room = response.data.room;
        messages = response.data.messages;
      } else {
        room = selectRoom[0];

        const selectMember = dbCon
          .select('a.*')
          .from(function () {
            this.select(
              'u.id',
              'u.name',
              'u.PN',
              'u.LN',
              'u.TN',
              'u.dept',
              'u.presence',
              'u.isMobile',
              'u.photoPath',
              'rm.registDate',
            )
              .from('room_member as rm')
              .join('room as r', 'r.roomId', 'rm.roomId')
              .join('users as u', 'u.id', 'rm.userId')
              .where('rm.roomId', roomId)
              .andWhere('r.roomType', '!=', 'M')
              .unionAll([
                dbCon
                  .select(
                    'u.id',
                    'u.name',
                    'u.PN',
                    'u.LN',
                    'u.TN',
                    'u.dept',
                    'u.presence',
                    'u.isMobile',
                    'u.photoPath',
                    'rm.registDate',
                  )
                  .from('room as r')
                  .join('users as u', 'r.targetCode', 'u.id')
                  .leftJoin('room_member as rm', function () {
                    this.on('r.targetCode', 'rm.userId').andOn(
                      'r.roomId',
                      'rm.roomId',
                    );
                  })
                  .where('r.roomId', roomId)
                  .andWhere('r.roomType', 'M'),
                dbCon
                  .select(
                    'u.id',
                    'u.name',
                    'u.PN',
                    'u.LN',
                    'u.TN',
                    'u.dept',
                    'u.presence',
                    'u.isMobile',
                    'u.photoPath',
                    'rm.registDate',
                  )
                  .from('room as r')
                  .join('users as u', 'r.ownerCode', 'u.id')
                  .leftJoin('room_member as rm', function () {
                    this.on('r.ownerCode', 'rm.userId').andOn(
                      'r.roomId',
                      'rm.roomId',
                    );
                  })
                  .where('r.roomId', roomId)
                  .andWhere('r.roomType', 'M'),
              ])
              .as('a');
          })
          .orderBy('registDate');

        const maxCnt = 50;
        let offset = 0;

        let messageCnt = await dbCon('message')
          .count({ count: '*' })
          .where({ roomId: roomId });

        messageCnt = messageCnt[0].count;
        offset = messageCnt - maxCnt;
        offset = offset < 0 ? 0 : offset;

        const selectSenderInfo = dbCon.raw(
          `(select 
            '{"name":"' || name || '"
            ,"PN":"' || PN || '"
            ,"LN":"' || LN || '"
            ,"TN":"' || TN || '"
            ,"photoPath":"' || ifnull(photoPath, '') || '"
            ,"presence":"' || ifnull(presence, '') || '"
            ,"isMobile":"' || isMobile || '" }' 
            from users 
            where id = m.sender) as senderInfo`,
        );

        const selectMessage = dbCon
          .select(
            'm.messageId AS messageID',
            'm.context',
            'm.sender',
            'm.sendDate',
            'm.roomId AS roomID',
            'm.roomType',
            'm.receiver',
            'm.messageType',
            'm.unreadCnt',
            'm.readYN',
            'm.isMine',
            'm.tempId',
            'm.fileInfos',
            room.roomType == 'A' ? selectSenderInfo : 'm.senderInfo',
            'm.linkInfo',
            'm.botInfo',
          )
          .where({ roomId: roomId })
          .from('message as m')
          .limit(maxCnt)
          .offset(offset)
          .orderBy('m.messageId');

        const members = await selectMember;
        messages = await selectMessage;

        if (messages.length == 0) {
          console.log('room ' + roomId + ' messages nothing..');
        }

        room.members = [];
        members.forEach(member => {
          room.members.push(member);
        });
      }
    } catch (e) {
      logger.info(e.stack);
    }

    logger.info(JSON.stringify(messages));

    return { room: room, messages: messages };
  } else return { room: {}, messages: [] };
};

export const reqSaveMessage = async params => {
  logger.info('reqSaveMessage');

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

    try {
      dbCon('message')
        .insert({
          messageId: params.messageID,
          context: params.context,
          sender: params.sender,
          sendDate: params.sendDate,
          roomId: params.roomID,
          roomType: params.roomType,
          receiver: params.receiver,
          messageType: params.messageType,
          unreadCnt: params.unreadCnt,
          isSyncUnRead: params.isSyncUnRead,
          readYN: params.readYN,
          isMine: params.isMine ? params.isMine : 'N',
          tempId: params.tempId,
          fileInfos: params.fileInfos,
          linkInfo: params.linkInfo,
          botInfo: params.botInfo,
        })
        .then(() => {
          if (params.senderInfo) {
            const senderInfo = JSON.parse(params.senderInfo);

            dbCon
              .raw(
                'UPDATE message SET senderInfo = ' +
                  `JSON_OBJECT('name', '${senderInfo.name}', 'PN', '${
                    senderInfo.PN ? senderInfo.PN : ''
                  }', 'LN', '${senderInfo.LN ? senderInfo.LN : ''}', 'TN', '${
                    senderInfo.TN ? senderInfo.TN : ''
                  }', 'photoPath', '${senderInfo.photoPath}', 'presence', '${
                    senderInfo.presence ? senderInfo.presence : 'offline'
                  }', 'isMobile', '${senderInfo.isMobile}', 'sender', '${
                    senderInfo.sender
                  }', 'companyCode', '${
                    senderInfo.companyCode
                  }', 'deptCode', '${senderInfo.deptCode}') ` +
                  `WHERE messageId = ${params.messageID}`,
              )
              .then(() => {});
          }
        })
        .catch(e => {
          logger.info(e.stack);
        });

      let notReadArr = notReadList.getData();
      if (notReadArr.length > 0) {
        const preReadCnt = notReadArr.reduce((acc, current) => {
          if (acc[current]) {
            acc[current] = acc[current] + 1;
          } else {
            acc[current] = 1;
          }
          return acc;
        }, {});

        let filterArray = [];
        const preReadCntKeys = Object.keys(preReadCnt);
        const messageIds = await db.selectExecuter(param => {
          return dbCon
            .select('messageId')
            .from('message')
            .whereIn('messageId', param);
        }, preReadCntKeys);

        preReadCntKeys.forEach(key => {
          const messageId = messageIds.find(item => {
            if (item.messageId == key) return item.messageId;
          });
          if (messageId) {
            dbCon('message')
              .update({
                unreadCnt: dbCon.raw(
                  `case when unreadCnt > 0 then unreadCnt - ${preReadCnt[key]} else 0 end`,
                ),
              })
              .where('messageId', messageId)
              .then(() => {})
              .catch(e => {
                logger.info('update notReadCount - messageId : ', messageId);
                logger.info(e.stack);
              });
          } else {
            for (let i = 0; i < preReadCnt[key]; i++) {
              filterArray.push(key);
            }
          }
        });
        notReadList.setData(filterArray);
      }
    } catch (e) {
      logger.info(e.stack);
    }
    return true;
  } else return false;
};

export const reqSetPresence = async args => {
  logger.info('reqSetPresence');

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

    const param = args.params;
    try {
      param.forEach(item => {
        dbCon('users')
          .where({ id: item.userId })
          .andWhere('presence', '!=', item.state)
          .update({ presence: item.state })
          .then(() => {})
          .catch(e => {
            logger.info(e.stack);
          });
      });
    } catch (e) {
      logger.info(e.stack);
    }
  }
};

export const reqSaveRooms = async (event, args) => {
  logger.info('reqSaveRooms');

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);
    const txProvider = dbCon.transactionProvider();

    const totalRoomId = args.rooms.map(item => item.roomID);
    const notInRoomIds = await dbCon
      .select('roomId')
      .from('room')
      .whereIn('roomId', totalRoomId);

    const rooms = args.rooms.filter(item => {
      if (!notInRoomIds.find(room => item.roomID == room.roomId)) return item;
    });

    if (rooms.length > 0) {
      const tx = await txProvider();
      try {
        let roomData = [];
        let roomMemberData = [];

        let totalUserID = new Set();
        let userInfos = {};

        rooms.forEach(room => {
          roomData.push({
            roomId: room.roomID,
            roomName: room.roomName,
            roomType: room.roomType,
            ownerCode: room.ownerCode,
            targetCode: room.targetCode,
            registDate: room.registDate,
            deleteDate: room.deleteDate,
            updateDate: room.updateDate,
            setting: room.setting,
          });

          room.members.forEach(member => {
            totalUserID.add(member.id);
            userInfos[member.id] = {
              id: member.id,
              name: member.name,
              dept: member.dept,
              PN: member.PN,
              LN: member.LN,
              TN: member.TN,
              presence: member.presence,
              isMobile: member.isMobile,
              photoPath: member.photoPath,
            };

            roomMemberData.push({
              roomId: room.roomID,
              userId: member.id,
              registDate: member.registDate,
            });
          });
        });

        const notInUserIds = await tx
          .select('id')
          .from('users')
          .whereIn('id', [...totalUserID]);

        let usersData = [];
        totalUserID.forEach(id => {
          if (!notInUserIds.find(user => id == user.id)) {
            usersData.push(userInfos[id]);
          }
        });

        const insertR = tx('room').insert(roomData);
        const insertRM = tx('room_member').insert(roomMemberData);
        let insertU;
        if (usersData.length > 0) insertU = tx('users').insert(usersData);

        await insertR;
        await insertRM;
        if (insertU) await insertU;

        await tx.commit();
      } catch (e) {
        logger.info(e.stack);
        await tx.rollback();
      }
    }
  }
};

export const reqDeleteRoom = async (event, args) => {
  logger.info('reqDeleteRoom');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const tx = await txProvider();

    try {
      const where = { roomId: args.roomId };

      const deleteRoomFN = tx('room').where(where).del();
      const deleteMemFN = tx('room_member').where(where).del();
      const deleteMessageFN = tx('message').where(where).del();

      await deleteRoomFN;
      await deleteMemFN;
      await deleteMessageFN;
      await tx.commit();
    } catch (e) {
      logger.info(e.stack);
      await tx.rollback();
    }
  }
};

export const reqModifyRoomName = async (event, args) => {
  logger.info('reqModifyRoomName');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const tx = await txProvider();

    try {
      await tx('room')
        .where({
          roomId: args.roomId,
        })
        .update({ roomName: args.roomName });

      await tx.commit();
    } catch (e) {
      logger.info(e.stack);
      await tx.rollback();
    }
  }
};

export const reqModifyRoomSetting = async (event, args) => {
  logger.info('reqModifyRoomSetting');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const tx = await txProvider();

    try {
      await tx('room')
        .where({
          roomId: args.roomID,
        })
        .update({ setting: args.setting });

      await tx.commit();
    } catch (e) {
      logger.info(e.stack);
      await tx.rollback();
    }
  }
};

export const reqRematchMember = async (event, args) => {
  logger.info('reqRematchMember');

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

    const roomId = args.roomId;
    const members = args.members;

    members.forEach(item => {
      dbCon
        .select('userId')
        .from('room_member')
        .where('roomId', roomId)
        .andWhere('userId', item.id)
        .then(result => {
          if (result.length == 0) {
            dbCon('room_member')
              .insert({
                roomId: roomId,
                userId: item.id,
                registDate: item.registDate,
              })
              .then(() => {});
          } else {
            dbCon('room_member')
              .update({
                registDate: item.registDate,
              })
              .where({ roomId: roomId })
              .then(() => {});
          }
        });
    });
  }
};

export const reqAddMember = async param => {
  logger.info('reqAddMember');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const tx = await txProvider();

    try {
      // room 이 존재할 때만 insert
      const room = await tx('room')
        .count({ count: '*' })
        .where({ roomId: param.roomID });

      if (room[0].count > 0) {
        const inviteMember = param.inviteMember;
        let totalUserID = [];
        let membersParam = [];

        inviteMember.forEach(member => {
          totalUserID.push(member.id);
          membersParam.push({
            roomId: param.roomID,
            userId: member.id,
            registDate: member.registDate,
          });
        });

        const notInUserIds = await tx
          .select('id')
          .from('users')
          .whereIn('id', totalUserID);

        const users = inviteMember.filter(item => {
          if (!notInUserIds.find(user => item.id == user.id))
            return {
              id: item.id,
              name: item.name,
              dept: item.dept,
              PN: item.PN,
              LN: item.LN,
              TN: item.TN,
              presence: item.presence,
              isMobile: item.isMobile,
              photoPath: item.photoPath,
            };
        });

        let InsertUserFN;
        if (users.length > 0) {
          InsertUserFN = tx('users').insert(users);
        }

        const InsertRMFN = tx('room_member').insert(membersParam);

        if (InsertUserFN) await InsertUserFN;
        await InsertRMFN;
      }

      await tx.commit();
    } catch (e) {
      logger.info(e.stack);
      await tx.rollback();
    }
  }
};

export const reqDeleteMember = async param => {
  logger.info('reqDeleteMember');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const tx = await txProvider();

    try {
      await tx('room_member')
        .where({
          roomId: param.roomID,
          userId: param.leaveMember,
        })
        .del();
      await tx.commit();
    } catch (e) {
      logger.info(e.stack);
      await tx.rollback();
    }
  }
};

export const reqDeleteTargetUser = async param => {
  logger.info('reqDeleteTargetUser');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const tx = await txProvider();

    try {
      /*await tx('room_member').update({ registDate: null }).where({
        roomId: param.roomID,
        userId: param.leaveMember,
      });*/

      await tx('room_member').delete().where({
        roomId: param.roomID,
        userId: param.leaveMember,
      });

      await tx.commit();
    } catch (e) {
      logger.info(e.stack);
      await tx.rollback();
    }
  }
};

export const reqSetUnreadCnt = async param => {
  logger.info('reqSetUnreadCnt');

  if (loginInfo.getData()) {
    const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

    param.messageIDs.forEach(id => {
      dbCon('message')
        .update({
          unreadCnt: dbCon.raw(
            'case when unreadCnt > 0 then unreadCnt - 1 else 0 end',
          ),
        })
        .where('messageId', id)
        .then(count => {
          if (count == 0) {
            notReadList.setData([...notReadList.getData(), id]);
          }
        })
        .catch(e => {
          logger.info(e.stack);
          logger.info(`reqSetUnreadCnt error - messageID : ${id}`);
        });
    });
  }
};

export const reqGetMessages = async (event, args) => {
  logger.info('reqGetMessages');

  let messages = [];
  const returnObj = {};

  if (loginInfo.getData()) {
    try {
      if (args.dist == 'CENTER') {
        messages = await selectBetweenMessages(args);
      } else {
        messages = await selectMessages(args);
      }

      returnObj.status = 'SUCCESS';
      returnObj.result = messages;
    } catch (e) {
      returnObj.status = 'FAIL';
      logger.info(e.stack);
    }

    return { data: returnObj };
  } else return { data: {} };
};

const selectMessages = async params => {
  logger.info('selectMessages');
  const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

  const selectSenderInfo = dbCon.raw(
    `(select 
      '{"name":"' || name || '"
      ,"PN":"' || PN || '"
      ,"LN":"' || LN || '"
      ,"TN":"' || TN || '"
      ,"photoPath":"' || ifnull(photoPath, '') || '"
      ,"presence":"' || ifnull(presence, '') || '"
      ,"isMobile":"' || isMobile || '"}' 
      from users 
      where id = m.sender) as senderInfo`,
  );

  const subQuery = dbCon
    .select(
      'messageId AS messageID',
      'context',
      'sender',
      'sendDate',
      'roomId AS roomID',
      'roomType',
      'receiver',
      'messageType',
      'unreadCnt',
      'readYN',
      'isMine',
      'tempId',
      'fileInfos',
      params.isNotice ? selectSenderInfo : 'senderInfo',
      'linkInfo',
      'botInfo',
    )
    .from('message as m')
    .where('roomId', params.roomID)
    .andWhere(function () {
      if (params.startId) {
        if (params.dist == 'BEFORE')
          this.where('messageId', '>', params.startId);
        else this.where('messageId', '<', params.startId);
      }
    })
    .orderBy('messageId', params.dist == 'BEFORE' ? 'asc' : 'desc')
    .limit(params.loadCnt)
    .offset(0);

  const messages = await dbCon
    .select('*')
    .from(subQuery.as('a'))
    .orderBy('a.messageId');

  return messages;
};

export const selectBetweenMessagesByIDs = async params => {
  const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

  const selectMessage = dbCon
    .select(
      'messageId AS messageID',
      'context',
      'sender',
      'sendDate',
      'fileInfos',
      'senderInfo',
      'linkInfo',
      'botInfo',
    )
    .from('message')
    .whereBetween('messageId', [params.startId, params.endId]);

  const messages = await selectMessage;
  return messages;
};

const selectBetweenMessages = async params => {
  const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

  const count = Math.round(params.loadCnt / 2);

  const selectMessage = dbCon
    .select(
      'messageId AS messageID',
      'context',
      'sender',
      'sendDate',
      'roomId AS roomID',
      'roomType',
      'receiver',
      'messageType',
      'unreadCnt',
      'readYN',
      'isMine',
      'tempId',
      'fileInfos',
      'senderInfo',
      'linkInfo',
      'botInfo',
    )
    .from('message as m')
    .where('roomId', params.roomID);

  const beforeMessages = dbCon
    .select()
    .from(selectMessage.as('a'))
    .where('a.messageId', '<=', params.startId)
    .orderBy('a.messageID', 'desc')
    .limit(count)
    .offset(0);

  const afterMessages = dbCon
    .select()
    .from(selectMessage.as('a'))
    .where('a.messageId', '>', params.startId)
    .orderBy('a.messageID')
    .limit(count)
    .offset(0);

  const unionAllQuery = dbCon
    .select()
    .from(function () {
      this.select()
        .from(beforeMessages.as('before'))
        .unionAll(function () {
          this.select().from(afterMessages.as('after'));
        })
        .as('a');
    })
    .orderBy('a.messageId');

  const messages = await unionAllQuery;
  return messages;
};

export const reqGetSearchMessages = async (event, args) => {
  logger.info('reqGetSearchMessages');

  const returnObj = {};

  if (loginInfo.getData()) {
    try {
      let messages = null;
      let search = await searchMessages(args);
      if (search.length > 0) {
        search = search.map(item => item.messageId);
        args.startId = search[0];
        messages = await selectBetweenMessages(args);

        returnObj.status = 'SUCCESS';
        returnObj.search = search;
        returnObj.firstPage = messages;
      } else {
        returnObj.status = 'FAIL';
      }
    } catch (e) {
      returnObj.status = 'FAIL';
      logger.info(e.stack);
    }

    return { data: returnObj };
  } else return { data: {} };
};

const searchMessages = async param => {
  const dbCon = await db.getConnection(dbPath, loginInfo.getData().id);

  const search = dbCon
    .select('messageId')
    .from('message')
    .where('roomId', param.roomID)
    .andWhere('context', 'like', `%${param.search}%`)
    .andWhere('context', 'not like', '%eumtalk://emoticon.%')
    .andWhere('messageType', 'N')
    .orderBy('messageId', 'desc');

  return search;
};

export const updateLinkInfo = async (messageId, linkInfo) => {
  logger.info('updateLinkInfo');

  if (loginInfo.getData()) {
    const txProvider = await db.getTransactionProvider(
      dbPath,
      loginInfo.getData().id,
    );
    const tx = await txProvider();

    try {
      await tx('message')
        .update({ linkInfo: JSON.stringify(linkInfo) })
        .where({
          messageId: messageId,
        });

      await tx.commit();
    } catch (e) {
      logger.info(e.stack);
      await tx.rollback();
    }
  }
};

export const deleteChatroomMessage = async ({ roomID, deletedMessageIds }) => {
  logger.info(
    `Delete Chatroom Message:: room('${roomID}') deletedMessageIds: (${JSON.stringify(
      deletedMessageIds,
    )})`,
  );
  const userInfo = loginInfo.getData();
  if (!userInfo) {
    return;
  }
  const txProvider = await db.getTransactionProvider(dbPath, userInfo.id);
  const tx = await txProvider();
  try {
    await tx('message')
      .del()
      .where('roomId', roomID)
      .whereIn('messageId', deletedMessageIds);
    await tx.commit();
  } catch (err) {
    logger.info(`Delete Chatroom Message Error: ${JSON.stringify(err)}`);
    await tx.rollback();
  }
};

export const syncChatroomDeletedMessages = async ({ roomID }) => {
  logger.info(`Chatroom: Sync deleted messages on room ${roomID}`);
  if (!roomID) {
    return;
  }
  try {
    const { data } = await managesvr('get', `/sync/room/message/${roomID}`);
    logger.info(
      `/sync/room/message/${roomID} result :: ` + JSON.stringify(data),
    );
    if (
      data.status !== 'SUCCESS' ||
      Array.isArray(data?.result?.deletedMessageIds) !== true
    ) {
      return;
    }
    deleteChatroomMessage({
      roomID,
      ...data.result,
    });
  } catch (err) {
    logger.info(
      `Chatroom: Sync deleted messages on room ${roomID} occured an error : ${JSON.stringify(
        err,
      )}`,
    );
  }
};
