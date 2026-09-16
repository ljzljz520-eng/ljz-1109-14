import { qsa, on, prefersReducedMotion, isLowEndDevice } from "./utils.js";

let revealObserver;
let pageTransitionTimer;

export const initScrollReveal = () => {
  if (prefersReducedMotion()) return;
  const items = qsa("[data-reveal]");
  if (!items.length) return;

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
  );

  items.forEach((item) => revealObserver.observe(item));
};

export const destroyScrollReveal = () => {
  if (!revealObserver) return;
  revealObserver.disconnect();
  revealObserver = null;
};

export const initPageTransitions = () => {
  const body = document.body;
  body.classList.add("page-enter");
  requestAnimationFrame(() => {
    body.classList.add("page-enter-active");
    // 动画结束后移除类，避免 transform 影响 position: fixed 元素
    setTimeout(() => {
      body.classList.remove("page-enter", "page-enter-active");
    }, 400); // 略大于 transition 时间
  });

  qsa("a[data-transition]").forEach((link) => {
    on(link, "click", (event) => {
      const url = link.getAttribute("href");
      if (!url || url.startsWith("#") || url.startsWith("mailto")) return;
      event.preventDefault();
      body.classList.add("page-leave", "page-leave-active");
      if (pageTransitionTimer) clearTimeout(pageTransitionTimer);
      pageTransitionTimer = setTimeout(() => {
        window.location.href = url;
      }, 260);
    });
  });
};

export const destroyPageTransitions = () => {
  if (pageTransitionTimer) {
    clearTimeout(pageTransitionTimer);
    pageTransitionTimer = null;
  }
};

export const initPerformanceMode = () => {
  if (prefersReducedMotion() || isLowEndDevice()) {
    document.documentElement.dataset.motion = "reduced";
  }
};

export const pauseAnimations = () => {
  document.documentElement.dataset.motion = "paused";
};

export const playAnimations = () => {
  document.documentElement.dataset.motion = "";
};

export const destroyAnimations = () => {
  destroyScrollReveal();
  destroyPageTransitions();
};

export const revealElements = (elements) => {
  elements.forEach((el) => el.classList.add("is-visible"));
};

export const toggleReducedMotion = (enable) => {
  if (enable) {
    document.documentElement.dataset.motion = "reduced";
  } else {
    document.documentElement.dataset.motion = "";
  }
};
