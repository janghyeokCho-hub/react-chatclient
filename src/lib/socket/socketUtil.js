import { checkNetworkStatus } from '@/lib/deviceConnector';

let checker = null;

export const checkNetwork = (callback, interval) => {
  if (checker != null) {
    clearTimeout(checker);
    checker = null;
  }

  checker = setTimeout(() => {
    checkNetworkStatus(callback, () => {
      checkNetwork(callback, interval);
    });
  }, interval);
};

export const clearCheck = () => {
  if (checker) {
    clearTimeout(checker);
    checker = null;
  }
};
