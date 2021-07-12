import { useState, useEffect, useCallback, useMemo } from 'react';
import useWindowDimensions from '@/hooks/useWindowDimensions';

/**
 * v1 2020.12.22
 * v2 2021.01.15
 * 
 * Offset state 관리를 위한 hook
 * @param {Number} initialNumToRender   초기 렌더링 개수        (default innerHeight/heightPerItem + 2 )
 * @param {Number} renderPerBatch       페이징 업데이트 단위     (default 5)
 * @param {Number} heightPerItem        각 컴포넌트의 height    (default 60)
 */
export default function useOffset(data = [], { initialNumToRender = Math.ceil(window.innerHeight) + 2, renderPerBatch, heightPerItem }) {
    const { height: windowHeight } = useWindowDimensions();
    
    // limit: 페이지네이션의 최대값. 데이터가 없을 경우 기본값 0
    const limit = data.length;
    // renderOffset: 페이지네이션 위치를 기록하는 offset
    const [renderOffset, setRenderOffset] = useState(start || 0);
    // isDone: offset의 현재값이 최대값을 초과했는지 확인하기 위한 플래그
    const [isDone, setIsDone] = useState(renderOffset >= limit);
    const height = heightPerItem || 60;
    const start = useMemo(() => {
        // 첫 렌더링은 (innerHeight/itemHeight)+@ 를 렌더링 해야 스크롤바가 생김
        const defaultNumToRender = Math.ceil(windowHeight / height) + 1;
        if(initialNumToRender && initialNumToRender >= defaultNumToRender) {
            return initialNumToRender;
        }
        // initialNumToRender가 default값보다 작을 경우 해당 옵션 무시
        return defaultNumToRender;
    }, [initialNumToRender, windowHeight]);
    const size = renderPerBatch || 5;

    useEffect(() => {
        // 검색어가 바뀌어서 데이터가 변할때마다 offset 초기화
        setRenderOffset(start);
    }, [limit]);

    useEffect(() => {
        // offset 또는 데이터가 변할때마다 isDone 업데이트
        const status = renderOffset >= limit;
        if(status !== isDone) {
            setIsDone(status);
        }
    }, [renderOffset, limit]);

    useEffect(() => {
        // 2021.01.15
        // 첫 렌더링 이후 스크롤 이전에 window size가 변할 경우, 변화한 크기에 맞춰서 scroll paging 동작
        if(start >= renderOffset) {
            nextStep(start - renderOffset + 1);
        }
    }, [start]);

    function nextStep(step) {
        const prev = renderOffset;
        // 별도의 파라미터(step)을 넘기지 않으면, 초기에 지정된 renderPerBatch(size)만큼 페이징 동작
        const next = step ? renderOffset + step : renderOffset + size;
        
        // 다음 페이지로 offset 값 업데이트
        if(isDone === false) {
            setRenderOffset(next);
        }

        // 각 step마다 offset 값이 필요할 경우 return value를 활용함
        // ( 2020.12.24 기준 사용 X )
        return { prev, next };
    }

    const handleScrollUpdate = ({ threshold }) => {
        return useCallback((value) => {
            const { top } = value;
            if(top > threshold && isDone === false) {
                nextStep();
            }
        }, [renderOffset, limit, isDone]);
    };

    // 2020.12.24
    // data에 대한 wrapper function
    // 요구사항 변경시 function 추가 or 수정 필요
    // 2021.05.14 data 방어코드 추가
    const list = (func) => {
        return data.slice ? data.slice(0, renderOffset).map(func) : [];
    };

    const filter = (func) => {
        return data.slice ? data.slice(0, renderOffset).filter(func) : [];
    };

    return {
        renderOffset,
        setRenderOffset,
        isDone,
        setIsDone,
        nextStep,
        handleScrollUpdate,
        list,
        filter,
    };
}