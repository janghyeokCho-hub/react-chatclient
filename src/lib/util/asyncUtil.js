/**
 * asyncUtil
 * 
 * 2020.12.28
 * Promise에 대한 debounce를 구현하기 위한 cancelable proimise
 * 
 * Node v15부터 지원하는 기능인 AbortController을 이용해 추후에 리팩토링 할 수 있음
 * [AbortController API](https://developer.mozilla.org/ko/docs/Web/API/AbortController)
 *
 *  @param {Promise} promise 
 */

// 2020.12.28
// Timer debounce
function createTakeLatestTimer(timeout = 100) {
    const TIMEOUT = timeout;
    let cancelableTimer = null;

    // clearTimeout 후 초기화
    const cancel = () => {
        if (!!cancelableTimer) {
            clearTimeout(cancelableTimer);
            cancelableTimer = null;
        }
    };

    // ${timeout} milliseconds 만큼 debounce
    const takeLatest = (callback) => {
        cancel();
        cancelableTimer = setTimeout(() => {
            // callback이 완료된 이후에 자동으로 clear수행 안함(cancel 호출시에만 clear)
            callback(...arguments);
        }, TIMEOUT);
        return cancelableTimer;
    };

    return {
        cancel,
        takeLatest
    };
}

/**
 * 
 * 2021.07.13
 * debounce 구현 (2차)
 * 
 * debounce(func, timeout);
 * debounce(func, timeout, { leading: true });
 * 
 * @param {Function} func 
 * @param {Number} timeout 
 * @param {*} options
 * @returns {Function}
 */
function debounce(func, timeout = 100, {leading = false, throttle = false} = {}) {
    let currentTimer = null;
    
    return (...args) => {
        const execImmediate = (leading || throttle) && !currentTimer;

        if (currentTimer && !throttle) {
            clearTimeout(currentTimer);
            currentTimer = 0;
        }

        if(!currentTimer) {
            currentTimer = setTimeout(() => {
                !throttle && func(...args);
                currentTimer = 0;
            }, timeout);
        }

        execImmediate && func(...args);
    }
}

/**
 * 2021.07.13
 * Throttle 구현
 * 
 * @param {Function} func 
 * @param {Number} timeout 
 * @returns {Function}
 */
function throttle(func, timeout) {
    return debounce(func, timeout, { throttle: true });
}

export {
    debounce,
    throttle,
    
    // createTakeLatestTimer: 1차 구현된 debounce (legacy)
    createTakeLatestTimer
}