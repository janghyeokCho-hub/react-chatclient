export function isEmptyValue(src) {
  if (Array.isArray(src)) {
    // Check empty array
    return !src?.length;
  } else {
    const valueType = typeof src;
    if (valueType === 'object') {
      // Check empty object
      return src === null || !Object.keys(src).length;
    } else if (valueType === 'number' || valueType === 'bigint') {
      // Check invalid number
      return isNaN(src);
    }
    // Check falsy value
    return !src;
  }
}

export function sortObjectProperties(obj) {
  const keys = Object.keys(obj).sort();
  return keys.reduce((prev, key) => {
    prev[key] = obj[key];
    return prev;
  }, {});
}

export function isSameValue(source, target) {
  if (isEmptyValue(source) || isEmptyValue(target)) {
    return false;
  }
  if (typeof source === 'object') {
    source = JSON.stringify(sortObjectProperties(source));
  }
  if (typeof target === 'object') {
    target = JSON.stringify(sortObjectProperties(target));
  }
  return source === target;
}
