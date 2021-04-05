'use strict';
import fs from 'fs';

export const exists = file => {
  try {
    fs.statSync(file);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
  }
};

export const sync = (file, object) => {
  fs.writeFileSync(file, JSON.stringify(object));
};

export const search = (object, key) => {
  let path = key.split('.');
  for (let i = 0; i < path.length; i++) {
    if (object[path[i]] === undefined) {
      return undefined;
    }
    object = object[path[i]];
  }
  return object;
};

export const set = (object, key) => {
  let path = key.split('.');
  for (var i = 0; i < path.length - 1; ++i) {
    if (!object[path[i]]) {
      object[path[i]] = {};
    }
    object = object[path[i]];
  }
  return ((object, attribute) => {
    return value => {
      object[attribute] = value;
    };
  })(object, path[i]);
};

export const remove = (object, key) => {
  let path = key.split('.');
  for (var i = 0; i < path.length - 1; ++i) {
    if (!object[path[i]]) {
      object[path[i]] = {};
    }
    object = object[path[i]];
  }
  return ((object, attribute) => {
    return () => {
      delete object[attribute];
    };
  })(object, path[i]);
};
