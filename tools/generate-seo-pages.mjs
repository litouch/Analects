import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, "index.html");
const OUT_DIR = process.env.OUT_DIR || PROJECT_ROOT;
const CSS_HREF = "/v2/analects.css";

// --- 解析配置 ---
function readFileIfExists(p) { try { return fs.readFileSync(p, "utf8"); } catch { return null; } }
const indexHtml = readFileIfExists(INDEX_HTML_PATH) || "";
function parseCreds(html) {
  const url = html.match(/supabaseUrl\s*:\s*['"]([^'"]+)['"]/)?.[1];
  const key = html.match(/supabaseKey\s*:\s*['"]([^'"]+)['"]/)?.[1];
  return { url, key };
}
const { url: SUPABASE_URL, key: SUPABASE_KEY } = parseCreds(indexHtml);
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

/**
 * 【关键】UI复刻：生成与首页搜索结果 1:1 的卡片 HTML
 */
function renderEntryCard(entry) {
  return `
  <div class="analect-card" data-entry-id="${entry.id}">
    <div class="card-header">
      <div class="tags-container">
        <span class="chapter-tag">${esc(entry.chapter || '论语')}</span>
      </div>
      <div class="actions-container">
        <button class="action-btn-favorite" data-id="${entry.id}" title="收藏">
          <i data-lucide="heart"></i>
        </button>
        <button class="action-btn-copy" data-content="${esc(entry.original_text)}" title="复制原文">
          <i data-lucide="copy"></i>
        </button>
      </div>
    </div>
    <div class="entry-content">
      <p class="original-text">${esc(entry.original_text)}</p>
    </div>
    <div class="translations-container">
      <div class="translation-item">
        <div class="translation-label">
          <span class="label-line"></span>白话本 (杨伯峻)
        </div>
        <p class="translation-text">${esc(entry.translation)}</p>
      </div>
      ${entry.english_text ? `
      <div class="translation-item">
        <div class="translation-label">
          <span class="label-line"></span>English (Legge)
        </div>
        <p class="translation-text english">${esc(entry.english_text)}</p>
      </div>` : ''}
    </div>
  </div>`;
}

/**
 * 页面总布局 (包含粘性头和页脚)
 */
const layout = (title, content, breadcrumbs = []) => `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} | 论语全文检索</title>
  <link rel="stylesheet" href="${CSS_HREF}" />
  <script defer src="https://unpkg.com/lucide@latest"></script>
  <style>
    /* 粘性页头补丁 */
    .sticky-header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #f1f5f9; }
    .breadcrumb-nav { display: flex; align-items: center; gap: 10px; font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 0.2em; margin-bottom: 40px; text-transform: uppercase; }
    .breadcrumb-item.active { color: #1e293b; }
    .breadcrumb-separator { color: #cbd5e1; font-weight: 300; }
  </style>
</head>
<body class="bg-slate-50/50">
  <header id="global-header-wrapper" class="sticky-header"></header>
  
  <main class="max-w-5xl mx-auto px-6 py-12">
    <nav class="breadcrumb-nav">
      <a href="/" class="hover:text-blue-600">HOME</a>
      <span class="breadcrumb-separator">/</span>
      ${breadcrumbs.map((b, i) => `
        <a href="${b.link}" class="${i === breadcrumbs.length-1 ? 'breadcrumb-item active' : 'hover:text-blue-600'}">${esc(b.name.toUpperCase())}</a>
        ${i < breadcrumbs.length - 1 ? '<span class="breadcrumb-separator">/</span>' : ''}
      `).join('')}
    </nav>

    <div class="analects-search-container">
      <div class="analects-results-container">
        ${content}
      </div>
    </div>
  </main>

  <footer class="mt-24 py-16 border-t border-slate-100 bg-white text-center">
    <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">&copy; ${new Date().getFullYear()} www.lunyu.xyz</p>
  </footer>

  <script type="module">
    import { AnalectsSDK } from '/v2/analects.js';
    const sdk = new AnalectsSDK({ supabaseUrl: '${SUPABASE_URL}', supabaseKey: '${SUPABASE_KEY}' });
    window.sdk = sdk;
    await sdk.init();
    sdk.renderGlobalHeader();
    if(window.lucide) window.lucide.createIcons();

    // 激活卡片收藏状态 (水合)
    const cards = document.querySelectorAll('.analect-card');
    if (sdk.currentUser && sdk.favoriteIds) {
      cards.forEach(card => {
        if (sdk.favoriteIds.has(card.dataset.entryId)) {
          card.querySelector('.action-btn-favorite')?.classList.add('active');
        }
      });
    }
    // 绑定事件 (SDK内部逻辑)
    document.addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('.action-btn-copy');
      if (copyBtn) {
        await navigator.clipboard.writeText(copyBtn.dataset.content);
        if(window.showToast) showToast('已复制原文');
      }
    });
  </script>
</body>
</html>`;

function buildPersonHtml({ person, entries }) {
  const cardsHtml = entries.map(e => renderEntryCard(e)).join("");
  const content = `
    <div class="person-detail-header mb-16">
      <div class="flex items-center gap-4 mb-6">
        <h1 class="text-5xl font-black text-slate-900">${esc(person.name)}</h1>
        <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase">${esc(person.role_tag)}</span>
      </div>
      <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <p class="text-2xl text-slate-600 leading-relaxed font-serif">${esc(person.description)}</p>
      </div>
    </div>
    <div class="results-title flex items-center gap-4 mb-10">
      <h2 class="text-xs font-black text-slate-400 uppercase tracking-widest">相关论语条目 / ${entries.length}</h2>
      <div class="flex-grow h-[1px] bg-slate-100"></div>
    </div>
    <div id="static-entries-list">${cardsHtml}</div>
  `;
  return layout(person.name, content, [{ name: "PEOPLE", link: "/people/index.html" }, { name: person.name, link: "" }]);
}

// ... restGetAll, esc, normalizeSlug 等辅助函数保持不变 ...
async function restGetAll(pathname, params = {}) {
  let all = []; let page = 0;
  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${pathname}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, { headers: { ...headers, Range: `${page*1000}-${(page+1)*1000-1}` } });
    const chunk = await res.json();
    if (!chunk.length) break;
    all = all.concat(chunk);
    if (chunk.length < 1000) break;
    page++;
  }
  return all;
}
function esc(s) { return String(s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
function normalizeSlug(s) { return String(s||"").trim().toLowerCase().replace(/[\s_]+/g,"-").replace(/[^a-z0-9\-]/g,"").replace(/\-+/g,"-").replace(/^\-|\-$/g,""); }
function writeText(p, content) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content, "utf8"); }

async function main() {
  console.log("🚀 正在拉取数据并生成 1:1 还原页面...");
  const [characters, allEntries, relations] = await Promise.all([
    restGetAll("characters", { select: "id,name,description,slug,role_tag" }),
    restGetAll("analects_entries_expanded", { select: "id,original_text,translation,english_text,chapter" }),
    restGetAll("entry_characters", { select: "entry_id,character_id" })
  ]);

  const entryMap = new Map(allEntries.map(e => [e.id, e]));
  const charToEntries = new Map();
  relations.forEach(rel => {
    if (!charToEntries.has(rel.character_id)) charToEntries.set(rel.character_id, []);
    const e = entryMap.get(rel.entry_id); if (e) charToEntries.get(rel.character_id).push(e);
  });

  for (const p of characters) {
    const slug = normalizeSlug(p.slug || p.name);
    const html = buildPersonHtml({ person: p, entries: charToEntries.get(p.id) || [] });
    writeText(path.join(OUT_DIR, "people", `${slug}.html`), html);
  }
  console.log("✨ 页面已在 /people/ 目录下生成，UI 结构已与首页完全对齐。");
}
main();