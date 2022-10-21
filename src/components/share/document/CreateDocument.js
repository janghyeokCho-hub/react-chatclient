import React, { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLayer, openPopup } from '@/lib/common';
import Scrollbars from 'react-custom-scrollbars';
import { createDocument } from '@/lib/document';
import { openLink } from '@/lib/deviceConnector';

const CreateDocument = ({ postAction }) => {
  const dispatch = useDispatch();
  const myInfo = useSelector(({ login }) => login.userInfo);
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

  const [docTitle, setDocTitle] = useState('');
  const docTitleRef = useRef(null);
  const [description, setDescription] = useState('');
  const descriptionRef = useRef(null);
  const [category, setCategory] = useState('');

  const handleClose = () => {
    deleteLayer(dispatch);
  };

  const docPostMessage = useCallback(
    item => {
      console.log(currentRoom);
      const roomID =
        currentRoom.roomType === 'C' ? currentRoom.roomId : currentRoom.roomID;
      const msgObj = JSON.stringify({
        title: covi.getDic('JointDoc', '공동문서'),
        context: item.docTitle,
        func: [
          {
            name: covi.getDic('docEdit', '문서 편집'),
            type: 'link',
            data: {
              baseURL: item.docURL,
            },
          },
          {
            name: covi.getDic('ViewProperties', '속성 보기'),
            type: 'openLayer',
            data: {
              componentName: 'DocPropertyView',
              item: item,
              room: currentRoom,
            },
          },
          {
            name: covi.getDic('InviteEditor', '편집자 초대'),
            type: 'openLayer',
            data: {
              componentName: 'InviteMember',
              headerName: covi.getDic('InviteEditor', '편집자 초대'),
              roomId: roomID,
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
    },
    [currentRoom],
  );

  const handleCreate = useCallback(async () => {
    if (!docTitle) {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_Note_EnterTitle', '제목을 입력하세요.'),
          callback: () => {
            docTitleRef.current.focus();
          },
        },
        dispatch,
      );
      return;
    } else if (!description) {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic('Msg_InputDescription', '설명을 입력하세요.'),
          callback: () => {
            descriptionRef.current.focus();
          },
        },
        dispatch,
      );
      return;
    }

    const ownerCode = myInfo.id;
    const { members, roomType } = currentRoom;
    const roomID = roomType === 'C' ? currentRoom.roomId : currentRoom.roomID;
    const targetList = members.map(({ id }) => id);
    const params = {
      roomId: roomID,
      docTitle,
      description,
      category,
      ownerCode,
      targetList,
    };
    const response = await createDocument(params);
    const { status, result } = response.data;
    if (status === 'SUCCESS' && response.status === 200) {
      handleClose();
      const { docURL } = result;
      if (DEVICE_TYPE === 'd') {
        openLink(docURL);
      } else {
        window.open(docURL);
      }
      docPostMessage(result);
    } else {
      openPopup(
        {
          type: 'Alert',
          message: covi.getDic(
            'Msg_Error',
            '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
          ),
          callback: () => {},
        },
        dispatch,
      );
    }
  }, [dispatch, docTitle, description, category, currentRoom]);

  return (
    <>
      <div className="layerWrap Layer-AddChannel">
        <div className="modalheader">
          <a className="closebtn" onClick={handleClose}></a>
          <div className="modaltit">
            <p>{covi.getDic('CreateShareDoc', '공동 문서 생성')}</p>
          </div>
        </div>

        <div
          className="container Layer-AddChannel-Con tabcontent active"
          style={{ height: 'calc(100% - 50px)' }}
        >
          <Scrollbars style={{ height: 'calc(100% - 80px)' }} autoHide={true}>
            <div className="Profile-info-input">
              <div className="input full">
                <label
                  style={{ cursor: 'default' }}
                  className="string optional"
                >
                  {covi.getDic('DocTitle', '문서 제목')}
                </label>
                <input
                  className="string optional"
                  placeholder={covi.getDic(
                    'Msg_Note_EnterTitle',
                    '제목을 입력하세요.',
                  )}
                  type="text"
                  onChange={e => setDocTitle(e.target.value)}
                  ref={docTitleRef}
                />
              </div>
              <div className="input full">
                <label
                  style={{ cursor: 'default' }}
                  className="string optional"
                >
                  {covi.getDic('DocDescription', '문서 설명')}
                </label>
                <input
                  className="string optional"
                  placeholder={covi.getDic(
                    'Msg_InputDescription',
                    '설명을 입력하세요.',
                  )}
                  type="text"
                  onChange={e => setDescription(e.target.value)}
                  ref={descriptionRef}
                />
              </div>
              <div className="input full">
                <label
                  style={{ cursor: 'default' }}
                  className="string optional"
                >
                  {covi.getDic('Category', '카테고리')}
                </label>
                <input
                  className="string optional"
                  placeholder={covi.getDic(
                    'Msg_InputCategory',
                    '카테고리를 입력하세요.',
                  )}
                  type="text"
                  onChange={e => setCategory(e.target.value)}
                />
              </div>
            </div>
          </Scrollbars>
          <div className="layer-bottom-btn-wrap" onClick={handleCreate}>
            <a className="Btn-pointcolor-full">{covi.getDic('Ok', '확인')}</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateDocument;
