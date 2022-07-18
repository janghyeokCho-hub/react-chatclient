import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteLayer,
  clearLayer,
  isJSONStr,
  getJobInfo,
  getSysMsgFormatStr,
} from '@/lib/common';
import { Scrollbars } from 'react-custom-scrollbars';
import { format } from 'date-fns';
import { setMoveView } from '@/modules/message';
import { isBlockCheck } from '@/lib/orgchart';
import TrashCanIcon from '@/icons/svg/TrashCanIcon';
import { getConfig } from '@/lib/util/configUtil';
import ProfileBox from '@C/common/ProfileBox';
import { getBookmarkList, deleteBookmark } from '@/lib/message';

const autoHide = getConfig('AutoHide_ChatMemberScroll', 'Y') === 'Y';

const BookmarkSummary = ({ roomId }) => {
  const dispatch = useDispatch();
  const [bookmarkList, setBookmarkList] = useState([]);
  const chineseWall = useSelector(({ login }) => login.chineseWall);

  const handleClose = () => {
    deleteLayer(dispatch);
  };

  const substrTxt = str => {
    if (str.length >= 30) {
      return str.substr(0, 27) + '...';
    } else {
      return str;
    }
  };

  const moveToMsg = bookmark => {
    dispatch(
      setMoveView({
        roomID: bookmark.roomId,
        moveId: bookmark.messageId,
        visible: true,
      }),
    );
    clearLayer(dispatch);
  };

  const getList = async () => {
    try {
      const response = await getBookmarkList(roomId);
      if (response.data.status === 'SUCCESS') {
        let list = response.data.list;
        list = list.filter((item = {}) => {
          let isBlock = false;
          if (chineseWall?.length) {
            const senderInfo = isJSONStr(item.senderInfo)
              ? JSON.parse(item.senderInfo)
              : item?.senderInfo;
            const { blockChat, blockFile } = isBlockCheck({
              targetInfo: {
                ...senderInfo,
                id: senderInfo?.sender,
              },
              chineseWall,
            });
            const isFile = item.fileCnt > 0;
            isBlock = isFile ? blockFile : blockChat;
          }
          return !isBlock && item;
        });
        list.sort((a, b) => b.sendDate - a.sendDate);
        setBookmarkList(list);
      } else {
        return;
      }
    } catch (error) {
      console.log('Send Error', error);
    }
  };

  const handleDeleteBookmark = bookmark => {
    const param = {
      roomId: bookmark.roomId,
      bookmarkId: bookmark.bookmarkId,
    };
    deleteBookmark(param)
      .then(({ data }) => {
        if (data.status === 'SUCCESS') {
          setBookmarkList([]);
          getList();
        }
      })
      .catch(error => console.log('Send Error   ', error));
  };

  const getOtherCases = bookmark => {
    let returnText = '';
    if (bookmark.fileCnt > 1) {
      returnText = getSysMsgFormatStr(covi.getDic('Tmp_andCnt', '외 %s건'), [
        { type: 'Plain', data: bookmark.fileCnt - 1 },
      ]);
    }
    return returnText;
  };

  const getDate = idx => {
    let returnDate = '';

    if (idx === 0) {
      returnDate = format(new Date(bookmarkList[idx].sendDate), '  yyyy.MM.dd');
    } else {
      let preDate = format(
        new Date(bookmarkList[idx - 1].sendDate),
        '  yyyy.MM.dd',
      );
      let currDate = format(
        new Date(bookmarkList[idx].sendDate),
        '  yyyy.MM.dd',
      );

      if (preDate !== currDate)
        returnDate = format(
          new Date(bookmarkList[idx].sendDate),
          '  yyyy.MM.dd',
        );
    }
    return returnDate;
  };

  useEffect(() => {
    getList();
  }, []);

  const ListView = () => {
    return (
      <ul>
        {bookmarkList.map((bookmark, idx) => {
          return (
            <div key={idx}>
              <div
                style={{
                  marginTop: getDate(idx) ? '15px' : 0,
                  paddingLeft: getDate(idx) ? '15px' : 0,
                }}
              >
                {getDate(idx)}
              </div>
              <li className="divideline bookmark-list">
                <div
                  onClick={() => moveToMsg(bookmark)}
                  className="bookmark-contents"
                >
                  <div className="profile-photo">
                    <ProfileBox
                      userId={bookmark.senderInfo.sender}
                      userName={bookmark.senderInfo.name}
                      img={bookmark.senderInfo.photoPath}
                    />
                  </div>
                  <p className="sender-name">
                    {getJobInfo(bookmark.senderInfo)}
                  </p>
                  <div className="bookmark-context">
                    {bookmark.fileCnt ? (
                      <>
                        {`${substrTxt(bookmark.fileName)} ${getOtherCases(
                          bookmark,
                        )}`}
                      </>
                    ) : (
                      substrTxt(bookmark.context)
                    )}
                  </div>
                </div>
                <div
                  className="del-bookmark-btn"
                  onClick={() => handleDeleteBookmark(bookmark)}
                >
                  <TrashCanIcon />
                </div>
              </li>
            </div>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <div className="Layer-fileView" style={{ height: '100%' }}>
        <div className="modalheader">
          <a className="closebtn" onClick={handleClose}></a>
          <div className="modaltit">
            <p>{covi.getDic('BookmarkSummary', '책갈피 모아보기')}</p>
          </div>
        </div>
        <Scrollbars
          style={{
            height: 'calc(100% - 46px)',
            boxSizing: 'border-box',
          }}
          autoHide={autoHide}
        >
          <div className="bookmark-List">
            <ListView />
          </div>
        </Scrollbars>
      </div>
    </>
  );
};

export default BookmarkSummary;
