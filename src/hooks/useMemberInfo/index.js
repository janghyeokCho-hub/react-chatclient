import LRU from 'lru-cache';
import { useSelector } from 'react-redux';
import { getProfileInfo } from '@/lib/profile';
import { searchOrgChart } from '@/lib/orgchart';

export function useMemberCache(opts = {}) {
    const default_options = {
        max: 30,
        length: (n, key) => n*2 + key.length,
        maxAge: 5000
    };
    const cache = new LRU({
        ...default_options,
        ...opts
    });

    return async (userID, targetName, forceUpdate = false) => {
        let cachedTarget = cache.get(targetName); 
        if(cachedTarget && forceUpdate === false) {
            return cachedTarget;
        } else {
            try {
                // const tmp = await getProfileInfo(targetId);
                const tmp = await searchOrgChart({ userID, value: targetName, type: 'O' });
                if (tmp.data.status === 'SUCCESS') {
                    cache.set(targetName, tmp.data.result);
                    return tmp.data.result;
                } else {
                    return null;
                }
            } catch(err) {
                console.log(`SearchOrgChart(${userID}, ${targetName}, O) Error :: `, err);
                return null;
            }
        }
    }
}

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
                const tmp = await getProfileInfo(targetId, { useCache: true });
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