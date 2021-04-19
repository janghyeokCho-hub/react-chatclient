import { useEffect, useState } from 'react';


/**
 * 리소스 캐시용 querystring 파라미터 생성을 위한 타임스탬프 lib
 * 
 * opt는 타임스탬프 표현범위 'yMdhms'
 * y: year
 * M: month
 * d: date
 * h: hour
 * m: minute
 * s: second
 * 
 * function 호출시 'yMdhms'에서 생략한 값은 제외되어 리턴함
 */
export function getTimestamp({ option, prefix }) {
    const current = new Date();
    if(typeof option === 'undefined') {
        return current.getTime();
    }
    let returnDate = prefix || '';

    if(option.includes('y')) {
        returnDate += current.getFullYear();
    }
    if(option.includes('M')) {
        returnDate += (current.getMonth() + 1);
    }
    if(option.includes('d')) {
        returnDate += current.getDate();
    }
    if(option.includes('h')) {
        returnDate += current.getHours();
    }
    if(option.includes('m')) {
        returnDate += current.getMinutes();
    }
    if(option.includes('s')) {
        returnDate += current.getSeconds();
    }
    return returnDate.length ? returnDate : current.getTime();
}

export default function useTimestamp({ option, prefix }) {
    const [timestamp, setTimestamp] = useState(getTimestamp({ option, prefix }));
    return {
        timestamp,
        setTimestamp
    };
}