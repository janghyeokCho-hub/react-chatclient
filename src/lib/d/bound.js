import { screen, remote } from 'electron';

/**
 * 2022.07.14
 */

const defaultSize = { width: 500, height: 800 };

export const adjustBounds = (key, bounds) => {
  if (bounds) {
    const targetScreen = screen.getDisplayMatching(bounds);
    const resized = {
      width: Math.min(bounds.width || defaultSize.width, targetScreen.workArea.width),
      height: Math.min(bounds.height || defaultSize.height, targetScreen.workArea.height),
    };
    const { x, y, width, height } = bounds;
    let boundsOutOfDisplay = false;

    if (targetScreen.workArea.x > x) {
      // console.log('OutOfDisplay CASE 1 :: ', targetScreen.workArea.x, x);
      boundsOutOfDisplay = true;
    } else if (targetScreen.workArea.x + targetScreen.workArea.width < x + width) {
      // console.log('OutOfDisplay CASE 2 :: ', targetScreen.workArea.x + targetScreen.workArea.width, x + width);
      boundsOutOfDisplay = true;
    } else if (targetScreen.workArea.y > y) {
      // console.log('OutOfDisplay CASE 3 :: ', targetScreen.workArea.y, y);
      boundsOutOfDisplay = true;
    } else if (targetScreen.workArea.y + targetScreen.workArea.height < y + height) {
      // console.log('OutOfDisplay CASE 4 :: ', targetScreen.workArea.y + targetScreen.workArea.height, y + height);
      boundsOutOfDisplay = true;
    }

    if (boundsOutOfDisplay) {
      return resized;
    }
    return {
      x,
      y,
      width,
      height,
    };
  }
  return defaultSize;
}

export const getInitialBounds = (boundKey) => {
  try {
    // electron main      =>  global.APP_SETTING    
    // electron renderer  =>  remote.getGlobal 
    const APP_SETTING = remote?.getGlobal ? remote.getGlobal('APP_SETTING') : global.APP_SETTING;
    const initialBounds = APP_SETTING.get(boundKey);
    return adjustBounds(boundKey, initialBounds);
  } catch (e) {
    console.log('Error  ', e);
    return defaultSize;
  }
};
