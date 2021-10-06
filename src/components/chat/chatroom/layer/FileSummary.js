import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import {
  clearLayer,
  deleteLayer,
  openPopup,
  getSysMsgFormatStr,
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
import { getDic } from '@/lib/util/configUtil';

const synapDocViewServer = getConfig('SynapDocViewServer');
const fileAttachViewMode = getConfig('FileAttachViewMode');

const FileList = ({ files, onSelect, selectMode }) => {
  return (
    <ul className="file-list">
      {files &&
        files.map(item => (
          <File
            key={item.FileID}
            file={item}
            onSelect={onSelect}
            selectMode={selectMode}
          ></File>
        ))}
    </ul>
  );
};

const File = ({ file, onSelect, selectMode }) => {
  const [check, setCheck] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setCheck(false);
  }, [selectMode]);

  const handleCheck = (fileID, fileName) => {
    if (onSelect({ token: fileID, name: fileName }, !check)) {
      setCheck(!check);
    }
  };

  const handleMenu = item => {
    //일렉트론 다운로드o 뷰어o
    if(DEVICE_TYPE === 'd' && synapDocViewServer && fileAttachViewMode && fileAttachViewMode[0].type === 'PC' && fileAttachViewMode[0].Viewer === true && fileAttachViewMode[0].Download === true){
      openPopup(
        {
          type: 'Select',
          buttons: [
            {
              name: covi.getDic('Detail'),
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
            {
              name: covi.getDic('RunViewer'),
              callback: () => {
                let fileType = 'URL';
                let token = localStorage.getItem('covi_user_access_token')
                token = token.replace(/\^/gi,'-')
                //filePath 사이냅 서버가 문서를 변환하기 위해 다운받을 주소 
                let eumTalkfilePath = `${window.covi.baseURL}/restful/na/nf/synabDownload/${item.FileID}/${token}`;
                let filePath = `${eumTalkfilePath}`;
  
                //fid 사이냅 변환요청시 관리자 페이지에 표시되는 문서ID (다운로드 링크에 따라오는 파일토큰)
                let fid = `${item.token}`;
                // let waterMarkText = 'EumTalk';
                viewerApi.sendConversionRequest({
                  fileType, filePath, fid
                }).then(response => {
                  let job = 'job';
                  let key = response.data.key;
                  let url = ''
                  let view = 'view/'
                  url = response.config.url.indexOf(job);
                  url = response.config.url.substring(0,url);
                  url = url + view + key;
  
                  if (DEVICE_TYPE == 'd') {
                    window.openExternalPopup(url)
                  }else{
                    window.open(url)
                  }
                  // testFunc(key)
                }).catch(response => {
                  if(response){
                    openPopup(
                      {
                        type: 'Alert',
                        message: getDic('Msg_FileExpired'),
                      },
                      dispatch,
                    );
                  }
                })
              }
            },
            {
              name: covi.getDic('Download'),
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
                          message: covi.getDic('Msg_DownloadSuccess'),
                        },
                        dispatch,
                      );
                    }
                  },
                );
              },
            },
          ],
        },
        dispatch,
      )
    }
    //일렉트론 다운로드o 뷰어x
    else if(synapDocViewServer && fileAttachViewMode && fileAttachViewMode[0].type === 'PC' && fileAttachViewMode[0].Download === true){
      openPopup(
        {
          type: 'Select',
          buttons: [
            {
              name: covi.getDic('Detail'),
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
            {
              name: covi.getDic('Download'),
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
                            message: covi.getDic('Msg_DownloadSuccess'),
                          },
                          dispatch,
                        );
                      }
                    },
                  );
              },
            },
          ],
        },
        dispatch,
      )
    }
    //일렉트론 다운로드x 뷰어o
    else if(DEVICE_TYPE === 'd' && synapDocViewServer && fileAttachViewMode && fileAttachViewMode[0].type === 'PC' && fileAttachViewMode[0].Viewer === true){
      openPopup(
        {
          type: 'Select',
          buttons: [
            {
              name: covi.getDic('Detail'),
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
            {
              name: covi.getDic('RunViewer'),
              callback: () => {
                let fileType = 'URL';
                let token = localStorage.getItem('covi_user_access_token')
                token = token.replace(/\^/gi,'-')
                //filePath 사이냅 서버가 문서를 변환하기 위해 다운받을 주소 
                let eumTalkfilePath = `${window.covi.baseURL}/restful/na/nf/synabDownload/${item.FileID}/${token}`;
                let filePath = `${eumTalkfilePath}`;

                //fid 사이냅 변환요청시 관리자 페이지에 표시되는 문서ID (다운로드 링크에 따라오는 파일토큰)
                let fid = `${item.token}`;
                // let waterMarkText = 'EumTalk';
                viewerApi.sendConversionRequest({
                  fileType, filePath, fid
                }).then(response => {
                  let job = 'job';
                  let key = response.data.key;
                  let url = ''
                  let view = 'view/'
                  url = response.config.url.indexOf(job);
                  url = response.config.url.substring(0,url);
                  url = url + view + key;

                  if (DEVICE_TYPE == 'd') {
                    window.openExternalPopup(url)
                  }else{
                    window.open(url)
                  }
                  // testFunc(key)
                }).catch(response => {
                  if(response){
                    openPopup(
                      {
                        type: 'Alert',
                        message: getDic('Msg_FileExpired'),
                      },
                      dispatch,
                    );
                  }
                })
              }
            },
          ],
        },
        dispatch,
      )
    }
    //브라우저(브라우저에서는 뷰어 안되니) 다운로드x
    else if (synapDocViewServer && fileAttachViewMode && fileAttachViewMode[0].type === 'PC' && fileAttachViewMode[0].Viewer === true){
    openPopup(
      {
        type: 'Select',
        buttons: [
          {
            name: covi.getDic('Detail'),
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
    )}
    // 브라우저 다운로드o
    else if(synapDocViewServer && fileAttachViewMode && fileAttachViewMode[0].type === 'PC'){
      openPopup(
        {
          type: 'Select',
          buttons: [
            {
              name: covi.getDic('Detail'),
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
            {
              name: covi.getDic('Download'),
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
                            message: covi.getDic('Msg_DownloadSuccess'),
                          },
                          dispatch,
                        );
                      }
                    },
                  );
              },
            },
          ],
        },
        dispatch,
      )
    };
  };

  return (
    <li
      onClick={e => {
        if (selectMode) {
          handleCheck(file.FileID, file.FileName);
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
            {covi.getDic('FileSize')} {convertFileSize(file.FileSize)}
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
                    handleCheck(file.FileID, file.FileName);
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

const FileSummary = ({ roomId }) => {
  const dispatch = useDispatch();
  const loadCnt = 30;
  const [select, setSelect] = useState(false);
  const [selectItems, setSelectItems] = useState([]);
  const [files, setFiles] = useState([]);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageEnd, setPageEnd] = useState(false);

  const handleClose = () => {
    deleteLayer(dispatch);
  };

  const handleSelect = async () => {
    setSelect(!select);

    if (select) {
      // 이전 상태가 선택모드였다면 변경시 cnt도 0으로 초기화
      if (selectItems.length > 0) {
        if (selectItems.length <= 5) {
          const arrDownloadList = await downloadByTokenAll(selectItems);
          if (arrDownloadList) {
            Promise.all(arrDownloadList).then(values => {
              // 실패한 조건만 탐색
              const downloaded = values.reduce(
                (acc, val) => {
                  if (val.result === false) {
                    return val;
                  }

                  return acc;
                },
                { result: true, data: null },
              );

              if (!downloaded.result) {
                openPopup(
                  {
                    type: 'Alert',
                    message: downloaded.data.message,
                  },
                  dispatch,
                );
              } else {
                openPopup(
                  {
                    type: 'Alert',
                    message: covi.getDic('Msg_Save'),
                  },
                  dispatch,
                );
              }
            });
          }
        } else {
          openPopup(
            {
              type: 'Alert',
              message: getSysMsgFormatStr(covi.getDic('Tmp_saveLimitCnt'), [
                { type: 'Plain', data: '5' },
              ]),
            },
            dispatch,
          );
        }
      }

      setSelectItems([]);
    }
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
            message: getSysMsgFormatStr(covi.getDic('Tmp_checkLimitCnt'), [
              { type: 'Plain', data: '5' },
            ]),
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
        setFiles(data.result);
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
            setFiles([...files, ...data.result]);
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
        if (firstDate != compareDate) {
          if (firstDate != 0 && sameDateArr.length > 0)
            returnJSX.push(
              <FileList
                key={`flist_${firstDate}`}
                files={sameDateArr}
                selectMode={select}
                onSelect={handleSelectItem}
              ></FileList>,
            );

          returnJSX.push(
            <div className="datetxt" key={`flist_${firstDate}_txt`}>
              <p>{format(new Date(item.SendDate), 'yyyy.MM.dd')}</p>
            </div>,
          );

          firstDate = compareDate;
          sameDateArr = [];
        }

        sameDateArr.push(item);

        if (index == data.length - 1 && sameDateArr.length > 0) {
          returnJSX.push(
            <FileList
              key={`flist_${firstDate}`}
              files={sameDateArr}
              selectMode={select}
              onSelect={handleSelectItem}
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
            <p>{covi.getDic('FileSummary')}</p>
          </div>
          {(!select && synapDocViewServer && fileAttachViewMode && fileAttachViewMode[0].type === 'PC' && fileAttachViewMode[0].Download === true &&
              <a className="checkbtn" onClick={handleSelect}>
                <div style={{ position: 'absolute', left: '-50px', fontWeight: 'bold' }}>
                  {covi.getDic('chooseFile')}
                </div>
              </a>
                  ) || ( select &&
            <a className="Okbtn" onClick={handleSelect}>
              <span className="colortxt-point mr5">{selectItems.length}</span>
              {covi.getDic('Save')}
            </a>
          ) || (
            <>
            </>
          )}
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
            {covi.getDic('Msg_NoContent')}
          </div>
        )}
      </div>
      {loading && <LoadingWrap></LoadingWrap>}
    </>
  );
};

export default FileSummary;
