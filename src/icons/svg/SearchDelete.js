import React from 'react';

export default function SearchDeleteIcon(props) {
    return (
        <button className="searchdeleteico" {...props}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><g transform="translate(0.488)"><path d="M8,0A8,8,0,1,1,0,8,8,8,0,0,1,8,0Z" transform="translate(-0.488)" fill="#999"></path><g transform="translate(4.513 5.224)"><path d="M128.407,133.742a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12l2.284-2.165,2.284,2.165a.427.427,0,0,0,.294.12.414.414,0,0,0,.294-.12.39.39,0,0,0,0-.565l-2.277-2.158,2.277-2.165a.39.39,0,0,0,0-.564.437.437,0,0,0-.6,0l-2.277,2.165L129,128.3a.444.444,0,0,0-.6,0,.39.39,0,0,0,0,.564l2.284,2.158-2.277,2.165A.371.371,0,0,0,128.407,133.742Z" transform="translate(-128.279 -128.173)" fill="#fff"></path></g></g></svg>
        </button>
    );
}