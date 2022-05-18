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

// [0] PC [1] MOBILE
const downloadOption = getConfig('FileAttachViewMode') || [];

const PhotoList = ({ photos, onSelect, selectMode, handleProgress }) => {
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

const Photo = ({ photo, onSelect, selectMode, handleProgress }) => {
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
                )} : ${convertFileSize(item.FileSize)}</li><li>${covi.getDic(
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
      ];
      // 파일 다운로드 허용일 경우에만 다운로드 옵션 노출
      if (!downloadOption.length || downloadOption[0].Download === true) {
        buttonArrs.push({
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

const PhotoSummary = ({ roomId, chineseWall }) => {
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

      if (selectItems.length) {
        // 다운로드가 금지되어 있는 경우
        if (downloadOption.length && downloadOption[0].Download === false) {
          openPopup(
            {
              type: 'Alert',
              message: covi.getDic(
                'Block_FileDownload',
                '파일 다운로드가 금지되어 있습니다.',
              ),
            },
            dispatch,
          );
        }
        // TODO: 차후 멀티다운로드로 수정 필요
        // 만료처리 등 처리 필요
        // 다운로드 가능 && 선택개수 15개 미만
        else if (selectItems.length <= 15) {
          // 2개 이상은 압축
          const resp = await downloadByTokenAll(
            selectItems,
            selectItems.length > 1,
            handleProgress,
          );
          if (resp?.result) {
            openPopup(
              {
                type: 'Alert',
                message: covi.getDic('Msg_Save', '저장되었습니다.'),
              },
              dispatch,
            );
          } else {
            openPopup(
              {
                type: 'Alert',
                message: resp.data.message,
              },
              dispatch,
            );
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
                [{ type: 'Plain', data: '15' }],
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
      if (selectItems.length < 15) {
        // 추가
        setSelectItems([...selectItems, item]);
      } else {
        openPopup(
          {
            type: 'Alert',
            message: getSysMsgFormatStr(
              covi.getDic('Tmp_checkLimitCnt', '%s개 이상 선택할 수 없습니다.'),
              [{ type: 'Plain', data: '15' }],
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
                id: item.sender || senderInfo.sender,
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
  }, []);

  const handleUpdate = value => {
    if (value?.top > 0.85 && !loading && !pageEnd) {
      // 하위 페이지 추가
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
                    id: item.sender || senderInfo.sender,
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
            <p>{covi.getDic('PhotoSummary', '사진 모아보기')}</p>
          </div>
          {(!select && (
            <a className="checkbtn" onClick={handleSelect}>
              <div
                style={{
                  position: 'absolute',
                  left: '-50px',
                  fontWeight: 'bold',
                }}
              >
                {covi.getDic('choosePhoto', '사진 선택')}
              </div>
            </a>
          )) || (
            <a className="Okbtn" onClick={progressData ? null : handleSelect}>
              <span className="colortxt-point mr5">{selectItems.length}</span>
              {selectItems.length > 1
                ? covi.getDic('AllSave', '일괄저장')
                : covi.getDic('Save', '저장')}
            </a>
          )}
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

export default PhotoSummary;
