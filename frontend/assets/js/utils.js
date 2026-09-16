export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const on = (element, event, handler, options) => {
  if (!element) return;
  element.addEventListener(event, handler, options);
};

export const debounce = (fn, delay = 200) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, delay = 200) => {
  let waiting = false;
  return (...args) => {
    if (waiting) return;
    waiting = true;
    fn(...args);
    setTimeout(() => {
      waiting = false;
    }, delay);
  };
};

export const prefersReducedMotion = () => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const isLowEndDevice = () => {
  const cores = navigator.hardwareConcurrency || 4;
  return cores <= 4;
};
