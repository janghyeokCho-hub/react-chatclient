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
function cancelable(promise) {
    let hasCancelled = false;

    return {
        promise: promise.then(v => {
            if (hasCancelled) {
                throw { isCancelled: true };
            }
            return v;
        }),
        cancel: () => hasCancelled = true
    }
};

// 2020.12.28
// Promise debounce
// 구현 미완료
function createTakeLatest(timeout = 100, leading = false) {
    let cancelablePromise = null;
    let cancelableTimer = null;

    const cancel = () => {
        clearTimeout(cancelableTimer);
        cancelableTimer = null;
    }

    const takeLatest = promise => {
        cancel();
        cancelablePromise = cancelable(promise);
        return cancelablePromise.promise;
    };

    return {
        cancel,
        takeLatest,
    };
};

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

// 2020.12.28
// Throttle promise
// 구현 미완료
function createThrottle(threshold) {

}

export {
    cancelable,
    createTakeLatest,
    createTakeLatestTimer,
    createThrottle,
}