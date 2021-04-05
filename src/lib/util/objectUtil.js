function deepEqual(A, B) {
    try {
        const keysA = Object.keys(A);
    
        if(keysA.length !== Object.keys(B).length) {
            return false;
        }
        for(const key of keysA) {
            const propertyA = A[key];
            const propertyB = B[key];
            if(typeof propertyA === 'object' && typeof propertyB === 'object') {
                if(deepEqual(propertyA, propertyB) === false) {
                    return false;
                }
            }
            if(propertyA !== propertyB) {
                return false;
            }
        }
        return true;
    } catch(err) {
        return false;
    }
}

function jsonEqual(A, B) {
    try {
        const jsonA = JSON.stringify(A);
        const jsonB = JSON.stringify(B);
        return jsonA === jsonB;
    } catch(err) {
        return false;
    }
}

function merge(...objects) {
    try {
        return Object.assign({}, ...objects);
    } catch(err) {
        return {};
    }
}

export {
    deepEqual,
    jsonEqual,
    merge,
}