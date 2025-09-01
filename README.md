# 论语 SDK (Analects SDK) 📚

> 现代化的《论语》学习与搜索 JavaScript SDK，让孔子的智慧在数字时代重新焕发光彩

一个功能完备的论语在线服务 JavaScript SDK，提供每日论语推荐和强大的论语搜索功能，支持多维度筛选和关键词高亮。

[![npm version](https://img.shields.io/npm/v/analects-sdk.svg)](https://www.npmjs.com/package/analects-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/litouch/Analects)

## ✨ 核心功能

### 📅 每日论语
- **智慧推荐**：每天推送精选论语内容
- **完整展示**：原文、翻译、章节信息一目了然
- **社交分享**：支持 Twitter、Facebook、邮件分享
- **一键复制**：方便的分享链接复制功能
- **响应式设计**：完美适配各种设备尺寸

### 🔍 论语搜索
- **全文检索**：支持原文、翻译、注释全文搜索
- **多关键词**：支持多个关键词AND逻辑搜索
- **高级筛选**：按章节、人物、论点、谚语多维度筛选
- **智能分页**：滚动自动加载，流畅的浏览体验
- **关键词高亮**：搜索结果中关键词智能高亮显示
- **实时过滤**：搜索选项支持实时过滤功能

## 🌟 项目特点

### 🎨 现代化设计
- **优雅界面**：简洁现代的UI设计，支持深色模式
- **动画效果**：平滑的过渡动画和交互反馈
- **响应式布局**：完美适配桌面端和移动端
- **无障碍支持**：遵循可访问性标准，支持键盘导航

### 🔧 技术架构
- **原生 JavaScript**：无框架依赖，轻量高效
- **ES6+ 语法**：现代 JavaScript 特性
- **Webpack 构建**：完善的构建和打包流程
- **Supabase 后端**：基于 Supabase 的数据服务
- **CSS3 样式**：现代 CSS 特性，支持自定义主题

### 📱 功能丰富
- **智能缓存**：本地缓存机制，提升加载速度
- **错误处理**：完善的错误处理和用户提示
- **打印友好**：优化的打印样式
- **SEO 优化**：搜索引擎友好的HTML结构

## 🚀 快速开始

### 安装方式

#### 通过 CDN 引入
```html
<!-- CSS -->
<link rel="stylesheet" href="https://unpkg.com/analects-sdk@latest/dist/analects.css">

<!-- JavaScript -->
<script src="https://unpkg.com/analects-sdk@latest/dist/analects.js"></script>
```

#### 通过 npm 安装
```bash
npm install analects-sdk
```

#### ES6 模块导入
```javascript
import AnalectsSDK from 'analects-sdk';
```

### 基本使用

#### 1. 初始化 SDK
```javascript
const sdk = new AnalectsSDK({
  supabaseUrl: 'your-supabase-url',
  supabaseKey: 'your-supabase-anon-key'
});
```

#### 2. 渲染每日论语
```html
<div id="daily-analects"></div>
```

```javascript
const container = document.getElementById('daily-analects');
sdk.renderDailyAnalect(container);
```

#### 3. 渲染搜索界面
```html
<div id="analects-search"></div>
```

```javascript
const searchContainer = document.getElementById('analects-search');
sdk.renderSearchInterface(searchContainer);
```

#### 4. 自动初始化（推荐）
```html
<div data-analects-auto-init 
     data-supabase-url="your-supabase-url"
     data-supabase-key="your-supabase-key">
  <div data-analects-daily></div>
  <div data-analects-search></div>
</div>
```

## 📖 API 文档

### 核心方法

#### `new AnalectsSDK(config)`
创建 SDK 实例

**参数：**
- `config.supabaseUrl` (string): Supabase 项目URL
- `config.supabaseKey` (string): Supabase 匿名密钥

#### `renderDailyAnalect(container)`
渲染每日论语组件

**参数：**
- `container` (HTMLElement): 容器DOM元素

#### `renderSearchInterface(container)`
渲染搜索界面组件

**参数：**
- `container` (HTMLElement): 容器DOM元素

#### `getDailyAnalect()`
获取每日论语数据

**返回：** Promise<Object> - 论语数据对象

#### `fetchAnalects(filters, page, pageSize)`
搜索论语数据

**参数：**
- `filters` (Object): 搜索过滤条件
- `page` (number): 页码（从0开始）
- `pageSize` (number): 每页数量

### 数据结构

#### 论语条目 (AnalectEntry)
```javascript
{
  id: 1,
  chapter: "学而第一",
  section_number: 1,
  original_text: "学而时习之，不亦说乎？",
  translation: "学了知识然后按时复习...",
  annotation: "详细注释...",
  personal_insight: "个人感悟...",
  entry_characters: [...],  // 相关人物
  entry_arguments: [...],   // 相关论点
  entry_proverbs: [...]     // 相关谚语
}
```

## 🎯 使用场景

### 教育网站
为语文教育网站添加论语学习功能：
```html
<!-- 每日论语模块 -->
<section class="daily-wisdom">
  <div data-analects-daily></div>
</section>

<!-- 论语搜索模块 -->
<section class="analects-library">
  <div data-analects-search></div>
</section>
```

### 博客集成
在个人博客中集成论语内容：
```javascript
// 获取今日论语作为文章引言
sdk.getDailyAnalect().then(analect => {
  document.querySelector('.article-quote').innerHTML = 
    `<blockquote>${analect.original_text}</blockquote>`;
});
```

### 移动应用
React Native 或混合应用集成：
```javascript
// 使用 SDK 的核心数据获取功能
const searchResults = await sdk.fetchAnalects({
  keyword: '学而时习之',
  chapter: '学而第一'
}, 0, 10);
```

## 🎨 自定义样式

SDK 提供了完整的 CSS 变量系统，支持主题定制：

```css
:root {
  --primary: #2d3748;      /* 主色调 */
  --blue: #3182ce;         /* 蓝色主题 */
  --green: #38a169;        /* 成功色 */
  --orange: #dd6b20;       /* 警告色 */
  --red: #e53e3e;          /* 错误色 */
  --bg: #ffffff;           /* 背景色 */
  --card-bg: #fafafa;      /* 卡片背景 */
  --border: #e2e8f0;       /* 边框色 */
  --radius: 8px;           /* 圆角半径 */
  --spacing: 16px;         /* 间距 */
}

/* 深色主题 */
[data-theme="dark"] {
  --primary: #e2e8f0;
  --bg: #1a202c;
  --card-bg: #2d3748;
  --border: #4a5568;
}
```

## 🏗️ 开发指南

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/litouch/Analects.git
cd Analects

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 项目结构
```
src/
├── index.js          # 主入口文件
├── styles/
│   └── analects.css  # 样式文件
└── components/       # 组件模块（可扩展）

dist/                 # 构建输出目录
├── analects.js       # 开发版本
├── analects.min.js   # 压缩版本
├── analects.css      # 样式文件
└── analects.min.css  # 压缩样式

webpack.config.js     # Webpack 配置
package.json          # 项目配置
index.html            # SDK演示和获取嵌入代码页
```

### 构建配置
- **开发模式**：支持热重载，保留源码映射
- **生产模式**：代码压缩，移除调试信息
- **多目标输出**：同时生成压缩和非压缩版本
- **CSS 处理**：自动添加浏览器前缀

## 🔧 配置说明

### Supabase 配置
1. 创建 Supabase 项目
2. 获取项目 URL 和匿名密钥
3. 导入论语数据库结构
4. 配置 RLS 策略（如需要）

### 数据库表结构
SDK 依赖以下数据库表：
- `analects_entries` - 论语条目主表
- `characters` - 人物表
- `arguments` - 论点表
- `proverbs` - 谚语表
- `entry_characters` - 条目人物关联表
- `entry_arguments` - 条目论点关联表
- `entry_proverbs` - 条目谚语关联表

## 🌍 浏览器支持

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- IE 11+（有限支持）

## 📝 更新日志
### v1.0.3 (2025-09-01)
- 🎨 优化演示页面的SEO，更新为域名https://lunyu.xyz

### v1.0.2 (2025-08-31)
- ✨ 更新SDK演示及获取嵌入代码页，在页头加入杨伯峻先生、钱穆先生以及刘勃著作“匏瓜”中的对论语核心思想的解释。

### v1.0.1 (2025-08-30)
- ✨ 发布SDK演示及获取嵌入代码页，托管页面https://analects.vercel.app/

### v1.0.0 (2025-08-24)
- ✨ 初始发布
- 🎨 完整的每日论语功能
- 🔍 强大的搜索和筛选功能
- 📱 响应式设计支持
- 🎯 关键词高亮显示
- 📦 Webpack 构建系统

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范
- 遵循 ESLint 代码规范
- 添加适当的注释和文档
- 确保代码测试通过
- 保持向后兼容性

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议发布。

## 🙏 致谢

- 感谢 [Supabase](https://supabase.com) 提供优秀的后端服务
- 感谢所有为传承中华文化做出贡献的开发者和学者
- 特别感谢孔子及其弟子为人类留下的珍贵智慧财富

## 📧 联系方式

- **GitHub**: [https://github.com/litouch/Analects](https://github.com/litouch/Analects)
- **Issues**: [提交问题和建议](https://github.com/litouch/Analects/issues)
- **Email**: 通过 GitHub Issues 联系维护者

---

<p align="center">
  <strong>让古代智慧在现代技术中重新绽放光彩 ✨</strong>
</p>
