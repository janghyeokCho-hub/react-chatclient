import * as messageApi from '@/lib/message';
import * as roomApi from '@/lib/room';
import { getConfig } from '@/lib/util/configUtil';
import fileDownload from 'js-file-download';
import {
  openSubPop,
  saveFile,
  getDownloadPath,
  evalConnector,
} from '@/lib/deviceConnector';
import { getSysMsgFormatStr } from '@/lib/common';
import EXIF from 'exif-js';
import exif2css from 'exif2css';
import imageExtensions from 'image-extensions';
import { filesvr } from '../api';
import { format } from 'date-fns';
import { isBlockCheck } from '../orgchart';
import {
  eumTalkRegularExp,
  convertEumTalkProtocolPreview,
  convertEumTalkProtocolPreviewForChannelItem,
} from '@/lib/common';

const extensionImage = new Set(imageExtensions);

export const isAllImage = fileobj => {
  let allImage = true;
  fileobj.map(file => {
    if (!extensionImage.has(file.ext)) {
      allImage = false;
    }
  });
  return allImage;
};

let fileInstance;

class coviFile {
  files = [];
  fileInfos = [];
  appendFiles = files => {
    let resultType = 'SUCCESS';
    let resultMsg = '';

    const checkValidation = this.checkValidationFile(files);
    if (checkValidation != 'SUCCESS') {
      resultType = 'FAILURE';
      resultMsg = checkValidation;
    }

    if (resultType == 'SUCCESS') {
      Array.prototype.forEach.call(files, file => {
        if (!this.checkDuplication(file)) {
          const fileBasicInfo = this.makeFileInfo(file, false);
          const fileInfo = { ...fileBasicInfo };
          file.tempId = fileInfo.tempId;

          this.files.push(file);
          this.fileInfos.push(fileInfo);
        }
      });
    }

    // this.files = [...this.files, ...files];

    // result type
    return { result: resultType, message: resultMsg };
  };

  pasteFiles = file => {
    let resultType = 'SUCCESS';
    let resultMsg = '';

    const checkValidation = this.checkValidationFile(file);

    if (checkValidation === 'SUCCESS') {
      const fileBasicInfo = this.makeFileInfo(file, true);
      const fileInfo = { ...fileBasicInfo };

      file.tempId = fileInfo.tempId;

      this.files.push(file);
      this.fileInfos.push(fileInfo);
    } else {
      resultType = 'FAILURE';
      resultMsg = checkValidation;
    }

    return { result: resultType, message: resultMsg };
  };

  imageProcessing = (tempId, callback) => {
    let fileInfo = this.fileInfos.find(item => item.tempId == tempId);
    let file = this.files.find(item => item.tempId == tempId);

    if (fileInfo.image) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const thumb = new Image();
        const dataURL = reader.result;
        thumb.onload = async () => {
          let orientation = await getOrientation(thumb);
          const size = this.resize(thumb.width, thumb.height, 150, 150);

          let width = size.resizeWidth;
          let height = size.resizeHeight;
          let thumbDataURL = this.makeThumb(
            thumb,
            width,
            height,
            orientation,
          ).data;

          const newFileInfo = {
            ...fileInfo,
            width: width,
            height: height,
            thumbDataURL: thumbDataURL,
          };

          this.fileInfos = this.fileInfos.map(item => {
            if (item.tempId == tempId) {
              return newFileInfo;
            } else {
              return item;
            }
          });

          callback(newFileInfo);
        };
        thumb.src = dataURL;
      };
    }
  };

  resize = (width, height, maxWidth, maxHeight) => {
    let resizeWidth = 0;
    let resizeHeight = 0;

    // 가로나 세로의 길이가 최대 사이즈보다 크면 실행
    if (width > maxWidth || height > maxHeight) {
      // 가로가 세로보다 크면 가로는 최대사이즈로, 세로는 비율 맞춰 리사이즈
      if (width > height) {
        resizeWidth = maxWidth;
        resizeHeight = Math.round((height * resizeWidth) / width); // 세로가 가로보다 크면 세로는 최대사이즈로, 가로는 비율 맞춰 리사이즈
      } else {
        resizeHeight = maxHeight;
        resizeWidth = Math.round((width * resizeHeight) / height);
      } // 최대사이즈보다 작으면 원본 그대로
    } else {
      resizeWidth = width;
      resizeHeight = height;
    } // 리사이즈한 크기로 이미지 크기 다시 지정
    return {
      resizeWidth,
      resizeHeight,
    };
  };

  makeThumb = (img, width, height, orientation = 1) => {
    console.log('makeThumb!!');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    console.log(orientation);
    let sourceWidth = width;
    let sourceHeight = height;
    /// JavaScript-Load-Image load-image-orientation.js 참고.
    // 그대로 사용시 180도 flip 필요.

    if (orientation > 4) {
      canvas.width = height;
      canvas.height = width;
      sourceWidth = height;
      sourceHeight = width;
    }
    switch (orientation) {
      case 2:
        // Horizontal flip
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        break;
      case 3:
        // 180° Rotate CCW
        ctx.translate(width, height);
        ctx.rotate(Math.PI);
        break;
      case 4:
        // Vertical flip
        ctx.translate(0, height);
        ctx.scale(1, -1);
        break;
      case 5:
        // Horizontal flip + 90° Rotate CCW
        ctx.rotate(-0.5 * Math.PI);
        ctx.translate(-width, height);
        ctx.scale(1, -1);
        break;
      case 6:
        // 90° Rotate CCW
        ctx.rotate(0.5 * Math.PI);
        ctx.translate(0, -height);
        break;
      case 7:
        // Vertical flip + 90° Rotate CCW
        ctx.rotate(-0.5 * Math.PI);
        ctx.scale(-1, 1);
        break;
      case 8:
        // 90° Rotate CW
        ctx.rotate(-0.5 * Math.PI);
        ctx.translate(-width, 0);
        break;
    }

    ctx.drawImage(img, 0, 0, width, height);

    return {
      data: canvas.toDataURL(),
      width: sourceWidth,
      height: sourceHeight,
    };
  };

  getFiles = () => {
    return this.files;
  };

  getFile = tempId => {
    return this.files.find(item => item.tempId == tempId);
  };

  getFileInfo = tempId => {
    return this.fileInfos.find(item => item.tempId == tempId);
  };

  delFile = tempId => {
    let indexFiles = this.files.findIndex(item => item.tempId == tempId);
    let indexFileInfos = this.fileInfos.findIndex(
      item => item.tempId == tempId,
    );

    this.files.splice(indexFiles, 1);
    this.fileInfos.splice(indexFileInfos, 1);
  };

  getFileInfos = () => {
    return this.fileInfos.map(item => {
      return item;
    });
  };

  getRealFileInfos = () => {
    return this.fileInfos;
  };

  makeFileInfo = (fileObj, isPaste) => {
    const fileUndefined = fileObj.name;
    const fileLen = fileObj.name.length;
    const lastDot = fileObj.name.lastIndexOf('.');
    const fileExt = fileObj.name.substring(lastDot + 1, fileLen).toLowerCase();
    const fileName = fileObj.name.substring(0, lastDot);
    if (fileUndefined === 'capture.png') {
      return {
        tempId: guid(),
        fullName: 'capture.png',
        fileName: 'capture',
        ext: 'png',
        size: fileObj.size,
        isPaste: isPaste,
        image: true,
      };
    } else {
      return {
        tempId: guid(),
        fullName: fileObj.name,
        fileName: fileName,
        ext: fileExt,
        size: fileObj.size,
        isPaste: isPaste,
        image:
          fileExt == 'png' ||
          fileExt == 'jpg' ||
          fileExt == 'jpeg' ||
          fileExt == 'bmp' ||
          fileExt == 'gif'
            ? true
            : false,
      };
    }
  };

  checkDuplication = fileObj => {
    let duplication = false;
    this.fileInfos.forEach(file => {
      if (file.fullName == fileObj.name && file.IsPaste != 'Y') {
        duplication = true;
        return false;
      }
    });

    return duplication;
  };

  checkValidationFile = fileObjs => {
    let length = 0;
    let size = true;
    let ext = true;
    // 붙여넣기 된 파일은 FileList type이 아님
    if (!isNaN(fileObjs.length)) {
      Array.prototype.forEach.call(fileObjs, file => {
        length++;
        // File Size Check
        if (file.size >= getConfig('File.limitUnitFileSize')) {
          size = false;
          return false;
        }
        const fileLen = file.name.length;
        const lastDot = file.name.lastIndexOf('.');
        const fileExt =
          file.name === 'undefined'
            ? file.type.split('/')[1]
            : file.name.substring(lastDot + 1, fileLen).toLowerCase();
        if (getConfig('File.limitExtension').indexOf(fileExt) == -1) {
          ext = false;
          return false;
        }
      });
    } else {
      length = 1;
      // File Size Check
      if (fileObjs.size >= getConfig('File.limitUnitFileSize')) {
        size = false;
      }

      const fileLen = fileObjs.name.length;
      const lastDot = fileObjs.name.lastIndexOf('.');
      const fileExt = fileObjs.name
        .substring(lastDot + 1, fileLen)
        .toLowerCase();

      if (getConfig('File.limitExtension').indexOf(fileExt) == -1) {
        ext = false;
      }
    }

    if (!size) return 'LIMIT_FILE_SIZE';
    if (!ext) return 'LIMIT_FILE_EXTENSION';

    // File Count Check

    if (length + this.files.length > getConfig('File.limitFileCnt')) {
      return 'LIMIT_FILE_COUNT';
    }

    // File Ext Check

    return 'SUCCESS';
  };

  clear = () => {
    this.fileInfos = [];
    this.files = [];
  };

  // 중복검사 관련된 함수들 추가
}

export const getInstance = () => {
  if (fileInstance) return fileInstance;
  else {
    fileInstance = new coviFile();
    return fileInstance;
  }
};

/**
 * 파일 토큰 유효 검사 동기화 실행
 * @param {*} array 파일 목록 배열
 * @param {*} handleProgress Progress Callback Function
 * @returns
 */
const checkByTokens = (array, handleProgress) => {
  // 2개 이상인 파일일 경우
  // n개의 파일의 사이즈 합 아니면 0
  const totalSize =
    array.length > 1
      ? array.reduce((acc, cur) => {
          return (acc += cur.size);
        }, 0)
      : 0;

  return array.reduce(
    (prevPrms, currElem, i) =>
      prevPrms.then(async prevRes => {
        const currRes = await messageApi.getFileByToken(
          { token: currElem.token },
          e => {
            let { loaded } = e;
            if (typeof handleProgress === 'function') {
              // 현재 진행파일 이전 파일들의 size 합
              const completeSize = array.reduce((acc, cur, j) => {
                return i > j ? (acc += cur.size) : acc;
              }, 0);
              // 단일 파일일 경우 totalSize = 0
              const total = totalSize ? totalSize : e.total;

              handleProgress(loaded + completeSize, total);
            }
          },
        );
        currRes.fileName = currElem.fileName;
        return [...prevRes, currRes];
      }),
    Promise.resolve([]),
  );
};

/**
 * 파일들 데이터 받아와 압축하기
 * @param {*} files
 * @returns {*} { results : [ {data, status, ...} ] , JSZip : require('jszip')() }
 */
const makeZipFile = async files => {
  const JSZip = require('jszip')();

  for (const file of files) {
    if (file.status === 200) JSZip.file(file.fileName, file.data);
  }

  return JSZip;
};
/**
 * 여러 파일 다운로드
 * @param {*} fileItems
 * @param {*} isZip 압축여부 true || false
 * @param {*} handleProgress
 * @returns
 */
export const downloadByTokenAll = async (
  fileItems,
  isZip = false,
  handleProgress = null,
) => {
  /**
   * 2021.09.28
   * 다운로드 경로확인 ON 설정일 때
   * 파일 모아보기에서 저장하면 'saveAs'가 동작하지 않도록 'open' 옵션 강제 지정
   */
  const savePath = await getDownloadPath({ mode: 'open' });
  // 다운로드 경로지정 dialog을 닫은경우 다운로드 실행하지 않음
  if (DEVICE_TYPE === 'd' && savePath?.canceled) return null;
  if (savePath?.filePath && !savePath?.filePaths) {
    /**
     * 2021.10.19
     * 다운로드 경로확인 옵션 X일 경우: filePath가 경로
     * 다운로드 경로확인 옵션 O일경우: filePaths가 경로
     *
     * 다운로드 경로확인 옵션 X일 경우에 중복파일명 덮어쓰기 방지를 위해 경로를 array로 넘김
     */
    savePath.filePaths = [savePath.filePath];
  }

  let check = true;
  let message = '';
  const results = await checkByTokens(fileItems, handleProgress);

  // 모두 만료된 파일인가 확인
  const expiredCheck = results.every(result => {
    return result.status === 204;
  });
  // 모두 권한이 없는 파일인가 확인
  const permissionCheck = results.every(result => {
    return result.status === 403;
  });

  if (expiredCheck) {
    check = false;
    message = covi.getDic('Msg_FileExpired', '만료된 파일입니다.');
  } else if (permissionCheck) {
    check = false;
    message = covi.getDic('Msg_FilePermission', '권한이 없는 파일입니다.');
  } else {
    // 압축 여부
    if (isZip) {
      const JSZip = await makeZipFile(results);
      if (Object.keys(JSZip?.files).length) {
        const fileName = `${results[0]?.fileName?.split('.')[0]}.zip`;
        JSZip.generateAsync({ type: 'arraybuffer' }).then(data => {
          if (DEVICE_TYPE == 'b') {
            fileDownload(data, fileName);
          } else {
            saveFile(savePath?.filePaths, fileName, data, { isZip: true });
          }
        });
      }
    } else {
      // 한 개만 있지만 배열 형태임
      results.map(resilt => {
        if (DEVICE_TYPE == 'b') {
          fileDownload(resilt.data, resilt.fileName);
        } else {
          saveFile(savePath?.filePaths, resilt.fileName, resilt.data, {
            isZip: false,
          });
        }
      });
    }
  }
  return { result: check, data: { message } };
};

const downloadFiles = (
  token,
  savePath,
  fileName,
  callback,
  progress,
  execute,
) => {
  if (!typeof progress == 'function') {
    progress = null;
  }

  messageApi.getFileByToken({ token }, progress).then(response => {
    if (response.status == 204) {
      callback({
        result: 'EXPIRED',
        message: covi.getDic('Msg_FileExpired', '만료된 파일입니다.'),
      });
    } else if (response.status == 403) {
      callback({
        result: 'FORBIDDEN',
        message: covi.getDic('Msg_FilePermission', '권한이 없는 파일입니다.'),
      });
    } else {
      if (DEVICE_TYPE == 'b') {
        fileDownload(response.data, fileName);
      } else {
        saveFile(savePath, fileName, response.data, {
          execute: execute,
          token: token,
          isZip: false,
        });
      }
      callback({ result: 'SUCCESS', message: '' });
    }
  });
};

export const checkFileTokenValidation = async ({ token, serviceType }) => {
  const url = `/check/${serviceType}/${token}`;
  return await filesvr('get', url);
};

export const downloadByToken = async (
  token,
  fileName,
  callback,
  progress,
  execute,
) => {
  const savePath = await getDownloadPath({ defaultFileName: fileName });
  if (DEVICE_TYPE === 'd' && savePath?.canceled) return null;
  else
    downloadFiles(
      token,
      savePath?.filePath,
      fileName,
      callback,
      progress,
      execute,
    );
};

export const downloadMessageData = async ({
  roomID,
  fileName,
  roomName,
  chineseWall = [],
}) => {
  const { data } = await evalConnector({
    method: 'sendSync',
    channel: 'req-get-all-messages',
    message: {
      roomID,
    },
  });
  const { result, status } = data;
  if (status === 'SUCCESS') {
    if (!result?.length) {
      // 대화내용없음
      return 'NONE';
    } else {
      let txt = `${roomName}\n`;
      txt += `저장한 날짜 : ${format(new Date(), 'yyyy년 MM월 dd일 HH:mm')}\n`;

      // 파일 대화내용 지우기
      const items = result.filter(item => !item.fileInfos);
      // 동기 처리를 위해 forEach 대신 for 사용
      for (const item of items) {
        if (item.messageType === 'N') {
          const sendDate = format(item.sendDate, 'yyyy년 MM월 dd일 HH:mm:ss');
          const senderInfo = isJSONStr(item.senderInfo)
            ? JSON.parse(item.senderInfo)
            : item.senderInfo;
          const name = senderInfo.name?.split(';')[0];
          let isBlock = false;

          if (item.isMine !== 'Y' && chineseWall.length) {
            const { blockChat } = isBlockCheck({
              targetInfo: {
                ...senderInfo,
                id: item.sender,
              },
              chineseWall,
            });
            isBlock = blockChat;
          }

          let context = isBlock
            ? covi.getDic('BlockChat', '차단된 메시지입니다.')
            : item.context;

          if (eumTalkRegularExp.test(context)) {
            const messageObj =
              await convertEumTalkProtocolPreviewForChannelItem(context);
            context = messageObj.message;
          }
          txt += `\n${sendDate} ${name} : ${context}`;
        }
      }

      fileDownload(txt, fileName);
    }
  }
  return status;
};

export const convertFileSize = size => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (size == 0) return 'n/a';
  const i = parseInt(Math.floor(Math.log(size) / Math.log(1024)));
  return (size / Math.pow(1024, i)).toFixed(1) + sizes[i];
};

export const getIconClass = extension => {
  let strReturn = '';
  const lowerExt = extension.toLowerCase();
  if (lowerExt == 'xls' || lowerExt == 'xlsx') {
    strReturn = 'exCel';
  } else if (
    lowerExt == 'jpg' ||
    lowerExt == 'png' ||
    lowerExt == 'bmp' ||
    lowerExt == 'gif'
  ) {
    strReturn = 'imAge';
  } else if (lowerExt == 'doc' || lowerExt == 'docx') {
    strReturn = 'woRd';
  } else if (lowerExt == 'ppt' || lowerExt == 'pptx') {
    strReturn = 'pPoint';
  } else if (lowerExt == 'txt' || lowerExt == 'hwp') {
    strReturn = 'teXt';
  } else {
    strReturn = 'etcFile';
  }

  return strReturn;
};

export const resizeImage = (width, height, maxWidth, maxHeight) => {
  let resizeWidth = 0;
  let resizeHeight = 0;

  // 가로나 세로의 길이가 최대 사이즈보다 크면 실행
  if (width > maxWidth || height > maxHeight) {
    // 가로가 세로보다 크면 가로는 최대사이즈로, 세로는 비율 맞춰 리사이즈
    if (width > height) {
      resizeWidth = maxWidth;
      resizeHeight = Math.round((height * resizeWidth) / width); // 세로가 가로보다 크면 세로는 최대사이즈로, 가로는 비율 맞춰 리사이즈
    } else {
      resizeHeight = maxHeight;
      resizeWidth = Math.round((width * resizeHeight) / height);
    } // 최대사이즈보다 작으면 원본 그대로
  } else {
    resizeWidth = width;
    resizeHeight = height;
  } // 리사이즈한 크기로 이미지 크기 다시 지정
  return {
    resizeWidth,
    resizeHeight,
  };
};

export const getFileExtension = ext => {
  switch (ext) {
    case 'doc':
    case 'docx':
      ext = 'doc';
      break;
    case 'xls':
    case 'xlsx':
      ext = 'xls';
      break;
    case 'ppt':
    case 'pptx':
      ext = 'ppt';
      break;
    case 'pdf':
      ext = 'pdf';
      break;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      ext = 'img';
      break;
    default:
      ext = 'etc';
      break;
  }

  return ext;
};

/*
file : 표시할 파일
files : L type일 경우 사용
type : N (Normal), L (List), A (Async)
params : Async Params
*/
export const openFilePreview = (file, files, type, params) => {
  openSubPop(
    'preview',
    '#/client/nw/preview',
    { file, files, type, params },
    670,
    770,
    'center',
    true,
    { resize: true, minWidth: 600, minHeight: 550 },
  );
};

export const getValidationMessage = type => {
  if (type == 'LIMIT_FILE_COUNT') {
    return getSysMsgFormatStr(
      covi.getDic('Msg_LimitFileCnt', '파일 첨부 최대 갯수는 %s개 입니다.'),
      [{ type: 'Plain', data: getConfig('File.limitFileCnt') }],
    );
  } else if (type == 'LIMIT_FILE_SIZE') {
    return getSysMsgFormatStr(
      covi.getDic(
        'Msg_LimitFileSize',
        '첨부파일의 단일사이즈 제한은 %s 입니다.',
      ),
      [
        {
          type: 'Plain',
          data: convertFileSize(getConfig('File.limitUnitFileSize')),
        },
      ],
    );
  } else if (type == 'LIMIT_FILE_EXTENSION') {
    return covi.getDic('Msg_LimitFileExt', '제한된 확장자 입니다.');
  }
};

export const guid = () => {
  const s4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };

  return (
    s4() +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    s4() +
    s4()
  );
};

export const getOrientation = async image => {
  let orientation = new Promise((resolve, reject) => {
    if (
      EXIF.getData(image, () => {
        let orientation = EXIF.getTag(image, 'Orientation');
        resolve(orientation);
      })
    ) {
    } else {
      console.log('someThing Wrong!!');
      resolve(-1);
    }
  });
  return await orientation;
};

export const getOrientationFixedStyles = async image => {
  let orientation = await getOrientation(image);
  let unFixed = exif2css(orientation);
  let styles =
    orientation > 1
      ? Object.keys(unFixed)
          .map(k => ({
            [k.replace(/(-\w)/g, m => m[1].toUpperCase())]: unFixed[k],
          }))
          .reduce((a, b) => ({ ...a, ...b }), {})
      : {};
  return styles;
};
