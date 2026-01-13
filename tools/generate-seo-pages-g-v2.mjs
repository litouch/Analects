// tools/generate-seo-pages.mjs
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, "index.html");

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://www.lunyu.xyz";
const OUT_DIR = process.env.OUT_DIR || PROJECT_ROOT;
const SDK_JS_URL = "/v2/analects.js"; 
const CSS_HREF = "/v2/analects.css";

// 身份标签指定顺序
const ROLE_ORDER = ['全部', '孔子', '孔子弟子', '先贤', '先王', '隐士', '诸侯', '卿大夫', '其他'];

function readFileIfExists(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

function parseSupabaseCreds(html) {
  const urlMatch = html.match(/supabaseUrl\s*:\s*['"]([^'"]+)['"]/);
  const keyMatch = html.match(/supabaseKey\s*:\s*['"]([^'"]+)['"]/);
  return { url: urlMatch?.[1] || "", key: keyMatch?.[1] || "" };
}

const indexHtml = readFileIfExists(INDEX_HTML_PATH) || "";
const creds = parseSupabaseCreds(indexHtml);
const SUPABASE_URL = process.env.SUPABASE_URL || creds.url;
const SUPABASE_KEY = process.env.SUPABASE_KEY || creds.key;
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

// --- 公共 HTML 片段 ---

const COMMON_HEAD = `
  <script defer src="https://unpkg.com/lucide@latest"></script>
  <script type="module" src="${SDK_JS_URL}"></script>
  <style>
    .sticky-header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border-bottom: 1px solid #f1f5f9; }
    .role-pill.active { background-color: #2563eb !important; color: white !important; border-color: #2563eb !important; }
    .sort-btn.active { color: #2563eb !important; font-weight: 700; border-bottom: 2px solid #2563eb; }
  </style>
`;

const GLOBAL_FOOTER = `
<footer class="mt-20 py-12 border-t border-slate-100 bg-white">
    <div class="max-w-5xl mx-auto px-6 text-center md:text-left">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
                <h4 class="font-bold text-slate-900 mb-4 text-lg">论语索引</h4>
                <p class="text-slate-500 text-sm leading-relaxed">数字化呈现《论语》智慧，支持多维度检索与沉浸式阅读体验。</p>
            </div>
            <div>
                <h4 class="font-bold text-slate-900 mb-4 text-lg">快速导航</h4>
                <ul class="text-sm space-y-2 text-blue-600">
                    <li><a href="/" class="hover:underline">网站首页</a></li>
                    <li><a href="/people/index.html" class="hover:underline">人物索引</a></li>
                    <li><a href="https://github.com/litouch/Analects" target="_blank" class="hover:underline">GitHub 开源</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-slate-900 mb-4 text-lg">联系我们</h4>
                <p class="text-slate-500 text-sm">建议或反馈：contact@lunyu.xyz</p>
            </div>
        </div>
        <div class="mt-12 pt-8 border-t border-slate-50 text-center text-xs text-slate-400 uppercase tracking-widest">
            &copy; ${new Date().getFullYear()} www.lunyu.xyz
        </div>
    </div>
</footer>
`;

// --- 页面构建逻辑 ---

function buildPeopleIndexHtml({ people }) {
  const items = people.map(p => `
    <li class="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-all group" 
        data-role="${esc(p.role_tag)}" data-name="${esc(p.name)}" data-count="${p.count}">
      <div class="flex justify-between items-start mb-2">
        <a class="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors" href="/people/${p.slug}.html">${esc(p.name)}</a>
        <span class="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded uppercase">${p.count} ENTRIES</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500 px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">${esc(p.role_tag)}</span>
      </div>
    </li>`).join("");

  const pills = ROLE_ORDER.map(r => `
    <button class="role-pill px-4 py-1.5 rounded-full border border-slate-200 bg-white text-sm text-slate-600 hover:border-blue-300 transition-all" data-role="${esc(r)}">${esc(r)}</button>
  `).join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>人物索引 | 论语学习与检索平台</title>
  <link rel="stylesheet" href="${CSS_HREF}" />
  ${COMMON_HEAD}
</head>
<body class="bg-slate-50/50">
  <header id="global-header-wrapper" class="sticky-header"></header>
  <main class="max-w-5xl mx-auto px-6 py-16">
    <div class="mb-12">
      <h1 class="text-4xl font-black text-slate-900 mb-3 tracking-tight">人物索引</h1>
      <p class="text-slate-500">按身份或姓名检索《论语》中出现的历史人物</p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">身份筛选</span>
          ${pills}
        </div>
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-slate-50">
          <div class="flex items-center gap-6">
            <button id="sort-freq" class="sort-btn active text-sm text-slate-400 pb-1">按引用频率</button>
            <button id="sort-alpha" class="sort-btn text-sm text-slate-400 pb-1">按姓氏拼音</button>
          </div>
          <div class="relative flex-1 max-w-sm">
            <input id="search-input" type="search" placeholder="输入姓名关键词..." class="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
        </div>
      </div>
    </div>

    <ul id="people-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${items}</ul>
    <div id="no-results" class="hidden text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed">没有找到匹配的人物</div>
  </main>
  ${GLOBAL_FOOTER}
  <script type="module">
    async function init() {
      const sdk = new AnalectsSDK({ supabaseUrl: '${SUPABASE_URL}', supabaseKey: '${SUPABASE_KEY}' });
      await sdk.init();
      sdk.renderGlobalHeader();
    }
    init();

    const grid = document.getElementById('people-grid');
    const input = document.getElementById('search-input');
    const pills = document.querySelectorAll('.role-pill');
    const sortFreq = document.getElementById('sort-freq');
    const sortAlpha = document.getElementById('sort-alpha');
    let activeRole = '全部';

    function update() {
      const q = input.value.trim().toLowerCase();
      const items = Array.from(grid.children);
      let found = 0;

      items.forEach(li => {
        const matchRole = activeRole === '全部' || li.dataset.role === activeRole;
        const matchText = li.dataset.name.toLowerCase().includes(q);
        const visible = matchRole && matchText;
        li.style.display = visible ? '' : 'none';
        if(visible) found++;
      });
      document.getElementById('no-results').classList.toggle('hidden', found > 0);
    }

    pills.forEach(p => {
      p.addEventListener('click', () => {
        pills.forEach(b => b.classList.remove('active'));
        p.classList.add('active');
        activeRole = p.dataset.role;
        update();
      });
    });
    pills[0].classList.add('active');

    sortFreq.onclick = () => {
      sortFreq.classList.add('active'); sortAlpha.classList.remove('active');
      Array.from(grid.children).sort((a,b) => b.dataset.count - a.dataset.count).forEach(li => grid.appendChild(li));
    };
    sortAlpha.onclick = () => {
      sortAlpha.classList.add('active'); sortFreq.classList.remove('active');
      Array.from(grid.children).sort((a,b) => a.dataset.name.localeCompare(b.dataset.name, 'zh')).forEach(li => grid.appendChild(li));
    };

    input.oninput = update;
  </script>
</body>
</html>`;
}

function buildPersonHtml({ person }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(person.name)} - 人物详情 | 论语索引</title>
  <meta name="description" content="${esc(person.description)}" />
  <link rel="stylesheet" href="${CSS_HREF}" />
  ${COMMON_HEAD}
</head>
<body class="bg-slate-50/50">
  <header id="global-header-wrapper" class="sticky-header"></header>
  
  <main class="max-w-5xl mx-auto px-6 py-12">
    <nav class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
      <a href="/" class="hover:text-blue-600">首页</a>
      <span class="lucide-chevron-right w-3 h-3"></span>
      <a href="/people/index.html" class="hover:text-blue-600">人物索引</a>
      <span class="lucide-chevron-right w-3 h-3"></span>
      <span class="text-slate-900">${esc(person.name)}</span>
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
      <div class="lg:col-span-2">
        <div class="flex items-center gap-4 mb-6">
          <h1 class="text-5xl font-black text-slate-900 tracking-tight">${esc(person.name)}</h1>
          <span class="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded-lg border border-blue-100 uppercase">${esc(person.role_tag)}</span>
        </div>
        <p class="text-xl text-slate-600 leading-relaxed font-serif">${esc(person.description)}</p>
      </div>
    </div>

    <section class="mt-12">
      <div class="flex items-center gap-3 mb-8">
        <div class="h-6 w-1 bg-blue-600 rounded-full"></div>
        <h2 class="text-2xl font-bold text-slate-900 italic">相关《论语》条目</h2>
      </div>
      
      <div id="analects-search-container" class="min-h-[600px] bg-white rounded-3xl border border-slate-200 p-2 md:p-6">
          <div id="loading-placeholder" class="p-10 text-center text-slate-400 animate-pulse">
            正在检索相关条目...
          </div>
      </div>
    </section>
  </main>

  ${GLOBAL_FOOTER}

  <script type="module">
    async function init() {
      try {
        const sdk = new AnalectsSDK({
            supabaseUrl: '${SUPABASE_URL}',
            supabaseKey: '${SUPABASE_KEY}'
        });
        await sdk.init();
        sdk.renderGlobalHeader();

        const container = document.getElementById('analects-search-container');
        // 1. 渲染搜索界面 (会包含搜索框和结果容器)
        sdk.renderSearchInterface(container);

        // 2. 关键：注入人物筛选状态并触发搜索
        // 我们通过直接操作 sdk.selectedItems 来实现“首页点击人物并搜索”的效果
        const personId = "${person.id}";
        const personName = "${esc(person.name)}";
        
        // 模拟用户在高级搜索中选中了该人物
        sdk.selectedItems.characters.set(personId, personName);
        
        // 触发搜索执行
        await sdk.handleSearch();
        
        // 移除 loading
        const placeholder = document.getElementById('loading-placeholder');
        if(placeholder) placeholder.remove();

      } catch (err) {
        console.error('SDK Error:', err);
      }
    }
    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}

// --- 辅助函数 (保持不变) ---

function esc(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function normalizeSlug(slug) {
  return String(slug ?? "").trim().toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-|\-$/g, "");
}

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function writeText(p, content) { ensureDir(path.dirname(p)); fs.writeFileSync(p, content, "utf8"); }

async function restGet(pathname, params = {}, range = null) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const h = { ...headers };
  if (range) h.Range = range;
  const res = await fetch(url.toString(), { headers: h });
  return res.json();
}

async function restGetAll(pathname, params = {}) {
  const all = [];
  for (let page = 0; page < 10; page++) {
    const start = page * 1000, end = start + 999;
    const chunk = await restGet(pathname, params, `${start}-${end}`);
    all.push(...chunk);
    if (chunk.length < 1000) break;
  }
  return all;
}

async function main() {
  console.log("🚀 开始 SEO 页面重构...");
  const characters = await restGetAll("characters", { select: "id,name,description,slug,role_tag" });
  const rels = await restGetAll("entry_characters", { select: "character_id" });

  const countMap = new Map();
  rels.forEach(r => countMap.set(r.character_id, (countMap.get(r.character_id) || 0) + 1));

  const people = characters
    .map(c => ({
      ...c,
      slug: normalizeSlug(c.slug),
      role_tag: (c.role_tag || "其他").trim(),
      count: countMap.get(c.id) || 0
    }))
    .filter(p => p.slug)
    .sort((a, b) => b.count - a.count);

  const peopleDir = path.join(OUT_DIR, "people");
  writeText(path.join(peopleDir, "index.html"), buildPeopleIndexHtml({ people }));
  for (const p of people) {
    writeText(path.join(peopleDir, `${p.slug}.html`), buildPersonHtml({ person: p }));
  }
  console.log(`✅ 成功生成 ${people.length} 个详情页。`);
}

main().catch(console.error);