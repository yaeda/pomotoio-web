export const createCountdownTimer = () => {
  const listeners = [];
  let duration = undefined;
  let endTime = undefined;
  let timeoutId;
  let started = false;

  const onFinish = (listener) => {
    listeners.push(listener);
  };

  const setTime = (time /* ms */) => {
    stop();
    duration = time;
  };

  const start = () => {
    if (started || duration === undefined) {
      return;
    }
    endTime = Date.now() + duration;
    timeoutId = setTimeout(() => {
      stop();
      listeners.forEach((listener) => listener());
    }, duration);
    started = true;
  };

  const stop = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    duration = undefined;
    endTime = undefined;
    started = false;
  };

  const getRemainingTime = () => {
    if (!started) {
      return duration === undefined ? 0 : duration;
    }

    const remainingTime = endTime - Date.now();
    return remainingTime >= 0 ? remainingTime : 0;
  };

  return {
    onFinish: onFinish,
    setTime: setTime,
    start: start,
    stop: stop,
    getRemainingTime: getRemainingTime,
  };
};

// const LOOP_SPAN = 500; // msec

// export const createCountdownTimer = (time /* msec */) => {
//   let duration = time;
//   let timerHandler;
//   let lastTickedTime;
//   const listeners = [];

//   const _update = () => {
//     const now = new Date().getTime();
//     duration -= now - lastTickedTime;
//     lastTickedTime = now;

//     if (duration < 0) {
//       duration = 0;
//     }

//     listeners.forEach((listener) => listener("time", duration));

//     if (duration === 0) {
//       listeners.forEach((listener) => listener("finish"));
//       stop();
//     } else {
//       timerHandler = setTimeout(_update, LOOP_SPAN);
//     }
//   };

//   const on = (listener) => {
//     listeners.push(listener);
//   };

//   const start = () => {
//     stop();
//     lastTickedTime = new Date().getTime();
//     timerHandler = setTimeout(_update, LOOP_SPAN);
//   };

//   const stop = () => {
//     if (timerHandler !== undefined) {
//       clearInterval(timerHandler);
//     }
//   };

//   const getRemainingTime = () => {
//     return duration;
//   };

//   return {
//     on: on,
//     start: start,
//     stop: stop,
//     getRemainingTime: getRemainingTime,
//   };
// };
