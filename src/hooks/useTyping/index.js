import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { messageCurrentTyping } from '@/modules/room';
import { openPopup } from '@/lib/common';

/**
 * 2020.12.22
 * messageCurrentTyping 액션의 typing 플래그 값을 ref에 업데이트하는 hook
 */
export default function useTyping() {
    const typing = useSelector(({ room }) => room.typing);
    const needAlert = useRef(false);

    /**
     * useSelector 호출로 가져온 state는 effect 훅에서 최신 값을 가져오지 못함
     * 따라서 needAlert에 값을 매핑하여 플래그를 업데이트
     *  */
    useEffect(() => {
        needAlert.current = !!typing;
    }, [typing]);

    /**
     * 
     * @param {*} dispatch react-redux의 dispatch
     * @param {*} action action 생성 function
     * @param {*} actionParams action의 파라미터
     * @param {*} clearTyping action dispatch 이전에 typing을 false 초기화여부 플래그
     * @param {*} usingDispatch True: dispatch(action(...actionParams)) 호출 | False: action(actionParams) 호출
     */
    function confirm(dispatch, action, actionParams, clearTyping, usingDispatch) {
        if(typeof dispatch === 'undefined' ||
           typeof action === 'undefined' ||
           typeof actionParams === 'undefined') {
            return;
        }
        if(needAlert.current === true) {
            openPopup({
                type: 'Confirm',
                message: covi.getDic('Msg_MoveWarning'),
                callback(result) {
                  if(result === true) {
                    if(!!clearTyping === true) {
                        dispatch(messageCurrentTyping({
                            typing: false
                        }));
                    }
                    /**
                     * 2020.12.22
                     * 1) usingDispatch flag가 true인 경우
                     * 2) actionParams가 Array인 경우
                     * action 변수가 dispatch를 wrapping하고 있는 function이라고 판단함
                     * (예:roomUtil.js의 openChatRoomView)
                     * 위 케이스에는 actionParams를 spread하여 function call
                     * 
                     * 이외의 경우는 파라미터 그대로 action을 dispatch
                     *  */
                    if(usingDispatch || Array.isArray(actionParams)) {
                        action(...actionParams);
                    }
                    else {
                        dispatch(action(actionParams));
                    }
                  }
                }
              }, dispatch);
        } else {
            if(usingDispatch || Array.isArray(actionParams)) {
                action(...actionParams);
            }
            else {
                dispatch(action(actionParams));
            }
        }
    }

    return { typing, needAlert, confirm };
}