import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { clearLayer, deleteLayer, openLayer, openPopup } from '@/lib/common';
import LoadingWrap from '@/components/common/LoadingWrap';
import { getDocItem, getRoomDocList } from '@/lib/document';
import { openLink } from '@/lib/deviceConnector';
import { rematchingMember } from '@/modules/room';
import { sendMessage, sendChannelMessage } from '@/modules/message';
import DocPropertyView from '@/components/chat/chatroom/layer/DocPropertyView';

const DocList = ({ list }) => {
  return (
    <ul className="file-list">
      {list &&
        list.map(item => {
          return <Doc key={item.docID} docItem={item}></Doc>;
        })}
    </ul>
  );
};

const Doc = ({ docItem }) => {
  const dispatch = useDispatch();

  const room = useSelector(({ room, channel }) => {
    if (room.currentRoom) {
      return room.currentRoom;
    } else if (channel.currentChannel) {
      return channel.currentChannel;
    } else {
      return {
        members: [],
      };
    }
  });

  const handleMessage = useCallback(
    async message => {
      const data = {
        roomID: room.roomType === 'C' ? room.roomId : room.roomID,
        context: message,
        roomType: room.roomType,
        messageType: 'A',
      };
      if (room.roomType === 'C') {
        dispatch(sendChannelMessage(data));
      } else {
        // sendMessage 하기 전에 RoomType이 M인데 참가자가 자기자신밖에 없는경우 상대를 먼저 초대함.
        if (room.roomType === 'M' && room.realMemberCnt === 1) {
          dispatch(rematchingMember(data));
        } else {
          // rematchingMember 내에서 서버 호출 후 sendMessage 호출하도록 변경
          dispatch(sendMessage(data));
        }
      }

      if (window.covi?.listBottomBtn) {
        window.covi.listBottomBtn.click();
      }
    },
    [dispatch, room],
  );

  const handleMenu = item => {
    const buttons = [
      {
        name: covi.getDic('docEdit', '문서 편집'),
        callback: () => {
          if (DEVICE_TYPE === 'd') {
            openLink(item.docURL);
          } else {
            window.open(item.docURL);
          }
        },
      },
      {
        name: covi.getDic('ViewProperties', '속성 보기'),
        callback: () => {
          clearLayer(dispatch);
          openLayer(
            {
              component: <DocPropertyView item={item} room={room} />,
            },
            dispatch,
          );
        },
      },
      {
        name: covi.getDic('ShareAgain', '다시 공유하기'),
        callback: async () => {
          const response = await getDocItem(item.docID);
          const { status, result } = response?.data;
          if (status === 'SUCCESS' && result) {
            const msgObj = {
              title: covi.getDic('JointDoc', '공동문서'),
              context: result.docTitle,
              func: [
                {
                  name: covi.getDic('docEdit', '문서 편집'),
                  type: 'link',
                  data: {
                    baseURL: result.docURL,
                  },
                },
                {
                  name: covi.getDic('ViewProperties', '속성 보기'),
                  type: 'openLayer',
                  data: {
                    componentName: 'DocPropertyView',
                    item: result,
                    room: room,
                  },
                },
                {
                  name: covi.getDic('InviteEditor', '편집자 초대'),
                  type: 'openLayer',
                  data: {
                    componentName: 'InviteMember',
                    headerName: covi.getDic('InviteEditor', '편집자 초대'),
                    roomId: result.roomID,
                    roomType: room.roomType,
                    isNewRoom: false,
                  },
                },
              ],
            };
            handleMessage(JSON.stringify(msgObj));
            clearLayer(dispatch);
          } else {
            openPopup({
              type: 'Alert',
              message: covi.getDic(
                'Msg_Error',
                '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
              ),
            });
          }
        },
      },
    ];

    openPopup(
      {
        type: 'Select',
        buttons: buttons,
      },
      dispatch,
    );
  };

  return (
    <li
      onClick={e => {
        handleMenu(docItem);
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className={`file-message`}>
        <div
          className="file-info-txt"
          style={{
            textalign: 'start',
            paddingLeft: '2em',
          }}
        >
          <p className="file-name">{docItem.docTitle}</p>
          <p className="file-size">{docItem.description}</p>
        </div>
      </div>
    </li>
  );
};

const DocSummary = ({ roomId }) => {
  const dispatch = useDispatch();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getList(roomId) {
      setLoading(true);
      const response = await getRoomDocList(roomId);
      const { result, status } = response?.data;
      if (status === 'SUCCESS' && response.status === 200) {
        if (result) {
          setList(result);
        } else {
          setList([]);
        }
      } else {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic(
              'Msg_Error',
              '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
            ),
          },
          dispatch,
        );
      }
      setLoading(false);
    }
    getList(roomId);
  }, [roomId]);

  const handleClose = () => {
    deleteLayer(dispatch);
  };

  const drawData = useMemo(() => {
    return <DocList list={list} />;
  }, [list]);

  return (
    <>
      <div className="Layer-fileView" style={{ height: '100%' }}>
        <div className="modalheader">
          <a className="closebtn" onClick={handleClose}></a>
          <div className="modaltit">
            <p>{covi.getDic('ShareDocSummary', '공동문서 모아보기')}</p>
          </div>
        </div>
        {(list && (
          <Scrollbars
            className="container"
            style={{ height: 'calc(100% - 50px)' }}
            autoHide={true}
          >
            {drawData}
          </Scrollbars>
        )) || (
          <div
            style={{ width: '100%', textAlign: 'center', marginTop: '30px' }}
          >
            {covi.getDic('Msg_NoContent', '조회할 내용이 없습니다.')}
          </div>
        )}
      </div>
      {loading && <LoadingWrap></LoadingWrap>}
    </>
  );
};

export default DocSummary;
