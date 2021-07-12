import React from 'react';
import useSWR from 'swr';

const KEY = '/note/send/targets';

export default function useTargetState() {
    return useSWR(KEY, null, { revalidateOnFocus: false, initialData: [] });
}