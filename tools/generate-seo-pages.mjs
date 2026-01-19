import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, "index.html");
const OUT_DIR = process.env.OUT_DIR || PROJECT_ROOT;

const CSS_HREF = "/v2/analects.css";
const SDK_HREF = "/v2/analects.js";
const SITE_ORIGIN = "https://www.lunyu.xyz";

const ROLE_ORDER = ["孔子", "孔子弟子", "先贤", "先王", "隐士", "诸侯", "卿大夫", "其他"];

function readFileIfExists(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function parseCredsFromIndexHtml(html) {
  const url = html.match(/supabaseUrl\s*:\s*['"]([^'"]+)['"]/)
    ?.[1];
  const key = html.match(/supabaseKey\s*:\s*['"]([^'"]+)['"]/)
    ?.[1];
  return { url, key };
}

const indexHtml = readFileIfExists(INDEX_HTML_PATH) || "";
const { url: SUPABASE_URL, key: SUPABASE_KEY } = parseCredsFromIndexHtml(indexHtml);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing Supabase credentials. Please ensure index.html contains AnalectsSDK({ supabaseUrl: '...', supabaseKey: '...' })."
  );
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}

function normalizeSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-|\-$/g, "");
}

function writeText(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

async function restGetAll(pathname, params = {}) {
  let all = [];
  let page = 0;
  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${pathname}`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const rangeStart = page * 1000;
    const rangeEnd = (page + 1) * 1000 - 1;

    const res = await fetch(url, {
      headers: {
        ...headers,
        Range: `${rangeStart}-${rangeEnd}`,
      },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Supabase REST error: ${res.status} ${res.statusText}. ${txt}`);
    }

    const chunk = await res.json();
    if (!chunk.length) break;

    all = all.concat(chunk);
    if (chunk.length < 1000) break;
    page += 1;
  }

  return all;
}

function buildGlobalHeaderHtml(activeKey) {
  const navItems = [
    { key: "chapters", label: "论语二十篇", href: "/chapters/index.html" },
    { key: "people", label: "论语人物", href: "/people/index.html" },
    { key: "topics", label: "论语主题", href: "/topics/index.html" },
    { key: "proverbs", label: "论语成语", href: "/idioms/index.html" },
  ];

  const anchors = navItems
    .map((it) => {
      const cls = it.key === activeKey ? "header-anchor is-active" : "header-anchor";
      return `<a class="${cls}" href="${it.href}">${it.label}</a>`;
    })
    .join("\n");

  return `
<header id="global-header-wrapper">
  <div class="global-header-inner">
    <div class="header-left-area">
      <a class="header-brand" href="/">論語XYZ</a>
      <span class="header-welcome-message" aria-live="polite"></span>
    </div>

    <nav class="header-center-nav" aria-label="站点导航">
      ${anchors}
    </nav>

    <div class="header-right-area">
  <div class="header-skeleton avatar" aria-hidden="true"></div>
  <noscript><a class="header-login-btn" href="/login.html">登录 / 注册</a></noscript>
</div>
  </div>
</header>`;
}

function buildCommonHead({ title, description, canonical, jsonLd }) {
  return `
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="${CSS_HREF}">
  <script defer src="https://unpkg.com/lucide@latest"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  ${jsonLd || ""}
</head>`;
}

function buildCommonFooterHtml() {
  return `
<footer class="mt-10 md:mt-12 pt-10 border-t border-gray-200">
  <div class="text-center text-sm text-gray-500 max-w-3xl mx-auto px-4">
    <p>&copy; <span id="year"></span> 论语XYZ. Made with ❤️ by <a href="https://lehua.li" class="text-blue-600 hover:underline">lehua.li</a></p>
  </div>
</footer>
<script type="module">
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
</script>`;
}

function buildSdkBootScript({ initChapterCards = false } = {}) {
  return `
<script type="module" src="${SDK_HREF}"></script>
<script type="module">
  const sdk = new AnalectsSDK({
    supabaseUrl: '${SUPABASE_URL}',
    supabaseKey: '${SUPABASE_KEY}'
  });

  await sdk.init();
  sdk.renderGlobalHeader();

  if (window.lucide) { window.lucide.createIcons(); }

  ${initChapterCards ? "await sdk.initializeChapterPage();" : ""}
</script>`;
}

function buildPageHtml({
  title,
  description,
  canonical,
  activeNavKey,
  jsonLd,
  bodyContent,
  initChapterCards = false,
}) {
  const head = buildCommonHead({ title, description, canonical, jsonLd });
  const header = buildGlobalHeaderHtml(activeNavKey);
  const footer = buildCommonFooterHtml();
  const boot = buildSdkBootScript({ initChapterCards });

  return `<!DOCTYPE html>
<html lang="zh-CN">
${head}
<body class="page-with-sticky-header page-fixed-nav text-gray-800 antialiased">
  ${header}
  ${bodyContent}
  <div id="analects-global-widget-container"></div>
  <div id="toast" class="fixed top-5 right-5 bg-green-600 text-white py-2 px-5 rounded-lg shadow-lg transform translate-x-[120%] opacity-0 transition-all duration-300 ease-in-out z-50"></div>
  ${footer}
  ${boot}
</body>
</html>`;
}

function buildPeopleIndexJsonLd() {
  return `
<script type="application/ld+json">
${JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "论语人物", item: `${SITE_ORIGIN}/people/index.html` },
    ],
  },
  null,
  2
)}
</script>`;
}

function buildPeopleDetailJsonLd({ personName, personUrl }) {
  return `
<script type="application/ld+json">
${JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "论语人物", item: `${SITE_ORIGIN}/people/index.html` },
      { "@type": "ListItem", position: 3, name: personName, item: personUrl },
    ],
  },
  null,
  2
)}
</script>`;
}

function buildPeopleIndexPageHtml({ people }) {
  const roleSet = new Set(people.map((p) => (p.role_tag || "").trim()).filter(Boolean));
  const extraRoles = Array.from(roleSet).filter((r) => !ROLE_ORDER.includes(r)).sort();
  const roles = ROLE_ORDER.concat(extraRoles);

  const cardsHtml = people
    .map((p) => {
      const name = esc(p.name);
      const desc = esc((p.description || "").trim());
      const role = esc((p.role_tag || "").trim());
      const slug = esc(p.slug_norm);
      const count = Number(p.mention_count || 0);

      return `
<a href="/people/${slug}.html" class="chapter-card flex flex-col p-5 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
   data-name="${name}" data-desc="${desc}" data-role="${role}" data-count="${count}">
  <div class="flex items-center justify-between gap-3 mb-1">
    <h2 class="font-semibold text-lg text-gray-800">${name}</h2>
    ${role ? `<span class="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md border border-blue-100">${role}</span>` : ""}
  </div>
  ${desc ? `<p class="text-gray-600 text-sm leading-relaxed">${desc}</p>` : `<p class="text-gray-400 text-sm">暂无简介</p>`}
  <div class="mt-3 text-xs text-gray-500">提及条目 · <span class="font-semibold text-gray-700">${count}</span></div>
</a>`;
    })
    .join("\n");

  const bodyContent = `
<div class="page-container">
  <nav class="breadcrumb" aria-label="面包屑">
    <a href="/">首页</a>
    <span class="sep">/</span>
    <span aria-current="page">论语人物</span>
  </nav>

  <header class="text-center mb-8 border-b pb-6 page-header">
    <h1 class="text-3xl md:text-4xl font-bold text-gray-900">论语人物索引</h1>
    <p class="text-lg text-gray-500 mt-2">按人物浏览与检索</p>
  </header>

  <section class="people-controls mb-6 bg-white rounded-lg border border-gray-200 p-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label for="people-search" class="hidden md:block text-xs font-medium text-gray-500 mb-1">搜索</label>
        <input id="people-search" class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="搜索人物. 支持姓名与简介" aria-label="搜索人物" />
      </div>
      <div>
        <label for="people-role" class="hidden md:block text-xs font-medium text-gray-500 mb-1">身份标签</label>
        <select id="people-role" class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" aria-label="按身份标签筛选">
          <option value="">全部</option>
          ${roles.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join("\n")}
        </select>
      </div>
      <div>
        <label for="people-sort" class="hidden md:block text-xs font-medium text-gray-500 mb-1">排序</label>
        <select id="people-sort" class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" aria-label="排序">
          <option value="mentions">按论语条目</option>
          <option value="alpha">按字母表</option>
        </select>
      </div>
    </div>

    <div class="mt-3 text-sm text-gray-500">
      当前显示 <span id="people-count" class="font-semibold text-gray-700">${people.length}</span> 位人物
    </div>
  </section>

  <main id="people-grid" class="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
    ${cardsHtml}
  </main>
</div>

<script type="module">
  const grid = document.getElementById('people-grid');
  const countEl = document.getElementById('people-count');
  const searchEl = document.getElementById('people-search');
  const roleEl = document.getElementById('people-role');
  const sortEl = document.getElementById('people-sort');

  const collator = new Intl.Collator('zh-Hans-u-co-pinyin', { numeric: true, sensitivity: 'base' });
  const allCards = Array.from(grid.querySelectorAll('a.chapter-card'));

  function apply() {
    const q = (searchEl.value || '').trim().toLowerCase();
    const role = roleEl.value || '';
    const sort = sortEl.value || 'mentions';

    const filtered = allCards.filter(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const desc = (card.dataset.desc || '').toLowerCase();
      const r = card.dataset.role || '';
      if (role && r !== role) return false;
      if (!q) return true;
      return name.includes(q) || desc.includes(q);
    });

    filtered.sort((a, b) => {
      if (sort === 'alpha') {
        return collator.compare(a.dataset.name || '', b.dataset.name || '');
      }
      const ca = Number(a.dataset.count || 0);
      const cb = Number(b.dataset.count || 0);
      if (cb !== ca) return cb - ca;
      return collator.compare(a.dataset.name || '', b.dataset.name || '');
    });

    grid.innerHTML = '';
    filtered.forEach(c => grid.appendChild(c));
    countEl.textContent = String(filtered.length);
  }

  searchEl.addEventListener('input', apply);
  roleEl.addEventListener('change', apply);
  sortEl.addEventListener('change', apply);

  apply();
</script>`;

  return buildPageHtml({
    title: "论语人物索引. 按人物浏览与检索. 論語XYZ",
    description: "浏览《论语》中出现的重要人物. 支持按身份标签筛选. 搜索. 并按论语条目数或字母表排序.",
    canonical: `${SITE_ORIGIN}/people/index.html`,
    activeNavKey: "people",
    jsonLd: buildPeopleIndexJsonLd(),
    bodyContent,
    initChapterCards: false,
  });
}

function buildPersonDetailPageHtml({ person, entries }) {
  const slug = person.slug_norm;
  const personUrl = `${SITE_ORIGIN}/people/${slug}.html`;

  const cardsHtml = entries
    .map((e) => {
      const original = esc(e.original_text);
      const trans = esc(e.translation || "");
      return `
<div class="verse-card" data-entry-id="${e.id}">
  <blockquote class="verse-original">${original}</blockquote>
  ${trans ? `<p class="verse-translation">【译文】${trans}</p>` : ""}
  <div class="analects-card-footer-placeholder"></div>
</div>`;
    })
    .join("\n");

  const role = (person.role_tag || "").trim();
  const desc = (person.description || "").trim();

  const bodyContent = `
<div class="page-container">
  <nav class="breadcrumb" aria-label="面包屑">
    <a href="/">首页</a>
    <span class="sep">/</span>
    <a href="/people/index.html">论语人物</a>
    <span class="sep">/</span>
    <span aria-current="page">${esc(person.name)}</span>
  </nav>

  <header class="text-center mb-8 border-b pb-6 page-header">
    <h1 class="text-3xl md:text-4xl font-bold text-gray-900">${esc(person.name)}</h1>
    ${role ? `<p class="text-lg text-gray-500 mt-2">${esc(role)}</p>` : ``}
  </header>

  ${desc ? `
  <section class="mb-6 bg-white rounded-lg border border-gray-200 p-5">
    <p class="text-gray-700 leading-relaxed">${esc(desc)}</p>
  </section>` : ""}

  <div class="results-title flex items-center gap-4 mb-6">
    <h2 class="text-xs font-black text-slate-400 uppercase tracking-widest">相关论语条目 / ${entries.length}</h2>
    <div class="flex-grow h-[1px] bg-slate-100"></div>
  </div>

  <main class="space-y-4">
    ${cardsHtml}
  </main>
</div>`;

  return buildPageHtml({
    title: `${person.name}. 论语人物. 論語XYZ`,
    description: `《论语》人物. ${person.name}. 查看人物简介与相关论语条目.`,
    canonical: personUrl,
    activeNavKey: "people",
    jsonLd: buildPeopleDetailJsonLd({ personName: person.name, personUrl }),
    bodyContent,
    initChapterCards: true,
  });
}

async function main() {
  console.log("Generating people index and people detail pages");

  const [characters, allEntries, relations] = await Promise.all([
    restGetAll("characters", { select: "id,name,description,slug,role_tag" }),
    restGetAll("analects_entries_expanded", { select: "id,original_text,translation,english_text,chapter" }),
    restGetAll("entry_characters", { select: "entry_id,character_id" }),
  ]);

  const entryMap = new Map(allEntries.map((e) => [e.id, e]));

  // character_id -> array of entries
  const charToEntries = new Map();
  for (const rel of relations) {
    if (!charToEntries.has(rel.character_id)) {
      charToEntries.set(rel.character_id, []);
    }
    const e = entryMap.get(rel.entry_id);
    if (e) charToEntries.get(rel.character_id).push(e);
  }

  // Normalize and count
  for (const p of characters) {
    p.slug_norm = normalizeSlug(p.slug || p.name);
    p.mention_count = (charToEntries.get(p.id) || []).length;
  }

  // People index. Pre-sort by mentions desc, then name
  const peopleSorted = [...characters].sort((a, b) => {
    const diff = (b.mention_count || 0) - (a.mention_count || 0);
    if (diff !== 0) return diff;
    return String(a.name || "").localeCompare(String(b.name || ""), "zh-Hans");
  });

  const peopleIndexHtml = buildPeopleIndexPageHtml({ people: peopleSorted });
  writeText(path.join(OUT_DIR, "people", "index.html"), peopleIndexHtml);

  // People detail pages
  for (const p of characters) {
    const slug = p.slug_norm;
    if (!slug) continue;

    const entries = (charToEntries.get(p.id) || []).slice();

    // Stable order for static HTML. Then hydration will render full cards.
    entries.sort((a, b) => (a.id - b.id));

    const html = buildPersonDetailPageHtml({ person: p, entries });
    writeText(path.join(OUT_DIR, "people", `${slug}.html`), html);
  }

  console.log("Done. Output written to", path.join(OUT_DIR, "people"));
}

main();
