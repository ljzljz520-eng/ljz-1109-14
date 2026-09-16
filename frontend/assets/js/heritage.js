/**
 * heritage.js —— 「传承的意义」专题页脚本
 * 能力：
 *  1. JSON 内容渲染 + 可折叠段落（{{term:x}} 术语词条 / {{ref:n}} 引用上标）
 *  2. 术语索引 / 引用来源
 *  3. 全文检索：节点级索引、命中片段、节点偏移（offset）定位与高亮
 *  4. 版本链：contenteditable 编辑 → 快照保存 → 预览 / 回滚（localStorage）
 *  5. 目录滚动同步（IntersectionObserver scrollspy）+ 阅读进度
 *  6. 移动端目录抽屉 + 折叠状态 / 目录状态 / 滚动位置可恢复
 */
import { qs, qsa, debounce, throttle } from "./utils.js";

const PAGE_KEY = "guangxiu-heritage";
const LS_VERSIONS = `${PAGE_KEY}:versions`;
const LS_OPEN = `${PAGE_KEY}:open-blocks`;
const SS_SCROLL = `${PAGE_KEY}:scroll-y`;
const SS_TOC = `${PAGE_KEY}:toc-open`;

const CONTENT_URL = "../assets/data/heritage.json";

/** 可编辑节点类型（快照时读取） */
const EDIT_SELECTOR = "[data-edit]";

let DATA = null;
let SOURCE_MAP = {};   // sourceId -> source
let TERM_SLUGS = {};   // slug -> term

/* ----------------------------- 工具 ----------------------------- */

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (s) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));

const slugify = (term) => {
  const map = {
    广绣: "guangxiu", 粤绣: "yuexiu", 钉金绣: "dingjinxiu", 留水路: "liushuilu",
    套针: "taozhen", 铺针: "puzhen", 劈线: "pixian", 上绷: "shangbeng",
    状元坊: "zhuangyuanfang", 十三行: "shisanhang", 一口通商: "yikoutongshang",
    裙褂: "qungua", 外销绣: "waixiaoxiu", 非遗代表性传承人: "feiyichuanchengren"
  };
  return map[term] || `term-${term.codePointAt(0)}`;
};

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 隐私模式忽略 */ }
};

const formatTime = (ts) => {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* --------------------- 行内标记：词条与引用 --------------------- */

const renderInline = (raw) =>
  escapeHtml(raw)
    .replace(/\{\{term:([一-龥]+)\}\}/g, (_m, t) => {
      const slug = slugify(t);
      return `<a class="term-chip" href="#term-${slug}" data-term-jump="${slug}">${t}</a>`;
    })
    .replace(/\{\{ref:(\d+)\}\}/g, (_m, n) =>
      `<a class="ref-mark" href="#source-${n}" title="查看引用来源 ${n}" data-ref-jump="${n}"><sup>[${n}]</sup></a>`);

/* ----------------------------- 渲染 ----------------------------- */

const renderSection = (sec) => {
  const keyPoints = sec.keyPoints.map((kp) => `
    <li class="key-point">
      <span class="key-point-icon">${escapeHtml(kp.icon)}</span>
      <div><strong>${escapeHtml(kp.title)}</strong><p>${escapeHtml(kp.desc)}</p></div>
    </li>`).join("");

  const blocks = sec.blocks.map((b, bi) => {
    const blockId = `${sec.id}-b${bi + 1}`;
    const quote = b.quote ? `
      <figure class="heritage-quote" data-node-id="${blockId}-quote" data-node-section="${sec.index} ${escapeHtml(sec.title)}" data-node-label="引文 · ${escapeHtml(b.quote.type)}" data-searchable>
        <span class="quote-type">${escapeHtml(b.quote.type)}</span>
        <blockquote data-edit="quote-text" data-block-id="${blockId}-quote">${renderInline(b.quote.text)}</blockquote>
        <figcaption>${b.quote.sourceRef ? `<a class="ref-mark" href="#source-${b.quote.sourceRef}" data-ref-jump="${b.quote.sourceRef}">来源 [${b.quote.sourceRef}]</a>` : ""}</figcaption>
      </figure>` : "";

    return `
      <article class="fold is-open" data-fold="${blockId}">
        <button class="fold-trigger" type="button" data-fold-trigger aria-expanded="true"
                data-node-id="${blockId}-h" data-node-section="${sec.index} ${escapeHtml(sec.title)}" data-node-label="小节标题" data-searchable>
          <span class="fold-caret" aria-hidden="true"></span>
          <span data-edit="heading" data-block-id="${blockId}-h">${escapeHtml(b.heading)}</span>
        </button>
        <div class="fold-panel">
          <div class="fold-inner">
            <p class="fold-text" data-edit="text" data-block-id="${blockId}-p"
               data-node-id="${blockId}-p" data-node-section="${sec.index} ${escapeHtml(sec.title)}" data-node-label="正文段落" data-searchable>${renderInline(b.text)}</p>
            ${quote}
          </div>
        </div>
      </article>`;
  }).join("");

  return `
    <section class="heritage-block" id="${sec.id}" data-section-id="${sec.id}">
      <header class="block-head">
        <span class="block-index">${escapeHtml(sec.index)}</span>
        <div>
          <h2 data-edit="section-title" data-block-id="${sec.id}-title">${escapeHtml(sec.title)}</h2>
          <p class="block-subtitle" data-edit="section-subtitle" data-block-id="${sec.id}-sub">${escapeHtml(sec.subtitle)}</p>
        </div>
      </header>
      <p class="block-tagline" data-edit="section-tagline" data-block-id="${sec.id}-tagline">${escapeHtml(sec.tagline)}</p>
      <ul class="key-points">${keyPoints}</ul>
      <div class="fold-list">${blocks}</div>
    </section>`;
};

const renderGlossary = () => {
  const wrap = qs("[data-glossary]");
  if (!wrap) return;
  wrap.innerHTML = DATA.glossary
    .slice()
    .sort((a, b) => a.pinyin.localeCompare(b.pinyin, "zh"))
    .map((g) => `
      <article class="glossary-item" id="term-${TERM_SLUGS[g.term]}" tabindex="0">
        <h3>${escapeHtml(g.term)} <span class="glossary-pinyin">${escapeHtml(g.pinyin)}</span></h3>
        <p>${escapeHtml(g.def)}</p>
      </article>`).join("");
};

const renderSources = () => {
  const wrap = qs("[data-sources]");
  if (!wrap) return;
  wrap.innerHTML = DATA.sources.map((s) => `
    <li class="source-item" id="source-${s.id}">
      <span class="source-no">${s.id}</span>
      <div>
        <p class="source-title">[${escapeHtml(s.type)}] ${escapeHtml(s.title)}</p>
        <p class="source-meta">${escapeHtml(s.author)} · ${escapeHtml(s.publisher)} · ${escapeHtml(s.year)}</p>
        <p class="source-detail">${escapeHtml(s.detail)}</p>
      </div>
    </li>`).join("");
};

/* --------------------- 可折叠段落（含状态恢复） --------------------- */

const getOpenMap = () => load(LS_OPEN, {});
const setOpenState = (fold, open, persist = true) => {
  const panel = qs(".fold-panel", fold);
  fold.classList.toggle("is-open", open);
  const trigger = qs("[data-fold-trigger]", fold);
  if (trigger) trigger.setAttribute("aria-expanded", String(open));
  if (panel) panel.style.maxHeight = open ? panel.scrollHeight + "px" : "";
  if (persist) {
    const map = getOpenMap();
    map[fold.dataset.fold] = open;
    save(LS_OPEN, map);
  }
};

const initFolds = () => {
  const folds = qsa("[data-fold]");
  const saved = getOpenMap();
  folds.forEach((fold) => {
    // 默认展开；用户历史折叠过则恢复折叠
    const wantOpen = saved[fold.dataset.fold] === false ? false : true;
    setOpenState(fold, wantOpen, false);
    const trigger = qs("[data-fold-trigger]", fold);
    trigger.addEventListener("click", () => {
      // 编辑模式下折叠面板不响应点击，避免与 contenteditable 冲突
      if (document.body.classList.contains("is-editing")) return;
      setOpenState(fold, !fold.classList.contains("is-open"));
    });
  });

  const toggle = qs("[data-collapse-toggle]");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const expand = !qsa("[data-fold].is-open").length ||
        qsa("[data-fold].is-open").length < folds.length;
      folds.forEach((f) => setOpenState(f, expand));
      toggle.textContent = expand ? "收起全部段落" : "展开全部段落";
      toggle.setAttribute("aria-expanded", String(expand));
    });
  }
};

/* ------------------------- 版本链 / 编辑 ------------------------- */

const takeSnapshot = (note, author) => {
  const edits = {};
  qsa(EDIT_SELECTOR).forEach((el) => {
    edits[el.dataset.blockId] = el.innerHTML;
  });
  return {
    id: `v${Date.now().toString(36)}`,
    ts: Date.now(),
    note: note || "未填写更新说明",
    author: author || "访客编辑",
    edits
  };
};

const applySnapshot = (snapshot, { flash = true } = {}) => {
  if (!snapshot) return;
  qsa(EDIT_SELECTOR).forEach((el) => {
    const id = el.dataset.blockId;
    if (snapshot.edits[id] != null) el.innerHTML = snapshot.edits[id];
  });
  // 应用后折叠面板高度需要重算
  qsa("[data-fold].is-open").forEach((fold) => {
    const panel = qs(".fold-panel", fold);
    if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
  });
  if (flash) {
    qs("[data-heritage-content]")?.classList.add("version-flash");
    setTimeout(() => qs("[data-heritage-content]")?.classList.remove("version-flash"), 700);
  }
};

const getVersions = () => load(LS_VERSIONS, []);
const setVersions = (list) => save(LS_VERSIONS, list);

const renderVersionChain = () => {
  const list = getVersions();
  const chain = qs("[data-version-chain]");
  if (!chain) return;
  if (!list.length) {
    chain.innerHTML = `<li class="version-empty">尚无保存的版本</li>`;
    return;
  }
  const latestId = list[list.length - 1].id;
  chain.innerHTML = list.slice().reverse().map((v) => {
    const isLatest = v.id === latestId;
    const parent = v.parentId
      ? list.find((x) => x.id === v.parentId)
      : null;
    const seq = list.indexOf(v) + 1;
    return `
      <li class="version-item ${isLatest ? "is-latest" : ""}">
        <div class="version-dot">${isLatest ? "●" : "○"}</div>
        <div class="version-body">
          <div class="version-meta">
            <strong>${v.id.startsWith("v-init") ? `初始版本 v${seq}` : `版本 v${seq}`}</strong>
            <time>${formatTime(v.ts)}</time>
          </div>
          <p class="version-note">${escapeHtml(v.note)} <span>· ${escapeHtml(v.author)}</span></p>
          ${parent ? `<p class="version-parent">↩ 基于「${escapeHtml(parent.note)}」回滚生成</p>` : ""}
          <div class="version-ops">
            <button type="button" class="link-btn" data-version-preview="${v.id}">预览</button>
            ${!isLatest ? `<button type="button" class="link-btn" data-version-restore="${v.id}">回滚到此版</button>` : `<span class="version-current">当前版本</span>`}
          </div>
        </div>
      </li>`;
  }).join("");
};

const initEditor = () => {
  const drawer = qs("[data-editor-drawer]");
  const editToggle = qs("[data-edit-toggle]");
  const open = () => { drawer.hidden = false; document.body.style.overflow = "hidden"; };
  const close = () => { drawer.hidden = true; document.body.style.overflow = ""; };

  // 点击「编辑更新」：进入编辑态并打开版本抽屉
  editToggle.addEventListener("click", () => {
    open();
    renderVersionChain();
    setEditMode(true);
  });
  qsa("[data-editor-close]").forEach((el) => el.addEventListener("click", () => {
    setEditMode(false);
    close();
  }));

  const setEditMode = (on) => {
    document.body.classList.toggle("is-editing", on);
    qsa(EDIT_SELECTOR).forEach((el) => {
      el.contentEditable = on ? "true" : "false";
      el.spellcheck = false;
    });
    editToggle.textContent = on ? "编辑中…（完成后保存）" : "✎ 编辑更新";
  };

  qs("[data-exit-edit]").addEventListener("click", () => {
    setEditMode(false);
    close();
    window.showToast?.(window.editorReverted ? "已恢复到所选版本" : "已退出编辑，未保存的修改已丢弃", "info");
  });

  qs("[data-save-version]").addEventListener("click", () => {
    const note = qs("#edit-note").value.trim();
    const author = qs("#edit-author").value.trim();
    const versions = getVersions();
    const snap = takeSnapshot(note, author);
    versions.push(snap);
    setVersions(versions);
    qs("#edit-note").value = "";
    setEditMode(false);
    renderVersionChain();
    window.showToast?.("新版本已保存，版本链已更新", "success");
  });

  qs("[data-reset-versions]").addEventListener("click", () => {
    if (!confirm("将清除本地保存的所有版本，并恢复为初始内容。确定？")) return;
    localStorage.removeItem(LS_VERSIONS);
    const init = buildInitialSnapshot();
    setVersions([init]);
    applySnapshot(init);
    setEditMode(false);
    renderVersionChain();
    window.showToast?.("已恢复初始版本", "success");
  });

  // 事件委托：预览 / 回滚
  qs("[data-version-chain]").addEventListener("click", (e) => {
    const previewId = e.target?.dataset?.versionPreview;
    const restoreId = e.target?.dataset?.versionRestore;
    const versions = getVersions();
    if (previewId) {
      const v = versions.find((x) => x.id === previewId);
      applySnapshot(v);
      window.showToast?.(`已预览 ${v.id.startsWith("v-init") ? "初始版本" : "该版本"}（未写入历史，可回滚）`, "info");
      close();
      document.querySelector(`#${firstSectionId()}`)?.scrollIntoView();
    }
    if (restoreId) {
      const target = versions.find((x) => x.id === restoreId);
      if (!target) return;
      if (!confirm(`回滚到「${target.note}」？将基于该版本生成一个新版本，历史版本链保留。`)) return;
      const copy = takeSnapshot(`回滚：${target.note}`, qs("#edit-author").value.trim() || "系统回滚");
      copy.edits = structuredClone(target.edits);
      copy.parentId = target.id;
      versions.push(copy);
      setVersions(versions);
      applySnapshot(copy);
      setEditMode(false);
      renderVersionChain();
      window.editorReverted = true;
      window.showToast?.("已回滚，并在版本链中生成新版本", "success");
      close();
    }
  });
};

const firstSectionId = () => DATA?.sections?.[0]?.id || "lingnan";

/* 初始快照：由 JSON 渲染后的 DOM 提取（保持与后续版本同构） */
const buildInitialSnapshot = () => {
  const edits = {};
  qsa(EDIT_SELECTOR).forEach((el) => { edits[el.dataset.blockId] = el.innerHTML; });
  return {
    id: "v-init-1",
    ts: new Date(DATA.updatedAt).getTime() || Date.now(),
    note: "内容首发：四版块文化传承专题",
    author: "编辑部",
    edits
  };
};

/* 判断已存版本与当前页面结构是否匹配（编辑节点 id 集合一致） */
const versionsMatchStructure = (versions) => {
  if (!versions.length) return false;
  const currentIds = new Set(qsa(EDIT_SELECTOR).map((el) => el.dataset.blockId));
  const savedIds = new Set(Object.keys(versions[versions.length - 1].edits || {}));
  if (currentIds.size !== savedIds.size) return false;
  for (const id of currentIds) if (!savedIds.has(id)) return false;
  return true;
};

const initVersionBootstrap = () => {
  let versions = getVersions();
  if (!versions.length || !versionsMatchStructure(versions)) {
    // 首次访问，或内容结构已更新（旧快照失效）→ 重新播种初始版本
    versions = [buildInitialSnapshot()];
    setVersions(versions);
  } else {
    // 恢复到最后一次保存的版本（版本链可恢复）
    applySnapshot(versions[versions.length - 1], { flash: false });
  }
};

/* --------------------- 全文检索 + 节点偏移 --------------------- */

const buildSearchIndex = () => {
  const nodes = qsa("[data-searchable]");
  return nodes.map((el) => ({
    el,
    id: el.dataset.nodeId,
    section: el.dataset.nodeSection || "",
    label: el.dataset.nodeLabel || "",
    // 纯文本用于匹配；offset 即相对该节点 textContent 的字符偏移
    text: el.textContent.replace(/\s+/g, " ").trim()
  }));
};

/** 片段中的关键词加粗（转义后再替换） */
const emphasize = (text, kw) =>
  escapeHtml(text).replace(new RegExp(escapeHtml(kw).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    (m) => `<mark class="search-mark">${m}</mark>`);

const highlightNode = (node, startOffset) => {
  // 折叠中的段落先展开
  const fold = node.el.closest("[data-fold]");
  if (fold && !fold.classList.contains("is-open")) {
    setOpenState(fold, true);
  }
  // 节点偏移容错：编辑后文本可能变短，clamp 到合法范围
  const validOffset = Math.min(Math.max(0, startOffset), Math.max(0, node.text.length - 1));
  // 整体命中高亮（命中态保留到清除搜索 / 下一次检索）
  qsa(".search-hit").forEach((n) => n.classList.remove("search-hit"));
  node.el.classList.add("search-hit");
  node.el.scrollIntoView({ behavior: "smooth", block: "center" });
  // 写入可分享 / 可恢复的 hash：h-节点id-偏移
  history.replaceState(null, "", `#h-${node.id}-${validOffset}`);
};

const initSearch = () => {
  const input = qs("#heritage-search-input");
  const panel = qs("[data-search-panel]");
  const list = qs("[data-search-results]");
  const count = qs("[data-search-count]");
  const clearBtn = qs("[data-search-clear]");
  let index = [];
  let hits = [];

  const clearHits = () => {
    qsa(".search-hit").forEach((n) => n.classList.remove("search-hit"));
  };

  const closePanel = () => {
    panel.hidden = true;
    list.innerHTML = "";
    hits = [];
  };

  const run = (kwRaw) => {
    const kw = kwRaw.trim();
    clearHits();
    if (!kw) { closePanel(); return; }
    // 每次检索重建索引，保证编辑后的最新内容可被命中
    index = buildSearchIndex();

    hits = [];
    index.forEach((node) => {
      const text = node.text;
      let from = 0;
      while (from <= text.length) {
        const at = text.indexOf(kw, from);
        if (at === -1) break;
        const s = Math.max(0, at - 14);
        const e = Math.min(text.length, at + kw.length + 18);
        hits.push({
          node,
          offset: at,
          snippet: (s > 0 ? "…" : "") + text.slice(s, at) +
            `【${text.slice(at, at + kw.length)}】` + text.slice(at + kw.length, e) + (e < text.length ? "…" : "")
        });
        from = at + kw.length;
      }
    });

    count.textContent = `${hits.length} 处命中 · “${escapeHtml(kw)}”`;
    list.innerHTML = hits.slice(0, 30).map((h, i) => `
      <li>
        <button type="button" class="search-result-item" data-hit="${i}">
          <span class="search-result-crumb">${escapeHtml(h.node.section)} · ${escapeHtml(h.node.label)}</span>
          <span class="search-result-snippet">${emphasize(h.snippet.replace(/【|】/g, ""), kw)}</span>
          <span class="search-result-offset">节点偏移 ${h.offset}</span>
        </button>
      </li>`).join("") +
      (hits.length > 30 ? `<li class="search-more">仅显示前 30 处，共 ${hits.length} 处</li>` : "");
    panel.hidden = false;
    if (!hits.length) {
      count.textContent = `未找到 “${escapeHtml(kw)}”，试试「针法」「十三行」`;
    }
  };

  input.addEventListener("input", debounce((e) => run(e.target.value), 180));
  clearBtn.addEventListener("click", () => { input.value = ""; closePanel(); clearHits(); input.focus(); });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-hit]");
    if (!btn) return;
    const h = hits[Number(btn.dataset.hit)];
    if (h) highlightNode(h.node, h.offset);
  });

  // 支持 URL hash 直达：#h-<nodeId>-<offset>
  const restoreHashHit = () => {
    const m = location.hash.match(/^#h-([\w-]+)-(\d+)$/);
    if (!m) return;
    if (!index.length) index = buildSearchIndex();
    const node = index.find((n) => n.id === m[1]);
    if (node) {
      setTimeout(() => {
        qsa(".search-hit").forEach((n) => n.classList.remove("search-hit"));
        const fold = node.el.closest("[data-fold]");
        if (fold && !fold.classList.contains("is-open")) setOpenState(fold, true);
        node.el.classList.add("search-hit");
        node.el.scrollIntoView({ block: "center" });
      }, 300);
    }
  };
  window.addEventListener("heritage:rendered", restoreHashHit, { once: true });
};

/* -------------- 目录 scrollspy / 进度 / 移动端抽屉 -------------- */

// 函数声明提升：点击移动目录项时也可调用
function closeTocDrawer() {
  const drawer = qs("[data-toc-drawer]");
  if (!drawer || drawer.hidden) return;
  drawer.classList.remove("is-open");
  setTimeout(() => { drawer.hidden = true; }, 250);
  try { sessionStorage.removeItem(SS_TOC); } catch {}
}

const initToc = () => {
  // 侧栏目录是静态 HTML；移动抽屉内的目录由其克隆生成（保证两处条目一致）
  const sourceList = qs(".toc-card [data-toc-list]");
  const drawerList = qs(".toc-drawer [data-toc-list]");
  if (sourceList && drawerList) {
    drawerList.innerHTML = sourceList.innerHTML;
  }

  const links = qsa("[data-toc-link]");
  const targets = Array.from(
    new Set(links.map((l) => l.dataset.tocLink))
  ).map((id) => document.getElementById(id)).filter(Boolean);

  // 桌面侧栏与移动抽屉两处条目同步高亮（目录与正文滚动同步）
  const setActive = (id) => {
    links.forEach((l) => l.classList.toggle("is-active", l.dataset.tocLink === id));
  };

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      // 取当前与视口交叉、位置最靠上的一个目标
      const visible = entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: "-25% 0px -60% 0px", threshold: 0 });
    targets.forEach((t) => spy.observe(t));
  }

  // 阅读进度（桌面侧栏 + 移动 FAB 两处同步）
  const progressBars = qsa("[data-read-progress]");
  const onScroll = throttle(() => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    progressBars.forEach((bar) => { bar.style.width = `${pct}%`; });
    try { sessionStorage.setItem(SS_SCROLL, String(window.scrollY)); } catch {}
  }, 120);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // 点击任意目录项：跳转后关闭移动抽屉
  links.forEach((link) => {
    link.addEventListener("click", () => closeTocDrawer());
  });

  // 移动端抽屉
  const drawer = qs("[data-toc-drawer]");
  const fab = qs("[data-toc-fab]");
  const openTocDrawer = () => {
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    try { sessionStorage.setItem(SS_TOC, "1"); } catch {}
  };
  fab.addEventListener("click", openTocDrawer);
  qsa("[data-toc-close]").forEach((el) => el.addEventListener("click", closeTocDrawer));

  // 可恢复：重新进入页面时自动打开上次的目录抽屉
  if (sessionStorage.getItem(SS_TOC) === "1") {
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
  }
};

const restoreScroll = () => {
  if (location.hash) return; // hash 定位优先（含搜索节点偏移）
  const y = Number(sessionStorage.getItem(SS_SCROLL) || 0);
  if (y > 0) {
    requestAnimationFrame(() => window.scrollTo(0, y));
  }
};

/* ----------------------------- 启动 ----------------------------- */

const renderAll = (data) => {
  DATA = data;
  SOURCE_MAP = Object.fromEntries(data.sources.map((s) => [s.id, s]));
  data.glossary.forEach((g) => { TERM_SLUGS[g.term] = slugify(g.term); });

  qs("#heritage-intro").textContent = data.intro;
  qs("#heritage-updated").textContent = `内容版本 v${data.version} · 更新于 ${data.updatedAt}`;

  const content = qs("[data-heritage-content]");
  content.innerHTML = data.sections.map(renderSection).join("");

  renderGlossary();
  renderSources();

  initFolds();
  initVersionBootstrap();
  initEditor();
  initSearch();
  restoreScroll();   // 先恢复阅读位置，再启动目录与进度监听，避免初始 0 值覆盖
  initToc();

  window.dispatchEvent(new Event("heritage:rendered"));
};

const boot = async () => {
  // 仅在本页存在挂载点时执行
  if (!qs("[data-heritage-content]")) return;
  try {
    const res = await fetch(CONTENT_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderAll(data);
  } catch (err) {
    qs("[data-heritage-content]").innerHTML = `
      <div class="heritage-error traditional-border">
        <h3>内容暂时加载失败</h3>
        <p>请检查网络后刷新页面；若问题持续，可稍后再来。</p>
        <button class="btn btn-primary btn-sm" type="button" onclick="location.reload()">重新加载</button>
      </div>`;
  }
};

document.addEventListener("DOMContentLoaded", boot);
