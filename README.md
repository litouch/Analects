# 📚 论语 SDK

一个专为论语在线服务设计的 JavaScript SDK，提供完整的 API 接口和 UI 组件，支持搜索、展示和管理论语内容。

## ✨ 特性

- 🎯 **完整的 API 支持** - 提供论语条目、人物、论点、谚语的完整 CRUD 操作
- 🎨 **Notion 风格 UI** - 现代化的卡片式设计，移动端友好
- 🔍 **强大的搜索功能** - 支持关键词、人物、论点多维度搜索
- 📱 **响应式设计** - 完美支持移动设备和桌面端
- 🚀 **即开即用** - 支持 CDN 引入和自动初始化
- ⚡ **轻量高效** - 压缩后仅 ~50KB，无第三方依赖

## 🚀 快速开始

### CDN 引入（推荐）

```html
<!-- 引入样式文件 -->
<link rel="stylesheet" href="https://your-cdn.com/analects.css">

<!-- 引入 JavaScript 文件 -->
<script src="https://your-cdn.com/analects.js"></script>

<!-- 初始化 SDK -->
<script>
const sdk = new AnalectsSDK({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key'
});
</script>
```

### 自动初始化

无需编写 JavaScript 代码，直接在 HTML 中使用：

```html
<!-- 配置自动初始化 -->
<div data-analects-auto-init 
     data-supabase-url="https://your-project.supabase.co"
     data-supabase-key="your-anon-key">
  
  <!-- 搜索界面 -->
  <div data-analects-search></div>
  
  <!-- 每日论语 -->
  <div data-analects-daily></div>
</div>
```

## 📖 API 使用指南

### 初始化 SDK

```javascript
const sdk = new AnalectsSDK({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key'
});
```

### 获取论语条目

```javascript
// 获取所有条目
const allAnalects = await sdk.fetchAnalects();

// 关键词搜索
const searchResults = await sdk.fetchAnalects({
  keyword: '学而时习之'
});

// 按章节筛选
const chapterResults = await sdk.fetchAnalects({
  chapter: '学而第一'
});
```

### 获取每日论语

```javascript
const dailyAnalect = await sdk.getDailyAnalect();
console.log(dailyAnalect);
```

### 人物和论点查询

```javascript
// 获取所有人物
const characters = await sdk.getCharacters();

// 获取所有论点
const arguments = await sdk.getArguments();

// 按人物查询论语
const byCharacter = await sdk.searchByCharacter([1, 2, 3]);

// 按论点查询论语
const byArgument = await sdk.searchByArgument([1, 2]);
```

## 🎨 UI 组件使用

### 搜索界面

```javascript
// 渲染搜索界面
const searchContainer = document.getElementById('search-container');
sdk.renderSearchInterface(searchContainer);
```

### 每日论语组件

```javascript
// 渲染每日论语
const dailyContainer = document.getElementById('daily-container');
sdk.renderDailyAnalect(dailyContainer);
```

### 自定义卡片渲染

```javascript
// 获取数据并自定义渲染
const analects = await sdk.fetchAnalects({ keyword: '仁' });
const container = document.getElementById('results');

analects.forEach(entry => {
  sdk.renderAnalectCard(entry, container);
});
```

## 🎯 WordPress 集成示例

```php
<?php
// 在主题的 functions.php 中添加
function enqueue_analects_sdk() {
    wp_enqueue_style('analects-css', 'https://your-cdn.com/analects.css');
    wp_enqueue_script('analects-js', 'https://your-cdn.com/analects.js', [], '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_analects_sdk');
?>

<!-- 在文章或页面中使用短代码 -->
<div data-analects-auto-init 
     data-supabase-url="<?php echo get_option('analects_supabase_url'); ?>"
     data-supabase-key="<?php echo get_option('analects_supabase_key'); ?>">
  <div data-analects-daily></div>
</div>
```

## 📊 数据结构

### 论语条目 (analects_entries)

```javascript
{
  "id": 1,
  "chapter": "学而第一",
  "section_number": 1,
  "original_text": "子曰："学而时习之，不亦说乎？"",
  "annotation": "学习知识并时常复习，不是很快乐的事吗？",
  "translation": "孔子说："学习知识并时常复习，不是很快乐的事吗？"",
  "show_in_daily": true,
  "personal_insight": "学习的快乐在于反复实践和深入理解"
}
```

### 人物信息 (characters)

```javascript
{
  "id": 1,
  "name": "孔子",
  "description": "春秋时期思想家、教育家，儒家学派创始人"
}
```

## 🎨 样式自定义

SDK 使用 CSS 变量，可以轻松自定义主题：

```css
:root {
  --analects-primary: #2d3748;      /* 主色调 */
  --analects-blue: #3182ce;         /* 翻译文字颜色 */
  --analects-green: #38a169;        /* 人物标签颜色 */
  --analects-orange: #dd6b20;       /* 论点标签颜色 */
  --analects-purple: #805ad5;       /* 谚语标签颜色 */
  --analects-radius: 8px;           /* 圆角大小 */
  --analects-spacing: 16px;         /* 间距 */
}
```

### 深色主题示例

```css
[data-theme="dark"] {
  --analects-primary: #f7fafc;
  --analects-bg: #1a202c;
  --analects-card-bg: #2d3748;
  --analects-border: #4a5568;
}
```

## 🛠️ 开发和构建

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test
```

### 项目结构

```
analects-sdk/
├── src/
│   ├── index.js          # SDK 核心代码
│   └── styles/
│       └── analects.css  # 样式文件
├── dist/                 # 构建输出
├── package.json         # 项目配置
├── webpack.config.js    # 打包配置
└── README.md           # 项目文档
```

## 📱 移动端优化

- 触摸友好的界面设计
- 响应式布局适配各种屏幕
- 优化的字体大小和间距
- 支持手势操作

## 🔧 配置选项

```javascript
const sdk = new AnalectsSDK({
  supabaseUrl: 'string',      // Supabase 项目 URL（必需）
  supabaseKey: 'string',      // Supabase 匿名密钥（必需）
  theme: 'light',            // 主题：'light' | 'dark'
  language: 'zh-CN',         // 语言设置
  pageSize: 20,              // 分页大小
  cacheExpiry: 300000        // 缓存过期时间（毫秒）
});
```

## 🔄 API 接口列表

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|-------|
| `fetchAnalects(filters)` | 获取论语条目 | `filters: Object` | `Promise<Array>` |
| `getDailyAnalect()` | 获取每日论语 | 无 | `Promise<Object>` |
| `getCharacters()` | 获取所有人物 | 无 | `Promise<Array>` |
| `getArguments()` | 获取所有论点 | 无 | `Promise<Array>` |
| `getProverbs()` | 获取所有谚语 | 无 | `Promise<Array>` |
| `searchByCharacter(ids)` | 按人物查询 | `ids: Array<number>` | `Promise<Array>` |
| `searchByArgument(ids)` | 按论点查询 | `ids: Array<number>` | `Promise<Array>` |

## 🎯 UI 组件方法

| 方法 | 描述 | 参数 |
|------|------|------|
| `renderSearchInterface(container)` | 渲染搜索界面 | `container: HTMLElement` |
| `renderDailyAnalect(container)` | 渲染每日论语 | `container: HTMLElement` |
| `renderAnalectCard(entry, container)` | 渲染论语卡片 | `entry: Object, container: HTMLElement` |

## 🚀 部署到 Vercel

1. **推送代码到 GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/analects-sdk.git
git push -u origin main
```

2. **在 Vercel 中导入项目**
   - 访问 [Vercel 控制台](https://vercel.com)
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测为静态项目

3. **配置构建设置**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

4. **获取 CDN 链接**
部署完成后，你将获得以下 CDN 链接：
- `https://your-project.vercel.app/analects.js`
- `https://your-project.vercel.app/analects.css`
- `https://your-project.vercel.app/analects.min.js`
- `https://your-project.vercel.app/analects.min.css`

## 🔐 Supabase 配置

### 1. 数据库设置
确保你的 Supabase 项目已创建以下表结构：

```sql
-- 论语条目表
CREATE TABLE analects_entries (
  id BIGSERIAL PRIMARY KEY,
  chapter TEXT,
  section_number INTEGER,
  original_text TEXT,
  annotation TEXT,
  translation TEXT,
  show_in_daily BOOLEAN DEFAULT false,
  personal_insight TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 人物表
CREATE TABLE characters (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 论点表
CREATE TABLE arguments (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 谚语表
CREATE TABLE proverbs (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 关联表
CREATE TABLE entry_characters (
  id BIGSERIAL PRIMARY KEY,
  entry_id BIGINT REFERENCES analects_entries(id) ON DELETE CASCADE,
  character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE entry_arguments (
  id BIGSERIAL PRIMARY KEY,
  entry_id BIGINT REFERENCES analects_entries(id) ON DELETE CASCADE,
  argument_id BIGINT REFERENCES arguments(id) ON DELETE CASCADE
);

CREATE TABLE entry_proverbs (
  id BIGSERIAL PRIMARY KEY,
  entry_id BIGINT REFERENCES analects_entries(id) ON DELETE CASCADE,
  proverb_id BIGINT REFERENCES proverbs(id) ON DELETE CASCADE
);
```

### 2. 行级安全策略 (RLS)

```sql
-- 启用 RLS
ALTER TABLE analects_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE arguments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proverbs ENABLE ROW LEVEL SECURITY;

-- 允许公开读取
CREATE POLICY "Allow public read access" ON analects_entries FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON characters FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON arguments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON proverbs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON entry_characters FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON entry_arguments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON entry_proverbs FOR SELECT USING (true);
```

## 🎨 使用示例

### 1. 简单的每日论语页面

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日论语</title>
    <link rel="stylesheet" href="https://your-cdn.com/analects.css">
</head>
<body>
    <div class="container">
        <h1>📖 每日论语</h1>
        <div id="daily-analect"></div>
    </div>

    <script src="https://your-cdn.com/analects.js"></script>
    <script>
        const sdk = new AnalectsSDK({
            supabaseUrl: 'https://your-project.supabase.co',
            supabaseKey: 'your-anon-key'
        });
        
        sdk.renderDailyAnalect(document.getElementById('daily-analect'));
    </script>
</body>
</html>
```

### 2. 完整的搜索页面

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>论语搜索</title>
    <link rel="stylesheet" href="https://your-cdn.com/analects.css">
</head>
<body>
    <div class="container">
        <h1>🔍 论语搜索</h1>
        <div id="search-interface"></div>
    </div>

    <script src="https://your-cdn.com/analects.js"></script>
    <script>
        const sdk = new AnalectsSDK({
            supabaseUrl: 'https://your-project.supabase.co',
            supabaseKey: 'your-anon-key'
        });
        
        sdk.renderSearchInterface(document.getElementById('search-interface'));
    </script>
</body>
</html>
```

### 3. React 集成示例

```jsx
import { useEffect, useRef } from 'react';

function AnalectsComponent() {
  const searchRef = useRef(null);
  const dailyRef = useRef(null);
  
  useEffect(() => {
    const sdk = new AnalectsSDK({
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
      supabaseKey: process.env.REACT_APP_SUPABASE_KEY
    });
    
    if (searchRef.current) {
      sdk.renderSearchInterface(searchRef.current);
    }
    
    if (dailyRef.current) {
      sdk.renderDailyAnalect(dailyRef.current);
    }
  }, []);
  
  return (
    <div>
      <div ref={dailyRef}></div>
      <div ref={searchRef}></div>
    </div>
  );
}
```

## 🐛 故障排除

### 常见问题

1. **SDK 无法加载数据**
   - 检查 Supabase URL 和 API Key 是否正确
   - 确认数据库表结构是否正确创建
   - 检查 RLS 策略是否正确配置

2. **样式显示异常**
   - 确认 CSS 文件正确引入
   - 检查是否有 CSS 冲突
   - 验证容器元素是否存在

3. **移动端显示问题**
   - 添加 viewport meta 标签
   - 检查响应式断点设置
   - 确认触摸事件正常工作

### 调试模式

```javascript
// 开启调试模式
const sdk = new AnalectsSDK({
  supabaseUrl: 'your-url',
  supabaseKey: 'your-key',
  debug: true  // 开启调试日志
});
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献指南

1. Fork 这个项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📞 支持

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/analects-sdk/issues)
- 📚 文档: [GitHub Wiki](https://github.com/yourusername/analects-sdk/wiki)

## 🎉 更新日志

### v1.0.0 (2024-08-06)
- ✨ 初始发布
- 🎯 完整的 API 支持
- 🎨 Notion 风格 UI 组件
- 📱 移动端优化
- 🚀 自动初始化功能

---

**🌟 如果这个项目对你有帮助，请给个 Star！**