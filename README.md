# 论语 SDK (Analects SDK) 📚

> 现代化的《论语》学习与分享平台，让孔子的智慧在数字时代重新焕发光彩。

一个专为学生、教师和论语爱好者打造的在线学习与分享平台。不仅提供每日论语、全文检索等基础功能，更支持用户收藏、记录个人笔记，并独创了**笔记分享**与**对照学习**模式，让经典学习不再孤单。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/litouch/Analects)
## ✨ 核心功能

### 📅 每日论语
- **智慧推荐**：每天推送精选论语内容。
- **完整展示**：原文、翻译、章节信息一目了然。
- **社交分享**：支持一键复制和邮件分享。

### 🔍 论语搜索
- **全文检索**：支持对原文、翻译、注释的全文搜索。
- **多维筛选**：可按章节、人物、论点、谚语进行组合筛选。
- **智能分页**：滚动自动加载，提供流畅的浏览体验。
- **关键词高亮**：搜索结果中关键词智能高亮显示。

### 👤 用户中心 (我的论语)
- **用户认证**：支持邮箱/密码和 Google 第三方登录。
- **论语收藏**：一键收藏您喜欢的章节，建立个人智慧库。
- **心得笔记**：为每个收藏的章节撰写和编辑您的个人感悟和理解。
- **🤝 笔记分享**：可将您的整本“我的论语”笔记通过安全链接或邮件分享给朋友、同学或老师，共同交流学习心得。
- **🧑‍🤝‍🧑 对照学习**：在阅读朋友分享的笔记时，可开启“对照模式”，在同一页面下同时查看自己和朋友针对同一章节的笔记，取长补短，激发深度思考。
- **数据同步**：所有收藏和笔记都与您的账户绑定，跨设备同步。

## 🌟 项目特点

- **优雅界面**：简洁现代的UI设计，支持系统深色模式。
- **原生开发**：无框架依赖，轻量高效，易于集成。
- **响应式布局**：完美适配桌面、平板和移动端设备。
- **高度可定制**：提供丰富的 CSS 变量，方便自定义主题。
- **体验优先**：采用骨架屏等技术，优化加载性能和用户感知。


## 🚀 快速开始

#### 1. 引入 SDK (两种模式)

**方案A：完整功能版 (适用于Web应用)**

如果您希望使用包括用户登录、收藏、笔记在内的所有功能，请引入 `v2` 版本。

```html
<link rel="stylesheet" href="[https://lunyu.xyz/v2/analects.css](https://lunyu.xyz/v2/analects.css)">

<script defer src="[https://unpkg.com/lucide@latest](https://unpkg.com/lucide@latest)"></script>

<script type="module" src="[https://lunyu.xyz/v2/analects.js](https://lunyu.xyz/v2/analects.js)"></script>
```
**方案B：轻量嵌入版 (适用于博客、静态网站)**

如果您只想在自己的网站上嵌入“每日论语”或“论语查询”等基础组件，且不需要用户功能，推荐使用更轻量的 `v1` 版本。

```html
<link rel="stylesheet" href="https://lunyu.xyz/v1/analects.css">
<script defer src="https://unpkg.com/lucide@latest"></script>
<script type="module" src="https://lunyu.xyz/v1/analects.js"></script>
```
#### 2. 基本使用
```html
<div id="daily-analect"></div>
<div id="analects-search"></div>
<div id="analects-global-widget-container"></div>
<script type="module">
  (async () => {
    // 1. 初始化 SDK
    const sdk = new AnalectsSDK({
      supabaseUrl: 'your-supabase-url',
      supabaseKey: 'your-supabase-anon-key'
    });

    // 2. 等待 SDK 会话和核心功能准备就绪
    await sdk.init();

    // 3. 渲染各个组件
    //    - V1 和 V2 版本都支持
    sdk.renderDailyAnalect(document.getElementById('daily-analect'));
    sdk.renderSearchInterface(document.getElementById('analects-search'));
    
    //    - 仅 V2 版本支持
    sdk.renderGlobalWidget(document.getElementById('analects-global-widget-container'));
  })();
</script> 
```

## 📖 API 文档 (核心方法)

#### `new AnalectsSDK(config)`
创建 SDK 实例。

- `config`: 包含 `supabaseUrl` 和 `supabaseKey` 的配置对象。


- *注意：v1嵌入版只包含核心渲染方法，不包含用户认证相关功能。*

#### `async sdk.init()`
异步初始化 SDK，建立会话并绑定全局事件。**必须在调用其他渲染方法前完成**。

#### `sdk.renderDailyAnalect(container)`
渲染“每日论语”组件。

#### `sdk.renderSearchInterface(container)`
渲染“论语查询”组件。

#### `sdk.renderGlobalWidget(container)`
渲染全局浮动操作栏（登录/收藏等）。(仅限 V2 版本)

#### `sdk.showAuthModal(view)`
显示登录或注册模态窗口。(仅限 V2 版本)

- `view` (string): `'login'` 或 `'signup'`。

#### `async sdk.signOut()`
登出当前用户。(仅限 V2 版本)

## 📝 更新日志

### v2.2.0 (2025-10-01)
- ✨ **新增笔记分享功能**：用户可以将自己的整本笔记分享给指定的朋友。
- ✨ **独创对照学习模式**：在查看分享时，可以并列查看自己与他人的笔记，方便对比学习。
- 💄 **UI/UX 优化**：全面优化了网站首页的文案和SEO元数据，明确了“为学生和爱好者服务的学习平台”定位。

### v2.1.0 (2025-09-25)
- ✨ **新增轻量嵌入版SDK**：将SDK拆分为 `v2` (完整版) 和 `v1` (嵌入版)，方便第三方网站轻松集成核心功能。
- 🔧 **架构重构**：采用基类与扩展类的模式，提升代码的可维护性和复用性。
- ⭐ **全新UI**：更加统一、现代化的UI，更利于阅读的章节和收藏页面。
- 🐞 **修复多项Bug**：解决了静态页面笔记丢失、页头加载延迟、弹窗交互等多项UI和逻辑问题。

### v2.0.0 (2025-09-13)
- ✨ **发布 V2.0**：项目重构，增加强大的用户功能。
- 👤 **新增用户系统**：支持邮箱和 Google 登录、注册、登出。
- ⭐ **新增收藏功能**：用户可以收藏任意论语章节。
- ✍️ **新增笔记功能**：用户可以为收藏的章节添加和编辑个人心得。
- 🔧 **重构会话管理**：彻底修复了跨页面、跨标签页的登录状态保持问题。
- 🚀 **优化加载性能**：全面采用骨架屏技术，提升页面感知速度。

### v1.0.0 (2025-08-24)
- ✨ 初始发布，提供“每日论语”和“论语查询”核心功能。

## 🤝 贡献指南

我们欢迎所有形式的贡献！请 Fork 本仓库，创建您的功能分支，并在完成修改后提交 Pull Request。

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议发布。

---

<p align="center">
  <strong>让古代智慧在现代技术中重新绽放光彩 ✨</strong>
</p>