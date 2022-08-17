import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import Config from '@/config/config';
import { isJSONStr, getSysMsgFormatStr } from '@/lib/common';
import { resizeImage } from '@/lib/fileUpload/coviFile';
import { getThumbnail } from '@/lib/message';
import FileIcons from '@/icons/svg/FileIcons';
import { convertEumTalkProtocol, getDictionary } from '@/lib/common';
import { convertChildren } from '@/lib/messageUtil';
import { useChatFontSize, useChatFontType } from '@/hooks/useChat';

const GridDiv = styled.div`
  display: grid;
  grid-template-rows: repeat(2, 1fr);
  grid-template-columns: auto 2fr 1fr;
  column-gap: 10px;
`;

const ReplyMessageWrapDiv = styled(GridDiv)`
  visibility: ${props => (props.displayNone ? 'hidden' : '')};
  bottom: ${props => `${props.bottom}px`};
  position: absolute;
  width: 80%;
  height: 50px;
  padding: 10px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  left: 50%;
  transform: translate(-50%);
`;

const ReplyFileItemDiv = styled.div`
  grid-row-start: 1;
  grid-row-end: 3;
  grid-column-start: 1;
  grid-column-end: 2;
  align-self: center;
  text-align: start;
`;

/**
 * 본문 공통 style
 * ReplySenderDiv 보낸이
 * ReplyContextDiv 내용
 */
const ContentDiv = styled.div`
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  grid-column-start: auto;
  grid-column-end: 3;
  text-align: start;
  font-family: ${props => props.fontType};
  font-size: ${props => props.fontSize}px;
  span {
    color: #fff;
    height: 100%;
    overflow: hidden;
    white-space: nowrap;
    -webkit-line-clamp: 1;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
  }
`;

const ReplySenderDiv = styled(ContentDiv)`
  grid-row-start: 1;
  grid-row-end: 2;
  font-weight: bold;
`;

const ReplyContextDiv = styled(ContentDiv)`
  grid-row-start: 2;
  grid-row-end: 3;
`;

const CloseBtnDiv = styled.div`
  grid-row-start: 1;
  grid-row-end: 3;
  grid-column-start: 3;
  grid-column-end: 4;
  text-align: end;
`;

const FileComponent = ({ fileInfos }) => {
  const isFileArray = Array.isArray(fileInfos);
  const file = isFileArray ? fileInfos[0] : fileInfos;
  if (!file) return <></>;

  if (file.isImage === 'Y') {
    getThumbnail({
      token: file.token,
    })
      .then(response => {
        const data = Buffer.from(response.data, 'binary').toString('base64');
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        image.onload = () => {
          const imgBox = document.getElementById(`reply_${file.token}`);
          try {
            // hieght에 따른 width 비율계산 필요
            const resize = resizeImage(image.width, image.height, 100, 50);

            imgBox.width = resize.resizeWidth;
            imgBox.height = resize.resizeHeight;
            imgBox.src = image.src;
          } catch (e) {}
        };
      })
      .catch(() => {
        // image not found ( 404 )
      });
    return (
      <img
        id={`reply_${file.token}`}
        src={`${Config.ServerURL.HOST}/storage/no_image.jpg`}
        width={100}
        max-height={50}
        style={{ border: '1px solid rgba(0,0,0,0)', borderRadius: 10 }}
      ></img>
    );
  } else {
    return <FileIcons etx={file.ext} width={50} height={40} />;
  }
};

const MessagePostReplyBox = ({
  replyMessage,
  setReplyMode,
  setReplyMessage,
  viewExtension,
  isTempEmoticon = false,
  isTempFiles = false,
}) => {
  // reply 위치
  // default = 130
  // isTempFiles = 첨부된 파일 유무
  // isTempEmoticon = 이모티콘 선택 유무
  // viewExtension = S 이모티콘 창 활성 유무
  let displayNone = false;
  if (viewExtension === 'S' && isTempEmoticon) {
    displayNone = true;
  }
  let bottomSize = 130;
  if (viewExtension === 'S') {
    // 이모티콘 창 활성
    bottomSize = bottomSize + 227;
  }
  if (viewExtension === 'M') {
    // 맨션 창 활성
    bottomSize = bottomSize + 245;
  }
  if (isTempEmoticon) {
    // 선택한 이모티콘이 존재
    bottomSize = bottomSize + 149;
  }
  if (isTempFiles) {
    // 첨부된 파일이 있을 경우
    bottomSize = bottomSize + 115;
  }

  const [fontSize] = useChatFontSize();
  const [fontType] = useChatFontType();
  const [processMsg, setProcessMsg] = useState(null);
  const [emoticon, setEmoticon] = useState(null);
  const [fileInfos, setFileInfos] = useState(null);

  const [senderName, setSenderName] = useState(null);
  const [context, setContext] = useState(null);

  useEffect(() => {
    if (replyMessage) {
      const senderInfo = isJSONStr(replyMessage.senderInfo)
        ? JSON.parse(replyMessage.senderInfo)
        : replyMessage.senderInfo;
      // "나"에 대한 다국어 처리 필요
      const name =
        replyMessage.isMine === 'Y' ? covi.getDic('me') : senderInfo.name;
      setSenderName(getDictionary(name));

      const result = convertEumTalkProtocol(replyMessage?.context);
      setProcessMsg(result);

      if (!!replyMessage?.fileInfos) {
        const file = isJSONStr(replyMessage.fileInfos)
          ? JSON.parse(replyMessage.fileInfos)
          : replyMessage.fileInfos;
        setFileInfos(file);
      }
    }

    return () => {
      setSenderName(null);
      setFileInfos(null);
      setProcessMsg(null);
      setContext(null);
    };
  }, [replyMessage]);

  useEffect(() => {
    if (processMsg) {
      if (processMsg.type === 'emoticon') {
        setEmoticon(processMsg.message);
        setContext(covi.getDic('emoticon', '이모티콘'));
      } else {
        let contextMsg = processMsg.message;
        if (!contextMsg) {
          const isFileArray = Array.isArray(fileInfos);
          if (isFileArray) {
            contextMsg = getSysMsgFormatStr(
              fileInfos[0].isImage === 'Y'
                ? covi.getDic('Tmp_imgExCnt', '사진 외 %s건')
                : covi.getDic('Tmp_fileExCnt', '파일 외 %s건'),
              [{ type: 'Plain', data: fileInfos.length - 1 }],
            );
          } else {
            contextMsg =
              fileInfos.isImage === 'Y'
                ? covi.getDic('Image', '사진')
                : covi.getDic('File', '파일');
          }
        }

        setContext(contextMsg);
      }
    }
    return () => {
      setEmoticon(null);
      setContext(null);
    };
  }, [processMsg, fileInfos]);

  // 다국어 처리
  // {myID === sender.id ? '나' : getJobInfo(sender)}에게 답장
  return (
    <ReplyMessageWrapDiv bottom={bottomSize} displayNone={displayNone}>
      <ReplyFileItemDiv>
        {(emoticon &&
          convertChildren({
            children: emoticon,
            style: { width: 50, height: 50 },
          })) || <FileComponent fileInfos={fileInfos} />}
      </ReplyFileItemDiv>
      <ReplySenderDiv fontSize={fontSize} fontType={fontType}>
        {senderName && (
          <span>
            {getSysMsgFormatStr(covi.getDic('replyToUser', '%s에게 답장'), [
              { type: 'Plain', data: senderName },
            ])}
          </span>
        )}
      </ReplySenderDiv>
      <ReplyContextDiv fontSize={fontSize} fontType={fontType}>
        {context &&
          ((processMsg?.mentionInfo.length > 0 && (
            <span>
              {convertChildren({
                children: context,
                mentionInfo: processMsg?.mentionInfo,
              })}
            </span>
          )) || <span>{context}</span>)}
      </ReplyContextDiv>
      <CloseBtnDiv>
        <span
          style={{
            display: 'inline-block',
            cursor: 'pointer',
          }}
          onClick={() => {
            setReplyMode(false);
            setReplyMessage(null);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 16 16"
          >
            <g transform="translate(0.488)">
              <path
                d="M8,0A8,8,0,1,1,0,8,8,8,0,0,1,8,0Z"
                transform="translate(-0.488)"
                fill="#999"
              ></path>
              <g transform="translate(4.513 5.224)">
                <path
                  d="M128.407,133.742a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12l2.284-2.165,2.284,2.165a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12.39.39,0,0,0,0-.565l-2.277-2.158,2.277-2.165a.39.39,0,0,0,0-.564.437.437,0,0,0-.6,0l-2.277,2.165L129,128.3a.444.444,0,0,0-.6,0,.39.39,0,0,0,0,.564l2.284,2.158-2.277,2.165A.371.371,0,0,0,128.407,133.742Z"
                  transform="translate(-128.279 -128.173)"
                  fill="#fff"
                ></path>
              </g>
            </g>
          </svg>
        </span>
      </CloseBtnDiv>
    </ReplyMessageWrapDiv>
  );
};

export default React.memo(MessagePostReplyBox);
