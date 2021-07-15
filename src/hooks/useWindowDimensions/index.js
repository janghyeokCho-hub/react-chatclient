import { useEffect, useState } from 'react';
import { throttle } from '@/lib/util/asyncUtil';

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height
    };
}


export default function useWindowDimensions(timeout) {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    if(!window) {
        return null;
    }
    
    useEffect(() => {
        const handleResize = throttle(() => {
            setWindowDimensions(getWindowDimensions())
        }, timeout || 100);

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}