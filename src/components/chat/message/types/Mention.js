import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { openProfilePopup } from '@/lib/profileUtil';
import Plain from '@C/chat/message/types/Plain';
import { getJobInfo } from '@/lib/common';
import useMemberInfo from '@/hooks/useMemberInfo';

const Mention = ({ marking, mentionInfo, type, targetId}) => {
  const dispatch = useDispatch();
  const [value, setValue] = useState('');
  const [memberInfo, setMemberInfo] = useState(null);
  
  const _isMounted = useRef(true);
  
  const { findMemberInfo } = useMemberInfo();

  const setMention = async () => {
    if (type == 'user' && targetId) {
      if (mentionInfo && Array.isArray(mentionInfo)) {
        const memberInfo = await findMemberInfo(mentionInfo, targetId);
        let txt = '@Unknown';
        if(!memberInfo) {
          //
        }
        else if (memberInfo.name) {
          const jobInfo = getJobInfo(memberInfo);
          txt = `@${jobInfo}`;
        } else if (memberInfo.id) {
          txt = `@${memberInfo.id}`;
        }
        if(_isMounted.current === true) {
          setValue(txt);
          setMemberInfo(memberInfo);
        }
      }
    }
  }

  useEffect(() => {
    setMention();
    // mention target 조회
    // setValue('@대상');
  }, [mentionInfo, targetId, type, _isMounted]);

  useEffect(() => {
    return () => {
      setValue(null);
      setMemberInfo(null);
      _isMounted.current = false;
    }
  }, []);

  const handleClick = () => {
    if (memberInfo.isMine) {
      if (typeof covi.changeSearchView == 'function') {
        // eumtalk://mention. ~ 전체검색하는 경우에만 검색결과가 나오지 않음
        // covi.changeSearchView(`eumtalk://mention.user.${memberInfo.id}`);

        // 멘션 임시패치
        covi.changeSearchView(`://mention.user.${memberInfo.id}`);
      }
    } else {
      openProfilePopup(dispatch, memberInfo.id);
    }
  };

  return (
    <>
      {memberInfo && (
        <span
          style={{
            color: memberInfo.isMine ? 'pink' : 'black',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
          onClick={handleClick}
        >
          <Plain marking={marking} text={value}></Plain>
        </span>
      )}
    </>
  );
};

export default Mention;
