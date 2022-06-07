import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import {
  clearLayer,
  deleteLayer,
  openPopup,
  getSysMsgFormatStr,
  isJSONStr,
} from '@/lib/common';
import { getRoomFiles } from '@/lib/message';
import {
  downloadByToken,
  downloadByTokenAll,
  convertFileSize,
  getFileExtension,
} from '@/lib/fileUpload/coviFile';
import { setMoveView } from '@/modules/message';
import LoadingWrap from '@/components/common/LoadingWrap';
import { format } from 'date-fns';
import { getConfig } from '@/lib/util/configUtil';
import * as viewerApi from '@/lib/viewer';
import Progress from '@C/common/buttons/Progress';
import { isBlockCheck } from '@/lib/orgchart';

const synapDocViewServer = getConfig('SynapDocViewServer');
const fileAttachViewMode = getConfig('FileAttachViewMode');

const FileList = ({ files, onSelect, selectMode, handleProgress }) => {
  return (
    <ul className="file-list">
      {files &&
        files.map(item => (
          <File
            key={item.FileID}
            file={item}
            onSelect={onSelect}
            selectMode={selectMode}
            handleProgress={handleProgress}
          ></File>
        ))}
    </ul>
  );
};

const File = ({ file, onSelect, selectMode, handleProgress }) => {
  const [check, setCheck] = useState(false);
  const dispatch = useDispatch();
  const currentRoom = useSelector(({ room }) => room.currentRoom);
  const currentChannel = useSelector(({ channel }) => channel.currentChannel);
  const roomID = useMemo(
    () => currentRoom?.roomID || currentChannel?.roomId,
    [currentRoom, currentChannel],
  );

  useEffect(() => {
    setCheck(false);
  }, [selectMode]);

  const handleCheck = file => {
    if (
      onSelect(
        { token: file.FileID, fileName: file.FileName, size: file.FileSize },
        !check,
      )
    ) {
      setCheck(!check);
    }
  };

  const handleMenu = item => {
    //일렉트론 다운로드o 뷰어o
    if (
      DEVICE_TYPE === 'd' &&
      synapDocViewServer &&
      fileAttachViewMode &&
      fileAttachViewMode[0].type === 'PC' &&
      fileAttachViewMode[0].Viewer === true &&
      fileAttachViewMode[0].Download === true
    ) {
      openPopup(
        {
          type: 'Select',
          buttons: [
            {
              name: covi.getDic('Detail', '상세정보'),
              callback: () => {
                openPopup(
                  {
                    type: 'Alert',
                    message: `<ul className="menulist">
                    <li style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                    ${covi.getDic('FileName', '파일명')} : ${
                      item.FileName
                    }</li><li>${covi.getDic(
                      'FileSize',
                      '용량',
                    )} : ${convertFileSize(
                      item.FileSize,
                    )}</li><li>${covi.getDic(
                      'ReceiveDate',
                      '수신일시',
                    )} : ${format(
                      new Date(item.SendDate),
                      'yyyy.MM.dd HH:mm:ss',
                    )}</li>`,
                  },
                  dispatch,
                );
              },
            },
            {
              name: covi.getDic('ShowChat', '대화보기'),
              callback: () => {
                dispatch(
                  setMoveView({
                    roomID: item.RoomID,
                    moveId: item.MessageID,
                    visible: true,
                  }),
                );
                clearLayer(dispatch);
              },
            },
            {
              name: covi.getDic('RunViewer', '뷰어로 열기'),
              callback: async () => {
                await viewerApi.requestSynapViewer(dispatch, {
                  fileId: item.FileID,
                  ext: item.Extension,
                  roomID,
                });
              },
            },
            {
              name: covi.getDic('Download', '다운로드'),
              callback: () => {
                downloadByToken(
                  item.FileID,
                  item.FileName,
                  data => {
                    if (data.result !== 'SUCCESS') {
                      openPopup(
                        {
                          type: 'Alert',
                          message: data.message,
                        },
                        dispatch,
                      );
                    } else {
                      openPopup(
                        {
                          type: 'Alert',
                          message: covi.getDic(
                            'Msg_DownloadSuccess',
                            '다운로드가 완료되었습니다.',
                          ),
                        },
                        dispatch,
                      );
                    }
                  },
                  e => {
                    handleProgress(e.loaded, e.total);
                  },
                );
              },
            },
          ],
        },
        dispatch,
      );
    }
    //일렉트론 다운로드o 뷰어x
    else if (
      synapDocViewServer &&
      fileAttachViewMode &&
      fileAttachViewMode[0].type === 'PC' &&
      fileAttachViewMode[0].Download === true
    ) {
      openPopup(
        {
          type: 'Select',
          buttons: [
            {
              name: covi.getDic('Detail', '상세정보'),
              callback: () => {
                openPopup(
                  {
                    type: 'Alert',
                    message: `<ul className="menulist">
                    <li style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                    ${covi.getDic('FileName', '파일명')} : ${
                      item.FileName
                    }</li><li>${covi.getDic(
                      'FileSize',
                      '용량',
                    )} : ${convertFileSize(
                      item.FileSize,
                    )}</li><li>${covi.getDic(
                      'ReceiveDate',
                      '수신일시',
                    )} : ${format(
                      new Date(item.SendDate),
                      'yyyy.MM.dd HH:mm:ss',
                    )}</li>`,
                  },
                  dispatch,
                );
              },
            },
            {
              name: covi.getDic('ShowChat', '대화보기'),
              callback: () => {
                dispatch(
                  setMoveView({
                    roomID: item.RoomID,
                    moveId: item.MessageID,
                    visible: true,
                  }),
                );
                clearLayer(dispatch);
              },
            },
            {
              name: covi.getDic('Download', '다운로드'),
              callback: () => {
                downloadByToken(
                  item.FileID,
                  item.FileName,
                  data => {
                    if (data.result != 'SUCCESS') {
                      openPopup(
                        {
                          type: 'Alert',
                          message: data.message,
                        },
                        dispatch,
                      );
                    } else {
                      openPopup(
                        {
                          type: 'Alert',
                          message: covi.getDic(
                            'Msg_DownloadSuccess',
                            '다운로드가 완료되었습니다.',
                          ),
                        },
                        dispatch,
                      );
                    }
                  },
                  e => {
                    handleProgress(e.loaded, e.total);
                  },
                );
              },
            },
          ],
        },
        dispatch,
      );
    }
    //일렉트론 다운로드x 뷰어o
    else if (
      DEVICE_TYPE === 'd' &&
      synapDocViewServer &&
      fileAttachViewMode &&
      fileAttachViewMode[0].type === 'PC' &&
      fileAttachViewMode[0].Viewer === true
    ) {
      openPopup(
        {
          type: 'Select',
          buttons: [
            {
              name: covi.getDic('Detail', '상세정보'),
              callback: () => {
                openPopup(
                  {
                    type: 'Alert',
                    message: `<ul className="menulist">
                    <li style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                    ${covi.getDic('FileName', '파일명')} : ${
                      item.FileName
                    }</li><li>${covi.getDic(
                      'FileSize',
                      '용량',
                    )} : ${convertFileSize(
                      item.FileSize,
                    )}</li><li>${covi.getDic(
                      'ReceiveDate',
                      '수신일시',
                    )} : ${format(
                      new Date(item.SendDate),
                      'yyyy.MM.dd HH:mm:ss',
                    )}</li>`,
                  },
                  dispatch,
                );
              },
            },
            {
              name: covi.getDic('ShowChat', '대화보기'),
              callback: () => {
                dispatch(
                  setMoveView({
                    roomID: item.RoomID,
                    moveId: item.MessageID,
                    visible: true,
                  }),
                );
                clearLayer(dispatch);
              },
            },
            {
              name: covi.getDic('RunViewer', '뷰어로 열기'),
              callback: async () => {
                await viewerApi.requestSynapViewer(dispatch, {
                  fileId: item.FileID,
                  ext: item.Extension,
                  roomID,
                });
              },
            },
          ],
        },
        dispatch,
      );
    }
    //브라우저(브라우저에서는 뷰어 안되니) 다운로드x
    else if (
      synapDocViewServer &&
      fileAttachViewMode &&
      fileAttachViewMode[0].type === 'PC' &&
      fileAttachViewMode[0].Viewer === true
    ) {
      openPopup(
        {
          type: 'Select',
          buttons: [
            {
              name: covi.getDic('Detail', '상세정보'),
              callback: () => {
                openPopup(
                  {
                    type: 'Alert',
                    message: `<ul className="menulist">
                  <li style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                  ${covi.getDic('FileName')} : ${
                      item.FileName
                    }</li><li>${covi.getDic('FileSize')} : ${convertFileSize(
                      item.FileSize,
                    )}</li><li>${covi.getDic('ReceiveDate')} : ${format(
                      new Date(item.SendDate),
                      'yyyy.MM.dd HH:mm:ss',
                    )}</li>`,
                  },
                  dispatch,
                );
              },
            },
            {
              name: covi.getDic('ShowChat'),
              callback: () => {
                dispatch(
                  setMoveView({
                    roomID: item.RoomID,
                    moveId: item.MessageID,
                    visible: true,
                  }),
                );
                clearLayer(dispatch);
              },
            },
          ],
        },
        dispatch,
      );
    }
    // 브라우저 다운로드o
    else if (
      synapDocViewServer &&
      fileAttachViewMode &&
      fileAttachViewMode[0].type === 'PC'
    ) {
      openPopup(
        {
          type: 'Select',
          buttons: [
            {
              name: covi.getDic('Detail', '상세정보'),
              callback: () => {
                openPopup(
                  {
                    type: 'Alert',
                    message: `<ul className="menulist">
                    <li style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                    ${covi.getDic('FileName', '파일명')} : ${
                      item.FileName
                    }</li><li>${covi.getDic(
                      'FileSize',
                      '용량',
                    )} : ${convertFileSize(
                      item.FileSize,
                    )}</li><li>${covi.getDic(
                      'ReceiveDate',
                      '수신일시',
                    )} : ${format(
                      new Date(item.SendDate),
                      'yyyy.MM.dd HH:mm:ss',
                    )}</li>`,
                  },
                  dispatch,
                );
              },
            },
            {
              name: covi.getDic('ShowChat', '대화보기'),
              callback: () => {
                dispatch(
                  setMoveView({
                    roomID: item.RoomID,
                    moveId: item.MessageID,
                    visible: true,
                  }),
                );
                clearLayer(dispatch);
              },
            },
            {
              name: covi.getDic('Download', '다운로드'),
              callback: () => {
                downloadByToken(item.FileID, item.FileName, data => {
                  if (data.result != 'SUCCESS') {
                    openPopup(
                      {
                        type: 'Alert',
                        message: data.message,
                      },
                      dispatch,
                    );
                  } else {
                    openPopup(
                      {
                        type: 'Alert',
                        message: covi.getDic(
                          'Msg_DownloadSuccess',
                          '다운로드가 완료되었습니다.',
                        ),
                      },
                      dispatch,
                    );
                  }
                });
              },
            },
          ],
        },
        dispatch,
      );
    }
  };

  return (
    <li
      onClick={e => {
        if (selectMode) {
          handleCheck(file);
        } else {
          handleMenu(file);
        }
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className={`file-message ${getFileExtension(file.Extension)}`}>
        <div className="file-type-ico"></div>
        <div className="file-info-txt">
          <p className="file-name">{file.FileName}</p>
          <p className="file-size">
            {covi.getDic('FileSize', '용량')} {convertFileSize(file.FileSize)}
          </p>
        </div>
        {selectMode && (
          <div className="check">
            <div className="chkStyle02">
              <input
                type="checkbox"
                id="chk01"
                checked={check}
                readOnly={true}
                onClick={e => {
                  if (selectMode) {
                    handleCheck(file);
                  } else {
                    handleMenu(file);
                  }
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
              <label htmlFor="chk01">
                <span></span>
              </label>
            </div>
          </div>
        )}
      </div>
    </li>
  );
};

const FileSummary = ({ roomId, chineseWall }) => {
  const dispatch = useDispatch();
  const loadCnt = 30;
  const [select, setSelect] = useState(false);
  const [selectItems, setSelectItems] = useState([]);
  const [files, setFiles] = useState([]);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageEnd, setPageEnd] = useState(false);
  const [progressData, setProgressData] = useState(null);

  const handleClose = () => {
    deleteLayer(dispatch);
  };

  const handleSelect = async () => {
    if (select) {
      // 이전 상태가 선택모드였다면 변경시 cnt도 0으로 초기화
      if (selectItems.length > 0) {
        if (selectItems.length <= 5) {
          // 2개 이상은 압축
          const isZip = selectItems.length > 1;
          const resp = await downloadByTokenAll(
            selectItems,
            isZip,
            handleProgress,
          );
          if (resp !== null) {
            if (!resp.result) {
              openPopup(
                {
                  type: 'Alert',
                  message: resp.data.message,
                },
                dispatch,
              );
            } else {
              openPopup(
                {
                  type: 'Alert',
                  message: covi.getDic('Msg_Save', '저장되었습니다.'),
                },
                dispatch,
              );
            }
          }
          // 만료된 파일과 정상 파일 섞어서 다운로드시 Total size에 도달하지 못함
          setProgressData(null);
        } else {
          openPopup(
            {
              type: 'Alert',
              message: getSysMsgFormatStr(
                covi.getDic(
                  'Tmp_saveLimitCnt',
                  '%s개 이상 다운로드할 수 없습니다.',
                ),
                [{ type: 'Plain', data: '5' }],
              ),
            },
            dispatch,
          );
        }
      }
      setSelectItems([]);
    }
    setSelect(!select);
  };

  const handleSelectItem = (item, check) => {
    if (check) {
      if (selectItems.length < 5) {
        // 추가
        setSelectItems([...selectItems, item]);
      } else {
        openPopup(
          {
            type: 'Alert',
            message: getSysMsgFormatStr(
              covi.getDic('Tmp_checkLimitCnt', '%s개 이상 선택할 수 없습니다.'),
              [{ type: 'Plain', data: '5' }],
            ),
          },
          dispatch,
        );

        return false;
      }
    } else {
      // 삭제
      // TODO: 삭제 구현 필요
      const deleteArr = selectItems.filter(
        select => select.token !== item.token,
      );
      setSelectItems(deleteArr);
    }
    return true;
  };

  /**
   * @param {*} load
   * @param {*} total
   */
  const handleProgress = useCallback((load, total) => {
    setProgressData({ load, total });
  }, []);

  const finishProgress = useCallback(() => {
    setProgressData(null);
  }, []);

  useEffect(() => {
    // fileData 호출
    // initialData
    setLoading(true);
    getRoomFiles({
      roomID: roomId,
      page: pageNum,
      loadCnt: loadCnt,
      isImage: 'N',
    }).then(({ data }) => {
      if (data.status == 'SUCCESS') {
        const result = data.result.filter(item => {
          let isBlock = false;
          if (item?.FileID && chineseWall?.length) {
            const senderInfo = isJSONStr(item.SenderInfo)
              ? JSON.parse(item.SenderInfo)
              : item.SenderInfo;
            const { blockFile } = isBlockCheck({
              targetInfo: {
                ...senderInfo,
                id: item?.sender || senderInfo?.sender,
              },
              chineseWall,
            });
            isBlock = blockFile;
          }
          return !isBlock && item;
        });
        setFiles(result);
      } else {
        setFiles([]);
      }
      setLoading(false);
    });
  }, []);

  const handleUpdate = value => {
    const { top } = value;

    if (top > 0.85 && !loading && !pageEnd) {
      // 하위 페이지 추가
      setLoading(true);
      getRoomFiles({
        roomID: roomId,
        page: pageNum + 1,
        loadCnt: loadCnt,
        isImage: 'N',
      }).then(({ data }) => {
        if (data.status == 'SUCCESS') {
          if (data.result.length > 0) {
            const result = data.result.filter(item => {
              let isBlock = false;
              if (item?.FileID && chineseWall?.length) {
                const senderInfo = isJSONStr(item.SenderInfo)
                  ? JSON.parse(item.SenderInfo)
                  : item.SenderInfo;
                const { blockFile } = isBlockCheck({
                  targetInfo: {
                    ...senderInfo,
                    id: item?.sender || senderInfo?.sender,
                  },
                  chineseWall,
                });
                isBlock = blockFile;
              }
              return !isBlock && item;
            });
            setFiles([...files, result]);
            if (data.result.length < loadCnt) {
              setPageEnd(true);
            }
          } else {
            setPageEnd(true);
          }
        } else {
          setPageEnd(true);
        }
        setPageNum(pageNum + 1);
        setLoading(false);
      });
    }
  };

  const drawData = data => {
    let returnJSX = [];
    if (data) {
      let firstDate = 0;
      let sameDateArr = [];
      data.forEach((item, index) => {
        // 86400000 = 1000 * 60 * 60 * 24 (1day)
        const compareDate = Math.floor(item.SendDate / 86400000);
        if (firstDate !== compareDate) {
          if (firstDate !== 0 && sameDateArr?.length) {
            returnJSX.push(
              <FileList
                key={`flist_${firstDate}`}
                files={sameDateArr}
                selectMode={select}
                onSelect={handleSelectItem}
                handleProgress={handleProgress}
              ></FileList>,
            );
          }

          returnJSX.push(
            <div className="datetxt" key={`flist_${firstDate}_txt`}>
              <p>{format(new Date(item.SendDate), 'yyyy.MM.dd')}</p>
            </div>,
          );

          firstDate = compareDate;
          sameDateArr = [];
        }

        sameDateArr.push(item);

        if (index === data.length - 1 && sameDateArr?.length) {
          returnJSX.push(
            <FileList
              key={`flist_${firstDate}`}
              files={sameDateArr}
              selectMode={select}
              onSelect={handleSelectItem}
              handleProgress={handleProgress}
            ></FileList>,
          );
        }
      });
    }
    return returnJSX;
  };

  return (
    <>
      <div className="Layer-fileView" style={{ height: '100%' }}>
        <div className="modalheader">
          <a className="closebtn" onClick={handleClose}></a>
          <div className="modaltit">
            <p>{covi.getDic('FileSummary', '파일 모아보기')}</p>
          </div>
          {(!select &&
            synapDocViewServer &&
            fileAttachViewMode &&
            fileAttachViewMode[0].type === 'PC' &&
            fileAttachViewMode[0].Download === true && (
              <a className="checkbtn" onClick={handleSelect}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-50px',
                    fontWeight: 'bold',
                  }}
                >
                  {covi.getDic('chooseFile', '파일 선택')}
                </div>
              </a>
            )) ||
            (select && (
              <a className="Okbtn" onClick={progressData ? null : handleSelect}>
                {
                  <>
                    <span className="colortxt-point mr5">
                      {selectItems.length}
                    </span>
                    {selectItems.length > 1
                      ? covi.getDic('AllSave', '일괄저장')
                      : covi.getDic('Save', '저장')}
                  </>
                }
              </a>
            )) || <></>}
        </div>
        {(files && files.length > 0 && (
          <Scrollbars
            className="container"
            style={{ height: 'calc(100% - 50px)' }}
            autoHide={true}
            onUpdate={handleUpdate}
          >
            {drawData(files)}
          </Scrollbars>
        )) || (
          <div
            style={{ width: '100%', textAlign: 'center', marginTop: '30px' }}
          >
            {covi.getDic('Msg_NoContent', '조회할 내용이 없습니다.')}
          </div>
        )}
        {progressData && (
          <div className="progress-sticke">
            <div style={{ width: '100%' }}>
              <span>
                {`${covi.getDic(
                  'Downloading',
                  '다운로드중',
                )} ( ${convertFileSize(progressData.load)} / ${convertFileSize(
                  progressData.total,
                )} )`}
              </span>
            </div>
            <div style={{ width: '100%' }}>
              <Progress
                id="progress"
                load={progressData.load}
                total={progressData.total}
                handleFinish={finishProgress}
              ></Progress>
            </div>
          </div>
        )}
      </div>
      {loading && <LoadingWrap></LoadingWrap>}
    </>
  );
};

export default FileSummary;
