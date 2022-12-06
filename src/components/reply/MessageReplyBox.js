import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Config from '@/config/config';
import { isJSONStr, getSysMsgFormatStr, getDictionary } from '@/lib/common';
import { resizeImage } from '@/lib/fileUpload/coviFile';
import { getThumbnail } from '@/lib/message';
import FileIcons from '@/icons/svg/FileIcons';
import { convertEumTalkProtocol } from '@/lib/common';
import { convertChildren } from '@/lib/messageUtil';
import { useSelector } from 'react-redux';
import { isBlockCheck } from '@/lib/orgchart';

/**
 * 삭제된 메시지 Style
 */
const DeleteDiv = styled.div`
  span {
    padding-bottom: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
`;

/**
 * 본문 전체 Style
 */
const GridDiv = styled.div`
  display: grid;
  height: 50px;
  column-gap: 10px;
  grid-template-rows: repeat(2, 1fr);
  grid-template-columns: auto 2fr;
  cursor: pointer;
`;

/**
 * 본문 파일 Style
 */
const ReplyFileItemDiv = styled.div`
  grid-row-start: 1;
  grid-row-end: 3;
  grid-column-start: 1;
  grid-column-end: auto;
  align-self: center;
  text-align: start;
`;

/**
 * 본문 내용 공통 Style
 */
const ContentDiv = styled.div`
  padding: 2px;
  grid-column-start: auto;
  grid-column-end: 3;
  text-align: start;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

/**
 * 본문 보낸 사람 Style
 */
const ReplySenderDiv = styled(ContentDiv)`
  grid-row-start: 1;
  grid-row-end: auto;
  font-weight: bold;
`;

/**
 * 본문 내용 Style
 */
const ReplyContextDiv = styled(ContentDiv)`
  grid-row-start: auto;
  grid-row-end: 3;
  display: inline-block;
  span {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
  }
  span:not(:first-child) {
    display: none;
  }
`;

/**
 * 본문 파일 영역 컴포넌트
 * @param {JSON} fileInfos
 */
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
            const resize = resizeImage(image.width, image.height, 45, 45);

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
        width={45}
        max-height={45}
        style={{ border: '1px solid rgba(0,0,0,0)', borderRadius: 10 }}
      ></img>
    );
  } else {
    return <FileIcons etx={file.ext} width={40} height={30} />;
  }
};

const MessageReplyBox = ({ replyID, replyInfo, goToOriginMsg, roomType }) => {
  const chineseWall = useSelector(({ login }) => login.chineseWall);
  const currentRoomID = useSelector(
    ({ room, channel }) =>
      room.currentRoom?.roomID || channel.currentChannel?.roomId,
  );

  const [replyMessage, setReplyMessage] = useState(null);
  const [processMsg, setProcessMsg] = useState(null);
  const [emoticon, setEmoticon] = useState(null);
  const [fileInfos, setFileInfos] = useState(null);

  const [senderName, setSenderName] = useState(null);
  const [context, setContext] = useState(null);
  const [blockFile, setBlockFile] = useState(false);
  const [blockChat, setBlockChat] = useState(false);
  const [isMsgDelete, setIsMsgDelete] = useState(false);

  useEffect(() => {
    if (replyID && replyInfo) {
      setReplyMessage(isJSONStr(replyInfo) ? JSON.parse(replyInfo) : replyInfo);
    } else {
      setIsMsgDelete(true);
    }
    return () => {
      setReplyMessage(null);
    };
  }, [replyID, replyInfo]);

  useEffect(() => {
    if (replyMessage) {
      const sender =
        getDictionary(replyMessage?.senderName) || replyMessage?.sender;
      setSenderName(sender || '@Unknown');

      const result = convertEumTalkProtocol(replyMessage?.context);
      setContext(result?.message || '');

      const isFile = !!replyMessage?.fileInfos;
      setProcessMsg(result);

      const targetInfo = {
        id: replyMessage.sender,
        deptCode: replyMessage.deptCode,
      };

      const chineseWallResult = isBlockCheck({ targetInfo, chineseWall });
      setBlockChat(chineseWallResult.blockChat);
      setBlockFile(chineseWallResult.blockFile);

      if (isFile) {
        const file = isJSONStr(replyMessage.fileInfos)
          ? JSON.parse(replyMessage.fileInfos)
          : replyMessage.fileInfos;
        setFileInfos(file);
      }
    }
    return () => {
      setProcessMsg(null);
    };
  }, [replyMessage]);

  useEffect(() => {
    if (processMsg) {
      if (processMsg.type === 'emoticon') {
        setEmoticon(processMsg.message);
        setContext(covi.getDic('emoticon', '이모티콘'));
      } else {
        let contextMsg = processMsg.message;
        if (fileInfos) {
          if (!contextMsg) {
            const isFileArray = Array.isArray(fileInfos);
            if (isFileArray) {
              contextMsg = !blockFile
                ? getSysMsgFormatStr(
                    fileInfos[0].isImage === 'Y'
                      ? covi.getDic('Tmp_imgExCnt', '사진 외 %s건')
                      : covi.getDic('Tmp_fileExCnt', '파일 외 %s건'),
                    [{ type: 'Plain', data: fileInfos.length - 1 }],
                  )
                : covi.getDic('BlockChat', '차단된 메시지 입니다.');
            } else {
              contextMsg = !blockFile
                ? fileInfos.isImage === 'Y'
                  ? covi.getDic('Image', '사진')
                  : covi.getDic('File', '파일')
                : covi.getDic('BlockChat', '차단된 메시지 입니다.');
            }
          }
        } else {
          contextMsg = blockChat
            ? covi.getDic('BlockChat', '차단된 메시지 입니다.')
            : processMsg.message;
        }

        setContext(
          contextMsg || covi.getDic('Msg_NoMessages', '대화내용 없음'),
        );
      }
    }
    return () => {
      setEmoticon(null);
      setContext(null);
    };
  }, [processMsg]);

  return (
    <>
      {(isMsgDelete && (
        <DeleteDiv>
          <span>{covi.getDic('Msg_Deleted', '삭제된 메시지 입니다.')}</span>
        </DeleteDiv>
      )) || (
        <GridDiv
          onClick={() => {
            goToOriginMsg(currentRoomID, replyID);
          }}
        >
          <ReplyFileItemDiv>
            {!blockChat &&
              emoticon &&
              convertChildren({
                children: emoticon,
                style: { width: 45, height: 45 },
              })}
            {!blockFile && fileInfos && <FileComponent fileInfos={fileInfos} />}
          </ReplyFileItemDiv>
          {senderName && (
            <ReplySenderDiv>
              <span>
                {getSysMsgFormatStr(covi.getDic('replyToUser', '%s에게 답장'), [
                  { type: 'Plain', data: getDictionary(senderName) },
                ])}
              </span>
            </ReplySenderDiv>
          )}
          {context && (
            <ReplyContextDiv>
              {(blockChat && (
                <span>{covi.getDic('BlockChat', '차단된 메시지 입니다.')}</span>
              )) ||
                convertChildren({
                  children: context,
                  mentionInfo: processMsg?.mentionInfo,
                  useAction: false,
                })}
            </ReplyContextDiv>
          )}
        </GridDiv>
      )}
    </>
  );
};

export default React.memo(MessageReplyBox);
