import { qs, qsa, on } from "./utils.js";

export const initTabs = () => {
  qsa("[data-tabs]").forEach((tabs) => {
    const buttons = qsa("[data-tab]", tabs);
    const panels = qsa("[data-tab-panel]", tabs);
    const activate = (target) => {
      buttons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.tab === target));
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.tabPanel === target));
    };

    buttons.forEach((btn) => {
      on(btn, "click", () => activate(btn.dataset.tab));
    });

    if (buttons[0]) {
      activate(buttons[0].dataset.tab);
    }
  });
};

export const initModal = () => {
  const modal = qs("[data-modal]");
  if (!modal) return;
  const openers = qsa("[data-modal-open]");
  const closer = qs("[data-modal-close]", modal);

  openers.forEach((btn) => on(btn, "click", () => modal.classList.add("is-open")));
  on(closer, "click", () => modal.classList.remove("is-open"));
  on(modal, "click", (event) => {
    if (event.target === modal) modal.classList.remove("is-open");
  });
  
  // ESC键关闭
  on(document, "keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      modal.classList.remove("is-open");
    }
  });
};

const stepData = [
  { title: "起针 (Starting)", desc: "确定纹样起始点，固定丝线张力，为绣制打下基础。", stitchType: "starting" },
  { title: "直针 (Straight)", desc: "广绣基础针法，针脚整齐排列，用于勾勒轮廓和填充平直区域。", stitchType: "straight" },
  { title: "插针 (Insertion)", desc: "广绣核心技艺，针脚密实，通过长短针交错实现色彩自然过渡。", stitchType: "insertion" },
  { title: "套针 (Satin)", desc: "长短针交替套叠，形成自然渐变效果，是广绣特色针法之一。", stitchType: "satin" },
  { title: "滚针 (Outline)", desc: "针针相扣形成线条，用于勾勒轮廓，线条流畅自然。", stitchType: "outline" },
  { title: "叠针 (Layering)", desc: "在基础层上重叠绣制，增加纹样的立体感与厚重感。", stitchType: "layering" },
  { title: "收针 (Finishing)", desc: "收尾压线，隐藏线头，确保绣面平整光洁。", stitchType: "finishing" }
];

export const initStepper = () => {
  const wrapper = qs("[data-stepper]");
  if (!wrapper) return;
  const title = qs("[data-step-title]", wrapper);
  const description = qs("[data-step-desc]", wrapper);
  const prevBtn = qs("[data-step-prev]", wrapper);
  const nextBtn = qs("[data-step-next]", wrapper);
  let currentIndex = 0;

  const render = () => {
    const active = stepData[currentIndex];
    if (title) title.textContent = active.title || "";
    if (description) description.textContent = active.desc || "";
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === stepData.length - 1;
  };

  on(prevBtn, "click", () => {
    currentIndex = Math.max(0, currentIndex - 1);
    render();
    initCanvasDemo(currentIndex);
  });
  on(nextBtn, "click", () => {
    currentIndex = Math.min(stepData.length - 1, currentIndex + 1);
    render();
    initCanvasDemo(currentIndex);
  });

  render();
};

// Canvas 动画状态
let canvasAnimationId = null;
let currentStitchStep = 0;

export const initCanvasDemo = (step = 0) => {
  currentStitchStep = step;
  const canvas = qs("#stitchCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  
  // 取消之前的动画
  if (canvasAnimationId) {
    cancelAnimationFrame(canvasAnimationId);
  }
  
  // 更新进度条
  const progressBar = qs("#stitchProgress");
  if (progressBar) {
    const totalSteps = stepData.length;
    const progress = ((step + 1) / totalSteps) * 100;
    progressBar.style.width = `${progress}%`;
  }

  ctx.clearRect(0, 0, width, height);
  
  // 绘制绣布纹理背景 - 带有回纹装饰
  drawFabricBackground(ctx, width, height);
  
  // 根据步骤绘制针法
  drawStitchByStep(ctx, width, height, step);
  
  // 绘制动态针
  drawAnimatedNeedle(ctx, width, height, step);
  
  // 绘制步骤标题
  drawStepTitle(ctx, width, height, step);
};

// 绘制绣布纹理背景 - 协调浅色系
const drawFabricBackground = (ctx, width, height) => {
  // 浅色渐变背景
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#f5f0e8");
  gradient.addColorStop(1, "#ebe5dc");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 绣布网格 - 深红色半透明
  ctx.strokeStyle = "rgba(138, 45, 45, 0.06)";
  ctx.lineWidth = 0.5;
  const gridSize = 15;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // 回纹边框装饰 - 深红色
  ctx.strokeStyle = "rgba(138, 45, 45, 0.2)";
  ctx.lineWidth = 1.5;
  const borderPadding = 12;
  
  // 绘制四角回纹
  const drawCornerPattern = (x, y, rotate) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotate);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    ctx.restore();
  };
  
  drawCornerPattern(borderPadding, borderPadding, 0);
  drawCornerPattern(width - borderPadding, borderPadding, Math.PI / 2);
  drawCornerPattern(width - borderPadding, height - borderPadding, Math.PI);
  drawCornerPattern(borderPadding, height - borderPadding, -Math.PI / 2);
  
  // 中心淡金色光晕效果
  const glowGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
  glowGradient.addColorStop(0, "rgba(216, 179, 106, 0.08)");
  glowGradient.addColorStop(1, "transparent");
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, width, height);
};

// 绘制单根丝线 - 协调色系丝绸效果
const drawStitch = (ctx, x1, y1, x2, y2, color = "#8a2d2d", width = 2.5, alpha = 1) => {
  ctx.save();
  
  // 基础丝线 - 带渐变
  const threadGradient = ctx.createLinearGradient(x1, y1, x2, y2);
  threadGradient.addColorStop(0, color);
  threadGradient.addColorStop(0.5, "#b05050");
  threadGradient.addColorStop(1, color);
  
  ctx.strokeStyle = threadGradient;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // 丝线高光效果 - 模拟丝光
  const highlightGradient = ctx.createLinearGradient(x1, y1, x2, y2);
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.strokeStyle = highlightGradient;
  ctx.lineWidth = width * 0.4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  ctx.restore();
};

// 绘制多股丝线
const drawThread = (ctx, x1, y1, x2, y2, color = "#8a2d2d", count = 3, alpha = 1) => {
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * 1.2;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const perpX = -Math.sin(angle) * offset;
    const perpY = Math.cos(angle) * offset;
    drawStitch(ctx, x1 + perpX, y1 + perpY, x2 + perpX, y2 + perpY, color, 1.2, alpha);
  }
};

// 根据步骤绘制针法
const drawStitchByStep = (ctx, width, height, step) => {
  const centerX = width / 2;
  const centerY = height / 2 - 10;
  
  // 绘制所有已完成的步骤
  for (let i = 0; i <= step; i++) {
    const alpha = i === step ? 1 : 0.6;
    const stitchType = stepData[i].stitchType;
    
    switch (stitchType) {
      case "starting":
        drawStartingStitch(ctx, centerX, centerY, alpha);
        break;
      case "straight":
        drawStraightStitch(ctx, centerX, centerY, alpha);
        break;
      case "insertion":
        drawInsertionStitch(ctx, centerX, centerY, alpha);
        break;
      case "satin":
        drawSatinStitch(ctx, centerX, centerY, alpha);
        break;
      case "outline":
        drawOutlineStitch(ctx, centerX, centerY, alpha);
        break;
      case "layering":
        drawLayeringStitch(ctx, centerX, centerY, alpha);
        break;
      case "finishing":
        drawFinishingStitch(ctx, centerX, centerY, alpha);
        break;
    }
  }
};

// 起针
const drawStartingStitch = (ctx, cx, cy, alpha) => {
  // 起针固定点
  ctx.save();
  ctx.fillStyle = "#d8b36a";
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(cx - 60, cy + 20, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // 起始线
  drawThread(ctx, cx - 60, cy + 20, cx - 50, cy - 10, "#8a2d2d", 2.5, alpha);
  
  // 起针标注
  ctx.fillStyle = "#8a2d2d";
  ctx.font = "bold 11px serif";
  ctx.textAlign = "center";
  ctx.fillText("起", cx - 60, cy + 45);
  ctx.globalAlpha = 1;
};

// 直针
const drawStraightStitch = (ctx, cx, cy, alpha) => {
  const colors = ["#8a2d2d", "#a04040", "#b05050"];
  for (let i = 0; i < 8; i++) {
    const x = cx - 40 + i * 12;
    const color = colors[i % colors.length];
    drawThread(ctx, x, cy - 25, x, cy + 15, color, 3, alpha * 0.9);
  }
};

// 插针 - 长短针交错
const drawInsertionStitch = (ctx, cx, cy, alpha) => {
  const colors = ["#8a2d2d", "#9a3d3d"];
  for (let i = 0; i < 10; i++) {
    const x = cx - 30 + i * 8;
    const isLong = i % 2 === 0;
    const length = isLong ? 35 : 22;
    const yOffset = isLong ? 0 : 8;
    const color = colors[i % colors.length];
    drawThread(ctx, x, cy - length / 2 + yOffset - 5, x, cy + length / 2 + yOffset - 5, color, 2.5, alpha);
  }
};

// 套针 - 长短针交替套叠
const drawSatinStitch = (ctx, cx, cy, alpha) => {
  const colors = ["#8a2d2d", "#9a3d3d", "#a84d4d"];
  for (let i = 0; i < 12; i++) {
    const x = cx - 20 + i * 6;
    const length = 25 + (i % 3) * 8;
    const color = colors[i % colors.length];
    drawThread(ctx, x, cy - length / 2, x, cy + length / 2, color, 2.5, alpha);
  }
};

// 滚针 - 勾勒轮廓
const drawOutlineStitch = (ctx, cx, cy, alpha) => {
  const color = "#6e1f1f";
  // 绘制流畅的曲线轮廓
  const points = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = cx - 50 + t * 100;
    const y = cy - 30 + Math.sin(t * Math.PI) * 20;
    points.push({ x, y });
  }
  
  for (let i = 0; i < points.length - 1; i++) {
    drawThread(ctx, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, color, 2.5, alpha);
  }
};

// 叠针 - 立体层次
const drawLayeringStitch = (ctx, cx, cy, alpha) => {
  // 第一层
  for (let i = 0; i < 6; i++) {
    const x = cx - 15 + i * 8;
    drawThread(ctx, x - 4, cy - 5, x + 4, cy + 5, "#a04040", 2.5, alpha * 0.8);
  }
  // 第二层覆盖
  for (let i = 0; i < 5; i++) {
    const x = cx - 10 + i * 8;
    drawThread(ctx, x + 4, cy - 8, x - 4, cy + 8, "#8a2d2d", 3, alpha);
  }
};

// 收针
const drawFinishingStitch = (ctx, cx, cy, alpha) => {
  // 结尾压线
  drawThread(ctx, cx + 50, cy, cx + 75, cy, "#8a2d2d", 4.5, alpha);
  
  // 结扣示意
  ctx.save();
  
  ctx.strokeStyle = "#8a2d2d";
  ctx.lineWidth = 2;
  ctx.globalAlpha = alpha;
  
  // 外圈
  ctx.beginPath();
  ctx.arc(cx + 50, cy, 8, 0, Math.PI * 2);
  ctx.stroke();
  
  // 内圈填充
  ctx.fillStyle = "#8a2d2d";
  ctx.beginPath();
  ctx.arc(cx + 50, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // 收针标注
  ctx.fillStyle = "#8a2d2d";
  ctx.font = "bold 11px serif";
  ctx.textAlign = "center";
  ctx.fillText("收", cx + 50, cy + 22);
  
  ctx.restore();
};

// 绘制动态针 - 金属光泽效果
const drawAnimatedNeedle = (ctx, width, height, step) => {
  const centerX = width / 2;
  const centerY = height / 2 - 10;
  
  // 针的位置根据步骤变化
  const stepPositions = [
    { x: -50, y: 5 },    // 起针
    { x: -30, y: -5 },   // 直针
    { x: -10, y: 5 },    // 插针
    { x: 10, y: -5 },    // 套针
    { x: 30, y: -10 },   // 滚针
    { x: 0, y: 8 },      // 叠针
    { x: 60, y: 0 }      // 收针
  ];
  
  const pos = stepPositions[Math.min(step, stepPositions.length - 1)];
  const needleX = centerX + pos.x;
  const needleY = centerY + pos.y;
  
  ctx.save();
  
  ctx.translate(needleX, needleY - 45);
  ctx.rotate(Math.PI / 5);
  
  // 针身金属渐变
  const needleGrad = ctx.createLinearGradient(-2, 0, 2, 60);
  needleGrad.addColorStop(0, "#888");
  needleGrad.addColorStop(0.15, "#ddd");
  needleGrad.addColorStop(0.3, "#fff");
  needleGrad.addColorStop(0.5, "#bbb");
  needleGrad.addColorStop(0.7, "#e0e0e0");
  needleGrad.addColorStop(0.85, "#999");
  needleGrad.addColorStop(1, "#666");
  
  // 针身阴影
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  
  ctx.fillStyle = needleGrad;
  ctx.fillRect(-2, 0, 4, 65);
  
  // 针尖
  ctx.shadowColor = "transparent";
  ctx.beginPath();
  ctx.moveTo(0, 72);
  ctx.lineTo(-3, 62);
  ctx.lineTo(3, 62);
  ctx.closePath();
  ctx.fillStyle = "#555";
  ctx.fill();
  
  // 针尾眼
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.strokeRect(-1.5, 4, 3, 6);
  
  ctx.restore();
};

// 绘制步骤标题 - 协调色系
const drawStepTitle = (ctx, width, height, step) => {
  ctx.save();
  
  // 背景条
  const barY = height - 38;
  ctx.fillStyle = "rgba(138, 45, 45, 0.08)";
  ctx.fillRect(width / 2 - 90, barY, 180, 26);
  
  // 边框
  ctx.strokeStyle = "rgba(138, 45, 45, 0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(width / 2 - 90, barY, 180, 26);
  
  // 标题文字
  ctx.fillStyle = "#8a2d2d";
  ctx.font = "bold 14px 'Noto Serif SC', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stepData[step].title, width / 2, barY + 13);
  
  ctx.restore();
};

let autoPlayInterval = null;

export const initAutoPlay = () => {
  const btn = qs("#autoPlayBtn");
  if (!btn) return;
  
  let currentIndex = 0;
  const totalSteps = stepData.length;
  let isPlaying = false;
  
  const stopAutoPlay = () => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
    isPlaying = false;
    btn.textContent = "自动播放演示";
  };
  
  btn.addEventListener("click", () => {
    if (isPlaying) {
      stopAutoPlay();
      return;
    }
    
    isPlaying = true;
    btn.textContent = "停止演示";
    currentIndex = 0;
    
    initCanvasDemo(currentIndex);
    updateStepperDisplay(currentIndex);
    
    autoPlayInterval = setInterval(() => {
      currentIndex++;
      if (currentIndex >= totalSteps) {
        stopAutoPlay();
        return;
      }
      initCanvasDemo(currentIndex);
      updateStepperDisplay(currentIndex);
    }, 1500);
  });
};

export const initHeroCarousel = () => {
  const carousel = qs("[data-hero-carousel]");
  if (!carousel) return;

  const items = qsa(".carousel-item", carousel);
  const dots = qsa(".dot", carousel);
  let currentIndex = 0;
  let timer = null;

  const showSlide = (index) => {
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add("active");
        if (dots[i]) dots[i].classList.add("active");
      } else {
        item.classList.remove("active");
        if (dots[i]) dots[i].classList.remove("active");
      }
    });
    currentIndex = index;
  };

  const nextSlide = () => {
    if (items.length <= 1) return;
    let next = (currentIndex + 1) % items.length;
    showSlide(next);
  };

  const startTimer = () => {
    timer = setInterval(nextSlide, 3000);
  };

  const stopTimer = () => {
    if (timer) clearInterval(timer);
  };

  dots.forEach((dot, i) => {
    on(dot, "click", () => {
      showSlide(i);
      stopTimer();
      startTimer();
    });
  });

  carousel.addEventListener("mouseenter", stopTimer);
  carousel.addEventListener("mouseleave", startTimer);

  startTimer();
};

const updateStepperDisplay = (index) => {
  const title = qs("[data-step-title]");
  const desc = qs("[data-step-desc]");
  const prevBtn = qs("[data-step-prev]");
  const nextBtn = qs("[data-step-next]");
  const currentStepEl = qs("#currentStep");
  
  const data = stepData[index];
  if (title) {
    title.textContent = data.title;
    title.style.animation = "none";
    title.offsetHeight; // 触发重绘
    title.style.animation = "fadeInUp 0.3s ease";
  }
  if (desc) {
    desc.textContent = data.desc;
    desc.style.animation = "none";
    desc.offsetHeight;
    desc.style.animation = "fadeInUp 0.3s ease 0.1s both";
  }
  if (prevBtn) {
    prevBtn.disabled = index === 0;
    prevBtn.style.opacity = index === 0 ? "0.4" : "1";
  }
  if (nextBtn) {
    nextBtn.disabled = index === stepData.length - 1;
    nextBtn.style.opacity = index === stepData.length - 1 ? "0.4" : "1";
  }
  if (currentStepEl) {
    currentStepEl.textContent = index + 1;
  }
};

export const init3DTilt = () => {
  const containers = qsa("[data-tilt-3d]");
  
  containers.forEach(container => {
    const target = qs(".stitch-3d", container);
    if (!target) return;
    
    let isDragging = false;
    let startX, startY;
    let currentRotateX = 10;
    let currentRotateY = 0;
    let autoRotate = true;
    let layerMode = false;
    
    // 更新视角指示器
    const updateIndicator = () => {
      const rotX = qs("#rotX");
      const rotY = qs("#rotY");
      if (rotX) rotX.textContent = Math.round(currentRotateX);
      if (rotY) rotY.textContent = Math.round(currentRotateY);
    };
    
    // 应用变换
    const applyTransform = () => {
      if (layerMode) {
        // 分层显示模式
        const layers = qsa(".layer", target);
        layers.forEach((layer, index) => {
          const baseZ = parseInt(layer.style.transform?.match(/translateZ\((-?\d+)px\)/)?.[1] || 0);
          const offsetZ = index * 40;
          layer.style.transform = layer.style.transform.replace(/translateZ\([^)]+\)/, `translateZ(${baseZ + offsetZ}px)`);
        });
      }
      target.style.transform = `rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
      updateIndicator();
    };
    
    // 鼠标拖动
    on(container, "mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      container.style.cursor = "grabbing";
      
      // 暂停自动旋转
      if (autoRotate) {
        target.classList.remove("auto-rotate");
      }
    });
    
    on(document, "mousemove", (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      currentRotateY += deltaX * 0.3;
      currentRotateX -= deltaY * 0.3;
      
      // 限制X轴旋转角度
      currentRotateX = Math.max(-45, Math.min(45, currentRotateX));
      
      applyTransform();
      
      startX = e.clientX;
      startY = e.clientY;
    });
    
    on(document, "mouseup", () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = "grab";
        
        // 恢复自动旋转
        if (autoRotate) {
          target.classList.add("auto-rotate");
        }
      }
    });
    
    // 滚轮缩放
    on(container, "wheel", (e) => {
      e.preventDefault();
      const scale = e.deltaY > 0 ? 0.9 : 1.1;
      const currentScale = parseFloat(target.dataset.scale || 1);
      const newScale = Math.max(0.5, Math.min(1.5, currentScale * scale));
      target.dataset.scale = newScale;
      target.style.scale = newScale;
    });
    
    // 控制按钮
    const rotateToggle = qs("#rotateToggle");
    const resetView = qs("#resetView");
    const layerToggle = qs("#layerToggle");
    
    if (rotateToggle) {
      on(rotateToggle, "click", () => {
        autoRotate = !autoRotate;
        target.classList.toggle("auto-rotate", autoRotate);
        rotateToggle.classList.toggle("active", autoRotate);
      });
    }
    
    if (resetView) {
      on(resetView, "click", () => {
        currentRotateX = 10;
        currentRotateY = 0;
        target.style.scale = 1;
        target.dataset.scale = 1;
        applyTransform();
      });
    }
    
    if (layerToggle) {
      on(layerToggle, "click", () => {
        layerMode = !layerMode;
        layerToggle.classList.toggle("active", layerMode);
        
        const layers = qsa(".layer", target);
        layers.forEach((layer, index) => {
          if (layerMode) {
            // 展开层
            const zValues = [100, 0, -80, -160];
            layer.style.transition = "transform 0.5s ease";
            layer.style.transform = `translateZ(${zValues[index] + index * 50}px)`;
          } else {
            // 恢复层
            layer.style.transition = "transform 0.5s ease";
            const zValues = [100, 0, -80, -160];
            layer.style.transform = `translateZ(${zValues[index]}px)`;
          }
        });
      });
    }
    
    // 鼠标悬停暂停
    on(container, "mouseenter", () => {
      if (autoRotate && !isDragging) {
        target.style.animationPlayState = "paused";
      }
    });
    
    on(container, "mouseleave", () => {
      if (autoRotate && !isDragging) {
        target.style.animationPlayState = "running";
      }
    });
    
    // 初始化
    updateIndicator();
  });
};

export const initAccordion = () => {
  qsa("[data-accordion]").forEach((accordion) => {
    const items = qsa("[data-accordion-item]", accordion);
    
    items.forEach((item) => {
      const trigger = qs("[data-accordion-trigger]", item);
      const content = qs("[data-accordion-content]", item);
      
      on(trigger, "click", () => {
        const isOpen = item.classList.contains("is-open");
        
        items.forEach((i) => {
          i.classList.remove("is-open");
          const c = qs("[data-accordion-content]", i);
          if (c) c.style.maxHeight = "";
        });
        
        if (!isOpen && content) {
          item.classList.add("is-open");
          content.style.maxHeight = content.scrollHeight + "px";
        }
      });
    });
  });
};

export const initToast = () => {
  const container = qs("[data-toast-container]") || (() => {
    const div = document.createElement("div");
    div.dataset.toastContainer = "";
    div.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:3000;display:flex;flex-direction:column;gap:10px;";
    document.body.appendChild(div);
    return div;
  })();
  
  window.showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    const bgColor = type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#8a2d2d";
    toast.style.cssText = `
      background: ${bgColor};
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };
};

export const initForm = () => {
  qsa("[data-form]").forEach((form) => {
    on(form, "submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const obj = Object.fromEntries(data);
      console.log("Form submitted:", obj);
      if (window.showToast) {
        window.showToast("表单提交成功！", "success");
      }
      form.reset();
    });
  });
};


