// tools/generate-seo-pages.mjs
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, "index.html");

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://www.lunyu.xyz";
const OUT_DIR = process.env.OUT_DIR || PROJECT_ROOT;
const CSS_HREF = "/v2/analects.css";

// 身份标签指定顺序
const ROLE_ORDER = ['全部', '孔子', '孔子弟子', '先贤', '先王', '隐士', '诸侯', '卿大夫', '其他'];

function readFileIfExists(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

function parseSupabaseCredsFromIndexHtml(html) {
  const urlMatch = html.match(/supabaseUrl\s*:\s*['"]([^'"]+)['"]/);
  const keyMatch = html.match(/supabaseKey\s*:\s*['"]([^'"]+)['"]/);
  return {
    url: urlMatch?.[1] || "",
    key: keyMatch?.[1] || "",
  };
}

const indexHtml = readFileIfExists(INDEX_HTML_PATH) || "";
let SUPABASE_URL = process.env.SUPABASE_URL || "";
let SUPABASE_KEY = process.env.SUPABASE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  const parsed = parseSupabaseCredsFromIndexHtml(indexHtml);
  SUPABASE_URL = SUPABASE_URL || parsed.url;
  SUPABASE_KEY = SUPABASE_KEY || parsed.key;
}

const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

// --- 通用 HTML 部件 ---

const SHARED_HEAD_MOD = `
  <script defer src="https://unpkg.com/lucide@latest"></script>
  <script type="module" src="/v2/analects.js"></script>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
    .sticky-header { position: sticky; top: 0; z-index: 1000; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border-bottom: 1px solid #e2e8f0; }
    .btn-primary { background: #2563eb; color: white; padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; display: inline-block; }
    .card { background: white; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
  </style>
`;

const GLOBAL_FOOTER = `
<footer class="mt-12 py-10 border-t border-gray-200 bg-white">
  <div class="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
      <div>
          <h4 class="font-semibold text-gray-800 mb-3">📚 开源项目</h4>
          <a href="https://github.com/litouch/Analects" target="_blank" class="text-blue-600 hover:underline">GitHub 仓库</a>
          <p class="text-sm text-gray-500 mt-2">查看源码或提交建议至 contact@lunyu.xyz</p>
      </div>
      <div>
          <h4 class="font-semibold text-gray-800 mb-3">👨‍💻 作者博客</h4>
          <a href="https://lehua.li" target="_blank" class="text-blue-600 hover:underline">lehua.li</a>
      </div>
      <div>
          <h4 class="font-semibold text-gray-800 mb-3">📖 关于项目</h4>
          <p class="text-sm text-gray-500">论语SDK 致力于传播中华传统文化，让更多人轻松学习论语。</p>
      </div>
  </div>
  <div class="mt-10 text-center text-sm text-gray-500">
      &copy; ${new Date().getFullYear()} 论语SDK. Made with ❤️ by lehua.li
  </div>
</footer>
`;

const SDK_INIT_SCRIPT = `
<script type="module">
  (async () => {
    try {
      const sdk = new AnalectsSDK({
          supabaseUrl: '${SUPABASE_URL}',
          supabaseKey: '${SUPABASE_KEY}'
      });
      await sdk.init();
      sdk.renderGlobalHeader();
      
      // 如果存在搜索容器，执行渲染
      const searchEl = document.getElementById('analects-search');
      if(searchEl) {
        sdk.renderSearchInterface(searchEl);
        // 如果是人物详情页，延时注入初始搜索词（等待组件挂载）
        const personName = document.body.dataset.personName;
        if(personName) {
           setTimeout(() => {
             const input = searchEl.querySelector('input[type="search"]');
             if(input) {
               input.value = personName;
               input.dispatchEvent(new Event('input', { bubbles: true }));
             }
           }, 500);
        }
      }
    } catch (e) { console.error("SDK Error:", e); }
  })();
</script>
`;

// --- 模板构建函数 ---

function buildPeopleIndexHtml({ people }) {
  const items = people.map(p => `
    <li class="card p-4 hover:shadow-md transition-shadow" data-role="${esc(p.role_tag)}" data-name="${esc(p.name)}" data-count="${p.count}">
      <div class="flex justify-between items-start">
        <a class="text-lg font-bold text-slate-900 hover:text-blue-600 decoration-blue-500" href="/people/${p.slug}.html">${esc(p.name)}</a>
        <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">${p.count} 条目</span>
      </div>
      <div class="mt-2"><span class="text-xs border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full">${esc(p.role_tag)}</span></div>
    </li>`).join("");

  const pills = ROLE_ORDER.map(r => `
    <button class="pill px-4 py-1.5 rounded-full border border-slate-200 bg-white text-sm text-slate-600 hover:border-blue-400" 
            data-role="${esc(r)}" aria-pressed="${r === '全部'}">${esc(r)}</button>
  `).join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>论语人物索引 | 按人物检索论语原文</title>
  <link rel="stylesheet" href="${CSS_HREF}" />
  ${SHARED_HEAD_MOD}
</head>
<body class="bg-slate-50">
  <header id="global-header-wrapper" class="sticky-header"></header>
  <main class="max-w-5xl mx-auto px-4 py-12">
    <div class="text-center mb-10">
      <h1 class="text-4xl font-extrabold text-slate-900 mb-4">论语人物索引</h1>
      <p class="text-slate-500">汇集《论语》中出现的诸侯、弟子及先贤，探索其言行背景。</p>
    </div>

    <div class="card p-6 mb-8">
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-sm font-bold text-slate-400 mr-2">筛选身份:</span>
          ${pills}
        </div>
        <div class="flex gap-4 items-center border-t pt-4">
          <span class="text-sm font-bold text-slate-400 mr-2">排序方式:</span>
          <button id="s-count" class="text-sm text-blue-600 font-bold">按词条频率</button>
          <button id="s-name" class="text-sm text-slate-400">按名称字母</button>
          <div class="ml-auto flex-1 max-w-xs">
            <input id="q" type="search" placeholder="快速搜索姓名..." class="w-full px-4 py-2 border rounded-lg text-sm" />
          </div>
        </div>
      </div>
    </div>

    <ul id="grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${items}</ul>
    <div id="empty" class="hidden text-center py-20 text-slate-400">未找到匹配的人物。</div>
  </main>
  ${GLOBAL_FOOTER}
  ${SDK_INIT_SCRIPT}
  <script>
    const grid = document.getElementById('grid');
    const q = document.getElementById('q');
    let currentRole = '全部';
    let sortMode = 'count';

    function apply() {
      const term = q.value.trim().toLowerCase();
      const items = Array.from(grid.querySelectorAll('li'));
      let visibleCount = 0;

      items.forEach(li => {
        const name = li.dataset.name.toLowerCase();
        const role = li.dataset.role;
        const matchRole = (currentRole === '全部' || role === currentRole);
        const matchTerm = (!term || name.includes(term));
        
        if (matchRole && matchTerm) {
          li.style.display = '';
          visibleCount++;
        } else {
          li.style.display = 'none';
        }
      });

      document.getElementById('empty').classList.toggle('hidden', visibleCount > 0);

      const sorted = items.filter(li => li.style.display !== 'none').sort((a,b) => {
        if(sortMode === 'count') return Number(b.dataset.count) - Number(a.dataset.count);
        return a.dataset.name.localeCompare(b.dataset.name, 'zh');
      });
      sorted.forEach(li => grid.appendChild(li));
    }

    document.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('border-blue-500', 'text-blue-600'));
        btn.classList.add('border-blue-500', 'text-blue-600');
        currentRole = btn.dataset.role;
        apply();
      });
    });

    document.getElementById('s-count').onclick = (e) => { sortMode='count'; updateSortUI(e.target); apply(); };
    document.getElementById('s-name').onclick = (e) => { sortMode='name'; updateSortUI(e.target); apply(); };
    function updateSortUI(el){
      document.getElementById('s-count').className = document.getElementById('s-name').className = 'text-sm text-slate-400';
      el.className = 'text-sm text-blue-600 font-bold';
    }
    q.addEventListener('input', apply);
  </script>
</body>
</html>`;
}

function buildPersonHtml({ person }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(person.name)} | 论语人物</title>
  <meta name="description" content="${esc(person.description)}" />
  <link rel="stylesheet" href="${CSS_HREF}" />
  ${SHARED_HEAD_MOD}
</head>
<body class="bg-slate-50" data-person-name="${esc(person.name)}">
  <header id="global-header-wrapper" class="sticky-header"></header>
  
  <main class="max-w-5xl mx-auto px-4 py-12">
    <nav class="mb-8 text-sm text-slate-400">
      <a href="/" class="hover:text-blue-600">首页</a> / 
      <a href="/people/index.html" class="hover:text-blue-600">人物索引</a> / 
      <span class="text-slate-600">${esc(person.name)}</span>
    </nav>

    <header class="mb-10">
      <div class="flex items-center gap-4 mb-4">
        <h1 class="text-5xl font-extrabold text-slate-900">${esc(person.name)}</h1>
        <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">${esc(person.role_tag)}</span>
      </div>
      <p class="text-xl text-slate-600 leading-relaxed max-w-3xl">${esc(person.description)}</p>
    </header>

    <section class="card overflow-hidden">
      <div class="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <h2 class="text-lg font-bold text-white">相关《论语》条目</h2>
        <span class="text-slate-400 text-sm">由 AnalectsSDK 动态加载</span>
      </div>
      <div id="analects-search" class="p-6 min-h-[400px]">
        <div class="animate-pulse flex flex-col gap-4">
          <div class="h-10 bg-slate-100 rounded w-full"></div>
          <div class="h-64 bg-slate-50 rounded w-full"></div>
        </div>
      </div>
    </section>
  </main>

  ${GLOBAL_FOOTER}
  ${SDK_INIT_SCRIPT}
</body>
</html>`;
}

// --- 其余逻辑 ---

function esc(s) {
  return String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function normalizeSlug(slug) {
  return String(slug ?? "").trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/\-+/g, "-").replace(/^\-|\-$/g, "");
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
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
  for (let page = 0; page < 20; page++) {
    const start = page * 2000, end = start + 1999;
    const chunk = await restGet(pathname, params, `${start}-${end}`);
    all.push(...chunk);
    if (chunk.length < 2000) break;
  }
  return all;
}

async function main() {
  console.log("🚀 开始生成 SEO 页面...");
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

  const sitemapUrls = [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/people/index.html`,
    ...people.map(p => `${SITE_ORIGIN}/people/${p.slug}.html`)
  ];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.map(u => `<url><loc>${u}</loc><lastmod>${new Date().toISOString()}</lastmod></url>`).join("")}</urlset>`;
  writeText(path.join(OUT_DIR, "sitemap.xml"), sitemapXml);

  console.log(`✅ 成功生成 ${people.length} 个详情页和 1 个索引页。`);
}

main().catch(console.error);