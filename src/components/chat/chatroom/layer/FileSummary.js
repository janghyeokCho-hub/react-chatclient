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

const FileList = ({
  files,
  onSelect,
  selectMode,
  handleProgress,
  filePermission,
}) => {
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
            filePermission={filePermission}
          ></File>
        ))}
    </ul>
  );
};

const File = ({
  file,
  onSelect,
  selectMode,
  handleProgress,
  filePermission,
}) => {
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
    const buttons = [
      {
        name: covi.getDic('Detail', '????????????'),
        callback: () => {
          openPopup(
            {
              type: 'Alert',
              message: `<ul className="menulist">
              <li style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
              ${covi.getDic('FileName', '?????????')} : ${
                item.FileName
              }</li><li>${covi.getDic('FileSize', '??????')} : ${convertFileSize(
                item.FileSize,
              )}</li><li>${covi.getDic('ReceiveDate', '????????????')} : ${format(
                new Date(item.SendDate),
                'yyyy.MM.dd HH:mm:ss',
              )}</li>`,
            },
            dispatch,
          );
        },
      },
      {
        name: covi.getDic('ShowChat', '????????????'),
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
    ];

    if (filePermission.download === 'Y') {
      buttons.push({
        name: covi.getDic('Download', '????????????'),
        callback: () => {
          let message = covi.getDic(
            'Msg_DownloadSuccess',
            '??????????????? ?????????????????????.',
          );
          if (filePermission.download !== 'Y') {
            message = covi.getDic(
              'Block_FileDownload',
              '?????? ??????????????? ???????????? ????????????.',
            );
          } else {
            downloadByToken(
              item.FileID,
              item.FileName,
              data => {
                if (data.result !== 'SUCCESS') {
                  message = data.message;
                }
                openPopup(
                  {
                    type: 'Alert',
                    message,
                  },
                  dispatch,
                );
              },
              e => {
                handleProgress(e.loaded, e.total);
              },
            );
          }
        },
      });
    }
    if (DEVICE_TYPE === 'd' && filePermission.viewer === 'Y') {
      buttons.push({
        name: covi.getDic('RunViewer', '????????? ??????'),
        callback: async () => {
          if (filePermission.viewer !== 'Y') {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic(
                  'Msg_FilePermission',
                  '????????? ?????? ???????????????.',
                ),
              },
              dispatch,
            );
          } else {
            await viewerApi.requestSynapViewer(dispatch, {
              fileId: item.FileID,
              ext: item.Extension,
              roomID,
            });
          }
        },
      });
    }

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
            {covi.getDic('FileSize', '??????')} {convertFileSize(file.FileSize)}
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

const FileSummary = ({ roomId }) => {
  const dispatch = useDispatch();
  const loadCnt = 30;
  const filePermission = useSelector(({ login }) => login.filePermission);
  const chineseWall = useSelector(({ login }) => login.chineseWall);
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
      // ?????? ????????? ????????????????????? ????????? cnt??? 0?????? ?????????
      if (selectItems.length > 0) {
        let message = covi.getDic('Msg_Save', '?????????????????????.');
        if (selectItems.length <= 5) {
          // 2??? ????????? ??????
          const isZip = selectItems.length > 1;
          if (filePermission.download !== 'Y') {
            message = covi.getDic(
              'Block_FileDownload',
              '?????? ??????????????? ???????????? ????????????.',
            );
          } else {
            const resp = await downloadByTokenAll(
              selectItems,
              isZip,
              handleProgress,
            );
            if (resp !== null) {
              if (!resp.result) {
                message = resp.data.message;
              }
            }
          }

          // ????????? ????????? ?????? ?????? ????????? ??????????????? Total size??? ???????????? ??????
          setProgressData(null);
        } else {
          message = getSysMsgFormatStr(
            covi.getDic(
              'Tmp_saveLimitCnt',
              '%s??? ?????? ??????????????? ??? ????????????.',
            ),
            [{ type: 'Plain', data: '5' }],
          );
        }
        openPopup(
          {
            type: 'Alert',
            message,
          },
          dispatch,
        );
      }
      setSelectItems([]);
    }
    setSelect(!select);
  };

  const handleSelectItem = (item, check) => {
    if (check) {
      if (selectItems.length < 5) {
        // ??????
        setSelectItems([...selectItems, item]);
      } else {
        openPopup(
          {
            type: 'Alert',
            message: getSysMsgFormatStr(
              covi.getDic('Tmp_checkLimitCnt', '%s??? ?????? ????????? ??? ????????????.'),
              [{ type: 'Plain', data: '5' }],
            ),
          },
          dispatch,
        );

        return false;
      }
    } else {
      // ??????
      // TODO: ?????? ?????? ??????
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
    // fileData ??????
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
  }, [chineseWall]);

  const handleUpdate = value => {
    const { top } = value;

    if (top > 0.85 && !loading && !pageEnd) {
      // ?????? ????????? ??????
      setLoading(true);
      getRoomFiles({
        roomID: roomId,
        page: pageNum + 1,
        loadCnt: loadCnt,
        isImage: 'N',
      }).then(({ data }) => {
        if (data?.status === 'SUCCESS') {
          if (data?.result?.length) {
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
            setFiles(files.concat(result));
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
                filePermission={filePermission}
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
              filePermission={filePermission}
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
            <p>{covi.getDic('FileSummary', '?????? ????????????')}</p>
          </div>
          {(filePermission.download === 'Y' &&
            ((!select && synapDocViewServer && (
              <a className="checkbtn" onClick={handleSelect}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-50px',
                    fontWeight: 'bold',
                  }}
                >
                  {covi.getDic('chooseFile', '?????? ??????')}
                </div>
              </a>
            )) ||
              (select && (
                <a
                  className="Okbtn"
                  onClick={progressData ? null : handleSelect}
                >
                  {
                    <>
                      <span className="colortxt-point mr5">
                        {selectItems.length}
                      </span>
                      {selectItems.length > 1
                        ? covi.getDic('AllSave', '????????????')
                        : covi.getDic('Save', '??????')}
                    </>
                  }
                </a>
              )))) || <></>}
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
            {covi.getDic('Msg_NoContent', '????????? ????????? ????????????.')}
          </div>
        )}
        {progressData && (
          <div className="progress-sticke">
            <div style={{ width: '100%' }}>
              <span>
                {`${covi.getDic(
                  'Downloading',
                  '???????????????',
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
