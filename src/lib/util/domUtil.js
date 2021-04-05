// pos : 'start', 'center'
// parent : scrollBox DOM Object
// target : target DOM Object
export const scrollIntoView = (pos, target) => {
  const parent = target.offsetParent;
  const { scrollHeight: totalHeight, offsetHeight: viewHeight } = parent;
  const { offsetTop: targetPos } = target;

  if (pos == 'center') {
    parent.scrollTo(0, targetPos - Math.floor(viewHeight / 2));
  } else {
    // start
    parent.scrollTo(0, targetPos);
  }
};
