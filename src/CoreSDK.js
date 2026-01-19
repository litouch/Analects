import { createClient } from '@supabase/supabase-js';
import './styles/analects.css';
import './styles/fonts.css';

// 论语 SDK - 核心功能基类 (供嵌入版使用)
export default class CoreSDK {
  constructor(config = {}) {
    this.supabaseUrl = config.supabaseUrl || 'https://your-project.supabase.co';
    this.supabaseKey = config.supabaseKey || 'your-anon-key';
    this.supabase = null; // 初始化为 null
    this._initializeSupabaseClient(); // 调用新的初始化方法

    this.apiBaseUrl = `${this.supabaseUrl}/rest/v1`;
    this.headers = {
      'apikey': this.supabaseKey,
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    this.entryCache = new Map();

    this.cache = {
      characters: null,
      arguments: null,
      proverbs: null,
      chapters: null
    };

    this.selectedItems = {
      characters: new Map(),
      arguments: new Map(),
      proverbs: new Map(),
      chapter: { id: 'all', name: '全部篇目' }
    };

    this.pagination = {
      pageSize: 10,
      currentPage: 0,
      totalLoaded: 0,
      isLoading: false,
      hasMore: true,
      totalCount: 0,
      loadedIds: new Set()
    };

    this.currentFilters = {};
    this.isSearchInitialized = false;
    this.scrollListener = null;
    this.isAutoLoadingEnabled = false;
    this.searchConditionsChanged = false;
    this.searchEventsInitialized = false;
    this.latestSearchId = 0;

    // [核心修正] 在构造函数中绑定事件处理函数的 this
    this._handleGlobalClick = this._handleGlobalClick.bind(this);
  }

  // [新增] 专门用于初始化 Supabase 客户端的方法
  // 这个基础版本为嵌入版 SDK 创建一个简单的客户端
  _initializeSupabaseClient() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  // [新增] 公开的初始化方法，用于启动事件监听
  async init() {
    this._initializeGlobalEventListeners();
  }

  // [新增] 初始化全局事件监听器 (精简版)
  _initializeGlobalEventListeners() {
    document.body.removeEventListener('click', this._handleGlobalClick);
    document.body.addEventListener('click', this._handleGlobalClick);
  }

  // [新增] 全局点击事件处理器 (精简版)
  _handleGlobalClick(event) {
    // 处理卡片上“更多选项”按钮的点击
    const moreOptionsButton = event.target.closest('.more-options-btn');
    if (moreOptionsButton) {
      event.stopPropagation();
      const dropdown = moreOptionsButton.nextElementSibling;
      const wasActive = dropdown.classList.contains('active');

      // 先关闭所有可能已打开的菜单
      document.querySelectorAll('.card-actions-dropdown.active').forEach(d => d.classList.remove('active'));

      // 如果当前菜单不是激活状态，则打开它
      if (!wasActive) {
        dropdown.classList.add('active');
      }
      return;
    }

    // 处理点击页面其他地方关闭菜单的逻辑
    const activeCardDropdown = document.querySelector('.card-actions-dropdown.active');
    if (activeCardDropdown && !event.target.closest('.card-actions-container')) {
      activeCardDropdown.classList.remove('active');
    }
  }

  // 验证配置
  validateConfig() {
    if (!this.supabaseUrl || this.supabaseUrl.includes('your-project')) {
      throw new Error('请先配置正确的 Supabase URL');
    }
    if (!this.supabaseKey || this.supabaseKey.includes('your-anon-key')) {
      throw new Error('请先配置正确的 Supabase Key');
    }
  }

  // [支持select字段参数] 使用 Supabase Query API 的统一请求方法
  async apiRequest(endpoint, params = {}) {
    this.validateConfig();

    const { count, select, ...urlParams } = params;

    // 初始化查询，默认 select(*)，如果传入了 select 参数就用它
    let query = this.supabase.from(endpoint)
      .select(select || '*', { count: count ? 'exact' : null });

    // 解析参数并应用到 Supabase 查询
    for (const [key, value] of Object.entries(urlParams)) {
      if (key === 'order') {
        const [col, dir] = value.split('.');
        query = query.order(col, { ascending: dir === 'asc' });
      } else if (key === 'limit') {
        query = query.limit(parseInt(value, 10));
      } else if (key === 'offset') {
        // Supabase 用 range(start, end) 实现 offset
        const start = parseInt(value, 10);
        const end = start + (parseInt(urlParams.limit || 10, 10)) - 1;
        query = query.range(start, end);
      } else {
        // 处理 eq.xxx / cs.{...} / ilike.*xxx* 等条件
        const dotIndex = value.indexOf('.');
        const op = value.slice(0, dotIndex);
        const val = value.slice(dotIndex + 1);
        if (op === 'eq') {
          query = query.eq(key, val);
        } else if (op === 'cs') {
          query = query.contains(key, val.replace(/[{}]/g, '').split(','));
        } else if (op === 'ilike') {
          query = query.ilike(key, val);
        } else {
          query = query.filter(key, op, val);
        }
      }
    }

    const { data, error, count: resultCount } = await query;

    if (error) {
      console.error('API错误详情:', error);
      throw new Error(`API请求失败: ${error.message}`);
    }

    if (count) {
      data.count = resultCount || 0;
    }

    return data;
  }

  // 分页数据获取
  async fetchAnalects(filters = {}, page = 0, pageSize = 10) {
    try {
      const params = this.buildQueryParams(filters, page, pageSize);
      let data = await this.apiRequest('analects_entries_expanded', params);

      const uniqueData = this.removeDuplicates(data);

      if (page === 0) {
        this.pagination.totalCount = await this.getTotalCount(filters);
      }

      const totalLoadedSoFar = page * pageSize + uniqueData.length;
      const hasMore = totalLoadedSoFar < this.pagination.totalCount;

      return {
        data: uniqueData,
        hasMore,
        total: uniqueData.length,
        totalCount: this.pagination.totalCount
      };
    } catch (error) {
      console.error('获取论语数据失败:', error);
      throw error;
    }
  }


  // 构建查询参数
  buildQueryParams(filters, page, pageSize) {
    const params = {
      select: `*,entry_characters(character_id,characters(id,name)),entry_arguments(argument_id,arguments(id,title)),entry_proverbs(proverbs(*))`,
      order: 'id.asc',
      limit: pageSize,
      offset: page * pageSize
    };

    if (filters.chapter && filters.chapter !== 'all' && filters.chapter.trim()) {
      params.chapter = `eq.${filters.chapter.trim()}`;
    }

    if (filters.characterIds && filters.characterIds.length > 0) {
      params.character_ids = `cs.{${filters.characterIds.join(',')}}`;
    }

    if (filters.argumentIds && filters.argumentIds.length > 0) {
      params.argument_ids = `cs.{${filters.argumentIds.join(',')}}`;
    }

    if (filters.proverbIds && filters.proverbIds.length > 0) {
      params.proverb_ids = `cs.{${filters.proverbIds.join(',')}}`;
    }

    // 关键字处理 - 多关键字 AND 逻辑
    if (filters.keyword && filters.keyword.trim()) {
      const rawKeyword = filters.keyword.trim().replace(/%/g, '');
      const keywords = rawKeyword.split(/\s+/).filter(k => k.length > 0);

      if (keywords.length > 0) {
        const keywordGroups = keywords.map(kw => {
          const searchFields = [
            `original_text.ilike.*${kw}*`,
            `translation.ilike.*${kw}*`,
            `annotation.ilike.*${kw}*`,
            // [新增] 将 english_text 加入到关键字搜索范围
            `english_text.ilike.*${kw}*`,
            `personal_insight.ilike.*${kw}*`
          ];
          return `or(${searchFields.join(',')})`;
        });

        params.and = `(${keywordGroups.join(',')})`;
      }
    }

    return params;
  }

  // 关键字高亮处理
  highlightKeywords(text, keyword) {
    if (!text || !keyword) {
      return this.escapeHtml(text || '');
    }

    let escapedText = this.escapeHtml(text);

    const keywords = keyword.trim().split(/\s+/).filter(k => k.length > 0);

    if (keywords.length === 0) {
      return escapedText;
    }

    keywords.forEach(kw => {
      if (kw.length > 0) {
        const escapedKeyword = this.escapeHtml(kw);
        const regex = new RegExp(`(${this.escapeRegExp(escapedKeyword)})`, 'gi');
        escapedText = escapedText.replace(regex, '<mark class="keyword-highlight">$1</mark>');
      }
    });

    return escapedText;
  }

  // HTML转义
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 正则表达式特殊字符转义
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 去重处理
  removeDuplicates(data) {
    const uniqueData = [];
    const seenIds = new Set();

    for (const entry of data) {
      if (entry.id && !seenIds.has(entry.id)) {
        seenIds.add(entry.id);
        uniqueData.push(entry);
      }
    }

    return uniqueData;
  }


  // 获取总数
  async getTotalCount(filters) {
    try {
      const params = {
        select: 'id',
        count: 'exact',
        limit: 0
      };

      if (filters.chapter && filters.chapter !== 'all' && filters.chapter.trim()) {
        params.chapter = `eq.${filters.chapter.trim()}`;
      }

      if (filters.characterIds && filters.characterIds.length > 0) {
        params.character_ids = `cs.{${filters.characterIds.join(',')}}`;
      }

      if (filters.argumentIds && filters.argumentIds.length > 0) {
        params.argument_ids = `cs.{${filters.argumentIds.join(',')}}`;
      }

      if (filters.proverbIds && filters.proverbIds.length > 0) {
        params.proverb_ids = `cs.{${filters.proverbIds.join(',')}}`;
      }

      if (filters.keyword && filters.keyword.trim()) {
        const rawKeyword = filters.keyword.trim().replace(/%/g, '');
        const keywords = rawKeyword.split(/\s+/).filter(k => k.length > 0);

        if (keywords.length > 0) {
          const keywordGroups = keywords.map(kw => {
            const searchFields = [
              `original_text.ilike.*${kw}*`,
              `translation.ilike.*${kw}*`,
              `annotation.ilike.*${kw}*`,
              // [新增] 将 english_text 加入到关键字搜索范围
              `english_text.ilike.*${kw}*`,
              `personal_insight.ilike.*${kw}*`
            ];
            return `or(${searchFields.join(',')})`;
          });

          params.and = `(${keywordGroups.join(',')})`;
        }
      }

      const result = await this.apiRequest('analects_entries_expanded', params);
      return result.count || 0;
    } catch (error) {
      console.error('获取总数失败:', error);
      return 0;
    }
  }

  // 中文拼音排序
  sortByPinyin(items, field) {
    return items.sort((a, b) => {
      const textA = a[field] || '';
      const textB = b[field] || '';
      return textA.localeCompare(textB, 'zh-CN', {
        numeric: true,
        sensitivity: 'base'
      });
    });
  }

  // 篇目排序
  sortChaptersByNumber(chapters) {
    return chapters.sort((a, b) => {
      const getChapterNumber = (chapterName) => {
        const match = chapterName.match(/第([一二三四五六七八九十百千万]+|[0-9]+)/);
        if (!match) return 0;
        const numStr = match[1];
        if (/^\d+$/.test(numStr)) {
          return parseInt(numStr, 10);
        }
        return this.chineseToNumber(numStr);
      };
      return getChapterNumber(a.name || a) - getChapterNumber(b.name || b);
    });
  }

  // 中文数字转阿拉伯数字
  chineseToNumber(chineseNum) {
    const chineseNumbers = {
      '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '百': 100, '千': 1000, '万': 10000
    };

    if (chineseNumbers[chineseNum]) {
      return chineseNumbers[chineseNum];
    }

    let result = 0;
    let temp = 0;

    if (chineseNum.startsWith('十')) {
      result = 10;
      chineseNum = chineseNum.substring(1);
    }

    for (let i = 0; i < chineseNum.length; i++) {
      const char = chineseNum[i];
      const num = chineseNumbers[char];

      if (num < 10) {
        temp = num;
      } else if (num === 10) {
        if (temp === 0) temp = 1;
        result += temp * 10;
        temp = 0;
      } else if (num === 100) {
        if (temp === 0) temp = 1;
        result += temp * 100;
        temp = 0;
      } else if (num === 1000) {
        if (temp === 0) temp = 1;
        result += temp * 1000;
        temp = 0;
      } else if (num === 10000) {
        if (temp === 0) temp = 1;
        result = (result + temp) * 10000;
        temp = 0;
      }
    }

    result += temp;
    return result;
  }

  // 获取数据
  async getData(type) {
    if (this.cache[type]) {
      return this.cache[type];
    }

    const endpoints = {
      characters: 'characters?order=name.asc',
      arguments: 'arguments?order=title.asc',
      proverbs: 'proverbs?order=content.asc',
      chapters: 'analects_entries?select=chapter&order=chapter.asc'
    };

    try {
      let data = await this.apiRequest(endpoints[type].split('?')[0],
        Object.fromEntries(new URLSearchParams(endpoints[type].split('?')[1] || '')));

      if (type === 'chapters') {
        const uniqueChapters = [...new Set(data.map(item => item.chapter))]
          .filter(chapter => chapter && typeof chapter === 'string' && chapter.trim())
          .map(chapter => ({ id: chapter, name: chapter }));
        data = this.sortChaptersByNumber(uniqueChapters);
      } else {
        const sortField = type === 'characters' ? 'name' :
          type === 'arguments' ? 'title' :
            type === 'proverbs' ? 'content' : null;
        if (sortField) {
          data = this.sortByPinyin(data, sortField);
        }
      }

      this.cache[type] = data;
      return data;
    } catch (error) {
      console.error(`获取${type}列表失败:`, error);
      if (error.message === 'Failed to fetch') {
        throw new Error('网络连接失败，请检查 Supabase 配置和网络连接');
      }
      throw error;
    }
  }

  // 便捷方法
  async getCharacters() { return this.getData('characters'); }
  async getArguments() { return this.getData('arguments'); }
  async getProverbs() { return this.getData('proverbs'); }
  async getChapters() { return this.getData('chapters'); }

  // [优化版] 获取每日论语，直接调用后端 RPC 函数
  async getDailyAnalect() {
    try {
      const { data: dailyEntries, error } = await this.supabase.rpc('get_daily_analect');
      if (error) throw error;

      if (dailyEntries && dailyEntries.length > 0) {
        return dailyEntries[0];
      }

      return null;
    } catch (error) {
      console.error('获取每日论语失败:', error);
      throw error;
    }
  }

  // 高级搜索
  async advancedSearch(filters = {}) {
    const result = await this.fetchAnalects(filters, 0, 1000);
    return result.data;
  }

  // 格式化日期
  formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];

    return {
      full: `${year}年${month}月${day}日`,
      weekday: weekday,
      iso: date.toISOString().split('T')[0]
    };
  }

  // [新增] 格式化为相对时间 (例如 “3小时前”)
  formatTimeAgo(dateString) {
    if (!dateString) return '';

    const now = new Date();
    const past = new Date(dateString);
    // 计算两个日期相差的秒数
    const seconds = Math.floor((now - past) / 1000);

    // [新增] 获取当前年份和收藏年份
    const yearNow = now.getFullYear();
    const yearPast = past.getFullYear();

    // 如果小于1分钟
    if (seconds < 60) {
      return '刚刚';
    }
    // 如果小于1小时
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}分钟前`;
    }
    // 如果小于1天
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}小时前`;
    }
    // 如果小于1个月 (简化为30天)
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days}天前`;
    }

    // [核心优化] 如果在同一年，则显示月和日
    if (yearNow === yearPast) {
      // toLocaleDateString 在不同浏览器和操作系统下表现可能略有差异
      // 但 'short' 格式通常是 'M/D' 或 'MM/DD'
      return past.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } else {
      // 如果跨年了，则显示完整的年月日
      return past.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }

  // 生成分享链接
  generateShareLinks(entry, currentUrl = window.location.href) {
    const text = `每日论语：${entry.original_text}`;
    const url = currentUrl;

    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      copy: text + ' - ' + url,
      email: `mailto:?subject=${encodeURIComponent('每日论语分享')}&body=${encodeURIComponent(text + ' - ' + url)}`
    };
  }

  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        Object.assign(textArea.style, {
          position: 'fixed',
          left: '-999999px',
          top: '-999999px'
        });
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (err) {
      console.error('复制失败:', err);
      return false;
    }
  }

  // [最终统一版] 渲染论语卡片 (统一使用 verse-card)
  renderAnalectCard(entry, container) {
    if (!container) {
      console.error('未找到容器元素');
      return;
    }

    this.entryCache.set(entry.id, entry);

    const card = document.createElement('div');
    card.className = 'verse-card';
    card.setAttribute('data-entry-id', entry.id);

    // [核心修正] 调用渲染函数时，明确指出要显示标签 (因为这个函数只用于搜索结果)
    card.innerHTML = this.generateResultCardHTML(entry, { showTags: true });

    container.appendChild(card);
    this._ensureIconsRendered();

    setTimeout(() => card.classList.add('animate-in'), 10);
  }

  // [最终完整版] 生成结果卡片HTML
  generateResultCardHTML(entry, options = {}) {
    if (!entry) return '';

    const { showTags = false } = options; // 默认不显示标签

    // --- 1. 数据准备 ---
    const currentKeyword = this.currentFilters?.keyword || '';
    // [核心修改] 在精简版中，永远不是收藏状态
    const isFavorited = false;
    const timeAgo = '';

    const getRelatedData = (items, field) =>
      (items || []).map(item => item[field]?.name || item[field]?.title || item[field]?.content).filter(Boolean);

    const characters = getRelatedData(entry.entry_characters, 'characters');
    const argumentsList = getRelatedData(entry.entry_arguments, 'arguments');
    const proverbs = getRelatedData(entry.entry_proverbs, 'proverbs');

    // --- 2. 构建卡片头部 ---
    const verseHeaderHTML = `
        <div class="verse-header">
          <div class="verse-header-left">
            <span class="verse-chapter">${this.escapeHtml(entry.chapter)}</span>
            <span class="verse-section">第${this.escapeHtml(entry.section_number)}节</span>
          </div>
          <div class="verse-header-right">
            ${timeAgo ? `<span class="verse-time-ago">${timeAgo}</span>` : ''}
          </div>
        </div>
      `;

    // --- 3. 构建卡片内容区 (包含原文、译文、注释) ---
    const highlightedOriginal = this.highlightKeywords(entry.original_text, currentKeyword);
    const highlightedTranslation = entry.translation ? this.highlightKeywords(entry.translation, currentKeyword) : '';
    // [新增] 对英译文进行关键字高亮处理
    const highlightedEnglish = entry.english_text ? this.highlightKeywords(entry.english_text, currentKeyword) : '';
    const highlightedAnnotation = entry.annotation ? this.highlightKeywords(entry.annotation, currentKeyword) : '';

    const contentHTML = `
        <blockquote class="verse-original">${highlightedOriginal}</blockquote>
        ${highlightedTranslation ? `<p class="verse-translation">【译文】${highlightedTranslation}</p>` : ''}
        ${highlightedEnglish ? `<p class="verse-translation">【英译】${highlightedEnglish}</p>` : ''}
        ${highlightedAnnotation ? `<div class="verse-annotation-wrapper">
                                    <div class="verse-annotation-title">【注释】</div>
                                    <div class="verse-annotation">${highlightedAnnotation}</div>
                                  </div>` : ''}
      `;

    // --- 4. 构建标签区 (变为条件化渲染) ---
    let tagsHTML = '';
    if (showTags) { // [核心修正] 只有在 showTags 为 true 时才生成标签区HTML
      // [核心] 定义SVG图标，移除对 lucide.js 的依赖
      const icons = {
        users: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        target: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        'message-square-quote': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
      };

      const createTagGroup = (label, items, icon, type) =>
        items.length > 0 ? `
            <div class="card-tag-group">
              <div class="card-tag-label">${icons[icon] || ''}<span>${label}</span></div>
              <div class="card-tag-items">
                ${items.map(item => `<span class="card-tag ${type}">${this.escapeHtml(item)}</span>`).join('')}
              </div>
            </div>
          ` : '';

      tagsHTML = (characters.length > 0 || argumentsList.length > 0 || proverbs.length > 0) ? `
          <div class="card-tags-section">
            ${createTagGroup('人物', characters, 'users', 'character')}
            ${createTagGroup('主题', argumentsList, 'target', 'argument')}
            ${createTagGroup('成语', proverbs, 'message-square-quote', 'proverb')}
          </div>
        ` : '';
    }

    // --- 5. 构建页脚 ---
    const footerHTML = this._generateCoreCardFooterHTML(entry);

    // --- 6. 组合成最终的卡片HTML ---
    return verseHeaderHTML + contentHTML + tagsHTML + footerHTML;
  }

  // [新增] 精简版的卡片页脚，不包含笔记和编辑功能
  _generateCoreCardFooterHTML(entry) {
    // [核心修正] favoriteButtonHTML 已被移除
    // const favoriteButtonHTML = `...`;

    const shareLinks = this.generateShareLinks(entry);
    const escapedCopyText = this.escapeHtml(shareLinks.copy).replace(/'/g, "\\'").replace(/\n/g, '\\n');

    const shareMenuHTML = `
	    <div class="card-actions-container">
	      <button class="more-options-btn" title="更多选项">
	         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
	      </button>
	      <div class="card-actions-dropdown">
	        <a href="${shareLinks.twitter}" target="_blank" rel="noopener noreferrer" class="dropdown-share-item">
	          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
	          <span>分享到 Twitter</span>
	        </a>
	        <a href="${shareLinks.facebook}" target="_blank" rel="noopener noreferrer" class="dropdown-share-item" onclick="return window.open(this.href, 'facebook-share', 'width=626,height=436,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes')">
	          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
	          <span>分享到 Facebook</span>
	        </a>
	        <button onclick="window.AnalectsSDK.copyText('${escapedCopyText}', this)" class="dropdown-share-item">
	          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
	          <span>复制内容</span>
	        </button>
	        <a href="${shareLinks.email}" class="dropdown-share-item">
	          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
	          <span>邮件分享</span>
	        </a>
	      </div>
	    </div>
	  `;

    return `
	    <div class="analects-card-footer">
	      <div class="footer-actions">
          <div class="flex items-center gap-2"></div>
	        ${shareMenuHTML}
	      </div>
	    </div>
	  `;
  }

  // 渲染搜索界面
  renderSearchInterface(container) {
    if (!container) {
      console.error('未找到容器元素');
      return;
    }

    container.innerHTML = this.getSearchInterfaceHTML();
    this.initializeSearchEvents();
    this.loadSearchOptions();
    this.initializeScrollFeatures();
    this.isSearchInitialized = true;
  }

  // 获取搜索界面HTML
  getSearchInterfaceHTML() {
    return `
      <div class="analects-search">
        <div class="analects-search-header">
          <h2 class="analects-search-title">论语搜索</h2>
          <p class="analects-search-subtitle">Search in the Analects of Confucius</p>
        </div>

        <div class="analects-search-form">
          <div class="analects-keyword-section">
            <label class="analects-keyword-label" for="analects-keyword">🔍 关键词搜索</label>
            <input type="text" id="analects-keyword" class="analects-input" 
                   placeholder="输入关键词搜索论语原文、翻译或注释... 按回车或点击开始搜索">
            
            <div class="analects-selected-items" id="selected-items-container" style="display: none;">
              <h4>已选择的搜索条件</h4>
              <div class="analects-selected-tags" id="selected-tags-container">
                <div class="analects-selected-empty">暂无选择的搜索条件</div>
              </div>
            </div>
          </div>

          <div class="analects-advanced-filters">
            <h3 class="analects-advanced-title">高级搜索</h3>
            
            <div class="analects-filters-grid single-column">
              ${this.createSearchSection('chapter', '篇目')}
            </div>
            
            <div class="analects-filters-grid">
              ${this.createSearchSection('character', '人物')}
              ${this.createSearchSection('argument', '主题')}
            </div>

            <div class="analects-filters-grid">
              ${this.createSearchSection('proverb', '成语', 'full-width')}
            </div>
          </div>

          <div class="analects-search-actions">
            <button id="analects-search-btn" class="analects-btn">🔍 开始搜索</button>
            <button id="analects-reset-btn" class="analects-btn analects-btn-clear">🔄 重置搜索</button>
          </div>
        </div>
        
        <div id="analects-search-status" class="analects-search-status"></div>

        <div class="analects-results">
          <div id="analects-results-container" class="analects-results-container"></div>
          <div id="analects-loading-more" style="display:none; text-align:center; margin:10px; color:#666;">
            加载中...
          </div>
          <div id="analects-load-complete" class="analects-load-complete" style="display:none;">
            <span class="analects-load-complete-text">—— ✨ 已全部显示完毕 ✨ ——</span>
          </div>
        </div>

        <div id="scroll-to-top" class="analects-scroll-indicator">↑</div>
      </div>
    `;
  }

  // [最终修复版] 创建搜索区域HTML 
  createSearchSection(type, title, className = '') {
    // [核心] 定义统一的SVG图标映射，不再需要外部JS库
    const icons = {
      chapter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      character: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      argument: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      proverb: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    };

    const wrapperStyle = className === 'full-width' ? 'style="grid-column: 1 / -1;"' : '';

    return `
    <div class="analects-filter-section" ${wrapperStyle}>
      <div class="analects-filter-header">
        <h4 class="analects-filter-title">
          ${icons[type] || ''}
          <span>${title}</span>
        </h4>
        <span class="analects-filter-count" id="${type}-count">0</span>
      </div>
      <div class="analects-filter-search">
        <input type="text" id="${type}-search" placeholder="搜索${title.replace('搜索', '')}...">
      </div>
      <div id="${type}-filters" class="analects-filter-options">
        <div class="analects-loading">加载中...</div>
      </div>
    </div>
  `;
  }

  // [优化版] 渲染每日论语组件
  async renderDailyAnalect(container) {
    if (!container) {
      console.error('未找到容器元素');
      return;
    }
    container.innerHTML = `<div class="daily-analect-skeleton"><div class="skeleton-block" style="height: 30px; width: 40%; margin: 0 auto 16px;"></div><div class="skeleton-block" style="height: 20px; width: 60%; margin: 0 auto 48px;"></div><div class="skeleton-block" style="height: 80px; width: 100%; margin-bottom: 24px;"></div><div class="skeleton-block" style="height: 50px; width: 80%; margin: 0 auto;"></div></div>`;

    try {
      const entry = await this.getDailyAnalect();

      if (entry) {
        const dateInfo = this.formatDate();
        const shareLinks = this.generateShareLinks(entry);
        container.innerHTML = this.getDailyAnalectHTML(entry, dateInfo, shareLinks);
      } else {
        container.innerHTML = '<div class="analects-daily-empty">今日无语。</div>';
      }
    } catch (error) {
      console.error('渲染每日论语失败:', error);
      container.innerHTML = '<div class="analects-daily-error">加载每日论语失败，请检查配置</div>';
    }
  }

  // [修正版] 获取每日论语HTML
  getDailyAnalectHTML(entry, dateInfo, shareLinks) {
    // [核心修改] 在精简版中，isFavorited永远为false
    const isFavorited = false;
    // [核心修正] 收藏按钮的HTML被彻底移除
    // const favoriteButtonHTML = `...`;

    return `
      <div class="analects-daily">
        <div class="analects-daily-header">
          <h2 class="analects-daily-title">每日论语</h2>
          <p class="analects-daily-subtitle">Daily Analects of Confucius</p>
          <div class="analects-daily-date">${dateInfo.full} · ${dateInfo.weekday}</div>
        </div>

        <div class="analects-daily-card">
          <div class="analects-daily-original">${entry.original_text}</div>
          ${entry.translation ? `<div class="analects-daily-translation">${entry.translation}</div>` : ''}
          
          <div class="analects-daily-reference-wrapper">
            <div class="analects-daily-reference">${entry.chapter} · 第${entry.section_number || ''}节</div>
            </div>
          
        </div>

        <div class="analects-daily-share">
          <span class="analects-daily-share-label">分享：</span>
          <div class="analects-share-buttons">
            ${this.createShareButton('twitter', shareLinks.twitter, '分享到 Twitter')}
            ${this.createShareButton('facebook', shareLinks.facebook, '分享到 Facebook', true)}
            ${this.createShareButton('copy', null, '复制分享内容', false, shareLinks.copy)}
            ${this.createShareButton('email', shareLinks.email, '通过邮件分享')}
          </div>
        </div>
      </div>
    `;
  }

  // 创建分享按钮
  createShareButton(type, href, title, popup = false, copyText = null) {
    const icons = {
      twitter: '<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>',
      facebook: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
      copy: '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>',
      email: '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>'
    };

    if (type === 'copy') {
      return `
        <button class="analects-share-btn copy" 
                onclick="window.AnalectsSDK.copyText('${copyText.replace(/'/g, "\\'")}', this)"
                title="${title}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${icons[type]}</svg>
        </button>
      `;
    }

    const popupHandler = popup ? `onclick="return window.open(this.href, '${type}-share', 'width=626,height=436,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes')"` : '';

    return `
      <a href="${href}" class="analects-share-btn ${type}" target="_blank" rel="noopener noreferrer" 
         ${popupHandler} title="${title}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${icons[type]}</svg>
      </a>
    `;
  }

  // [最终治本版] 初始化搜索事件 (统一了触发入口)
  initializeSearchEvents() {
    if (this.searchEventsInitialized) {
      return;
    }

    const eventMap = {
      'analects-search-btn': () => this.performSearch(),
      'analects-reset-btn': () => this.resetSearch()
    };

    Object.entries(eventMap).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) element.addEventListener('click', handler);
    });

    const keywordInput = document.getElementById('analects-keyword');
    if (keywordInput) {
      keywordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          // [核心修正] 不再直接调用搜索，而是触发按钮的点击事件
          // 这样可以确保所有搜索都通过同一个入口，避免事件冲突
          document.getElementById('analects-search-btn')?.click();
        }
      });

      keywordInput.addEventListener('input', () => {
        this.markSearchConditionsChanged();
      });
    }

    ['character', 'argument', 'proverb', 'chapter'].forEach(type => {
      const searchInput = document.getElementById(`${type}-search`);
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filterOptions(type, e.target.value);
        });
      }
    });

    this.searchEventsInitialized = true;
  }

  // 标记搜索条件已改变
  markSearchConditionsChanged() {
    this.searchConditionsChanged = true;
    const searchBtn = document.getElementById('analects-search-btn');
    if (searchBtn && this.searchConditionsChanged) {
      searchBtn.classList.add('search-changed');
    }
  }

  // 初始化滚动功能
  initializeScrollFeatures() {
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      window.addEventListener('scroll', () => {
        scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
      });
    }

    this.setupAutoLoad();
  }

  // 设置自动加载功能
  setupAutoLoad() {
    // 如果之前存在监听器，先从 window 移除
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }

    this.scrollListener = () => {
      // 检查是否应该加载
      if (!this.isAutoLoadingEnabled ||
        this.pagination.isLoading ||
        !this.pagination.hasMore ||
        this.pagination.totalLoaded === 0) {
        return;
      }

      // 获取结果容器元素
      const resultsContainer = document.getElementById('analects-results-container');
      if (!resultsContainer) {
        return; // 如果容器不存在，则不执行任何操作
      }

      // 关键修改：检查 resultsContainer 元素的位置
      const rect = resultsContainer.getBoundingClientRect();

      // 当结果容器的底部进入视口，并且距离视口底部小于等于 200px 时，加载更多
      // rect.bottom 是容器底部相对于视口顶部的距离
      // window.innerHeight 是视口的高度
      if (rect.bottom <= window.innerHeight + 200) {
        this.loadMoreResults();
      }
    };

    // 监听器仍然绑定在 window 对象上
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  // 加载搜索选项
  async loadSearchOptions() {
    try {
      const statusDiv = document.getElementById('analects-search-status');
      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-info">📄 加载搜索选项...</div>';
      }

      const [characters, argumentsList, proverbs, chapters] = await Promise.all([
        this.getCharacters(),
        this.getArguments(),
        this.getProverbs(),
        this.getChapters()
      ]);

      const searchData = { character: characters, argument: argumentsList, proverb: proverbs, chapter: chapters };

      Object.entries(searchData).forEach(([type, data]) => {
        this.updateSearchCount(type, data.length);
        this.renderSearchOptions(`${type}-filters`, data, type);
      });

      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-success">✅ 搜索选项加载完成</div>';
        setTimeout(() => statusDiv.innerHTML = '', 2000);
      }
    } catch (error) {
      console.error('加载搜索选项失败:', error);
      this.showSearchLoadError(error);
    }
  }

  // 显示搜索加载错误
  showSearchLoadError(error) {
    const statusDiv = document.getElementById('analects-search-status');
    if (statusDiv) {
      statusDiv.innerHTML = '<div class="analects-error">❌ 加载搜索选项失败，请检查配置</div>';
    }

    ['character', 'argument', 'proverb', 'chapter'].forEach(type => {
      const container = document.getElementById(`${type}-filters`);
      if (container) {
        container.innerHTML = '<div class="analects-no-options">数据加载失败</div>';
      }
    });
  }

  // 更新搜索计数
  updateSearchCount(type, count) {
    const countElement = document.getElementById(`${type}-count`);
    if (countElement) {
      countElement.textContent = count;
    }
  }

  // 渲染搜索选项
  renderSearchOptions(containerId, options, type) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(options)) {
      console.error('渲染搜索选项失败:', { containerId, options, type });
      if (container) {
        container.innerHTML = '<div class="analects-no-options">数据格式错误</div>';
      }
      return;
    }

    if (options.length === 0) {
      container.innerHTML = '<div class="analects-no-options">暂无选项</div>';
      return;
    }

    const tagCloud = document.createElement('div');
    tagCloud.className = 'analects-tag-cloud';
    tagCloud.setAttribute('data-type', type);

    // 为篇目添加"全部"选项
    if (type === 'chapter') {
      const allTag = this.createOptionTag('all', '全部篇目', type, true);
      tagCloud.appendChild(allTag);
      this.selectedItems.chapter = { id: 'all', name: '全部篇目' };
    }

    options.forEach(option => {
      if (!option || (!option.id && option.id !== 0)) {
        console.warn('选项缺少id:', option);
        return;
      }

      const displayName = option.name || option.title || option.content || `选项${option.id}`;
      const tag = this.createOptionTag(option.id, displayName, type, false);
      tagCloud.appendChild(tag);
    });

    container.innerHTML = '';
    container.appendChild(tagCloud);
  }

  // 创建选项标签
  createOptionTag(id, displayName, type, isSelected = false) {
    const tag = document.createElement('label');
    tag.className = `analects-option-tag ${isSelected ? 'selected' : ''}`;
    tag.setAttribute('data-id', id);
    tag.setAttribute('data-name', displayName.toLowerCase());

    tag.innerHTML = `
      <input type="checkbox" value="${id}" data-type="${type}" ${isSelected ? 'checked' : ''}>
      <span>${displayName}</span>
    `;

    tag.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleOptionClick(tag, type, id, displayName);
    });

    return tag;
  }

  // 处理选项点击
  handleOptionClick(tag, type, id, displayName) {
    const checkbox = tag.querySelector('input[type="checkbox"]');
    const tagCloud = tag.closest('.analects-tag-cloud');

    if (type === 'chapter') {
      // 篇目单选逻辑
      tagCloud.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.analects-option-tag').classList.remove('selected');
      });

      checkbox.checked = true;
      tag.classList.add('selected');
      this.selectedItems.chapter = { id, name: displayName };
    } else {
      // 其他类型多选逻辑
      const wasChecked = checkbox.checked;
      checkbox.checked = !wasChecked;
      tag.classList.toggle('selected', checkbox.checked);

      if (checkbox.checked) {
        this.addSelectedItem(type, id, displayName);
      } else {
        this.removeSelectedItem(type, id);
      }
    }

    this.markSearchConditionsChanged();
    this.renderSelectedItems();
  }

  // 选中项目管理方法
  addSelectedItem(type, id, name) {
    const key = type + 's';
    this.selectedItems[key].set(parseInt(id), name);
  }

  removeSelectedItem(type, id) {
    const key = type + 's';
    this.selectedItems[key].delete(parseInt(id));
  }

  // 渲染已选择的项目
  renderSelectedItems() {
    const selectedContainer = document.getElementById('selected-items-container');
    const tagsContainer = document.getElementById('selected-tags-container');

    if (!selectedContainer || !tagsContainer) return;

    const totalSelected = this.selectedItems.characters.size +
      this.selectedItems.arguments.size +
      this.selectedItems.proverbs.size +
      (this.selectedItems.chapter && this.selectedItems.chapter.id !== 'all' ? 1 : 0);

    if (totalSelected === 0) {
      selectedContainer.style.display = 'none';
      return;
    }

    selectedContainer.style.display = 'block';
    tagsContainer.innerHTML = '';

    // 渲染篇目标签（仅当不是"全部"时）
    if (this.selectedItems.chapter && this.selectedItems.chapter.id !== 'all') {
      const tag = this.createSelectedTag('chapter', this.selectedItems.chapter.id, this.selectedItems.chapter.name);
      tagsContainer.appendChild(tag);
    }

    // 渲染其他类型的标签
    ['characters', 'arguments', 'proverbs'].forEach(type => {
      this.selectedItems[type].forEach((name, id) => {
        const tag = this.createSelectedTag(type.slice(0, -1), id, name);
        tagsContainer.appendChild(tag);
      });
    });
  }

  // 创建已选择的标签
  createSelectedTag(type, id, name) {
    const tag = document.createElement('div');
    tag.className = `analects-selected-tag ${type}`;
    tag.innerHTML = `
      <span>${name}</span>
      <span class="remove-tag" data-type="${type}" data-id="${id}">×</span>
    `;

    tag.querySelector('.remove-tag').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeSelectedItemById(type, id);
    });

    return tag;
  }

  // 通过ID移除选中项目
  removeSelectedItemById(type, id) {
    if (type === 'chapter') {
      this.selectedItems.chapter = { id: 'all', name: '全部篇目' };

      const allCheckbox = document.querySelector('input[data-type="chapter"][value="all"]');
      const currentCheckbox = document.querySelector(`input[data-type="chapter"][value="${id}"]`);

      if (allCheckbox) {
        allCheckbox.checked = true;
        allCheckbox.closest('.analects-option-tag').classList.add('selected');
      }

      if (currentCheckbox) {
        currentCheckbox.checked = false;
        currentCheckbox.closest('.analects-option-tag').classList.remove('selected');
      }
    } else {
      this.removeSelectedItem(type, id);

      const checkbox = document.querySelector(`input[data-type="${type}"][value="${id}"]`);
      if (checkbox) {
        checkbox.checked = false;
        const tag = checkbox.closest('.analects-option-tag');
        if (tag) {
          tag.classList.remove('selected');
        }
      }
    }

    this.markSearchConditionsChanged();
    this.renderSelectedItems();
  }

  // 过滤选项
  filterOptions(type, searchTerm) {
    const container = document.getElementById(`${type}-filters`);
    if (!container) return;

    const tags = container.querySelectorAll('.analects-option-tag');
    const term = searchTerm.toLowerCase().trim();

    let visibleCount = 0;
    tags.forEach(tag => {
      const name = tag.getAttribute('data-name');
      const shouldShow = !term || name.includes(term);

      tag.style.display = shouldShow ? 'inline-flex' : 'none';
      if (shouldShow) visibleCount++;
    });

    const countElement = document.getElementById(`${type}-count`);
    if (countElement) {
      const totalCount = tags.length;
      countElement.textContent = term ? `${visibleCount}/${totalCount}` : totalCount;
    }
  }

  // [最终治本版] 执行搜索 (使用任务ID彻底解决竞态问题)
  async performSearch() {
    if (!this.isSearchInitialized) return;

    if (this.pagination.isLoading) {
      return;
    }

    // [核心修正1] 为这次搜索生成一个唯一的ID
    const searchId = ++this.latestSearchId;

    const keyword = document.getElementById('analects-keyword')?.value;
    const resultsContainer = document.getElementById('analects-results-container');
    const statusDiv = document.getElementById('analects-search-status');
    const loadCompleteDiv = document.getElementById('analects-load-complete');
    const loadingMoreDiv = document.getElementById('analects-loading-more');

    if (!resultsContainer) return;

    this.pagination.isLoading = true;

    const selectedCharacters = Array.from(this.selectedItems.characters.keys());
    const selectedArguments = Array.from(this.selectedItems.arguments.keys());
    const selectedProverbs = Array.from(this.selectedItems.proverbs.keys());
    const selectedChapter = this.selectedItems.chapter?.id === 'all' ? 'all' : this.selectedItems.chapter?.id || 'all';

    this.currentFilters = {
      keyword: keyword?.trim(),
      characterIds: selectedCharacters,
      argumentIds: selectedArguments,
      proverbIds: selectedProverbs,
      chapter: selectedChapter
    };

    this.resetPagination();
    this.searchConditionsChanged = false;
    this.isAutoLoadingEnabled = false;

    const searchBtn = document.getElementById('analects-search-btn');
    if (searchBtn) {
      searchBtn.classList.remove('search-changed');
    }

    if (loadCompleteDiv) loadCompleteDiv.style.display = 'none';
    if (loadingMoreDiv) loadingMoreDiv.style.display = 'none';
    if (statusDiv) statusDiv.innerHTML = '';

    // 定义可复用的骨架屏卡片HTML
    const skeletonCardHTML = `
      <div class="favorite-card-skeleton">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div class="skeleton-block" style="height: 20px; width: 30%;"></div>
          <div class="skeleton-block" style="height: 24px; width: 24px; border-radius: 50%;"></div>
        </div>
        <div class="skeleton-block" style="height: 18px; width: 90%; margin-bottom: 12px;"></div>
        <div class="skeleton-block" style="height: 18px; width: 70%;"></div>
      </div>
    `;
    // 将加载状态替换为1个骨架屏卡片
    resultsContainer.innerHTML = Array(1).fill(skeletonCardHTML).join('');

    try {
      const result = await this.fetchAnalects(this.currentFilters, 0, this.pagination.pageSize);

      // [核心修正2] 只有当这次搜索任务还是最新的，才去处理它的结果
      if (searchId === this.latestSearchId) {
        this.isAutoLoadingEnabled = true;
        this.handleFirstSearchResult(result, statusDiv, resultsContainer);
      }
    } catch (error) {
      // [核心修正3] 同样，只处理最新任务的错误
      if (searchId === this.latestSearchId) {
        console.error('搜索失败:', error);
        this.handleSearchError(error, statusDiv, resultsContainer);
      }
    } finally {
      // [核心修正4] 只为最新任务解锁
      if (searchId === this.latestSearchId) {
        this.pagination.isLoading = false;
      }
    }
  }

  // [最终优化版] 处理首次搜索结果，并在开头清空骨架屏
  async handleFirstSearchResult(result, statusDiv, resultsContainer) {
    // [核心修正] 在渲染真实数据前，先清空容器内的所有内容（即骨架屏）
    resultsContainer.innerHTML = '';

    if (result.data.length === 0) {
      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-warning">⚠️ 未找到匹配的章节</div>';
      }
      this.isAutoLoadingEnabled = false;
      return;
    }

    // [核心修改] 在精简版中，不需要注入收藏信息
    const hydratedResults = result.data;

    const uniqueResults = hydratedResults.filter(entry => {
      if (!entry.id || this.pagination.loadedIds.has(entry.id)) {
        return false;
      }
      this.pagination.loadedIds.add(entry.id);
      return true;
    });

    this.pagination.currentPage = 1;
    this.pagination.totalLoaded = uniqueResults.length;
    // [核心修正4] 直接使用从 fetchAnalects 传递过来的、最准确的 hasMore 结果
    this.pagination.hasMore = result.hasMore;

    if (statusDiv) {
      const totalCount = this.pagination.totalCount > 0 ? this.pagination.totalCount : uniqueResults.length;

      if (this.pagination.hasMore) {
        statusDiv.innerHTML = `<div class="analects-success">✅ 找到 ${totalCount} 条结果，每次加载 ${this.pagination.pageSize} 条，滚动自动加载更多</div>`;
      } else {
        statusDiv.innerHTML = `<div class="analects-success">✅ 已找到全部 ${totalCount} 条结果</div>`;
        const loadCompleteDiv = document.getElementById('analects-load-complete');
        if (loadCompleteDiv) {
          loadCompleteDiv.style.display = 'block';
        }
      }
    }

    uniqueResults.forEach((entry, index) => {
      setTimeout(() => {
        this.renderAnalectCard(entry, resultsContainer);
      }, index * 50);
    });
  }

  // 重置分页参数
  resetPagination() {
    Object.assign(this.pagination, {
      currentPage: 0,
      totalLoaded: 0,
      hasMore: true,
      isLoading: false,
      totalCount: 0
    });
    this.pagination.loadedIds.clear();
  }

  // 处理搜索错误
  handleSearchError(error, statusDiv, resultsContainer) {
    if (statusDiv) {
      statusDiv.innerHTML = `<div class="analects-error">❌ 搜索失败：${error.message}</div>`;
    }
    resultsContainer.innerHTML = `
      <div class="analects-error">
        <h3>搜索失败</h3>
        <p>${error.message}</p>
        <p style="font-size: 14px; color: #666; margin-top: 12px;">
          请检查Supabase配置是否正确，或查看控制台了解详细错误信息。
        </p>
      </div>
    `;
    this.isAutoLoadingEnabled = false;
  }

  // [最终治本版] 滚动加载更多 (使用任务ID)
  async loadMoreResults() {
    if (this.pagination.isLoading || !this.pagination.hasMore || !this.isAutoLoadingEnabled) {
      return;
    }

    // [核心修正1] 获取发起加载时的搜索ID
    const searchId = this.latestSearchId;

    this.pagination.isLoading = true;

    const loadingMoreDiv = document.getElementById('analects-loading-more');
    if (loadingMoreDiv) loadingMoreDiv.style.display = 'block';

    try {
      const result = await this.fetchAnalects(
        this.currentFilters,
        this.pagination.currentPage,
        this.pagination.pageSize
      );

      // [核心修正2] 只有当搜索ID未发生变化时，才追加结果
      if (searchId === this.latestSearchId) {
        // [核心修改] 精简版无需注入收藏信息
        const hydratedResults = result.data;

        const uniqueResults = hydratedResults.filter(entry => {
          if (!entry.id || this.pagination.loadedIds.has(entry.id)) {
            return false;
          }
          this.pagination.loadedIds.add(entry.id);
          return true;
        });

        const resultsContainer = document.getElementById('analects-results-container');
        uniqueResults.forEach((entry, index) => {
          setTimeout(() => {
            this.renderAnalectCard(entry, resultsContainer);
          }, index * 50);
        });

        this.pagination.currentPage++;
        this.pagination.totalLoaded += uniqueResults.length;
        this.pagination.hasMore = this.pagination.totalLoaded < this.pagination.totalCount;

        this.updateScrollStatus();
      }
    } catch (error) {
      console.error('加载更多结果失败:', error);
      const statusDiv = document.getElementById('analects-search-status');
      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-error">❌ 加载更多结果失败，请稍后重试</div>';
      }
    } finally {
      // [核心修正3] 同样，只有当ID匹配时才解锁
      if (searchId === this.latestSearchId) {
        this.pagination.isLoading = false;
      }
      if (loadingMoreDiv) loadingMoreDiv.style.display = 'none';
    }
  }

  // 滚动加载时的状态更新
  updateScrollStatus() {
    const statusDiv = document.getElementById('analects-search-status');
    const loadCompleteDiv = document.getElementById('analects-load-complete');

    if (!statusDiv || this.pagination.totalLoaded === 0) return;

    const displayedCount = this.pagination.totalLoaded;
    const totalCount = this.pagination.totalCount;

    if (this.pagination.hasMore) {
      statusDiv.innerHTML = `
        <div class="analects-success">
          ✅ 找到 ${totalCount} 条结果，已显示 ${displayedCount} 条，滚动自动加载更多
        </div>`;
    } else {
      statusDiv.innerHTML = `
        <div class="analects-success">
          ✅ 共找到 ${totalCount} 条结果，已全部显示完毕
        </div>`;
      this.isAutoLoadingEnabled = false;
      if (loadCompleteDiv) {
        loadCompleteDiv.style.display = 'block';
      }
    }
  }

  // 重置所有搜索内容
  resetSearch() {
    // 清空关键词
    const keywordInput = document.getElementById('analects-keyword');
    if (keywordInput) keywordInput.value = '';

    // 清空搜索框
    ['character-search', 'argument-search', 'proverb-search', 'chapter-search'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.value = '';
        this.filterOptions(id.split('-')[0], '');
      }
    });

    // 取消所有选中状态
    const checkboxes = document.querySelectorAll('.analects-tag-cloud input[type="checkbox"]');
    const tags = document.querySelectorAll('.analects-option-tag');

    checkboxes.forEach(cb => cb.checked = false);
    tags.forEach(tag => tag.classList.remove('selected'));

    // 篇目重置为"全部"
    const allCheckbox = document.querySelector('input[data-type="chapter"][value="all"]');
    if (allCheckbox) {
      allCheckbox.checked = true;
      allCheckbox.closest('.analects-option-tag').classList.add('selected');
    }

    // 清空内部选中项目存储
    this.selectedItems.characters.clear();
    this.selectedItems.arguments.clear();
    this.selectedItems.proverbs.clear();
    this.selectedItems.chapter = { id: 'all', name: '全部篇目' };

    // 清空结果
    const resultsContainer = document.getElementById('analects-results-container');
    const loadCompleteDiv = document.getElementById('analects-load-complete');

    if (resultsContainer) resultsContainer.innerHTML = '';
    if (loadCompleteDiv) loadCompleteDiv.style.display = 'none';

    // 重置分页和状态
    this.resetPagination();
    this.isAutoLoadingEnabled = false;
    this.searchConditionsChanged = false;

    // 清除搜索按钮的视觉提示
    const searchBtn = document.getElementById('analects-search-btn');
    if (searchBtn) {
      searchBtn.classList.remove('search-changed');
    }

    // 更新渲染
    this.renderSelectedItems();
    this.showStatusMessage('🔄 已重置所有搜索条件', 'success');
  }

  // 显示状态消息
  showStatusMessage(message, type = 'info', duration = 2000) {
    const statusDiv = document.getElementById('analects-search-status');
    if (statusDiv) {
      const className = type === 'success' ? 'analects-success' :
        type === 'error' ? 'analects-error' : 'analects-info';
      statusDiv.innerHTML = `<div class="${className}">${message}</div>`;
      if (duration > 0) {
        setTimeout(() => statusDiv.innerHTML = '', duration);
      }
    }
  }

  // [新增] 一个更可靠的、确保 Lucide 图标被渲染的函数
  _ensureIconsRendered() {
    // 立即尝试第一次
    if (window.lucide) {
      window.lucide.createIcons();
      return; // 成功渲染，任务结束
    }

    // 如果 lucide 还没准备好，启动一个“轮询器”来等待它
    let attempts = 0;
    const maxAttempts = 20; // 最多尝试20次 (2秒)

    const interval = setInterval(() => {
      attempts++;
      if (window.lucide) {
        // 成功等到，立即渲染并停止轮询
        window.lucide.createIcons();
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        // 超过2秒还未加载成功，判定为失败并停止
        console.error('Lucide.js failed to load after 2 seconds.');
        clearInterval(interval);
      }
    }, 100); // 每100毫秒检查一次
  }

  // 测试连接方法
  async testConnection() {
    try {
      const data = await this.apiRequest('characters', { limit: '1' });
      return {
        success: true,
        message: '连接测试成功',
        sampleData: data
      };
    } catch (error) {
      console.error('连接测试失败:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }
}