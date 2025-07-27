//  "favoritesUtils.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

const MINIMUM_LOADING_TIME = 500; // 0.5 seconds

export const createLoadingDelay = (startTime: number) => {
  const elapsedTime = Date.now() - startTime;
  const remainingTime = MINIMUM_LOADING_TIME - elapsedTime;
  return Math.max(0, remainingTime);
};

export const handleMinimumLoadingTime = (
  startTime: number,
  callback: () => void
) => {
  const remainingTime = createLoadingDelay(startTime);
  
  if (remainingTime > 0) {
    setTimeout(callback, remainingTime);
  } else {
    callback();
  }
};
