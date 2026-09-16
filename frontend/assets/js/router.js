import { qsa, on } from "./utils.js";

export const initViewRouter = () => {
  const viewPanels = qsa("[data-view]");
  if (!viewPanels.length) return;

  const setView = (viewName, push = true) => {
    viewPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.view === viewName);
    });

    if (push) {
      const url = new URL(window.location.href);
      url.searchParams.set("view", viewName);
      history.pushState({ view: viewName }, "", url);
    }
  };

  const currentView = new URLSearchParams(window.location.search).get("view") || viewPanels[0].dataset.view;
  setView(currentView, false);

  qsa("[data-view-target]").forEach((trigger) => {
    on(trigger, "click", (event) => {
      event.preventDefault();
      setView(trigger.dataset.viewTarget);
    });
  });

  on(window, "popstate", (event) => {
    if (event.state?.view) {
      setView(event.state.view, false);
    }
  });
};
