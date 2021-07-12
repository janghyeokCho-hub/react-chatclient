import React from 'react';

/**
 * 2021.05.10
 */

/* Usage */
// <ConditionalWrapper
//     wrapIf={value === true}
//     wrapper={(children)=> <div className="some-wrapper">{children}</div>}
// >
//     <div calssName="some-child">
//         Hello, World!
//     </div>
// </ConditionalWrapper>
export default function ConditionalWrapper({ wrapIf, wrapper, children }) {
    if(wrapIf === true) {
        return wrapper(children);
    }
    return children;
}