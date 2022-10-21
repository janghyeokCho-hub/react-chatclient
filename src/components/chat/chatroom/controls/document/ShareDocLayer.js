import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Scrollbars from 'react-custom-scrollbars';
import { getDocItem, getRoomDocList } from '@/lib/document';
import { openPopup } from '@/lib/common';

const ShareDocLayer = ({ handleDocumentControl, postAction }) => {
  const dispatch = useDispatch();
  const currentRoom = useSelector(({ room, channel }) => {
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

  const roomID =
    currentRoom.roomType === 'C' ? currentRoom.roomId : currentRoom.roomID;

  const [list, setList] = useState(null);

  useEffect(() => {
    async function getList(roomID) {
      const response = await getRoomDocList(roomID);
      const { result, status } = response?.data;
      if (status === 'SUCCESS' && response.status === 200) {
        if (result) {
          if (Array.isArray(result)) {
            setList(result);
          } else {
            const arr = new Array(result);
            setList(arr);
          }
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
    }
    getList(roomID);
  }, [roomID]);

  const handleShareDoc = async item => {
    const response = await getDocItem(item.docID);
    const { status, result } = response.data;
    if (result && status === 'SUCCESS') {
      const msgObj = JSON.stringify({
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
              roomID: roomID,
            },
          },
          {
            name: covi.getDic('InviteEditor', '편집자 초대'),
            type: 'openLayer',
            data: {
              componentName: 'InviteMember',
              headerName: covi.getDic('InviteEditor', '편집자 초대'),
              roomId: result.roomID,
              roomType: currentRoom.roomType,
              isNewRoom: false,
            },
          },
        ],
      });
      let params = [];
      if (currentRoom.roomType === 'C') {
        params = [msgObj, null, null, null, null, 'A', null];
      } else {
        params = [msgObj, null, null, 'A', null];
      }

      postAction(...params);
      // 공동 문서 공유 Layer 닫기
      handleDocumentControl();
    } else {
      openPopup({
        type: 'Alert',
        message: covi.getDic(
          'Msg_Error',
          '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
        ),
      });
    }
  };
  return (
    <>
      <div className="chat_sticker">
        <div className="chat_sticker_tab">
          <h3>{covi.getDic('ListShareDoc', '공동 문서 목록')}</h3>
        </div>

        <div className="chat_sticker_list">
          <Scrollbars
            autoHide={true}
            style={{
              overflowX: 'hidden',
              boxSizing: 'border-box',
              height: '175px',
            }}
            renderTrackHorizontal={() => <div style={{ display: 'none' }} />}
          >
            {list && (
              <ul className="people">
                {list.map(item => {
                  return (
                    <li
                      key={`doc_${item.docID}`}
                      className="person"
                      onClick={() => handleShareDoc(item)}
                    >
                      <div
                        style={{
                          width: '100%',
                          textAlign: 'start',
                          marginLeft: '1em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span
                          className="name"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 'calc(100% - 50px)',
                          }}
                        >
                          {item.docTitle}
                        </span>
                        <span className="preview">{item.description}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {!list?.length && (
              <p
                style={{
                  display: 'flex',
                  height: '100%',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {covi.getDic('Msg_NoContent', '조회할 내용이 없습니다.')}
              </p>
            )}
          </Scrollbars>
        </div>
      </div>
    </>
  );
};

export default ShareDocLayer;
