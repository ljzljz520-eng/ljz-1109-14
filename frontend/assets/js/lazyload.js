import { qsa } from "./utils.js";

let imageObserver;

export const initLazyLoad = () => {
  const images = qsa("img[data-src]");
  if (!images.length) return;

  imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        imageObserver.unobserve(img);
      });
    },
    { rootMargin: "120px" }
  );

  images.forEach((img) => imageObserver.observe(img));
};
