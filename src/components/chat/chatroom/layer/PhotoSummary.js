import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import Config from '@/config/config';
import { Scrollbars } from 'react-custom-scrollbars';
import {
  clearLayer,
  deleteLayer,
  openPopup,
  getSysMsgFormatStr,
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

// [0] PC [1] MOBILE
const downloadOption = getConfig('FileAttachViewMode') || [];

const PhotoList = ({ photos, onSelect, selectMode }) => {
  return (
    <ul className="photo-list">
      {photos &&
        photos.map(item => (
          <Photo
            key={item.FileID}
            photo={item}
            onSelect={onSelect}
            selectMode={selectMode}
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

const Photo = ({ photo, onSelect, selectMode }) => {
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
    if (DEVICE_TYPE == 'd') {
      const file = {
        token: item.FileID,
        fileName: item.FileName,
        size: item.FileSize,
        sendDate: item.SendDate,
        MessageID: item.MessageID,
      };
      openFilePreview(file, null, 'A', { roomID: item.RoomID });
    } else {
      let buttonArrs = [
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
      ];
      // 파일 다운로드 허용일 경우에만 다운로드 옵션 노출
      if (downloadOption.length === 0 || downloadOption[0].Download === true) {
        buttonArrs.push({
          name: covi.getDic('Download'),
          callback: () => {
            downloadByToken(item.FileID, downloadPath + item.FileName, data => {
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
            });
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
    setSelect(!select);

    if (select) {
      // 이전 상태가 선택모드였다면 변경시 cnt도 0으로 초기화

      if (selectItems.length > 0) {
        // 다운로드가 금지되어 있는 경우
        if (
          downloadOption.length !== 0 &&
          downloadOption[0].Download === false
        ) {
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
          const arrDownloadList = await downloadByTokenAll(selectItems);
          if (arrDownloadList) {
            Promise.all(arrDownloadList).then(values => {
              // 실패한 조건만 탐색
              const downloaded = values.reduce(
                (acc, val) => {
                  if (val.result === false) return val;
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
                { type: 'Plain', data: '15' },
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
      if (selectItems.length < 15) {
        // 추가
        setSelectItems([...selectItems, item]);
      } else {
        openPopup(
          {
            type: 'Alert',
            message: getSysMsgFormatStr(covi.getDic('Tmp_checkLimitCnt'), [
              { type: 'Plain', data: '15' },
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

  const handleAllDownLoad = async () => {
    const resp = await downloadByTokenAll(selectItems, true, handleProgress);
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
            message: covi.getDic('Msg_Save'),
          },
          dispatch,
        );
      }
    }
    // 만료된 파일과 정상 파일 섞어서 다운로드시 Total size에 도달하지 못함
    setProgressData(null);
  };

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
      setFiles(data.status == 'SUCCESS' ? data.result : []);
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
        isImage: 'Y',
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
              <PhotoList
                key={`plist_${firstDate}`}
                photos={sameDateArr}
                selectMode={select}
                onSelect={handleSelectItem}
              ></PhotoList>,
            );

          returnJSX.push(
            <div className="datetxt" key={`plist_date_${item.SendDate}`}>
              <p>{format(new Date(item.SendDate), 'yyyy.MM.dd')}</p>
            </div>,
          );

          firstDate = compareDate;
          sameDateArr = [];
        }

        sameDateArr.push(item);

        if (index == data.length - 1 && sameDateArr.length > 0) {
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
            <p>{covi.getDic('PhotoSummary')}</p>
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
                {covi.getDic('choosePhoto')}
              </div>
            </a>
          )) || (
            <a
              className="Okbtn"
              onClick={
                progressData
                  ? null
                  : selectItems.length > 1
                  ? handleAllDownLoad
                  : handleSelect
              }
            >
              <span className="colortxt-point mr5">{selectItems.length}</span>
              {progressData
                ? covi.getDic('Compressing')
                : selectItems.length > 1
                ? covi.getDic('AllSave')
                : covi.getDic('Save')}
            </a>
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
        {progressData && (
          <div className="progress-sticke">
            <div style={{ width: '100%' }}>
              <span>
                {`${covi.getDic('Compressing')} ( ${convertFileSize(
                  progressData.load,
                )} / ${convertFileSize(progressData.total)} )`}
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
