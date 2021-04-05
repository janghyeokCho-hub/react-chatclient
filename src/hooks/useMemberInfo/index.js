import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getProfileInfo } from '@/lib/profile';

// 캐시클리어 3분
// const CLEAR_TIMEOUT = 180000;
// const cachedData = {};
// const clearCache = {};

// async function readProfileInfo(targetId) {
//     const cache = cachedData[targetId];
//     if(!cache) {
//         // fetch profile data from backend
//         const data = await getProfileInfo(targetId);
//         if(data && cachedData[targetId]) {
//             cachedData[targetId] = data;
//             clearCache[targetId] = setTimeout(() => {
//                 cachedData[targetId] && delete cachedData[targetId];
//             }, CLEAR_TIMEOUT);
//         }
//         return data;
//     } else {
//         // update timer
//         clearTimeout(clearCache[targetId]);
//         clearCache[targetId] = setTimeout(() => {
//             cachedData[targetId] && delete cachedData[targetId];
//         }, CLEAR_TIMEOUT);
//         // cache hit
//         return cache;
//     }
// }

export default function useMemberInfo() {
    const { members } = useSelector(({ room, channel }) => {
        if(room.currentRoom) {
            return room.currentRoom;
        } else if(channel.currentChannel) {
            return channel.currentChannel;
        } else {
            return {
                members: []
            };
        }
    });

    const findMemberInfo = async (mentionInfo, targetId) => {
        if(!mentionInfo || !targetId || !Array.isArray(mentionInfo)) {
            // type checking
            return null;
        }
        // Step 1 - memberInfo 탐색
        let memberInfo = mentionInfo.find(m => m.id === targetId);
        if (!memberInfo || !memberInfo.name) {
            // Step 2 - memberInfo.name이 없을 경우, redux state 탐색
            memberInfo = members.find(m => m.id === targetId);
        }
        if (!memberInfo || !memberInfo.name) {
            // Step 3 - redux store에 memberInfo.name이 없을 경우, 서버로 ajax 요청
            try {
                // const tmp = await readProfileInfo(targetId);
                const tmp = await getProfileInfo(targetId);
                if(!tmp) {
                    return null;
                }
                memberInfo = tmp.data.result;
            }
            catch (err) {
                // 통신 오류가 발생하면 meberInfo를 반환하지 않음
                return null;
            }
        }
        return memberInfo;
    }

    return {
        findMemberInfo
    }
}