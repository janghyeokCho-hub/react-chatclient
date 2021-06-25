import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import UserInfoBox from '@COMMON/UserInfoBox';
import useOffset from '@/hooks/useOffset';
import { getChannelMentionList } from '@/lib/message';

const SuggestionLayer = ({
  roomId,
  currMember,
  onMentionClick,
  onSuggestionMembers,
  messageContext,
}) => {
  const { loginId, currentChannel } = useSelector(({ login }) => ({
    loginId: login.id,
  }));
  const RENDER_INIT = 10;
  const RENDER_UNIT = 8;
  const [suggestionList, setSuggestionList] = useState([]);
  const [mensionHeight, setMensionHeight] = useState('240px');
  const [suggestionMembersCount, setSuggestionMembersCount] = useState(0);
  const { renderOffset, setRenderOffset, handleScrollUpdate, list, filter } = useOffset(suggestionList, { initialNumToRender: RENDER_INIT, renderPerBatch: RENDER_UNIT });

  const handleUpdate = handleScrollUpdate({
    threshold: 0.9
  });

  const resizeMensionHeight = useCallback( suggestionMembersCount => {
    if((suggestionMembersCount * 60) <= 240)
      return (suggestionMembersCount * 60);
    return 240;
  }, [suggestionMembersCount]);

  useEffect(() => {
    // 멘션 키워드("@") 입력시 SuggestionLayer 노출
    if (messageContext[messageContext.length - 1] == '@') {
      // 새로운 request 없이 props로 넘겨받은 currMember로 멘션 리스트에 노출
      const suggestionMembers = currMember.filter((member) => member.id !== loginId);
      setMensionHeight(String(resizeMensionHeight(suggestionMembers.length) + 'px'));
      onSuggestionMembers(suggestionMembers);
      setSuggestionList(suggestionMembers);
    }
    // 멘션 키워드('@') 이후 검색대상 입력
    else if (messageContext.lastIndexOf('@') > -1) {
      // 멘션 키워드는 다른 텍스트와 공백으로 구분되어야 함
      const lastIdx = messageContext.lastIndexOf(' ');
      const lastMentionIdx = messageContext.lastIndexOf('@');
      if (lastIdx + 1 == lastMentionIdx) {
        // 대상 검색 시작
        const searchContext = messageContext.substring(lastMentionIdx + 1);

        /**
         * 2020.12.23
         * TODO: getCHannelMentionList에 비동기 debounce 적용(빠르게 스크롤할 시 버그발생여부 사전방지)
         */
        getChannelMentionList({ roomId, name: searchContext }).then(
          ({ data }) => {
            if (data.list && data.list.length > 0) {
              // 검색 결과를 멘션 리스트에 노출
              const suggestionMembers = data.list.map((member) => {
                return {
                  photoPath: member.photoPath,
                  name: member.displayName,
                  PN: member.PN,
                  LN: member.LN,
                  TN: member.TN,
                  id: member.userID,
                }
              });
              setMensionHeight(String(resizeMensionHeight(suggestionMembers.length) + 'px'));
              onSuggestionMembers(suggestionMembers);
              setSuggestionList(suggestionMembers);
            } else {
              // 초기화
              onSuggestionMembers([]);
              setSuggestionList([]);
            }
          },
        );
      }
    }
  }, [messageContext, renderOffset]);

  return (
    <>
      <div className="chat_sticker" style={{height: mensionHeight}}>
        <Scrollbars
          style={{ position: 'absolute', color: '#FF0000' }}
          className="MessageList"
          autoHide={true}
          onUpdate={handleUpdate}
        >
          <div className="chat_sticker_tab">
            <ul>
              {suggestionList && list((member, _) => {
                return (
                  <div
                      key={member.id}
                      style={{ height: '50px', padding: '5px 0px' }}
                      onClick={() => onMentionClick(member)}
                    >
                      <UserInfoBox
                        userInfo={member}
                        isInherit={false}
                        isClick={false}
                      />
                  </div>
                )
              })}
            </ul>
          </div>
        </Scrollbars>
      </div>
    </>
  );
};

export default SuggestionLayer;
