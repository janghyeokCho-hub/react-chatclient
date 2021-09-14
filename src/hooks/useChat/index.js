import { useCallback, useEffect } from 'react';
import { getConfig } from '@/lib/util/configUtil';
import useSWR from 'swr';

export function useChatFontSize() {
    const { data: fontType, mutate } = useSWR('/user/fontType', null, { initialData: +localStorage.getItem('covi_user_font_size') || 10 });
    const setFontType = useCallback((newVal) => {
        localStorage.setItem('covi_user_font_size', newVal);
        mutate(newVal);
    }, [mutate]);
    return [fontType, setFontType];
}

export function useChatFontType() {
    const { use: useChatCustomFonts } = getConfig('UseCustomFonts', { use: false });
    const { data: fontSize, mutate } = useSWR('/user/fontSize', null, { initialData: useChatCustomFonts ? localStorage.getItem('covi_user_font_type') || 'Default'  : 'Default'});

    const setFontSize = useCallback((newVal) => {
        localStorage.setItem('covi_user_font_type', newVal);
        mutate(newVal);
    }, [mutate]);
    return [fontSize, setFontSize];
}

export function useMyChatFontColor() {
    const { data: myChatFontColor, mutate } = useSWR('/user/myChatColor', null, { initialData: localStorage.getItem('covi_user_myChat_color') || '#FFF'});
    const setMyChatFontColor = useCallback((newVal) => {
        localStorage.setItem('covi_user_myChat_color', newVal);
        mutate(newVal);
    }, [mutate]);
    return [myChatFontColor, setMyChatFontColor];
}