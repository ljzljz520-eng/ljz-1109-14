import { initViewRouter } from "./router.js";
import { fetchJSON } from "./data.js";
import { initScrollReveal, initPageTransitions, initPerformanceMode, pauseAnimations, playAnimations, destroyAnimations } from "./animations.js";
import { initTabs, initModal, initStepper, initCanvasDemo, initAccordion, initToast, initForm, initAutoPlay, initHeroCarousel, init3DTilt } from "./components.js";
import { initLazyLoad } from "./lazyload.js";
import { on, qs, qsa } from "./utils.js";

const initNav = () => {
  const toggle = qs("[data-nav-toggle]");
  const menu = qs("[data-nav-menu]");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    menu.classList.toggle("is-open");
  });
};

const resolvePath = (path) => {
  if (path.startsWith("http") || path.startsWith("/")) return path;
  const isInPages = window.location.pathname.includes("/pages/");
  return `${isInPages ? "../" : ""}${path}`;
};

const renderCards = async (selector, path) => {
  const containers = qsa(selector);
  if (!containers.length) return;
  containers.forEach((container) => {
    container.innerHTML = "";
  });

  try {
    const data = await fetchJSON(resolvePath(path));
    const html = data.items
      .map(
        (item) => `
        <article class="card">
          <h3 class="card-title">${item.title}</h3>
          <p>${item.summary}</p>
          <div class="tag-list">
            ${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
        </article>
      `
      )
      .join("");
    containers.forEach((container) => {
      container.innerHTML = html;
    });
  } catch (error) {
    containers.forEach((container) => {
      container.innerHTML = `<p>数据加载失败，请稍后重试。</p>`;
    });
  }
};

const renderWorkGallery = async () => {
  const containers = qsa("[data-works]");
  if (!containers.length) return;
  containers.forEach((container) => {
    container.innerHTML = "";
  });

  try {
    const data = await fetchJSON(resolvePath("assets/data/works.json"));
    const html = data.items
      .map(
        (item) => `
        <article class="card traditional-border">
          <span class="seal-tag" style="position: absolute; top: -10px; right: 10px;">广绣</span>
          <h3 class="card-title">${item.title}</h3>
          <p>${item.story}</p>
          <div class="kpi">
            <strong>${item.year}</strong>
            <span>${item.type}</span>
          </div>
        </article>
      `
      )
      .join("");
    containers.forEach((container) => {
      container.innerHTML = html;
    });
  } catch {
    containers.forEach((container) => {
      container.innerHTML = `<p>代表作品加载失败。</p>`;
    });
  }
};

const initSkeleton = () => {
  qsa("[data-skeleton]").forEach((wrapper) => {
    setTimeout(() => {
      wrapper.innerHTML = "";
    }, 600);
  });
};

const initAnimationControls = () => {
  const control = qs("[data-animation-control]");
  if (!control) return;
  on(control, "click", () => {
    const isPaused = document.documentElement.dataset.motion === "paused";
    if (isPaused) {
      playAnimations();
      control.textContent = "暂停全局动画";
    } else {
      pauseAnimations();
      control.textContent = "播放全局动画";
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initPerformanceMode();
  initNav();
  initPageTransitions();
  initScrollReveal();
  initLazyLoad();
  initTabs();
  initModal();
  initStepper();
  initCanvasDemo();
  initViewRouter();
  initSkeleton();
  initAnimationControls();
  initAccordion();
  initToast();
  initForm();
  initAutoPlay();
  initHeroCarousel();
  init3DTilt();

  renderCards("[data-cases]", "assets/data/cases.json");
  renderCards("[data-techniques]", "assets/data/techniques.json");
  renderCards("[data-list]", "assets/data/list.json");
  renderWorkGallery();
});

window.addEventListener("beforeunload", () => {
  destroyAnimations();
});
