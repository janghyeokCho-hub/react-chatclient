import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSubPopData, moveContentView } from '@/lib/deviceConnector';
import * as messageApi from '@/lib/message';
import {
  resizeImage,
  downloadByToken,
  convertFileSize,
  getOrientation,
} from '@/lib/fileUpload/coviFile';
import * as coviFile from '@/lib/fileUpload/coviFile';
import Config from '@/config/config';
import { openPopup } from '@/lib/common';
import { format } from 'date-fns';
import LoadingWrap from '@COMMON/LoadingWrap';

let isDown = false;
const FileLayer = () => {
  const fileData = getSubPopData('preview');
  const filePermission = useSelector(({ login }) => login.filePermission);
  const [viewSize, setViewSize] = useState(0);
  const [previewFile, setPreviewFile] = useState(fileData.file);
  const [totalFile, setTotalFile] = useState(fileData.files);
  const [currIndex, setCurrIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [copyLoading, setCopyLoading] = useState(false);

  const [infoBox, setInfoBox] = useState(true);

  const [orientationStyle, setOrientationStyle] = useState({});

  const dispatch = useDispatch();

  const imageBox = useRef();
  const mainBox = useRef();

  document.onkeydown = e => {
    if (e.ctrlKey && e.code === 'KeyC' && !copyLoading) {
      if (filePermission.download === 'Y') {
        handleCopy();
      } else {
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
    }
  };

  const handleCopy = async () => {
    setCopyLoading(true);
    let message = '';
    if (filePermission.download === 'Y') {
      try {
        const response = await fetch(imageData.src);
        const blob = await response.blob();
        const data = new ClipboardItem({
          ['image/png']: blob,
        });
        await navigator.clipboard
          .write([data])
          .then(() => {
            message = covi.getDic('Msg_Copy', '복사되었습니다.');
          })
          .catch(() => {
            message = covi.getDic(
              'Msg_Error',
              '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
            );
          });
      } catch (err) {
        message = covi.getDic(
          'Msg_Error',
          '오류가 발생했습니다.<br/>관리자에게 문의해주세요.',
        );
      }
    } else {
      message = covi.getDic(
        'Block_FileDownload',
        '파일 다운로드가 금지되어 있습니다.',
      );
    }
    openPopup(
      {
        type: 'Alert',
        message,
        callback: () => {
          setCopyLoading(false);
        },
      },
      dispatch,
    );
  };

  const handleBefore = () => {
    if (currIndex - 1 >= 0) {
      const moveIdx = currIndex - 1;
      if (fileData.type === 'A' && totalFile[moveIdx] == null) {
        setLoading(true);
        messageApi
          .getRoomImages({
            roomID: fileData.params.roomID,
            token: previewFile.token,
            type: 'B',
            cnt: 10,
          })
          .then(({ data }) => {
            let files = totalFile;
            let moveFile = null;

            data.images.forEach(item => {
              const file = {
                fileName: item.FileName,
                token: item.FileID,
                size: item.FileSize,
                sendDate: item.sendDate,
                messageId: item.MessageID,
                ext: item.Extension,
              };

              files[item.RNUM - 1] = file;

              if (item.RNUM - 1 == moveIdx) {
                moveFile = file;
              }
            });

            files = files.map(item => {
              return item;
            });

            setTotalFile(files);
            setPreviewFile(moveFile);
            setLoading(false);
          });
      }

      setPreviewFile(totalFile[moveIdx]);
      setCurrIndex(moveIdx);
      setViewSize(0);
    }
  };

  const handleNext = () => {
    if (currIndex + 1 < maxIndex) {
      const moveIdx = currIndex + 1;
      if (fileData.type === 'A' && totalFile[moveIdx] == null) {
        setLoading(true);
        messageApi
          .getRoomImages({
            roomID: fileData.params.roomID,
            token: previewFile.token,
            type: 'N',
            cnt: 10,
          })
          .then(({ data }) => {
            let files = totalFile;
            let moveFile = null;

            data.images.forEach(item => {
              const file = {
                fileName: item.FileName,
                token: item.FileID,
                size: item.FileSize,
                sendDate: item.sendDate,
                messageId: item.MessageID,
                ext: item.Extension,
              };

              files[item.RNUM - 1] = file;

              if (item.RNUM - 1 == moveIdx) {
                moveFile = file;
              }
            });

            files = files.map(item => item);

            setTotalFile(files);
            setPreviewFile(moveFile);
            setLoading(false);
          });
      }
      setPreviewFile(totalFile[moveIdx]);
      setCurrIndex(moveIdx);
      setViewSize(0);
    }
  };

  const handleSave = () => {
    if (filePermission.download === 'Y') {
      downloadByToken(previewFile.token, previewFile.fileName, data => {
        let message = covi.getDic('Msg_Save', '저장되었습니다.');
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
      });
    } else {
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
  };

  const handleInfo = () => {
    messageApi.getFileInfo({ fileId: previewFile.token }).then(({ data }) => {
      if (data.status == 'SUCCESS') {
        openPopup(
          {
            type: 'Alert',
            message: `<ul className="menulist"><li>${covi.getDic(
              'FileName',
              '파일명',
            )} : ${data.result.fileName}</li><li>${covi.getDic(
              'FileSize',
              '용량',
            )} : ${convertFileSize(data.result.fileSize)}</li><li>${covi.getDic(
              'ReceiveDate',
              '수신일시',
            )} : ${format(
              new Date(data.result.sendDate),
              'yyyy.MM.dd HH:mm:ss',
            )}</li>`,
          },
          dispatch,
        );
      }
    });
  };

  const handleMoveContent = () => {
    messageApi.getFileInfo({ fileId: previewFile.token }).then(({ data }) => {
      if (data.status === 'SUCCESS') {
        moveContentView(data.result.roomID, {
          moveId: data.result.messageID,
          roomId: data.result.roomID,
          isChannel: data.result.roomType === 'C',
        });
      }
    });
  };

  useEffect(() => {
    const firstLoad = async () => {
      if (fileData.type === 'L' && fileData.files) {
        let findIndex = -1;
        totalFile.forEach((item, index) => {
          if (item.token == previewFile.token) {
            findIndex = index;
            return false;
          }
        });

        if (findIndex > -1) {
          setCurrIndex(findIndex);
        }

        setMaxIndex(totalFile.length);
      } else if (fileData.type === 'A') {
        // 파일 관련 정보 load 및 state 세팅

        const response = await messageApi.getRoomImages({
          roomID: fileData.params.roomID,
          token: previewFile.token,
          type: 'E',
          cnt: 0,
        });

        const data = response.data;
        // 전체 파일 기준 현재 index 조회 ( RoomID, UserCode, FileToken 정보 필요)

        // total, current, currentObj 정보가 조회되면 state 변경
        const total = data.cntInfo.maxCnt;
        const curr = data.cntInfo.rowNum - 1;
        let files = new Array(total);
        files.fill(null); // null 초기화

        files[curr] = fileData.file;

        setCurrIndex(curr);
        setMaxIndex(total);
        setTotalFile(files);
        setViewSize(0);
      }
    };
    /* 코드 중복.
    // 차후 renderer - main 통신으로 변경 필요
    if (previewFile != null) {
      messageApi
        .getOriginalImage({
          token: previewFile.token,
        })
        .then(response => {
          const data = Buffer.from(response.data, 'binary').toString('base64');

          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          image.onload = () => {
            const imgBox = imageBox.current;
            try {
              // hieght에 따른 width 비율계산 필요
              const resize = resizeImage(image.width, image.height, 650, 720);

              imgBox.width = resize.resizeWidth;
              imgBox.height = resize.resizeHeight;
              imgBox.setAttribute('data-width', resize.resizeWidth);
              imgBox.setAttribute('data-height', resize.resizeHeight);
              imgBox.src = image.src;
            } catch (e) {}
          };
        })
        .catch(() => {
          const imgBox = imageBox.current;
          imgBox.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
          imgBox.width = 300;
          imgBox.height = 300;
        });
    } else {
      const imgBox = imageBox.current;
      imgBox.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
      imgBox.width = 300;
      imgBox.height = 300;
    }
*/
    firstLoad();

    window.onmousewheel = event => {
      if (event.ctrlKey == true) {
        event.preventDefault();

        if (event.wheelDelta > 0) {
          handleViewSize(1);
        } else {
          handleViewSize(-1);
        }
      }
    };

    window.onresize = () => {
      handleViewCenter();
    };

    imageBox.current.ondragstart = event => {
      event.preventDefault();
    };

    imageBox.current.onmousedown = () => {
      isDown = true;
    };

    imageBox.current.onmousemove = event => {
      if (isDown) {
        const { offsetHeight: parentHeight, offsetWidth: parentWidth } =
          event.target.offsetParent;
        const {
          height: height,
          width: width,
          offsetTop: top,
          offsetLeft: left,
        } = event.target;

        if (parentHeight < height || parentWidth < width) {
          const moveTop = top + event.movementY;
          const moveLeft = left + event.movementX;

          if (moveTop < 0 && moveTop > parentHeight - height) {
            event.target.style.top = `${moveTop}px`;
          }

          if (moveLeft < 0 && moveLeft > parentWidth - width) {
            event.target.style.left = `${moveLeft}px`;
          }
        }
      }
    };

    imageBox.current.onmouseup = () => {
      isDown = false;
    };

    return () => {
      window.onresize = null;
      window.onmousewheel = null;
      imageBox.current.onmousedown = null;
      imageBox.current.onmouseup = null;
      imageBox.current.onmousemove = null;
      imageBox.current.ondragstart = null;
    };
  }, []);

  useEffect(() => {
    if (previewFile != null) {
      messageApi
        .getOriginalImage({
          token: previewFile.token,
        })
        .then(async response => {
          console.log('response!!');
          const data = Buffer.from(response.data, 'binary').toString('base64');
          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          image.onload = async () => {
            const imgBox = imageBox.current;
            try {
              const fileCtrl = coviFile.getInstance();
              let orientation = await getOrientation(image);
              const resize = resizeImage(image.width, image.height, 650, 650);
              const rotatedImage = fileCtrl.makeThumb(
                image,
                resize.resizeWidth * 3,
                resize.resizeHeight * 3,
                orientation,
              );
              imgBox.setAttribute('data-width', rotatedImage.width / 3);
              imgBox.setAttribute('data-height', rotatedImage.height / 3);
              imgBox.width = rotatedImage.width / 3;
              imgBox.height = rotatedImage.height / 3;
              imgBox.src = rotatedImage.data;

              /*
              // 미리보기 성능 이슈로 css rotate로 변경 필요
              // css로  rotate시 position 트러짐. top margin 수정 필요.  
              let styles = await getOrientationFixedStyles(image);     
              setOrientationStyle(styles);
              const resize = resizeImage(image.width, image.height, 650, 650);
              imgBox.setAttribute('data-width', resize.resizeWidth);
              imgBox.setAttribute('data-height', resize.resizeHeight);
              imgBox.width = resize.resizeWidth;
              imgBox.height = resize.resizeHeight;
              imgBox.src = image.src;
              */
              handleViewCenter();
            } catch (e) {}
          };
          setImageData(image);
        })
        .catch(() => {
          const imgBox = imageBox.current;
          imgBox.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
          imgBox.width = 300;
          imgBox.height = 300;

          handleViewCenter();
        });
    } else {
      const imgBox = imageBox.current;
      imgBox.src = `${Config.ServerURL.HOST}/storage/no_image.jpg`;
      imgBox.width = 300;
      imgBox.height = 300;

      handleViewCenter();
    }
  }, [previewFile]);

  const handleViewSize = change => {
    const changeSize = viewSize + change;
    const box = imageBox.current;
    try {
      const aWidth = parseInt(box.getAttribute('data-width'));
      const aHeight = parseInt(box.getAttribute('data-height'));

      if (aWidth && aHeight) {
        if (changeSize >= 0 && changeSize <= 10) {
          // 20%씩 증가 및 감소
          const incWidth = Math.floor(aWidth * 0.3) * change;
          const incHeight = Math.floor(aHeight * 0.3) * change;

          box.width = box.width + incWidth;
          box.height = box.height + incHeight;

          setViewSize(changeSize);
        }
      }

      handleViewCenter();
    } catch (e) {
      console.dir(e);
    }
  };

  const handleViewCenter = () => {
    const box = imageBox.current;
    try {
      const { offsetHeight: parentHeight, offsetWidth: parentWidth } =
        box.offsetParent;
      const { height: height, width: width } = box;

      box.style.top = `${Math.floor(parentHeight / 2 - height / 2)}px`;
      box.style.left = `${Math.floor(parentWidth / 2 - width / 2)}px`;
    } catch (e) {
      console.dir(e);
    }
  };

  /**
   * 2020.12.28
   * 휠스크롤 줌인/줌아웃 구현
   * Notes:
   *  1. 추후 성능이슈 발생시 throttle 적용 예정
   * @param {*} e
   */
  const handleWheelScroll = e => {
    /**
     * e.deltaY
     * wheel-up => negative
     * wheel-down => positive
     */
    const direction = e.deltaY;
    if (direction > 0) {
      // zoom-out when wheel-down
      handleViewSize(-1);
    } else {
      // zoom-in when wheel-up
      handleViewSize(1);
    }
  };

  return (
    <div className="wrap" style={{ width: '100%', height: '100%' }}>
      <div
        ref={mainBox}
        onMouseOver={e => {
          setInfoBox(true);
        }}
        onMouseOut={e => {
          setInfoBox(false);
        }}
        onWheel={handleWheelScroll}
        className="image-viewer"
      >
        <div className="imgbox">
          {loading && <LoadingWrap></LoadingWrap>}
          <img
            ref={imageBox}
            style={{
              position: 'absolute',
              display: 'block',
              ...orientationStyle,
            }}
            src={`${Config.ServerURL.HOST}/storage/no_image.jpg`}
            width={200}
            height={200}
          ></img>
        </div>
        {(fileData.type === 'L' || fileData.type === 'A') && (
          <>
            <span className="image-view-number">{`(${
              currIndex + 1
            } / ${maxIndex})`}</span>

            <button
              className="prev"
              onClick={handleBefore}
              type="button"
              disabled={loading || currIndex - 1 < 0}
            ></button>
            <button
              className="next"
              onClick={handleNext}
              type="button"
              disabled={loading || currIndex + 1 >= maxIndex}
            ></button>
          </>
        )}
        <div className="image-view-control">
          <div className="left-box">
            <button
              type="button"
              className="zoomin"
              onClick={() => handleViewSize(1)}
              disabled={loading}
              title={covi.getDic('ZoomIn', '확대')}
            ></button>
            <button
              type="button"
              className="zoomout"
              onClick={() => handleViewSize(-1)}
              disabled={loading}
              title={covi.getDic('ZoomOut', '축소')}
            ></button>
            <button
              type="button"
              className="download"
              onClick={handleSave}
              disabled={loading}
              title={covi.getDic('Save', '저장')}
            ></button>
            {/**
             * 일체형 SVG라서 permission 정책에 따라 없애지 않음.
             */}
            <button
              type="button"
              className="clipboard"
              onClick={handleCopy}
              disabled={loading}
              title={covi.getDic('ClipboardCopy', '클립보드 복사')}
            ></button>
            <button
              type="button"
              className="info"
              onClick={handleInfo}
              disabled={loading}
              title={covi.getDic('Detail', '상세정보')}
            ></button>
            <button
              type="button"
              className="chat"
              onClick={handleMoveContent}
              disabled={loading}
              title={covi.getDic('ShowChat', '대화보기')}
            ></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileLayer;
