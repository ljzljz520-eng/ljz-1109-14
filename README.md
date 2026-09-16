# 广绣文化专题介绍网站

## 🛠 技术栈
- Frontend: 原生 HTML5, CSS3 (Grid & Flexbox), 原生 JavaScript (ES6 Modules)
- Assets: SVG 矢量图形, JSON Mock 数据
- Server: Nginx (Alpine)

## 🚀 启动指南 (How to Run)
1. 确保 Docker Desktop 已启动。
2. 在项目根目录执行：
```bash
docker compose up --build
```
3. 等待容器启动完成。

## 🔗 服务地址 (Services)
- Frontend: [http://localhost:3000](http://localhost:3000)

## 🧪 项目特性
- **响应式布局**: 支持移动端、平板与桌面端三套断点适配。
- **模块化架构**: 基于 ES6 模块组织代码，实现路由管理、数据加载与组件封装。
- **视觉设计**: 融合中国传统美学配色与现代 UI 交互，支持 3D 可视化针法演示。
- **性能优化**: 实现图片懒加载、滚动触发动画及低端设备性能降级方案。
- **纯前端实现**: 无外部依赖，数据通过本地 JSON 异步加载。

---

## 🐳 Docker 交付说明
本项目已实现完全容器化。通过 Nginx 提供静态资源服务，确保环境一致性。
