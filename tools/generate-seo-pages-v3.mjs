// tools/generate-seo-pages.mjs
// 用法:
//   node tools/generate-seo-pages.mjs
//
// 依赖:
//   Node 18+ (内置 fetch)
// 环境变量(二选一):
//   A) SUPABASE_URL / SUPABASE_KEY / SITE_ORIGIN
//   B) 不设置 SUPABASE_*，脚本会尝试从 ./index.html 里解析 supabaseUrl/supabaseKey
//
// 输出:
//   ./people/index.html
//   ./people/<slug>.html   (按 characters 表生成)
//   ./sitemap.xml

import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, "index.html");

// 你站点域名, 用于 sitemap
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://www.lunyu.xyz";

// 输出目录, 默认项目根目录
const OUT_DIR = process.env.OUT_DIR || PROJECT_ROOT;

// 你站点 CSS 路径. 保持与现有站点一致
const CSS_HREF = "/v2/analects.css";

function readFileIfExists(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

function parseSupabaseCredsFromIndexHtml(html) {
  // 匹配类似:
  // supabaseUrl: 'https://xxx.supabase.co'
  // supabaseKey: 'sb_publishable_xxx'
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
  if (!indexHtml) {
    console.error("缺少 SUPABASE_URL/SUPABASE_KEY, 且未找到 index.html 供解析。");
    process.exit(1);
  }
  const parsed = parseSupabaseCredsFromIndexHtml(indexHtml);
  SUPABASE_URL = SUPABASE_URL || parsed.url;
  SUPABASE_KEY = SUPABASE_KEY || parsed.key;
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("无法获得 Supabase 凭据。请设置 SUPABASE_URL 和 SUPABASE_KEY。");
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

async function restGet(pathname, params = {}, range = null) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const h = { ...headers };
  if (range) h.Range = range;

  const res = await fetch(url.toString(), { headers: h });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GET ${pathname} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

async function restGetAll(pathname, params = {}, pageSize = 2000, maxPages = 200) {
  const all = [];
  for (let page = 0; page < maxPages; page++) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    const chunk = await restGet(pathname, params, `${start}-${end}`);
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return all;
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeSlug(slug) {
  return String(slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-|\-$/g, "");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeText(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}

function buildPeopleIndexHtml({ people, SUPABASE_URL, SUPABASE_KEY, CSS_HREF, SITE_ORIGIN }) {
  const roleTags = Array.from(new Set(people.map(p => (p.role_tag || "其他").trim() || "其他")))
    .sort((a, b) => a.localeCompare(b, "zh"));

  const rolePills = [
    `<button class="chip is-active" data-role="__all__" aria-pressed="true" type="button">全部</button>`,
    ...roleTags.map(tag => `<button class="chip" data-role="${esc(tag)}" aria-pressed="false" type="button">${esc(tag)}</button>`)
  ].join("");

  const cardsHtml = people.map(p => {
    const name = esc(p.name || "");
    const role = esc((p.role_tag || "其他").trim() || "其他");
    const slug = esc(p.slug || "");
    const count = Number(p.entry_count || 0);
    const intro = esc((p.short_intro || "").trim());
    const sub = intro ? intro : "查看简介与相关条目";
    return `
      <a class="person-card" href="/people/${slug}.html" data-name="${name}" data-role="${role}" data-count="${count}">
        <div class="person-card-top">
          <div class="person-name">${name}</div>
          <div class="badge" title="身份标签">${role}</div>
        </div>
        <div class="person-sub">${sub}</div>
        <div class="person-meta">
          <span class="meta-dot"></span>
          <span>${count} 条相关条目</span>
        </div>
      </a>
    `;
  }).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>论语人物索引 | 按人物检索论语原文</title>
  <meta name="description" content="《论语》人物索引页。默认按人物关联条目数排序。支持按身份标签筛选与名称检索，便于学习与查找。" />
  <link rel="stylesheet" href="${CSS_HREF}" />
  <link rel="canonical" href="${SITE_ORIGIN}/people/index.html" />
  <style>
    /* 让页面与首页保持同一套容器节奏 */
    body.people-index-page{background: #f8fafc;}
    .people-container{max-width:1000px;margin:0 auto;padding:24px 16px;}
    .people-hero{
      background:#fff;
      border:1px solid rgba(226,232,240,.9);
      border-radius:16px;
      padding:18px 18px 14px;
      box-shadow:0 1px 0 rgba(15,23,42,.03);
    }
    .people-title{font-size:28px;line-height:1.2;margin:0;color:#0f172a;font-weight:900;letter-spacing:-.02em;}
    .people-sub{margin-top:8px;color:#64748b;line-height:1.7;}
    .toolbar{margin-top:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;}
    .toolbar .field{flex:1 1 260px;min-width:220px;}
    .searchbox{
      width:100%;display:flex;gap:10px;align-items:center;
      background:#f8fafc;border:1px solid rgba(226,232,240,.9);
      border-radius:12px;padding:10px 10px;
    }
    .searchbox input{
      border:none;outline:none;background:transparent;
      width:100%;font-size:14px;color:#0f172a;
    }
    .btn{
      border:1px solid rgba(148,163,184,.55);
      background:#fff;border-radius:12px;padding:9px 12px;
      cursor:pointer;font-weight:700;color:#0f172a;
      transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease;
      white-space:nowrap;
    }
    .btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(15,23,42,.06);border-color:rgba(148,163,184,.75);}
    .seg{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
    .seg .seg-label{color:#64748b;font-size:13px;margin-right:2px;}
    .seg button[aria-pressed="true"]{border-color:rgba(59,130,246,.7);box-shadow:0 8px 20px rgba(37,99,235,.12);}
    .chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
    .chips .chips-label{color:#64748b;font-size:13px;margin-right:2px;}
    .chip{
      border:1px solid rgba(148,163,184,.55);
      background:#fff;border-radius:999px;padding:7px 12px;
      cursor:pointer;color:#334155;font-weight:700;font-size:13px;
      transition:all .12s ease;
    }
    .chip:hover{border-color:rgba(148,163,184,.85);box-shadow:0 6px 16px rgba(15,23,42,.06);}
    .chip.is-active{border-color:rgba(59,130,246,.7);color:#0f172a;box-shadow:0 8px 20px rgba(37,99,235,.12);}
    .people-grid{
      margin-top:16px;
      display:grid;
      grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
      gap:12px;
    }
    .person-card{
      display:block;text-decoration:none;
      border:1px solid rgba(226,232,240,.95);
      background:#fff;border-radius:16px;
      padding:14px 14px 12px;
      box-shadow:0 1px 0 rgba(15,23,42,.03);
      transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease;
      color:inherit;
    }
    .person-card:hover{
      transform:translateY(-2px);
      border-color:rgba(148,163,184,.7);
      box-shadow:0 10px 30px rgba(15,23,42,.10);
    }
    .person-card-top{display:flex;gap:10px;align-items:center;justify-content:space-between;}
    .person-name{font-weight:900;color:#0f172a;letter-spacing:-.01em;}
    .badge{
      font-size:12px;font-weight:800;
      padding:5px 10px;border-radius:999px;
      background:#f1f5f9;border:1px solid rgba(226,232,240,.9);
      color:#334155;white-space:nowrap;
    }
    .person-sub{margin-top:10px;color:#64748b;line-height:1.65;font-size:13px;min-height:2.6em;}
    .person-meta{margin-top:10px;color:#475569;font-size:13px;display:flex;gap:8px;align-items:center;}
    .meta-dot{width:6px;height:6px;border-radius:99px;background:#93c5fd;display:inline-block;}
    .empty{
      margin-top:16px;padding:18px;border:1px dashed rgba(148,163,184,.6);
      border-radius:16px;color:#64748b;background:rgba(255,255,255,.6);
    }
    .page-footer{margin-top:26px;padding-top:20px;border-top:1px solid rgba(226,232,240,.9);color:#64748b;font-size:14px;}
    .page-footer a{color:#1d4ed8;text-decoration:none;}
    .page-footer a:hover{text-decoration:underline;}
  </style>
</head>

<body class="page-with-sticky-header people-index-page">
  <div id="global-header-wrapper"></div>

  <main class="people-container">
    <section class="people-hero" aria-label="人物索引简介与筛选">
      <h1 class="people-title">论语人物索引</h1>
      <div class="people-sub">默认按关联条目数排序。支持按身份标签筛选与名称检索。</div>

      <div class="toolbar">
        <div class="field">
          <div class="searchbox" role="search">
            <input id="q" type="search" placeholder="搜索人物名。例如：颜回 / 子路…" autocomplete="off" />
            <button class="btn" id="clearBtn" type="button" title="清空">清空</button>
          </div>
        </div>

        <div class="seg" aria-label="排序">
          <span class="seg-label">排序</span>
          <button class="btn" id="s-count" aria-pressed="true" type="button">按条目数</button>
          <button class="btn" id="s-name" aria-pressed="false" type="button">按名称</button>
        </div>

        <div class="chips" aria-label="身份标签筛选" id="roleFilters">
          <span class="chips-label">筛选</span>
          ${rolePills}
        </div>
      </div>
    </section>

    <section class="people-grid" id="grid" aria-label="人物列表">
      ${cardsHtml}
    </section>

    <div id="empty" class="empty" style="display:none;">没有匹配的人物。你可以换个关键词，或取消筛选。</div>

    <footer class="page-footer">
      <div>© <span id="year"></span> Lunyu Index. <a href="/index.html">首页</a>.</div>
    </footer>
  </main>

  <div id="analects-global-widget-container"></div>

  <div data-analects-auto-init data-supabase-url="${esc(SUPABASE_URL)}" data-supabase-key="${esc(SUPABASE_KEY)}" style="display:none;"></div>
  <script type="module" src="/v2/analects.js"></script>

  <script>
    const grid = document.getElementById('grid');
    const empty = document.getElementById('empty');
    const q = document.getElementById('q');
    const clearBtn = document.getElementById('clearBtn');
    const roleFiltersEl = document.getElementById('roleFilters');

    let sortMode = 'count';
    let selectedRoles = new Set(); // 空集合表示“全部”

    function setPressed(id){
      ['s-count','s-name'].forEach(x=>{
        document.getElementById(x).setAttribute('aria-pressed', x===id ? 'true':'false');
      });
    }

    function compareZh(a,b){ return a.localeCompare(b, 'zh'); }

    function apply(){
      const keyword = (q.value || '').trim().toLowerCase();
      const cards = Array.from(grid.querySelectorAll('.person-card'));

      // filter
      let visible = cards.filter(card=>{
        const name = (card.dataset.name||'').toLowerCase();
        const role = (card.dataset.role||'');
        const okKeyword = !keyword || name.includes(keyword);
        const okRole = selectedRoles.size===0 || selectedRoles.has(role);
        return okKeyword && okRole;
      });

      // sort
      visible.sort((a,b)=>{
        if (sortMode==='count') return (parseInt(b.dataset.count,10)||0) - (parseInt(a.dataset.count,10)||0);
        const an=a.dataset.name||''; const bn=b.dataset.name||'';
        return compareZh(an,bn);
      });

      // render by re-append (fast enough for this scale)
      cards.forEach(c=>c.style.display='none');
      visible.forEach(c=>{
        c.style.display='';
        grid.appendChild(c);
      });

      empty.style.display = visible.length ? 'none' : '';
    }

    // sorting
    document.getElementById('s-count').addEventListener('click',()=>{sortMode='count';setPressed('s-count');apply();});
    document.getElementById('s-name').addEventListener('click',()=>{sortMode='name';setPressed('s-name');apply();});

    // roles
    roleFiltersEl.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-role]');
      if (!btn) return;
      const role = btn.dataset.role;
      if (role==='__all__'){
        selectedRoles.clear();
        roleFiltersEl.querySelectorAll('button[data-role]').forEach(b=>{
          b.classList.toggle('is-active', b.dataset.role==='__all__');
          b.setAttribute('aria-pressed', b.dataset.role==='__all__' ? 'true':'false');
        });
      } else {
        const allBtn = roleFiltersEl.querySelector('button[data-role="__all__"]');
        if (allBtn){
          allBtn.classList.remove('is-active');
          allBtn.setAttribute('aria-pressed','false');
        }
        if (selectedRoles.has(role)) selectedRoles.delete(role); else selectedRoles.add(role);
        roleFiltersEl.querySelectorAll('button[data-role]').forEach(b=>{
          if (b.dataset.role==='__all__') return;
          const active = selectedRoles.has(b.dataset.role);
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true':'false');
        });
        if (selectedRoles.size===0 && allBtn){
          allBtn.classList.add('is-active');
          allBtn.setAttribute('aria-pressed','true');
        }
      }
      apply();
    });

    // search
    q.addEventListener('input', apply);
    clearBtn.addEventListener('click', ()=>{ q.value=''; apply(); q.focus(); });

    document.getElementById('year').textContent = new Date().getFullYear();
    apply();
  </script>
</body>
</html>`;
}

function buildPersonHtml({ person, SUPABASE_URL, SUPABASE_KEY, CSS_HREF, SITE_ORIGIN }) {
  const name = esc(person.name || "");
  const title = `${name} | 论语人物`;
  const role = esc((person.role_tag || "其他").trim() || "其他");
  const desc = esc((person.short_intro || "").trim() || `${name} 在《论语》中多次出现。此页汇总其简介与相关条目，便于阅读与学习。`);
  const canonical = `${SITE_ORIGIN}/people/${esc(person.slug)}.html`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${desc}" />
  <link rel="stylesheet" href="${CSS_HREF}" />
  <link rel="canonical" href="${canonical}" />
  <style>
    body.person-detail-page{background:#f8fafc;}
    .people-container{max-width:1000px;margin:0 auto;padding:24px 16px;}
    .crumbs{display:flex;gap:8px;flex-wrap:wrap;align-items:center;color:#64748b;font-size:14px;}
    .crumbs a{color:#1d4ed8;text-decoration:none;}
    .crumbs a:hover{text-decoration:underline;}
    .hero{
      margin-top:10px;
      background:#fff;border:1px solid rgba(226,232,240,.95);
      border-radius:16px;padding:18px 18px 14px;
      box-shadow:0 1px 0 rgba(15,23,42,.03);
    }
    .hero-top{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between;}
    h1{font-size:30px;line-height:1.15;margin:0;color:#0f172a;font-weight:900;letter-spacing:-.02em;}
    .badge{
      font-size:12px;font-weight:800;
      padding:6px 10px;border-radius:999px;
      background:#f1f5f9;border:1px solid rgba(226,232,240,.9);
      color:#334155;white-space:nowrap;
    }
    .intro{margin-top:12px;line-height:1.9;color:#334155;max-width:900px;}
    .block{
      margin-top:14px;
      background:#fff;border:1px solid rgba(226,232,240,.95);
      border-radius:16px;padding:14px;
      box-shadow:0 1px 0 rgba(15,23,42,.03);
    }
    .block-title{font-weight:900;color:#0f172a;}
    .muted{color:#64748b;line-height:1.8;margin-top:6px;}
    /* 人物页：保留关键词检索与结果。隐藏高级筛选等干扰项 */
    body.person-detail-page .analects-search-header{display:none;}
    body.person-detail-page .analects-advanced-filters{display:none;}
    body.person-detail-page #analects-reset-btn{display:none;}
    body.person-detail-page .analects-filters{display:none;}
    body.person-detail-page .analects-search-actions{justify-content:flex-start;}
    body.person-detail-page .analects-search-actions .analects-btn{width:auto;}
    body.person-detail-page .analects-keyword-label{font-weight:800;}
    body.person-detail-page .analects-selected-items{display:block !important;margin-top:10px;}
    .page-footer{margin-top:26px;padding-top:20px;border-top:1px solid rgba(226,232,240,.9);color:#64748b;font-size:14px;}
    .page-footer a{color:#1d4ed8;text-decoration:none;}
    .page-footer a:hover{text-decoration:underline;}
  </style>
</head>

<body class="page-with-sticky-header person-detail-page">
  <div id="global-header-wrapper"></div>

  <main class="people-container">
    <nav class="crumbs" aria-label="面包屑">
      <a href="/index.html">首页</a>
      <span>›</span>
      <a href="/people/index.html">人物索引</a>
      <span>›</span>
      <span aria-current="page">${name}</span>
    </nav>

    <header class="hero">
      <div class="hero-top">
        <h1>${name}</h1>
        <div class="badge">${role}</div>
      </div>
      <div class="intro">${desc}</div>
    </header>

    <section class="block" aria-label="相关条目">
      <div class="block-title">相关论语条目</div>
      <p class="muted">下方结果来自数据库检索。你也可以在关键词框里进一步缩小范围。</p>
      <div id="analects-search" data-analects-search></div>
    </section>

    <footer class="page-footer">
      <div>© <span id="year"></span> Lunyu Index. <a href="/index.html">首页</a>. <a href="/people/index.html">人物索引</a>.</div>
    </footer>
  </main>

  <div id="analects-global-widget-container"></div>

  <div data-analects-auto-init data-supabase-url="${esc(SUPABASE_URL)}" data-supabase-key="${esc(SUPABASE_KEY)}" style="display:none;"></div>
  <script type="module" src="/v2/analects.js"></script>

  <script type="module">
    import AnalectsSDK from '/v2/analects.js';

    const sdk = new AnalectsSDK({ supabaseUrl: ${JSON.stringify(SUPABASE_URL)}, supabaseKey: ${JSON.stringify(SUPABASE_KEY)} });

    try {
      // 1) 先渲染搜索界面
      sdk.renderSearchInterface(document.getElementById('analects-search'));

      // 2) 初始化登录态后渲染页头等依赖组件
      await sdk.init();
      sdk.renderGlobalHeader();
      sdk._initializeHeaderAnimation();

      // 3) 预设人物筛选并自动搜索
      const PERSON_ID = ${JSON.stringify(person.id)};
      const PERSON_NAME = ${JSON.stringify(person.name)};
      sdk.addSelectedItem('character', PERSON_ID, PERSON_NAME);
      sdk.renderSelectedItems();
      await sdk.performSearch();

      // 4) 优化关键词框体验
      const input = document.getElementById('analects-keyword');
      if (input) input.placeholder = '输入关键词。可搜索原文、翻译或注释';
      document.getElementById('year').textContent = new Date().getFullYear();
    } catch (e) {
      console.error('AnalectsSDK init failed:', e);
      document.getElementById('year').textContent = new Date().getFullYear();
    }
  </script>
</body>
</html>`;
}

function buildSitemapXml(urls) {
  const now = new Date().toISOString();
  const items = urls.map(u => {
    return `<url><loc>${esc(u)}</loc><lastmod>${now}</lastmod></url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

async function main() {
  console.log("拉取 characters...");
  const characters = await restGetAll("characters", { select: "id,name,description,slug,role_tag" }, 2000, 200);

  // 过滤掉没有 slug 的条目, 因为你说 slug 已经准备好, 这里也做安全检查
  const normalized = characters
    .map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      slug: normalizeSlug(c.slug),
      role_tag: (c.role_tag || "其他").trim() || "其他",
    }))
    .filter(c => c.slug);

  console.log("拉取 entry_characters 计算条目数...");
  const rels = await restGetAll("entry_characters", { select: "character_id" }, 5000, 400);
  const countMap = new Map();
  for (const r of rels) {
    const id = r.character_id;
    countMap.set(id, (countMap.get(id) || 0) + 1);
  }

  const people = normalized
    .map(p => ({ ...p, count: countMap.get(p.id) || 0 }))
    .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name, "zh"));

  // 1) people/index.html
  const peopleDir = path.join(OUT_DIR, "people");
  ensureDir(peopleDir);
  writeText(path.join(peopleDir, "index.html"), buildPeopleIndexHtml({ people, SUPABASE_URL, SUPABASE_KEY, CSS_HREF, SITE_ORIGIN }));
  console.log(`生成 people/index.html 完成, 人物数 ${people.length}`);

  // 2) people/<slug>.html
  for (const p of people) {
    const html = buildPersonHtml({ person: p, SUPABASE_URL, SUPABASE_KEY, CSS_HREF, SITE_ORIGIN });
    writeText(path.join(peopleDir, `${p.slug}.html`), html);
  }
  console.log(`生成人物详情页完成, 共 ${people.length} 个`);

  // 3) sitemap.xml
  const urls = [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/index.html`,
    `${SITE_ORIGIN}/people/index.html`,
    ...people.map(p => `${SITE_ORIGIN}/people/${p.slug}.html`),
  ];
  writeText(path.join(OUT_DIR, "sitemap.xml"), buildSitemapXml(urls));
  console.log("生成 sitemap.xml 完成");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
