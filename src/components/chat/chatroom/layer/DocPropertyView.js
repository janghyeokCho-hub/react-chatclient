import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearLayer, openPopup } from '@/lib/common';
import { rematchingMember } from '@/modules/room';
import { sendMessage, sendChannelMessage } from '@/modules/message';
import { updateDocument } from '@/lib/document';
import { setCurrentDocument, setCurrentDocumentInit } from '@/modules/document';
import LoadingWrap from '@COMMON/LoadingWrap';

const DocPropertyView = ({ item }) => {
  const dispatch = useDispatch();
  const myInfo = useSelector(({ login }) => login.userInfo);
  const currentDocument = useSelector(
    ({ document }) => document.currentDocument,
  );

  const [docTitle, setDocTitle] = useState('');
  const docTitleRef = useRef(null);
  const [description, setDescription] = useState('');
  const descriptionRef = useRef(null);
  const [category, setCategory] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [docItem, setDocItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentDocument || item?.docID !== currentDocument.docID) {
      setLoading(true);
      dispatch(setCurrentDocument(item?.docID));
    } else {
      setDocItem(currentDocument);
      setLoading(false);
    }

    return () => {
      setDocItem(null);
    };
  }, [item, currentDocument]);

  useEffect(() => {
    if (docItem) {
      setDocTitle(docItem.docTitle || '');
      setDescription(docItem.description || '');
      setCategory(docItem.category || '');

      if (docItem?.ownerCode === myInfo?.id) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    }
  }, [docItem, myInfo.id]);

  useEffect(() => {
    return () => {
      setDocTitle('');
      setDescription('');
      setCategory('');
      setIsOwner(false);
    };
  }, []);

  const handleClose = useCallback(() => {
    dispatch(setCurrentDocumentInit());
    clearLayer(dispatch);
  }, [dispatch]);

  const handleMessage = useCallback(
    async message => {
      const data = {
        roomID: docItem.roomID,
        context: message,
        roomType: docItem.roomType,
        messageType: 'A',
      };
      if (docItem.roomType === 'C') {
        dispatch(sendChannelMessage(data));
      } else {
        // sendMessage ?????? ?????? RoomType??? M?????? ???????????? ?????????????????? ???????????? ????????? ?????? ?????????.
        if (docItem.roomType === 'M' && docItem.room.realMemberCnt === 1) {
          dispatch(rematchingMember(data));
        } else {
          // rematchingMember ????????? ?????? ?????? ??? sendMessage ??????????????? ??????
          dispatch(sendMessage(data));
        }
      }

      if (window.covi?.listBottomBtn) {
        window.covi.listBottomBtn.click();
      }
    },
    [dispatch, docItem],
  );

  const handleUpdate = useCallback(async () => {
    if (isOwner) {
      if (!docTitle) {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_Note_EnterTitle', '????????? ???????????????.'),
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
            message: covi.getDic('Msg_InputDescription', '????????? ???????????????.'),
            callback: () => {
              descriptionRef.current.focus();
            },
          },
          dispatch,
        );
        return;
      }
    }

    if (
      docTitle !== docItem.docTitle ||
      description !== docItem.description ||
      category !== docItem.category
    ) {
      const params = {
        roomID: docItem.roomID,
        roomType: docItem.roomType,
        docID: docItem.docID,
        docURL: docItem.docURL,
        docTitle: docTitle,
        description: description,
        category: category,
      };
      const response = await updateDocument(params);
      const { status, result } = response.data;

      if (status === 'SUCCESS') {
        console.log(docItem);
        if (
          isOwner &&
          (docTitle !== docItem.docTitle || description !== docItem.description)
        ) {
          const msgObj = {
            title: covi.getDic('JointDoc', '????????????'),
            context: result.docTitle,
            func: [
              {
                name: covi.getDic('docEdit', '?????? ??????'),
                type: 'link',
                data: {
                  baseURL: result.docURL,
                },
              },
              {
                name: covi.getDic('ViewProperties', '?????? ??????'),
                type: 'openLayer',
                data: {
                  componentName: 'DocPropertyView',
                  item: result,
                },
              },
              {
                name: covi.getDic('InviteEditocr', '????????? ??????'),
                type: 'openLayer',
                data: {
                  componentName: 'InviteMember',
                  headerName: covi.getDic('InviteEditor', '????????? ??????'),
                  roomId: docItem.roomID,
                  roomType: docItem.roomType,
                  isNewRoom: false,
                },
              },
            ],
          };

          handleMessage(JSON.stringify(msgObj));
        }
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic('Msg_ModifySuccess', '?????????????????????.'),
            callback: () => {
              handleClose();
            },
          },
          dispatch,
        );
      } else {
        openPopup(
          {
            type: 'Alert',
            message: covi.getDic(
              'Msg_Error',
              '????????? ??????????????????.<br/>??????????????? ??????????????????.',
            ),
          },
          dispatch,
        );
      }
    } else {
      handleClose();
    }
  }, [dispatch, isOwner, docTitle, description, category, docItem]);

  return (
    <>
      {(loading && <LoadingWrap />) || (
        <div className="innerbox">
          <div className="modalheader">
            <a className="closebtn" onClick={handleClose}></a>
            <div className="modaltit">
              <p>{covi.getDic('ViewProperties', '?????? ??????')}</p>
            </div>
          </div>
          <div className="Layer-AddChannel-Con">
            <div className="Layer-AddChannel">
              <div className="Profile-info-input">
                <div className="input full">
                  <label
                    htmlFor="docTitle"
                    style={{ cursor: 'default' }}
                    className="string optional"
                  >
                    {covi.getDic('DocTitle', '?????? ??????')}
                  </label>
                  <input
                    id="docTitle"
                    className="string optional"
                    placeholder={covi.getDic(
                      'Msg_Note_EnterTitle',
                      '????????? ???????????????.',
                    )}
                    type="text"
                    onChange={e => setDocTitle(e.target.value)}
                    value={docTitle}
                    disabled={!isOwner}
                    style={
                      (!isOwner && { opacity: '50%', cursor: 'not-allowed' }) ||
                      {}
                    }
                    ref={docTitleRef}
                  />
                </div>
                <div className="input full">
                  <label
                    htmlFor="description"
                    style={{ cursor: 'default' }}
                    className="string optional"
                  >
                    {covi.getDic('DocDescription', '?????? ??????')}
                  </label>
                  <input
                    id="description"
                    className="string optional"
                    placeholder={covi.getDic(
                      'Msg_InputDescription',
                      '????????? ???????????????.',
                    )}
                    type="text"
                    onChange={e => setDescription(e.target.value)}
                    value={description}
                    disabled={!isOwner}
                    style={
                      (!isOwner && { opacity: '50%', cursor: 'not-allowed' }) ||
                      {}
                    }
                    ref={descriptionRef}
                  />
                </div>
                <div className="input full">
                  <label
                    htmlFor="description"
                    style={{ cursor: 'default' }}
                    className="string optional"
                  >
                    {covi.getDic('Category', '????????????')}
                  </label>
                  <input
                    id="description"
                    className="string optional"
                    placeholder={covi.getDic(
                      'Msg_InputCategory',
                      '??????????????? ???????????????.',
                    )}
                    type="text"
                    onChange={e => setCategory(e.target.value)}
                    value={category}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="layer-bottom-btn-wrap" onClick={handleUpdate}>
            <a className="Btn-pointcolor-full">{covi.getDic('Ok', '??????')}</a>
          </div>
        </div>
      )}
    </>
  );
};

export default DocPropertyView;
