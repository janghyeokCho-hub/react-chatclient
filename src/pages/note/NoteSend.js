import React from 'react';
import NewNote from '@/pages/note/NewNote';
import LayerTemplate from '@COMMON/layer/LayerTemplate';

export default function NoteSend({ match, location }) {
    return (
        <>
            <NewNote match={match} location={location} />
            <LayerTemplate />
        </>
    );
}