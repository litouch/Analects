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

function buildPeopleIndexHtml({ people }) {
  const items = people.map(p => {
    const href = `/people/${p.slug}.html`;
    return `
<li class="card" data-role="${esc(p.role_tag)}" data-name="${esc(p.name)}" data-count="${p.count}">
  <div class="top">
    <a class="name" href="${href}">${esc(p.name)}</a>
    <span class="count">${p.count} 条</span>
  </div>
  <div class="meta">
    <span class="tag">${esc(p.role_tag)}</span>
  </div>
</li>`.trim();
  }).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>论语人物索引 | 按人物检索论语原文</title>
  <meta name="description" content="《论语》人物索引页。默认按人物关联条目数排序，并支持按身份标签与名称重排，便于学习与检索。" />
  <link rel="stylesheet" href="${CSS_HREF}" />
  <link rel="canonical" href="${SITE_ORIGIN}/people/index.html" />
  <style>
    .wrap{max-width:980px;margin:0 auto;padding:24px 16px;}
    h1{font-size:2rem;font-weight:800;line-height:1.15;margin:0;color:#0f172a;}
    .sub{margin-top:.5rem;color:#64748b;}
    .intro{margin-top:1rem;line-height:1.8;color:#475569;max-width:760px;}
    .bar{margin-top:1.25rem;display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;}
    .pill{border:1px solid rgba(148,163,184,.6);background:#fff;border-radius:999px;padding:.45rem .7rem;cursor:pointer;color:#334155;}
    .pill[aria-pressed="true"]{border-color:rgba(59,130,246,.7);color:#1d4ed8;}
    .q{margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap;}
    .q input{flex:1;min-width:240px;border:1px solid rgba(148,163,184,.6);border-radius:.75rem;padding:.7rem .9rem;}
    ul.grid{margin-top:1.5rem;list-style:none;padding:0;display:grid;grid-template-columns:repeat(1,minmax(0,1fr));gap:.75rem;}
    @media(min-width:640px){ul.grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media(min-width:1024px){ul.grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
    .card{border:1px solid rgba(148,163,184,.35);border-radius:1rem;background:rgba(255,255,255,.92);padding:.9rem .95rem;}
    .top{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;}
    .name{font-size:1.1rem;font-weight:800;color:#0f172a;text-decoration:none;}
    .name:hover{text-decoration:underline;}
    .count{font-size:.9rem;color:#334155;background:rgba(226,232,240,.6);border-radius:.75rem;padding:.25rem .55rem;white-space:nowrap;}
    .meta{margin-top:.65rem;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;color:#64748b;}
    .tag{font-size:.85rem;border:1px solid rgba(148,163,184,.5);border-radius:999px;padding:.2rem .5rem;background:#fff;color:#475569;}
    .empty{margin-top:1.5rem;padding:1rem;border:1px dashed rgba(148,163,184,.6);border-radius:1rem;color:#64748b;background:rgba(248,250,252,.7);display:none;}
  </style>
</head>

<body>
  <main class="wrap">
    <header>
      <h1>论语人物索引</h1>
      <div class="sub">默认按关联条目数排序。可按身份标签与名称重排。</div>
      <p class="intro">本页汇总《论语》相关人物。你可以从高频人物开始学习，也可以通过筛选快速定位，再进入人物详情页查看简介与相关条目。</p>

      <div class="bar" aria-label="排序">
        <span class="sub">排序</span>
        <button class="pill" id="s-count" aria-pressed="true" type="button">按条目数</button>
        <button class="pill" id="s-role" aria-pressed="false" type="button">按身份标签</button>
        <button class="pill" id="s-name" aria-pressed="false" type="button">按名称</button>
      </div>

      <div class="q">
        <input id="q" type="search" placeholder="搜索人物名，例如：颜回 / 子路…" autocomplete="off" />
        <button class="pill" id="clear" type="button">清空</button>
      </div>
    </header>

    <section aria-label="人物列表">
      <ul class="grid" id="grid">
${items}
      </ul>
      <div class="empty" id="empty">未找到匹配的人物。</div>
    </section>
  </main>

  <script>
    const grid = document.getElementById('grid');
    const empty = document.getElementById('empty');
    const q = document.getElementById('q');
    let sortMode = 'count';

    function setPressed(id){
      ['s-count','s-role','s-name'].forEach(x=>{
        document.getElementById(x).setAttribute('aria-pressed', x===id ? 'true':'false');
      });
    }
    function compareZh(a,b){ return a.localeCompare(b,'zh'); }

    function apply(){
      const term = q.value.trim().toLowerCase();
      const items = Array.from(grid.querySelectorAll('.card'));

      const filtered = items.filter(li=>{
        const name = (li.dataset.name || '').toLowerCase();
        return !term || name.includes(term);
      });

      for (const li of items) li.style.display = 'none';
      for (const li of filtered) li.style.display = '';

      if (filtered.length === 0){
        empty.style.display = 'block';
        return;
      }
      empty.style.display = 'none';

      filtered.sort((a,b)=>{
        const ac = Number(a.dataset.count||0), bc = Number(b.dataset.count||0);
        const ar = a.dataset.role||'', br = b.dataset.role||'';
        const an = a.dataset.name||'', bn = b.dataset.name||'';
        if (sortMode === 'count') return (bc-ac) || compareZh(an,bn);
        if (sortMode === 'role') return compareZh(ar,br) || (bc-ac) || compareZh(an,bn);
        return compareZh(an,bn) || (bc-ac);
      });

      const frag = document.createDocumentFragment();
      filtered.forEach(li=>frag.appendChild(li));
      grid.appendChild(frag);
    }

    document.getElementById('s-count').addEventListener('click', ()=>{ sortMode='count'; setPressed('s-count'); apply(); });
    document.getElementById('s-role').addEventListener('click', ()=>{ sortMode='role'; setPressed('s-role'); apply(); });
    document.getElementById('s-name').addEventListener('click', ()=>{ sortMode='name'; setPressed('s-name'); apply(); });

    q.addEventListener('input', apply);
    document.getElementById('clear').addEventListener('click', ()=>{ q.value=''; apply(); q.focus(); });

    apply();
  </script>
</body>
</html>`;
}

function buildPersonHtml({ person }) {
  const canonical = `${SITE_ORIGIN}/people/${person.slug}.html`;
  const title = `${person.name} | 论语人物`;
  const desc = person.description?.trim() || `${person.name}在《论语》中的相关人物条目与学习要点。`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="stylesheet" href="${CSS_HREF}" />
  <link rel="canonical" href="${canonical}" />
  <style>
    .wrap{max-width:980px;margin:0 auto;padding:24px 16px;}
    h1{font-size:2rem;font-weight:800;line-height:1.15;margin:0;color:#0f172a;}
    .tag{display:inline-flex;align-items:center;font-size:.9rem;border:1px solid rgba(148,163,184,.5);
      border-radius:999px;padding:.25rem .6rem;background:#fff;color:#475569;margin-top:.75rem;}
    .intro{margin-top:1rem;line-height:1.85;color:#334155;max-width:820px;}
    .links{margin-top:1.25rem;display:flex;gap:.75rem;flex-wrap:wrap;}
    .links a{color:#1d4ed8;text-decoration:none;}
    .links a:hover{text-decoration:underline;}
    .block{margin-top:1.75rem;border:1px solid rgba(148,163,184,.35);border-radius:1rem;background:rgba(255,255,255,.92);padding:1rem;}
    .muted{color:#64748b;}
  </style>
</head>

<body>
  <main class="wrap">
    <header>
      <h1>${esc(person.name)}</h1>
      <div class="tag">${esc(person.role_tag)}</div>
      <p class="intro">${esc(desc)}</p>

      <div class="links">
        <a href="/people/index.html">返回人物索引</a>
        <a href="/chapters.html">论语二十篇全文</a>
        <a href="/index.html">返回首页</a>
      </div>
    </header>

    <section class="block" aria-label="相关条目">
      <div style="font-weight:800;color:#0f172a;">相关论语条目</div>
      <p class="muted" style="margin-top:.5rem;">
        此区域建议后续用你的现有检索逻辑动态加载该人物关联条目。
        静态页先确保可收录与可导航。
      </p>
      <p class="muted">人物 ID: ${esc(person.id)}</p>
    </section>
  </main>
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
  writeText(path.join(peopleDir, "index.html"), buildPeopleIndexHtml({ people }));
  console.log(`生成 people/index.html 完成, 人物数 ${people.length}`);

  // 2) people/<slug>.html
  for (const p of people) {
    const html = buildPersonHtml({ person: p });
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
