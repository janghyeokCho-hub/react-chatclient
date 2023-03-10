import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Config from '@/config/config';
import { Scrollbars } from 'react-custom-scrollbars';
import {
  clearLayer,
  deleteLayer,
  openPopup,
  getSysMsgFormatStr,
  isJSONStr,
} from '@/lib/common';
import { getConfig } from '@/lib/util/configUtil';
import { getRoomFiles, getThumbnail } from '@/lib/message';
import {
  downloadByToken,
  downloadByTokenAll,
  convertFileSize,
  openFilePreview,
} from '@/lib/fileUpload/coviFile';
import { setMoveView } from '@/modules/message';
import LoadingWrap from '@/components/common/LoadingWrap';
import { format } from 'date-fns';
import Progress from '@C/common/buttons/Progress';
import { isBlockCheck } from '@/lib/orgchart';

const PhotoList = ({
  photos,
  onSelect,
  selectMode,
  handleProgress,
  filePermission,
}) => {
  return (
    <ul className="photo-list">
      {photos &&
        photos.map(item => (
          <Photo
            key={item.FileID}
            photo={item}
            onSelect={onSelect}
            selectMode={selectMode}
            handleProgress={handleProgress}
            filePermission={filePermission}
          ></Photo>
        ))}
    </ul>
  );
};

const drawThumbnail = photo => {
  getThumbnail({
    token: photo.FileID,
  }).then(response => {
    const data = Buffer.from(response.data, 'binary').toString('base64');
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    image.onload = () => {
      const imgBox = document.getElementById(`summary_${photo.FileID}`);
      try {
        imgBox.width = image.width;
        imgBox.height = image.height;
        imgBox.src = image.src;
      } catch (e) {}
    };
  });
  return (
    <img
      id={`summary_${photo.FileID}`}
      src={`${Config.ServerURL.HOST}/storage/no_image.jpg`}
      alt={photo.FileName}
    ></img>
  );
};

const Photo = ({
  photo,
  onSelect,
  selectMode,
  handleProgress,
  filePermission,
}) => {
  const [check, setCheck] = useState(false);
  const dispatch = useDispatch();

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
    if (DEVICE_TYPE === 'd') {
      openFilePreview(
        {
          token: item.FileID,
          fileName: item.FileName,
          size: item.FileSize,
          sendDate: item.SendDate,
          MessageID: item.MessageID,
        },
        null,
        'A',
        { roomID: item.RoomID },
      );
    } else {
      let buttonArrs = [
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
                }</li><li>${covi.getDic(
                  'FileSize',
                  '??????',
                )} : ${convertFileSize(item.FileSize)}</li><li>${covi.getDic(
                  'ReceiveDate',
                  '????????????',
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
      // ?????? ???????????? ????????? ???????????? ???????????? ?????? ??????
      if (filePermission.download === 'Y') {
        buttonArrs.push({
          name: covi.getDic('Download', '????????????'),
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
                        '??????????????? ?????????????????????.',
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
        });
      }
      openPopup(
        {
          type: 'Select',
          buttons: buttonArrs,
        },
        dispatch,
      );
    }
  };

  const thumbnail = useMemo(() => {
    return drawThumbnail(photo);
  }, [photo]);

  return (
    <li
      className={check ? 'photocheck' : ''}
      onClick={e => {
        if (selectMode) {
          handleCheck(photo);
        } else {
          handleMenu(photo);
        }
        e.preventDefault();
        e.stopPropagation();
      }}
    >
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
                  handleCheck(photo);
                } else {
                  handleMenu(photo);
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
      <a>
        <div className="photo-list-img">{thumbnail}</div>
      </a>
    </li>
  );
};

const PhotoSummary = ({ roomId }) => {
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

      if (selectItems.length) {
        // ??????????????? ???????????? ?????? ??????
        let message = covi.getDic('Msg_Save', '?????????????????????.');
        if (filePermission.download === 'N') {
          message = covi.getDic(
            'Block_FileDownload',
            '?????? ??????????????? ???????????? ????????????.',
          );
        }
        // TODO: ?????? ????????????????????? ?????? ??????
        // ???????????? ??? ?????? ??????
        // ???????????? ?????? && ???????????? 15??? ??????
        else if (selectItems.length <= 15) {
          // 2??? ????????? ??????
          const resp = await downloadByTokenAll(
            selectItems,
            selectItems.length > 1,
            handleProgress,
          );
          if (!resp?.result) {
            message = resp.data.message;
          }
          // ????????? ????????? ?????? ?????? ????????? ??????????????? Total size??? ???????????? ??????
          setProgressData(null);
        } else {
          message = getSysMsgFormatStr(
            covi.getDic(
              'Tmp_saveLimitCnt',
              '%s??? ?????? ??????????????? ??? ????????????.',
            ),
            [{ type: 'Plain', data: '15' }],
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
      if (selectItems.length < 15) {
        // ??????
        setSelectItems([...selectItems, item]);
      } else {
        openPopup(
          {
            type: 'Alert',
            message: getSysMsgFormatStr(
              covi.getDic('Tmp_checkLimitCnt', '%s??? ?????? ????????? ??? ????????????.'),
              [{ type: 'Plain', data: '15' }],
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
      isImage: 'Y',
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

    return () => {
      setLoading(false);
    };
  }, [chineseWall]);

  const handleUpdate = value => {
    if (value?.top > 0.85 && !loading && !pageEnd) {
      // ?????? ????????? ??????
      setLoading(true);
      getRoomFiles({
        roomID: roomId,
        page: pageNum + 1,
        loadCnt: loadCnt,
        isImage: 'Y',
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
        const compareDate = Math.floor(item.SendDate / 86400000);
        if (firstDate !== compareDate) {
          if (firstDate !== 0 && sameDateArr?.length) {
            returnJSX.push(
              <PhotoList
                key={`plist_${firstDate}`}
                photos={sameDateArr}
                selectMode={select}
                onSelect={handleSelectItem}
                handleProgress={handleProgress}
                filePermission={filePermission}
              ></PhotoList>,
            );
          }
          returnJSX.push(
            <div className="datetxt" key={`plist_date_${item.SendDate}`}>
              <p>{format(new Date(item.SendDate), 'yyyy.MM.dd')}</p>
            </div>,
          );

          firstDate = compareDate;
          sameDateArr = [];
        }

        sameDateArr.push(item);

        if (index === data.length - 1 && sameDateArr?.length) {
          returnJSX.push(
            <PhotoList
              key={`plist_${firstDate}`}
              photos={sameDateArr}
              selectMode={select}
              onSelect={handleSelectItem}
              filePermission={filePermission}
            ></PhotoList>,
          );
        }
      });
    }
    return returnJSX;
  };

  return (
    <>
      <div className="Layer-photoView" style={{ height: '100%' }}>
        <div className="modalheader">
          <a className="closebtn" onClick={handleClose}></a>
          <div className="modaltit">
            <p>{covi.getDic('PhotoSummary', '?????? ????????????')}</p>
          </div>
          {filePermission.download === 'Y' &&
            ((!select && (
              <a className="checkbtn" onClick={handleSelect}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-50px',
                    fontWeight: 'bold',
                  }}
                >
                  {covi.getDic('choosePhoto', '?????? ??????')}
                </div>
              </a>
            )) || (
              <a className="Okbtn" onClick={progressData ? null : handleSelect}>
                <span className="colortxt-point mr5">{selectItems.length}</span>
                {selectItems.length > 1
                  ? covi.getDic('AllSave', '????????????')
                  : covi.getDic('Save', '??????')}
              </a>
            ))}
        </div>

        {(files?.length && (
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

export default PhotoSummary;
