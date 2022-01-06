import { screen } from 'electron';
import { deepEqual } from '../util/objectUtil';

export const getInitialBounds = (boundKey, defaultSize, _remote) => {
  try {
    const _screen = _remote?.screen ? _remote.screen : screen;
    const APP_SECURITY_SETTING = _remote?.getGlobal
      ? _remote.getGlobal('APP_SECURITY_SETTING')
      : global.APP_SECURITY_SETTING;

    const initialBounds = APP_SECURITY_SETTING.get(boundKey);
    if (initialBounds) {
      const targetScreen = _screen.getDisplayMatching(initialBounds);
      const { x, y, width, height, display } = initialBounds;

      // 디스플레이 구성이 달라졌을 경우 저장된 좌표를 사용하지 않음 (화면 밖으로 나가는 현상 방지)
      if (display && targetScreen && targetScreen.id !== display.id) {
        throw new Error('Display changed. use default bounds');
      }
      /**
       * 2021.01.25
       * width* 0.8, height*0.8
       * 현재 창크기의 일부정도는 화면 밖으로 나가더라도 위치조정이 일어나지 않도록 느슨한 설정
       */
      const offsetX =
        x + width * 0.8 - targetScreen.bounds.x <= targetScreen.workArea.width;
      const offsetY =
        y + height * 0.8 - targetScreen.bounds.y <=
        targetScreen.workArea.height;

      /**
       * 2021.01.25
       * Future Work
       * 대화방을 마지막으로 사용했을 때와 디스플레이 환경이 다를 경우에
       * scale-up 또는 scale-down 계산하여 윈도우크기 적용
       */
      // if(
      //   (targetScreen.id === display.id) ||
      //   deepEqual(targetScreen.workArea, display.workArea)
      // ) {
      // } else {
      // }

      if (offsetX && offsetY) {
        // 이전에 닫힌 대화방이 현재 디스플레이 안에 온전히 들어가 있는 경우 - 저장된 위치 그대로
        const res = {
          x,
          y,
          width,
          height,
        };
        return res;
      } else {
        // 대화방이 현재 디스플레이 밖으로 나가는 경우 - 화면 중앙으로

        // width/height가 스크린 최대범위를 벗어나지 않도록 조정
        const resizedWidth =
          width < targetScreen.workArea.width
            ? width
            : targetScreen.workArea.width;
        const resizedHeight =
          height < targetScreen.workArea.height
            ? height
            : targetScreen.workArea.height;

        // 윈도우 창이 디스플레이의 가운데를 기준으로 하도록 x,y 값 조정
        const resizedX =
          targetScreen.workArea.x +
          (targetScreen.workArea.width / 2 - resizedWidth / 2);
        const resizedY =
          targetScreen.workArea.y +
          (targetScreen.workArea.height / 2 - resizedHeight / 2);

        const resized = {
          // x,y 범위가 화면 밖을 벗어나면: 해당 디스플레이의 (0,0) 좌표로 위치 이동
          x: resizedX >= 0 ? resizedX : targetScreen.workArea.x,
          y: resizedY >= 0 ? resizedY : targetScreen.workArea.y,
          width: resizedWidth,
          height: resizedHeight,
        };
        return resized;
      }
    } else {
      console.log('No initialBounds');
      return {
        width: defaultSize.width,
        height: defaultSize.height,
      };
    }
  } catch (e) {
    console.log('Error  ', e);
    return {
      width: defaultSize.width,
      height: defaultSize.height,
    };
  }
};
