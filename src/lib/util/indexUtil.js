export default class indexUtil {
  constructor() {}
}

export const isOdd = index => {
  return index % 2 !== 0;
};

export const isFirstIndex = index => {
  return index === 0;
};

export const isSecondIndex = index => {
  return index === 1;
};

export const isLastIndex = (index, length) => {
  return index == length - 1;
};

export const isBeforeLastIndex = (index, length) => {
  return index == length - 2;
};
