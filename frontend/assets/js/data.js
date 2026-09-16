const memoryCache = new Map();

const loadFromSession = (key) => {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveToSession = (key, value) => {
  sessionStorage.setItem(key, JSON.stringify(value));
};

export const fetchJSON = async (path) => {
  if (memoryCache.has(path)) {
    return memoryCache.get(path);
  }

  const cached = loadFromSession(path);
  if (cached) {
    memoryCache.set(path, cached);
    return cached;
  }

  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("数据加载失败");
  }
  const data = await response.json();
  memoryCache.set(path, data);
  saveToSession(path, data);
  return data;
};
