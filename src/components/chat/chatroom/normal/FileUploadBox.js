import React, { useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { changeFiles, clearFiles } from '@/modules/message';
import { openPopup } from '@/lib/common';
import { getConfig } from '@/lib/util/configUtil';
import * as coviFile from '@/lib/fileUpload/coviFile';

const FileUploadBox = ({ view, onView }) => {
  const fileUploadControl = useRef(null);
  const dispatch = useDispatch();
  const fileAttachMode = getConfig('FileAttachMode');
  const handleFileChange = useCallback(
    e => {
      const target = e.target;
      const fileCtrl = coviFile.getInstance();
      const files = target.files;

      if (files.length > 0) {
        if (
          fileAttachMode &&
          fileAttachMode.PC &&
          fileAttachMode.PC.upload === false
        ) {
          openPopup(
            {
              type: 'Alert',
              message: covi.getDic(
                'Block_FileUpload',
                '파일 첨부가 금지되어 있습니다.',
              ),
            },
            dispatch,
          );
          return;
        }
        const appendResult = fileCtrl.appendFiles(target.files);

        if (appendResult.result == 'SUCCESS') {
          dispatch(changeFiles({ files: fileCtrl.getFileInfos() }));
        } else {
          openPopup(
            {
              type: 'Alert',
              message: coviFile.getValidationMessage(appendResult.message),
            },
            dispatch,
          );
        }
      }

      e.target.value = '';
    },
    [dispatch],
  );

  useEffect(() => {
    if (typeof onView == 'function') {
      fileUploadControl.current.ondragleave = e => {
        onView(false);
        e.preventDefault();
        /*
        window.ondragover = e => {
          onView(true);
          window.ondragover = null;
          e.preventDefault();
        };
        */
      };

      fileUploadControl.current.ondrop = e => {
        onView(false);
        /*
        window.ondragover = e => {
          onView(true);
          window.ondragover = null;
          e.preventDefault();
        };
        */
      };
    }

    return () => {
      fileUploadControl.current.ondrop = null;
      fileUploadControl.current.ondragleave = null;
    };
  }, [view]);

  useEffect(() => {
    if (typeof onView == 'function') {
      fileUploadControl.current.ondragleave = e => {
        onView(false);
        e.preventDefault();
        /*
        window.ondragover = e => {
          onView(true);
          window.ondragover = null;
          e.preventDefault();
        };
        */
      };

      fileUploadControl.current.ondrop = e => {
        onView(false);
        /*
        window.ondragover = e => {
          onView(true);
          window.ondragover = null;
          e.preventDefault();
        };
        */
      };
    }

    return () => {
      fileUploadControl.current.ondrop = null;
      fileUploadControl.current.ondragleave = null;
    };
  }, []);

  return (
    <>
      <div
        className="fileUpBack"
        ref={fileUploadControl}
        style={view ? { display: 'block' } : { display: 'none', zIndex: '-99' }}
      >
        <div className="posi-center">
          <div className="file-upload-ico"></div>
          <p className="infotxt">
            {covi.getDic(
              'Msg_FileDragAndDrop',
              '파일을 이곳에 드래그 & 드롭하여 업로드하세요.',
            )}
          </p>
        </div>
        <input
          type="file"
          multiple={true}
          style={{ width: '100%', height: '100%', opacity: '0.0' }}
          onChange={handleFileChange}
        />
      </div>
    </>
  );
};

export default React.memo(FileUploadBox);
