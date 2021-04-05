import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { getJobInfo } from '@/lib/common';
import { secureCopy } from '@/lib/util/clipboardUtil';

/**
 * 메시지 복사시 보낸사람+시간정보 포함하기 (메시지 element의 attribute에 data-messageid 있어야 동작함)
 */
export default function useCopyWithSenderInfo() {
    const ATTRIBUTE_NAME = 'data-messageid';
    const TARGET_CLASSNAME = '.msgtxt';

    const copyWithSenderInfo = (messages) => {
        let arr = [];
        let msgArr = [];
        let msg = null;
        let selection = window.getSelection();
        let range = selection.getRangeAt(0);
        let allMessageID = document.querySelectorAll(TARGET_CLASSNAME);
        let firstSelectedMessage = range.startContainer.parentNode.parentNode.getAttribute(ATTRIBUTE_NAME);
        let tempFindNode = range.endContainer;
        let lastSelectedMessage = range.endContainer.parentNode.parentNode.getAttribute(ATTRIBUTE_NAME);
        if (firstSelectedMessage === null) firstSelectedMessage = range.startContainer.parentNode.parentNode.parentNode.getAttribute(ATTRIBUTE_NAME);
        if (lastSelectedMessage === null) lastSelectedMessage = range.endContainer.parentNode.parentNode.parentNode.getAttribute(ATTRIBUTE_NAME);
        if (lastSelectedMessage === null) {
            if (lastSelectedMessage == null) {
                if (tempFindNode.parentNode.parentNode.parentNode.previousSibling !== null) {
                    lastSelectedMessage = tempFindNode.parentNode.parentNode.parentNode.previousSibling.childNodes[1].childNodes[0].getAttribute(ATTRIBUTE_NAME);
                }
            }
        }
        if (lastSelectedMessage === null) {
            let arrNum = messages.length - 1;
            lastSelectedMessage = messages[arrNum]
        }

        allMessageID.forEach(element => {
            let selectedMessage = element.getAttribute(ATTRIBUTE_NAME);
            if (firstSelectedMessage <= selectedMessage && selectedMessage <= lastSelectedMessage) {
                arr.push(selectedMessage);
            }
        });

        messages.forEach(ele => {
            arr.forEach(element => {
                let mid = parseInt(element);
                if (mid === ele.messageID) {
                    let senderInfo = JSON.parse(ele.senderInfo);
                    msg = '[' + `${getJobInfo(senderInfo)}` + ']' + format(new Date(ele.sendDate), '[yyyy/MM/dd - HH:mm:ss]') + ' ' + ele.context;
                    msgArr.push(msg);
                }
            })
        });
        msgArr = JSON.stringify(msgArr);
        msgArr = msgArr.replace(/\\\"/gi, "");
        msgArr = msgArr.replace(/\"/gi, "");
        msgArr = msgArr.substring(1, msgArr.length - 1).toString();
        msgArr = msgArr.replace(/\,/gi, "\n");
        // navigator.clipboard.writeText(msgArr);
        secureCopy(msgArr);
    };

    return {
        copyWithSenderInfo
    };
}