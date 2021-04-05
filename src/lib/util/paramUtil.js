import { managesvr } from '@/lib/api';

export default class ParamUtil {
  constructor(str, obj) {
    this.str = str;
    this.obj = obj;
    this.queue = [];
    this.regex = new RegExp(/#|\+|\$|&/g);
  }

  static toValue = (object, key) => {
    let path = key.split('.');
    for (let i = 0; i < path.length; i++) {
      if (object[path[i]] === undefined) {
        return undefined;
      }
      object = object[path[i]];
    }
    return object;
  };

  static toDate = () => new Date().getTime();

  static toPlain = val => val;

  static toMerge = a => b => a + b;
  static toToken = () => localStorage.getItem('covi_user_access_token');
  static compose = funcs => {
    return funcs.reduceRight(
      (acc, curr) => {
        return () => curr(acc());
      },
      val => val,
    );
  };

  static matchAll = (str, regex) => {
    const matches = str.match(regex);
    const matchArr = matches.reduce((acc, curr) => {
      const lastGroup = acc.length > 0 ? acc[acc.length - 1] : null;
      let result = null;
      if (lastGroup) {
        const groupStr = lastGroup.remainStr.substring(
          lastGroup.remainStr.indexOf(curr),
        );
        result = {
          0: curr,
          input: str,
          index: str.length - groupStr.length,
          remainStr: groupStr,
        };
      } else {
        const groupStr = str.substring(str.indexOf(curr));
        result = {
          0: curr,
          input: str,
          index: str.length - groupStr.length,
          remainStr: groupStr,
        };
      }

      acc.push(result);

      return acc;
    }, []);

    return matchArr;
  };

  getURLParam = () => {
    let matches = null;
    if (typeof String.prototype.matchAll === 'function') {
      matches = this.str.matchAll(this.regex);
    } else {
      matches = ParamUtil.matchAll(this.str, this.regex);
    }

    let splitIdx = 0;
    for (let call of matches) {
      const type = call[0];

      const callVal =
        (type !== '+' && this.str.substring(splitIdx, call.index)) || 'toMerge';

      if (type === '#') {
        this.queue.push(ParamUtil[callVal]);
      } else if (type === '+') {
        this.queue.push(ParamUtil.toMerge(this.queue.pop()()));
      } else if (type === '$') {
        this.queue.push(() => ParamUtil.toValue(this.obj, callVal));
      } else if (type === '&') {
        this.queue.push(() => ParamUtil.toPlain(callVal));
      }

      splitIdx = call.index + 1;
    }

    if (this.queue.length > 0) {
      const composeFunc = ParamUtil.compose(this.queue);
      this.queue = [];

      return composeFunc();
    } else {
      return '';
    }
  };
}

export const encryptText = (text, type) => {
  return managesvr(
    'get',
    `/cipher?pt=${encodeURIComponent(text)}&et=${encodeURIComponent(type)}`,
    null,
  );
};
