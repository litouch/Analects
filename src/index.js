// 引入样式文件
// 1. 在文件顶部引入 Supabase 的 createClient 方法
import { createClient } from '@supabase/supabase-js';
import './styles/analects.css';
import './styles/fonts.css';

// 论语 SDK - 优化清理版
class AnalectsSDK {
  constructor(config = {}) {
    this.supabaseUrl = config.supabaseUrl || 'https://your-project.supabase.co';
    this.supabaseKey = config.supabaseKey || 'your-anon-key';
    // 2. [新增] 初始化 Supabase 客户端，并将其作为类的属性
    //    这样我们就可以在 SDK 的任何地方调用 this.supabase 了
    //this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
	this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
	  auth: {
	    persistSession: true,
	    storage: window.localStorage,
	    autoRefreshToken: true
	  }
	});

    this.apiBaseUrl = `${this.supabaseUrl}/rest/v1`;
    this.headers = {
      'apikey': this.supabaseKey,
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // 3. [新增] 增加一个属性来存储当前用户信息
    this.currentUser = null;
	this.favoriteIds = new Set(); // [新增] 用于存储用户已收藏条目的ID
	this.entryCache = new Map();
	this.favoritesDataCache = new Map();
	
    // [核心新增] 添加一个标志，用于跟踪初始会话是否已加载
    this.sessionInitialized = false; 
    
    // 缓存数据
    this.cache = {
      characters: null,
      arguments: null,
      proverbs: null,
      chapters: null
    };

    // 选中项目管理
    this.selectedItems = {
      characters: new Map(),
      arguments: new Map(),
      proverbs: new Map(),
      chapter: { id: 'all', name: '全部章节' }
    };

    // 分页参数
    this.pagination = {
      pageSize: 10,
      currentPage: 0,
      totalLoaded: 0,
      isLoading: false,
      hasMore: true,
      totalCount: 0,
      loadedIds: new Set()
    };

    // 搜索状态管理
    this.currentFilters = {};
    this.isSearchInitialized = false;
    this.scrollListener = null;
    this.isAutoLoadingEnabled = false;
    this.searchConditionsChanged = false;
    // 在构造函数中提前绑定事件处理函数的 this，确保其上下文正确
    this._handleGlobalClick = this._handleGlobalClick.bind(this);
	this._handleNoteFormSubmit = this._handleNoteFormSubmit.bind(this);
	this._handleGlobalKeyPress = this._handleGlobalKeyPress.bind(this);
  }
  
  // [新增] 公开的、异步的初始化方法
  async init() {
    await this._initializeSession();
    this._initializeGlobalEventListeners(); // 将事件监听器的启动也放在这里
  }
  
  // [最终修复版] 采用主动、完整的状态同步流程
  async _initializeSession() {
    
      // 步骤 1: 页面首次加载时，完整地获取并应用初始状态
      const { data: { session: initialSession } } = await this.supabase.auth.getSession();
      // [核心新增] 无论登录与否，只要首次检查完成，就更新标志
      this.sessionInitialized = true; 
      if (initialSession) {
          this.currentUser = initialSession.user;
          this.headers.Authorization = `Bearer ${initialSession.access_token}`;
          await this._loadUserFavorites(); // 加载收藏数据
      } else {
          this.currentUser = null;
          this.headers.Authorization = `Bearer ${this.supabaseKey}`;
      }

      // 步骤 2: 监听真正的“认证事件”（用户主动登录、登出）
      // 这个监听器现在只处理最核心的认证变化
      this.supabase.auth.onAuthStateChange(async (event, session) => {
          // [关键修复] 增加处理“刚刚登录成功”的逻辑，用于关闭弹窗
          const justLoggedIn = sessionStorage.getItem('justLoggedIn');
          if (session && justLoggedIn && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
			
              // [核心新增] 清理 URL 中的认证令牌，提升安全性和用户体验
              if (window.location.hash.includes('access_token')) {
                history.replaceState(null, '', window.location.pathname);
              }
			
            this.closeAuthModal(); // 关闭登录/注册弹窗
            if (window.showToast) {
              window.showToast('登录成功，欢迎回来！');
            }
            sessionStorage.removeItem('justLoggedIn'); // 用完后立即移除标志
	        // --- [核心功能新增] ---
	        // 登录成功后，检查当前页面路径
	        const currentPage = window.location.pathname;
	        if (currentPage.includes('/my-favorites.html')) {
	          // 如果在收藏页，则重新渲染收藏列表
	          const container = document.getElementById('favorites-list-container');
	          if (container) {
	            // 先显示一个加载提示，提升体验
	            container.innerHTML = '<div class="text-center text-gray-500 py-8">正在加载您的收藏...</div>';
	            // 异步执行渲染函数
	            await this.renderMyFavoritesPage(container);
	          }
	        }
	        // --- [功能新增结束] ---
          }
          // 只有当登录状态发生根本性改变时（从无到有，或从有到无），才执行
          const isLoggedIn = !!session;
          const wasLoggedIn = !!this.currentUser;
          // [核心修正] 在这里添加了对 "INITIAL_SESSION" 事件的判断
          // 它的意思是：如果登录状态变了，或者这是页面加载后的第一次会话检查，就执行更新
          if (isLoggedIn !== wasLoggedIn || event === 'INITIAL_SESSION') {
              this.currentUser = session ? session.user : null;
              this.headers.Authorization = session ? `Bearer ${session.access_token}` : `Bearer ${this.supabaseKey}`;

              if (session) {
                  await this._loadUserFavorites();
              } else {
                  this.favoriteIds.clear();
				  this.favoritesDataCache.clear();
              }
              // 发生变化后，更新所有UI
			  this.renderGlobalHeader();
              this._updateFavoriteButtonsUI();
			  this._refreshVisibleCardsUI();
			  this.renderGlobalWidget(document.getElementById('analects-global-widget-container'));
          }
      });

      // 步骤 3: [核心修复] 窗口焦点事件，执行独立的、完整的状态同步
      window.addEventListener('focus', async () => {
          // 3.1 刷新 Supabase 客户端的认证状态
          const { data } = await this.supabase.auth.getSession();
      
          if (data.session) {
              await this.supabase.auth.setSession({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
              });

              // 3.2 [关键] 不再依赖其他事件，自己主动完成所有状态和UI的同步
              this.currentUser = data.session.user;   // 同步用户状态
			  this.headers.Authorization = `Bearer ${data.session.access_token}`; // <-- 确保headers也更新
              await this._loadUserFavorites();       // 同步收藏状态
              this._updateFavoriteButtonsUI();       // 刷新收藏按钮UI
			  this.renderGlobalWidget(document.getElementById('analects-global-widget-container'));
          }
      });

      // 步骤 4: 确保页面首次加载时，UI完全渲染正确
      this._updateFavoriteButtonsUI();
	  this.renderGlobalWidget(document.getElementById('analects-global-widget-container'));
  }


// [新增] 统一处理全局键盘事件 (例如 ESC 退出)
    _handleGlobalKeyPress(event) {
      if (event.key === 'Escape') {
        // 我们倒序检查，确保总是关闭最顶层的弹窗
        
        // 检查确认弹窗
        const confirmModal = document.getElementById('analects-confirm-modal');
        if (confirmModal) {
          // .querySelector() 只会找到第一个匹配的按钮
          confirmModal.querySelector('.confirm-modal-btn.cancel').click();
          return; // 处理完后立即退出，防止关闭多个
        }

        // 检查笔记编辑弹窗
        const noteModal = document.getElementById('analects-note-modal');
        if (noteModal) {
          this.closeNoteEditorModal();
          return;
        }

        // 检查登录/注册弹窗
        const authModal = document.getElementById('analects-auth-modal');
        if (authModal) {
          this.closeAuthModal();
          return;
        }
      }
    }

  // [最终版] 初始化全局事件监听器
    _initializeGlobalEventListeners() {
      // --- 鼠标点击事件 ---
      document.body.removeEventListener('click', this._handleGlobalClick);
      document.body.addEventListener('click', this._handleGlobalClick);

      // --- [新增] 键盘按下事件 ---
      // 同样，先在 document 上移除，以防重复绑定
      document.removeEventListener('keydown', this._handleGlobalKeyPress);
      // 绑定我们新创建的键盘处理函数
      document.addEventListener('keydown', this._handleGlobalKeyPress);
    }

	// [新增/修改] 独立的事件处理方法，现在包含了“编辑笔记”的逻辑
	_handleGlobalClick(event) {
	  // 处理收藏按钮的点击
	  const favoriteButton = event.target.closest('.favorite-btn');
	  if (favoriteButton) {
	    const entryId = parseInt(favoriteButton.dataset.entryId, 10);
	    if (!isNaN(entryId)) {
	      this.toggleFavorite(entryId, favoriteButton);
	    }
	    return; // 处理完后结束
	  }

	  // 处理编辑笔记按钮的点击
	  const editInsightButton = event.target.closest('.edit-insight-btn');
	  if (editInsightButton) {
	    const entryId = parseInt(editInsightButton.dataset.entryId, 10);

	    const card = editInsightButton.closest('.analects-result-card');
	    const insightTextEl = card ? card.querySelector('.insight-text') : null;
	    const currentInsight = insightTextEl ? insightTextEl.textContent : '';

	    if (!isNaN(entryId)) {
	      this.showNoteEditorModal(entryId, currentInsight);
	    }
	  }

	  // [新增] 处理笔记展开/收起按钮的点击
	  const insightToggleButton = event.target.closest('.insight-toggle-btn');
	  if (insightToggleButton) {
	    const insightText = insightToggleButton.previousElementSibling;
	    if (insightText && insightText.classList.contains('insight-text')) {
	      insightText.classList.toggle('is-truncated');
	      insightToggleButton.textContent = insightText.classList.contains('is-truncated') ? '展开阅读' : '收起';
	    }
	  }

	  // [核心修改] 处理点击页面其他地方关闭【顶部】和【底部】菜单的逻辑
	  const activeHeaderDropdown = document.querySelector('.user-dropdown-menu.active');
	  if (activeHeaderDropdown && !event.target.closest('.user-avatar-container')) {
	      activeHeaderDropdown.classList.remove('active');
	  }

	  const activeFooterMenu = document.querySelector('.app-footer-submenu.active');
	  if (activeFooterMenu && !event.target.closest('.app-footer-menu-container')) {
	      activeFooterMenu.classList.remove('active');
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
  
  // 章节排序
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


  // [升级版] 获取每日论语 (支持每日固定)
  async getDailyAnalect(deterministic = true) {
    try {
      const data = await this.apiRequest('analects_entries_expanded', {
        select: 'id,chapter,section_number,original_text,translation',
        'show_in_daily': 'eq.true'
      });

      if (!data || data.length === 0) return null;

      if (deterministic) {
        // --- 每日固定的新逻辑 ---
        const startDate = new Date('2024-01-01T00:00:00Z'); // 设置一个固定的起始日期
        const today = new Date();
        
        // 将今天的日期和开始日期都标准化到UTC时间的零点，以保证全球用户在同一“天”
        startDate.setUTCHours(0, 0, 0, 0);
        today.setUTCHours(0, 0, 0, 0);
        
        // 计算从起始日期到今天过去了多少天
        const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        
        // 使用取余运算，确保索引总是在有效范围内，并实现循环展示
        const entryIndex = dayIndex % data.length;
        
        return data[entryIndex];

      } else {
        // --- 保留原来的随机逻辑，以备不时之需 ---
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex];
      }
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

// [最终修正版] 渲染论语卡片
  renderAnalectCard(entry, container) {
    if (!container) {
      console.error('未找到容器元素');
      return;
    }
    
    // [修复点1] 确保卡片数据被存入缓存
    this.entryCache.set(entry.id, entry); 

    const card = document.createElement('div');
    card.className = 'analects-result-card';
    
    // [修复点2] 确保卡片HTML元素有一个 data-entry-id 属性
    card.setAttribute('data-entry-id', entry.id);
    
    card.innerHTML = this.generateResultCardHTML(entry);
    
    container.appendChild(card);
    
    setTimeout(() => card.classList.add('animate-in'), 10);
  }


  // [FINAL VERSION V6 - LOGIC REFINED] Decouples share/more actions from the favorite state
  generateResultCardHTML(entry) {
      if (!entry) return '';

      const currentKeyword = this.currentFilters?.keyword || '';
  
      const getRelatedData = (items, field) => 
        (items || []).map(item => item[field]?.name || item[field]?.title || item[field]?.content).filter(Boolean);
  
      const characters = getRelatedData(entry.entry_characters, 'characters');
      const argumentsList = getRelatedData(entry.entry_arguments, 'arguments');
      const proverbs = getRelatedData(entry.entry_proverbs, 'proverbs');

      const createTagGroup = (label, items, className) => 
        items.length > 0 ? `
          <div class="analects-result-tag-group">
            <span class="analects-result-tag-label">${label}:</span>
            ${items.map(item => `<span class="analects-result-tag ${className}">${this.escapeHtml(item)}</span>`).join('')}
          </div>
        ` : '';

      const highlightedOriginal = this.highlightKeywords(entry.original_text, currentKeyword);
      const highlightedTranslation = entry.translation ? this.highlightKeywords(entry.translation, currentKeyword) : '';
      const highlightedAnnotation = entry.annotation ? this.highlightKeywords(entry.annotation, currentKeyword) : '';

      const isFavorited = this.favoriteIds.has(entry.id);
  	const timeAgo = isFavorited && entry.favorited_at ? this.formatTimeAgo(entry.favorited_at) : '';
      const favoriteButtonHTML = `
        <button 
          class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
          data-entry-id="${entry.id}" 
          title="${isFavorited ? '取消收藏' : '收藏此条'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
          </svg>
        </button>
      `;
    
      // 笔记区域HTML的生成逻辑不变
      let noteHTML = '';
      if (isFavorited && entry.user_insight) {
          const lineCount = (entry.user_insight || '').split('\n').length;
          const characterCount = (entry.user_insight || '').length;
          const isLongInsight = lineCount > 4 || characterCount > 150;
          const insightText = this.escapeHtml(entry.user_insight);
          const noteTimestamp = this.formatTimeAgo(entry.insight_updated_at || entry.favorited_at);

          noteHTML = `
              <div class="user-insight-wrapper">
                <div class="user-insight-header">
                    <span class="insight-timestamp">${noteTimestamp}</span>
                </div>
                <div class="user-insight-content">
                    <p class="insight-text ${isLongInsight ? 'is-truncated' : ''}">${insightText}</p>
                    ${isLongInsight ? '<button class="insight-toggle-btn">展开阅读</button>' : ''}
                </div>
              </div>
          `;
      }

      // [核心逻辑优化]
      // 1. “笔记”按钮现在只在收藏后出现
      const editNoteButtonHTML = isFavorited ? `
        <button class="edit-insight-btn pill-style" data-entry-id="${entry.id}">
          <span>${entry.user_insight ? '编辑笔记' : '添加笔记'}</span>
        </button>
      ` : '<div></div>'; // 未收藏时，用一个空div占位，确保flex布局中“…”按钮能正确靠右

      // 2. “更多”按钮永远显示
      const moreOptionsButtonHTML = `
        <button class="more-options-btn" title="更多选项">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
      `;

      // 3. 组装始终显示的底部操作区
      const footerHTML = `
        <div class="analects-card-footer">
          <div class="footer-actions">
              ${editNoteButtonHTML}
              ${moreOptionsButtonHTML}
          </div>
          ${noteHTML}
        </div>
      `;


      return `
        <div class="analects-result-header">
          <div class="result-header-left">
            <span class="analects-result-chapter">${this.escapeHtml(entry.chapter || '')}</span>
            <span class="analects-result-section">第${this.escapeHtml(entry.section_number || '')}节</span>
          </div>
          <div class="result-header-right">
            ${timeAgo ? `<span class="favorite-time-ago">${timeAgo}</span>` : ''}
            ${favoriteButtonHTML}
          </div>
        </div>
    
        <div class="analects-result-content">
          <div class="analects-result-original">${highlightedOriginal}</div>
          ${highlightedTranslation ? `<div class="analects-result-translation">${highlightedTranslation}</div>` : ''}
          ${highlightedAnnotation ? `<div class="analects-result-annotation">${highlightedAnnotation}</div>` : ''}
        </div>

        <div class="analects-result-tags">
          ${createTagGroup('人物', characters, 'character')}
          ${createTagGroup('论点', argumentsList, 'argument')}
          ${createTagGroup('谚语', proverbs, 'proverb')}
        </div>

        ${footerHTML}
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
              ${this.createSearchSection('chapter', '章节')}
            </div>
            
            <div class="analects-filters-grid">
              ${this.createSearchSection('character', '人物')}
              ${this.createSearchSection('argument', '论点')}
            </div>

            <div class="analects-filters-grid">
              ${this.createSearchSection('proverb', '谚语', 'full-width')}
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
          <div id="analects-load-complete" style="display:none; text-align:center; margin:20px; color:#888;">
            —— ✨ 已全部显示完毕 ✨ ——
          </div>
        </div>

        <div id="scroll-to-top" class="analects-scroll-indicator">↑</div>
      </div>
    `;
  }

  // 创建搜索区域HTML
  createSearchSection(type, title, className = '') {
    const types = {
      chapter: 'chapters',
      character: 'characters', 
      argument: 'arguments',
      proverb: 'proverbs'
    };
    
    // [核心修正] 仅在需要时（如“谚语”部分）添加内联样式以撑满整行
    const wrapperStyle = className === 'full-width' ? 'style="grid-column: 1 / -1;"' : '';

    // [核心修正] 移除了外层的div，现在函数只返回一个带样式的区块
    return `
      <div class="analects-filter-section" ${wrapperStyle}>
        <div class="analects-filter-header">
          <h4 class="analects-filter-title ${types[type]}">${title}</h4>
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

  // 渲染每日论语组件
  renderDailyAnalect(container) {
    if (!container) {
      console.error('未找到容器元素');
      return;
    }

    // [核心修改] 删除了JS动态生成骨架屏的代码块
  
    this.getDailyAnalect().then(entry => {
      if (!entry) {
        container.innerHTML = '<div class="analects-daily-empty">暂无每日论语</div>';
        return;
      }

      const dateInfo = this.formatDate();
      const shareLinks = this.generateShareLinks(entry);

      // 直接用真实数据替换掉HTML中的骨架屏
      container.innerHTML = this.getDailyAnalectHTML(entry, dateInfo, shareLinks);
    }).catch(error => {
      console.error('渲染每日论语失败:', error);
      container.innerHTML = '<div class="analects-daily-error">加载每日论语失败，请检查配置</div>';
    });
  }


  // [修正版] 获取每日论语HTML
  getDailyAnalectHTML(entry, dateInfo, shareLinks) {
    // [新增] 收藏按钮的核心逻辑
    const isFavorited = this.favoriteIds.has(entry.id);
    const favoriteButtonHTML = `
      <button 
        class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
        data-entry-id="${entry.id}" 
        title="${isFavorited ? '取消收藏' : '收藏此条'}">
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
	</svg>
      </button>
    `;

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
            ${favoriteButtonHTML}
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

  // 初始化搜索事件
  initializeSearchEvents() {
    const eventMap = {
      'analects-search-btn': () => this.performSearch(),
      'analects-reset-btn': () => this.resetSearch()
    };

    Object.entries(eventMap).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) element.addEventListener('click', handler);
    });

    // 回车键搜索
    const keywordInput = document.getElementById('analects-keyword');
    if (keywordInput) {
      keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.performSearch();
      });
      
      keywordInput.addEventListener('input', () => {
        this.markSearchConditionsChanged();
      });
    }

    // 实时搜索过滤器
    ['character', 'argument', 'proverb', 'chapter'].forEach(type => {
      const searchInput = document.getElementById(`${type}-search`);
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filterOptions(type, e.target.value);
        });
      }
    });
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

    // 为章节添加"全部"选项
    if (type === 'chapter') {
      const allTag = this.createOptionTag('all', '全部章节', type, true);
      tagCloud.appendChild(allTag);
      this.selectedItems.chapter = { id: 'all', name: '全部章节' };
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
      // 章节单选逻辑
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

    // 渲染章节标签（仅当不是"全部"时）
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
      this.selectedItems.chapter = { id: 'all', name: '全部章节' };
      
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

  // 执行搜索
  async performSearch() {
    if (!this.isSearchInitialized) return;

    const keyword = document.getElementById('analects-keyword')?.value;
    const resultsContainer = document.getElementById('analects-results-container');
    const statusDiv = document.getElementById('analects-search-status');
    const loadCompleteDiv = document.getElementById('analects-load-complete');
    const loadingMoreDiv = document.getElementById('analects-loading-more');
  
    if (!resultsContainer) return;

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
      this.isAutoLoadingEnabled = true;
      this.handleFirstSearchResult(result, statusDiv, resultsContainer);
    } catch (error) {
      console.error('搜索失败:', error);
      this.handleSearchError(error, statusDiv, resultsContainer);
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

    // [核心修改] 在渲染前，为搜索结果注入用户的个人收藏信息
    const hydratedResults = result.data.map(entry => {
      if (this.favoritesDataCache.has(entry.id)) {
        return { ...entry, ...this.favoritesDataCache.get(entry.id) };
      }
      return entry;
    });

    const uniqueResults = hydratedResults.filter(entry => {
      if (!entry.id || this.pagination.loadedIds.has(entry.id)) {
        return false;
      }
      this.pagination.loadedIds.add(entry.id);
      return true;
    });

    this.pagination.currentPage = 1;
    this.pagination.totalLoaded = uniqueResults.length;
    this.pagination.hasMore = this.pagination.totalLoaded < this.pagination.totalCount;

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

  // 滚动加载更多
  async loadMoreResults() {
    if (this.pagination.isLoading || !this.pagination.hasMore || !this.isAutoLoadingEnabled) {
      return;
    }

    this.pagination.isLoading = true;
  
    const loadingMoreDiv = document.getElementById('analects-loading-more');
    if (loadingMoreDiv) loadingMoreDiv.style.display = 'block';

    try {
      const result = await this.fetchAnalects(
        this.currentFilters, 
        this.pagination.currentPage, 
        this.pagination.pageSize
      );

      // [核心修改] 同样，在渲染前注入个人收藏信息
      const hydratedResults = result.data.map(entry => {
        if (this.favoritesDataCache.has(entry.id)) {
          return { ...entry, ...this.favoritesDataCache.get(entry.id) };
        }
        return entry;
      });

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

    } catch (error) {
      console.error('加载更多结果失败:', error);
      const statusDiv = document.getElementById('analects-search-status');
      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-error">❌ 加载更多结果失败，请稍后重试</div>';
      }
    } finally {
      this.pagination.isLoading = false;
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

    // 章节重置为"全部"
    const allCheckbox = document.querySelector('input[data-type="chapter"][value="all"]');
    if (allCheckbox) {
      allCheckbox.checked = true;
      allCheckbox.closest('.analects-option-tag').classList.add('selected');
    }

    // 清空内部选中项目存储
    this.selectedItems.characters.clear();
    this.selectedItems.arguments.clear();
    this.selectedItems.proverbs.clear();
    this.selectedItems.chapter = { id: 'all', name: '全部章节' };

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


  // [升级版] 获取收藏列表（包含笔记更新时间）
  async getMyFavorites() {
    if (!this.currentUser) return [];
    try {
      const { data, error } = await this.supabase
        .from('user_favorites')
        .select(`
          created_at,
          user_insight,
          insight_updated_at, 
          analects_entries (
            *
          )
        `)
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const favorites = data.map(item => {
        if (!item.analects_entries) return null;
        return {
          ...item.analects_entries,
          favorited_at: item.created_at,
          user_insight: item.user_insight,
          insight_updated_at: item.insight_updated_at
        };
      }).filter(Boolean);
      
      return favorites;
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      return [];
    }
  }


// [新增] 根据 email 生成带背景色的首字母头像 HTML
    _generateInitialsAvatar(email) {
      if (!email) return `<div class="initials">?</div>`;

      const initial = email[0].toUpperCase();
      
      // 根据 email 字符串生成一个简单的哈希值，用于分配颜色
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // 定义一个漂亮的颜色数组
      const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#34d399', '#22d3ee', '#60a5fa', '#818cf8', '#c084fc'];
      const color = colors[Math.abs(hash % colors.length)];

      return `<div class="initials" style="background-color: ${color}; color: white; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${initial}</div>`;
    }

    // [新增] 统一获取用户头像的 HTML (Google 或首字母)
    _getAvatarHTML(user) {
      if (!user) return this._generateInitialsAvatar('?');

      const metadata = user.user_metadata;
      // 1. 优先使用 Google 等第三方提供商的头像
      if (metadata && metadata.avatar_url) {
        return `<img src="${metadata.avatar_url}" alt="用户头像">`;
      }
      // 2. 否则，回退到使用 Email 生成首字母头像
      return this._generateInitialsAvatar(user.email);
    }
	
	
// [最终骨架屏版] 渲染全局页头
	renderGlobalHeader() {
	    const headerWrapper = document.getElementById('global-header-wrapper');
	    if (!headerWrapper) return;

	    let innerHTML = '';

	    // 状态一：如果初始会话还未确认，则显示骨架屏
	    if (!this.sessionInitialized) {
	        innerHTML = `
	            <div class="global-header-inner">
	                <div class="header-left-area"><div class="header-skeleton text"></div></div>
	                <a href="/" class="header-mini-logo">論語SDK</a>
	                <div class="header-right-area"><div class="header-skeleton avatar"></div></div>
	            </div>
	        `;
	    } 
	    // 状态二：会话已确认，且用户已登录
	    else if (this.currentUser) {
	        const avatarHTML = this._getAvatarHTML(this.currentUser);
	        const userEmail = this.escapeHtml(this.currentUser.email);
	        innerHTML = `
	            <div class="global-header-inner">
	                <div class="header-left-area"><div class="header-welcome-message">欢迎, <span class="email">${userEmail}</span></div></div>
	                <a href="/" class="header-mini-logo">論語SDK</a>
	                <div class="header-right-area">
	                    <div class="user-avatar-container">
	                        <button class="user-menu-button" title="用户菜单"><i data-lucide="menu" class="menu-icon"></i><div class="user-avatar-display">${avatarHTML}</div></button>
	                        <div class="user-dropdown-menu">
	                            <div class="dropdown-user-info"><span class="email">${userEmail}</span></div>
	                            <a href="/my-favorites.html" class="dropdown-item"><i data-lucide="bookmark"></i><span>我的收藏</span></a>
	                            <a href="/account.html" class="dropdown-item"><i data-lucide="settings"></i><span>账户设置</span></a>
	                            <button class="dropdown-item logout"><i data-lucide="log-out"></i><span>登出</span></button>
	                        </div>
	                    </div>
	                </div>
	            </div>
	        `;
	    } 
	    // 状态三：会话已确认，但用户未登录
	    else {
	        innerHTML = `
	            <div class="global-header-inner">
	                <div class="header-left-area"><div class="header-welcome-message">欢迎访问论语 SDK</div></div>
	                <a href="/" class="header-mini-logo">論語SDK</a>
	                <div class="header-right-area"><div class="header-user-area"><button id="header-login-btn" class="header-login-btn">登录 / 注册</button></div></div>
	            </div>
	        `;
	    }

	    headerWrapper.innerHTML = innerHTML;
	    
	    // 只有在渲染真实内容后才需要绑定事件和图标
	    if (this.sessionInitialized) {
	        this._attachHeaderEvents();
	    }
	}

// [最终修正版] 为全局页头绑定所有必要的事件
    _attachHeaderEvents() {
      // 1. 为登录按钮绑定事件 (这部分不变)
      const loginBtn = document.getElementById('header-login-btn');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => this.showAuthModal('login'));
      }

      // 2. [核心修正] 为页面上“所有”的用户菜单按钮绑定事件
      document.querySelectorAll('.user-menu-button').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation(); // 阻止事件冒泡，防止触发下面的全局点击事件
          
          // 找到紧跟在当前被点击按钮后面的那个下拉菜单
          const dropdown = button.nextElementSibling;
          
          if (dropdown && dropdown.classList.contains('user-dropdown-menu')) {
            const wasActive = dropdown.classList.contains('active');
            
            // 为保险起见，先关闭页面上所有可能已打开的下拉菜单
            document.querySelectorAll('.user-dropdown-menu').forEach(d => d.classList.remove('active'));
            
            // 如果刚才这个菜单不是打开状态，现在就打开它
            if (!wasActive) {
              dropdown.classList.add('active');
            }
          }
        });
      });

      // 3. [核心修正] 为页面上“所有”的登出按钮绑定事件
      // 注意：之前的代码只会为第一个登出按钮绑定事件，现在修正为所有
      document.querySelectorAll('.dropdown-item.logout').forEach(logoutBtn => {
        logoutBtn.addEventListener('click', () => this.signOut());
      });
      
      // 4. [核心修正] 修改全局点击事件，用于关闭“任何”已打开的菜单
      // 我们在 _initializeGlobalEventListeners 中统一处理这个逻辑
      // 此处无需重复添加 document.addEventListener
      
      // 5. 确保图标被正确渲染 (这部分不变)
      this._ensureIconsRendered();
    }
	
	
	// [最终统一版] 初始化页头动态效果
	_initializeHeaderAnimation() {
	    const sentinel = document.getElementById('header-sentinel');
	    const headerWrapper = document.getElementById('global-header-wrapper');

	    // 现在只操作一个页头，逻辑非常清晰
	    if (!sentinel || !headerWrapper) return;

	    const observer = new IntersectionObserver(
	        ([entry]) => {
	            const isScrolled = !entry.isIntersecting;
	            headerWrapper.classList.toggle('is-scrolled', isScrolled);
	        },
	        {
	            root: null,
	            threshold: 0,
	        }
	    );

	    observer.observe(sentinel);
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


// [最终修正版] 渲染“我的收藏”页面
  async renderMyFavoritesPage(container) {
    if (!container) {
      console.error('收藏页面的容器未找到');
      return;
    }

    if (!this.currentUser) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <p class="text-lg">请先登录以查看您的收藏。</p>
          <a href="/" class="text-blue-600 hover:underline mt-4 inline-block">&larr; 返回首页进行登录</a>
        </div>
      `;
      return;
    }

	try {
	        const favorites = await this.getMyFavorites();

	        if (favorites.length === 0) {
	            container.innerHTML = `
	            <div class="text-center text-gray-500 py-8">
	                <p class="text-lg">您还没有收藏任何章句。</p>
	                <a href="/" class="text-blue-600 hover:underline mt-4 inline-block">去首页浏览并收藏</a>
	            </div>
	            `;
	        } else {
	            // 先清空骨架屏，再渲染真实数据
	            container.innerHTML = '';
	            favorites.forEach(entry => {
	                this.entryCache.set(entry.id, entry);
	                const cardWrapper = document.createElement('div');
	                cardWrapper.className = 'analects-result-card';
	                cardWrapper.setAttribute('data-entry-id', entry.id);
	                cardWrapper.innerHTML = this.generateResultCardHTML(entry);
	                container.appendChild(cardWrapper);
	                setTimeout(() => cardWrapper.classList.add('animate-in'), 10);
	            });
	            // [核心新增] 在所有卡片渲染完成后，添加“已全部显示完毕”的提示
	            const allDisplayedMessage = document.createElement('div');
	            // 复用与搜索结果页相同的样式，保持视觉一致
	            allDisplayedMessage.className = 'analects-load-complete'; 
	            allDisplayedMessage.style.display = 'block'; // 确保它可见
	            allDisplayedMessage.innerHTML = '<span class="analects-load-complete-text">—— ✨ 已全部显示完毕 ✨ ——</span>';
	            container.appendChild(allDisplayedMessage);
	        }
	    } catch (error) {
	        console.error('渲染收藏页面失败:', error);
	        container.innerHTML = '<div class="analects-daily-error text-center py-8">加载收藏失败，请稍后重试。</div>';
	    }
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
  
// [最终导航版] 增加首页导航，并为当前页面添加'active'状态
  renderGlobalWidget(container) {
    if (!container) return;
    this.widgetContainer = container; 

    // 获取当前页面的路径，用于判断哪个菜单是激活状态
    const currentPage = window.location.pathname;

    let widgetHTML = '';

    if (this.currentUser) {
      // --- 已登录状态 ---
      container.classList.add('logged-in');
      container.classList.remove('logged-out');
      
      const isHomeActive = (currentPage === '/' || currentPage.includes('/index.html'));
      const isFavoritesActive = currentPage.includes('/my-favorites.html');

      // [核心修改] 生成包含弹出式菜单的新HTML结构
      widgetHTML = `
        <a href="/" class="app-footer-action ${isHomeActive ? 'active' : ''}">
          <i data-lucide="home"></i><span>首页</span>
        </a>
        <a href="/my-favorites.html" class="app-footer-action ${isFavoritesActive ? 'active' : ''}">
          <i data-lucide="bookmark"></i><span>我的收藏</span>
        </a>
        
        <div class="app-footer-menu-container">
          <button id="global-account-btn" class="app-footer-action">
            <i data-lucide="user"></i><span>我的账号</span>
          </button>
          <div id="global-account-menu" class="app-footer-submenu">
            <a href="/account.html" class="app-footer-submenu-item">
              <i data-lucide="settings"></i><span>账户设置</span>
            </a>
            <button id="global-logout-btn" class="app-footer-submenu-item logout">
              <i data-lucide="log-out"></i><span>登出</span>
            </button>
          </div>
        </div>
      `;

    } else {
      // --- 未登录状态 (保持不变) ---
      container.classList.add('logged-out');
      container.classList.remove('logged-in');
      
      widgetHTML = `
        <button id="global-login-btn" class="app-footer-action login">登录 / 注册</button>
      `;
    }

    container.innerHTML = widgetHTML;
    this._attachGlobalWidgetEvents();
  }

  // [新版] 为浮动操作栏绑定事件的辅助方法
  _attachGlobalWidgetEvents() {
    const loginBtn = this.widgetContainer.querySelector('#global-login-btn');
    const logoutBtn = this.widgetContainer.querySelector('#global-logout-btn');
    const accountBtn = this.widgetContainer.querySelector('#global-account-btn');
    const accountMenu = this.widgetContainer.querySelector('#global-account-menu');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.showAuthModal('login')); 
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.signOut());
    }

    // [核心新增] 为“我的账号”按钮和菜单添加交互
    if (accountBtn && accountMenu) {
      accountBtn.addEventListener('click', (e) => {
        // 阻止事件冒泡，防止触发下面的全局点击事件而立即关闭
        e.stopPropagation();
        accountMenu.classList.toggle('active');
      });
    }

    // 确保我们新添加的 Lucide 图标能被渲染
    this._ensureIconsRendered();
  }

    // [新增] 注册方法
    async signUp(email, password) {
      const { data, error } = await this.supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) {
        return { error };
      }
      // 注册成功，Supabase会发送确认邮件
      return { user: data.user };
    }

    // [新增] 登录方法
   async signIn(email, password) {
	  const { data, error } = await this.supabase.auth.signInWithPassword({
	    email: email,
	    password: password,
	  });
	  if (error) {
	    return { error };
	  }
	  // [核心修改] 登录成功后，设置一次性标志
	  sessionStorage.setItem('justLoggedIn', 'true');
	  return { user: data.user };
	}

    // [新增] 第三方登录方法 (以 Google 为例)
	async signInWithGoogle() {
	  // [核心修改] 在跳转前，设置一次性标志
	  sessionStorage.setItem('justLoggedIn', 'true');
	  const { error } = await this.supabase.auth.signInWithOAuth({
	    provider: 'google',
		options: {
		         // [核心修改] 动态指定重定向地址为当前页面的源地址
		         // 在本地，它会是 http://localhost:3000
		         // 在线上，它会是 https://lunyu.xyz
		         redirectTo: window.location.origin
		       }
	  });
	  if (error) {
	    // 如果跳转失败，最好把标志移除，以防万一
	    sessionStorage.removeItem('justLoggedIn');
	    console.error('Google 登录跳转失败:', error);
	  }
	}
	
// [最终优化版] 登出方法
    async signOut() {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('登出失败:', error);
        if (window.showToast) {
          window.showToast('登出失败，请稍后重试', true);
        }
      } else {
        if (window.showToast) {
          window.showToast('您已成功登出');
        }
      
        // [核心修正] 增加对 account.html 页面的判断
        const currentPage = window.location.pathname;
        if (currentPage.includes('/my-favorites.html') || currentPage.includes('/account.html')) {
          // 等待短暂延迟，让用户能看到 Toast 提示，然后再跳转
          setTimeout(() => {
            window.location.href = '/'; 
          }, 500); // 延迟500毫秒
        }
      }
    }
	
	
    // [新增] 更新用户密码
    async updatePassword(newPassword) {
      if (!this.currentUser) {
        return { error: new Error('用户未登录') };
      }
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        return { error };
      }
      return { data };
    }

    // [新增] 删除当前用户账户
    // 注意：这是一个敏感操作，在生产环境中建议通过一个自定义的 Edge Function 来执行
    // 这里我们先实现一个客户端版本，未来可以再加固
    async deleteCurrentUser() {
      if (!this.currentUser) {
        return { error: new Error('用户未登录') };
      }
      
      // Supabase 不允许在客户端直接删除用户，这是一个安全策略。
      // 正确的做法是调用一个您自己编写的、具有管理员权限的云函数。
      // 我们在这里模拟这个调用，并给出提示。
      console.warn('此为模拟删除。生产环境请替换为安全的 Edge Function 调用。');
      
      // 示例：如何调用一个名为 'delete-user' 的 Edge Function
      const { data, error } = await this.supabase.functions.invoke('delete-user', {
        method: 'POST',
      });

      if (error) {
        return { error };
      }

      // 如果云函数成功删除了用户，我们需要手动登出
      await this.signOut(); 
      return { data };
    }
	
  
    // [新增] 显示模态窗口的主方法
    showAuthModal(view = 'login') {
      // 防止重复创建
      if (document.getElementById('analects-auth-modal')) return;

      const modalHTML = `
        <div id="analects-auth-modal" class="auth-modal-overlay">
          <div class="auth-modal-content">
            <button id="auth-modal-close" class="auth-modal-close-btn">&times;</button>
            <div id="auth-modal-form-container"></div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    
      document.getElementById('auth-modal-close').addEventListener('click', () => this.closeAuthModal());
      document.getElementById('analects-auth-modal').addEventListener('click', (e) => {
        if (e.target.id === 'analects-auth-modal') {
          this.closeAuthModal();
        }
      });

      this._renderAuthForm(view);
    }

    // [新增] 关闭模态窗口
    closeAuthModal() {
      const modal = document.getElementById('analects-auth-modal');
      if (modal) {
        modal.remove();
      }
    }


    // [修正版] 渲染模态窗口内部的表单
    _renderAuthForm(view = 'login') {
      const container = document.getElementById('auth-modal-form-container');
      if (!container) return;

      let formHTML = '';
      // 我们将两个消息 div 放到一个容器里
      const messagesHTML = `
        <div class="auth-messages">
          <div id="auth-error-message" class="auth-error"></div>
          <div id="auth-success-message" class="auth-success"></div>
        </div>
      `;

      if (view === 'login') {
        formHTML = `
          <h3>登录</h3>
          <p class="auth-subtitle">欢迎回来</p>
          <form id="analects-login-form">
            <input type="email" name="email" placeholder="邮箱" required />
            <input type="password" name="password" placeholder="密码" required />
            ${messagesHTML}
            <button type="submit" class="auth-submit-btn">登录</button>
          </form>
          <div class="auth-separator">
            <span class="auth-separator-line"></span><span class="auth-separator-text">或</span><span class="auth-separator-line"></span>
          </div>
          <button id="google-signin-btn" class="auth-social-btn google">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 18 18"><path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z" fill="#4285F4"></path><path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-2.7 1.01c-2.09 0-3.87-1.4-4.5-3.3l-2.64 2.03A9 9 0 0 0 8.98 17Z" fill="#34A853"></path><path d="M4.48 10.37a5.4 5.4 0 0 1 0-3.74l-2.63-2.03a9 9 0 0 0 0 7.8Z" fill="#FBBC05"></path><path d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A9 9 0 0 0 8.98 1Z" fill="#EA4335"></path></svg>
            <span>使用 Google 登录</span>
          </button>
          <p class="auth-switcher">还没有账户？ <a href="#" id="auth-switch-to-signup">立即注册</a></p>
        `;
      } else { // view === 'signup'
        formHTML = `
          <h3>注册</h3>
          <p class="auth-subtitle">创建您的账户</p>
          <form id="analects-signup-form">
            <input type="email" name="email" placeholder="邮箱" required />
            <input type="password" name="password" placeholder="密码 (至少6位，不允许纯数字或字母)" required />
            ${messagesHTML}
            <button type="submit" class="auth-submit-btn">注册</button>
          </form>
          <p class="auth-switcher">已经有账户了？ <a href="#" id="auth-switch-to-login">立即登录</a></p>
        `;
      }
      container.innerHTML = formHTML;
      this._attachAuthFormEvents(view);
    }

    // [新增] 为表单绑定事件
    _attachAuthFormEvents(view = 'login') {
      const form = document.getElementById(view === 'login' ? 'analects-login-form' : 'analects-signup-form');
      const googleBtn = document.getElementById('google-signin-btn');
      const errorDiv = document.getElementById('auth-error-message');
    //  const successDiv = document.getElementById('auth-success-message');

      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = form.email.value;
          const password = form.password.value;
          errorDiv.textContent = '';
          // if (successDiv) successDiv.textContent = '';

          let result;
          if (view === 'login') {
            result = await this.signIn(email, password);
          } else {
            result = await this.signUp(email, password);
          }

		  if (result.error) {
		              errorDiv.textContent = result.error.message;
		            } else {
		              // [核心修复] 对 Email 登录成功的情况进行处理
		              if (view === 'login') {
		                // 不再等待事件，立即关闭弹窗并显示提示
		                this.closeAuthModal();
		                if (window.showToast) {
		                  window.showToast('登录成功，欢迎回来！');
		                }
		              } else { // view === 'signup'
		                const formContainer = document.getElementById('auth-modal-form-container');
		                this._renderSignupSuccessView(formContainer, email);
		              }
		  }
        });
      }
    
      if (googleBtn) {
          googleBtn.addEventListener('click', () => this.signInWithGoogle());
      }

      const switchToSignup = document.getElementById('auth-switch-to-signup');
      if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
          e.preventDefault();
          this._renderAuthForm('signup');
        });
      }

      const switchToLogin = document.getElementById('auth-switch-to-login');
      if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
          e.preventDefault();
          this._renderAuthForm('login');
        });
      }
    }
  

// [增强版] 加载用户所有收藏的完整信息到缓存
    async _loadUserFavorites() {
      if (!this.currentUser) return;

      try {
        const { data, error } = await this.supabase
          .from('user_favorites')
          .select('entry_id, user_insight, insight_updated_at, created_at')
          .eq('user_id', this.currentUser.id);

        if (error) throw error;

        this.favoriteIds.clear();
        this.favoritesDataCache.clear();
        
        data.forEach(item => {
          this.favoriteIds.add(item.entry_id);
          this.favoritesDataCache.set(item.entry_id, {
            user_insight: item.user_insight,
            insight_updated_at: item.insight_updated_at,
            favorited_at: item.created_at
          });
        });
      
      } catch (error) {
        console.error('加载用户收藏列表失败:', error);
      }
    }
	

// [新增] 显示自定义的居中确认弹窗
    async showConfirmationModal(title, message) {
      // 返回一个Promise，这样我们就可以用 await 等待用户的选择
      return new Promise((resolve) => {
        // 防止重复创建
        if (document.getElementById('analects-confirm-modal')) return;

        const modalHTML = `
          <div id="analects-confirm-modal" class="confirm-modal-overlay">
            <div class="confirm-modal-content">
              <h3>${this.escapeHtml(title)}</h3>
              <p>${this.escapeHtml(message)}</p>
              <div class="confirm-modal-actions">
                <button id="confirm-cancel-btn" class="confirm-modal-btn cancel">取消</button>
                <button id="confirm-ok-btn" class="confirm-modal-btn confirm">确认删除</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('analects-confirm-modal');
        const confirmBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        const closeModal = (result) => {
          modal.remove();
          resolve(result); // 当用户点击按钮时，解析Promise
        };

        confirmBtn.addEventListener('click', () => closeModal(true));
        cancelBtn.addEventListener('click', () => closeModal(false));
        // 点击遮罩层也视为取消
        modal.addEventListener('click', (e) => {
          if (e.target.id === 'analects-confirm-modal') {
            closeModal(false);
          }
        });
      });
    }

	// [最终完整注释版 V2] 收藏或取消收藏的核心方法，包含了所有UI交互和安全检查
	async toggleFavorite(entryId, targetButton) {
	  // 检查一：用户必须登录才能操作
	  if (!this.currentUser) {
	    this.showAuthModal('login');
	    return;
	  }
	  // 检查二：防止在加载过程中重复点击
	  if (!targetButton || targetButton.classList.contains('is-loading')) {
	    return;
	  }

	  targetButton.classList.add('is-loading');

	  const isFavorited = this.favoriteIds.has(entryId);
	  const card = targetButton.closest('.analects-result-card');

	  try {
	    let error;

	    if (isFavorited) {
	      // --- 分支一：执行取消收藏 (这部分逻辑不变) ---
	      let hasNote = false;
	      try {
	        const { data: noteCheck } = await this.supabase
	          .from('user_favorites')
	          .select('user_insight')
	          .match({ user_id: this.currentUser.id, entry_id: entryId })
	          .single();
	        if (noteCheck && noteCheck.user_insight) {
	          hasNote = true;
	        }
	      } catch(e) { /* 忽略错误 */ }

	      if (hasNote) {
	        const confirmed = await this.showConfirmationModal(
	          '确认取消收藏？',
	          '此条目包含您的笔记，取消收藏将会永久删除这条笔记。您确定要继续吗？'
	        );
	        if (!confirmed) {
	          targetButton.classList.remove('is-loading');
	          return;
	        }
	      }
      
	      const result = await this.supabase.from('user_favorites').delete().match({ user_id: this.currentUser.id, entry_id: entryId });
	      error = result.error;

	      if (!error) {
	        this.favoriteIds.delete(entryId);
	        this.favoritesDataCache.delete(entryId);
	        if (window.showToast) window.showToast('已取消收藏');
        
	        if (window.location.pathname.includes('/my-favorites.html')) {
	          if (card) {
	            card.classList.add('is-removing');
	            card.addEventListener('animationend', () => card.remove());
	          }
	        } else {
	          // 在搜索页，同样使用重绘的方式来移除底部
	          const originalEntry = this.entryCache.get(entryId);
	          if (card && originalEntry) {
	              card.innerHTML = this.generateResultCardHTML(originalEntry);
	          }
	        }
	      }
	    } else {
	      // --- 分支二：执行收藏 ---
	      const { data, error: insertError } = await this.supabase
	        .from('user_favorites')
	        .insert({ user_id: this.currentUser.id, entry_id: entryId })
	        .select()
	        .single();
    
	      error = insertError;
	      if (!error && data) {
	        // 更新内存中的收藏状态
	        this.favoriteIds.add(entryId);
	        this.favoritesDataCache.set(entryId, {
	            user_insight: data.user_insight,
	            insight_updated_at: data.insight_updated_at,
	            favorited_at: data.created_at
	        });

	        if (window.showToast) window.showToast('收藏成功！');

	        // [核心修正] 不再手动拼接旧HTML，而是获取最新数据并完整重绘卡片
	        const originalEntry = this.entryCache.get(entryId);
	        if (card && originalEntry) {
	            const updatedEntryData = {
	                ...originalEntry,
	                favorited_at: data.created_at,
	                user_insight: data.user_insight,
	                insight_updated_at: data.insight_updated_at
	            };
	            // 调用最新的渲染函数来重绘卡片内部，确保UI统一
	            card.innerHTML = this.generateResultCardHTML(updatedEntryData);
	        }
	      }
	    }

	    if (error) throw error;

	  } catch (error) {
	    console.error('收藏操作失败:', error);
	    if (window.showToast) window.showToast('操作失败，请稍后重试', true);
	  } finally {
	    targetButton.classList.remove('is-loading');
	  }
	}

// [最终正确版] 更新收藏条目的心得笔记
    async updateFavoriteInsight(entryId, insightText) {
      if (!this.currentUser) {
        this.showAuthModal('login');
        return { error: new Error('用户未登录') };
      }

      try {
        const { data, error } = await this.supabase
          .from('user_favorites')
          .update({ user_insight: insightText }) // 1. 更新笔记
          .match({ user_id: this.currentUser.id, entry_id: entryId })
          .select() // 2. [核心修改] 让 Supabase 返回更新后的完整数据行

        if (error) throw error;
      
        // 确保返回的是单个对象，而不是数组
        return { data: data ? data[0] : null };

      } catch (error) {
        console.error('更新笔记失败:', error);
        return { error };
      }
    }
	

    // [最终修正版] 显示笔记编辑模态窗口
    showNoteEditorModal(entryId, currentInsight = '') {
      if (document.getElementById('analects-note-modal')) return;

      const modalHTML = `
        <div id="analects-note-modal" class="auth-modal-overlay">
          <div class="auth-modal-content">
            <button id="note-modal-close" class="auth-modal-close-btn">&times;</button>
            <h3>编辑心得笔记</h3>

            <form id="analects-note-form" data-entry-id="${entryId}">
              <textarea name="insight" class="note-textarea" placeholder="在此输入您的心得...">${this.escapeHtml(currentInsight)}</textarea>
              <div id="note-error-message" class="auth-error"></div>
              <button type="submit" class="auth-submit-btn">保存笔记</button>
            </form>

          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const form = document.getElementById('analects-note-form');
      // 直接绑定我们已经修正了 this 指向的新方法
      form.addEventListener('submit', this._handleNoteFormSubmit);

      document.getElementById('note-modal-close').addEventListener('click', () => this.closeNoteEditorModal());
      document.getElementById('analects-note-modal').addEventListener('click', (e) => {
        if (e.target.id === 'analects-note-modal') {
          this.closeNoteEditorModal();
        }
      });
    }
	

    // [新增] 关闭笔记编辑模态窗口
    closeNoteEditorModal() {
      const modal = document.getElementById('analects-note-modal');
      if (modal) {
        modal.remove();
      }
    }
	

// [最终完整注释版] 处理笔记表单的提交，包含加载状态、UI重绘和错误处理
    async _handleNoteFormSubmit(event) {
      // 阻止表单的默认提交行为，防止页面刷新
      event.preventDefault();

      // --- 1. 获取表单和相关DOM元素 ---
      const form = event.target;
      const saveButton = form.querySelector('button[type="submit"]');
      const originalButtonText = saveButton.textContent;
      const entryId = parseInt(form.dataset.entryId, 10);
      const newInsight = form.insight.value;
      const errorDiv = form.querySelector('#note-error-message');

      if (isNaN(entryId)) {
        console.error('无法从表单获取有效的条目ID');
        return;
      }

      // --- 2. 进入加载状态，并清空旧的错误信息 ---
      saveButton.disabled = true;
      saveButton.textContent = '保存中...';
      errorDiv.textContent = '';

      try {
        // --- 3. 调用核心API方法，将笔记更新到数据库 ---
        // updateFavoriteInsight 会返回更新后的完整收藏数据
        const { data: updatedFavorite, error } = await this.updateFavoriteInsight(entryId, newInsight);

        // 如果数据库操作返回错误，则抛出异常，由 catch 块处理
        if (error) throw error;

        // --- 4. 执行UI的实时刷新 ---
        const card = document.querySelector(`.analects-result-card[data-entry-id="${entryId}"]`);
        const cachedEntry = this.entryCache.get(entryId);

        // 确保所有需要的数据都存在，才执行UI重绘
        if (card && cachedEntry && updatedFavorite) {
          // 将数据库返回的最新笔记和时间，合并到缓存的条目数据中
          const updatedEntryData = {
            ...cachedEntry,
            user_insight: updatedFavorite.user_insight,
            insight_updated_at: updatedFavorite.insight_updated_at,
            favorited_at: updatedFavorite.created_at
          };

          // 用合并后的最新数据，更新缓存
          this.entryCache.set(entryId, updatedEntryData);

          // 调用主模板函数，完整地重绘卡片内部HTML，确保UI绝对一致
          card.innerHTML = this.generateResultCardHTML(updatedEntryData);
        }
      
        // --- 5. 操作成功，给予用户反馈并关闭弹窗 ---
        if (window.showToast) window.showToast('笔记已保存！');
        this.closeNoteEditorModal();

      } catch (error) {
        // --- 6. 错误处理 ---
        // 在控制台为开发者记录详细的错误信息
        console.error('保存笔记失败:', error); 
        
        // 在UI上给用户一个友好的错误提示
        errorDiv.textContent = '保存失败，请稍后重试。';
        if (window.showToast) window.showToast('保存失败', true);
      } finally {
        // --- 7. 无论成功或失败，都恢复按钮的原始状态 ---
        saveButton.disabled = false;
        saveButton.textContent = originalButtonText;
      }
    }
	
		
    // [新增] 刷新页面上所有收藏按钮的UI状态
    _updateFavoriteButtonsUI() {
      const allFavoriteButtons = document.querySelectorAll('.favorite-btn');
      allFavoriteButtons.forEach(button => {
        const entryId = parseInt(button.dataset.entryId, 10);
        if (isNaN(entryId)) return;

        const isFavorited = this.favoriteIds.has(entryId);
      
        // 更新视觉状态 (class 和 title)
        button.classList.toggle('favorited', isFavorited);
        button.title = isFavorited ? '取消收藏' : '收藏此条';
      
        // 如果是每日论语的按钮，还需要更新文字
        const buttonTextSpan = button.querySelector('span');
        if (buttonTextSpan) {
          buttonTextSpan.textContent = isFavorited ? '已收藏' : '收藏';
        }
      });
    }
	
    // [新增] 刷新页面上所有可见卡片的完整UI (用于登出后移除笔记等)
    _refreshVisibleCardsUI() {
      const allCards = document.querySelectorAll('.analects-result-card');
      allCards.forEach(card => {
        const entryId = parseInt(card.dataset.entryId, 10);
        if (isNaN(entryId)) return;

        // 从基础数据缓存中获取原始条目信息
        const originalEntry = this.entryCache.get(entryId);
        if (originalEntry) {
          // 使用 generateResultCardHTML 重新生成卡片的内部HTML
          // 因为此时 favoriteIds 和 favoritesDataCache 都已清空，
          // 生成的HTML将不包含任何收藏信息或笔记内容。
          card.innerHTML = this.generateResultCardHTML(originalEntry);
        }
      });
    }

    // [新增] 渲染注册成功的视图
    _renderSignupSuccessView(container, email) {
      if (!container) return;

      const successHTML = `
        <div class="auth-success-view">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="auth-success-icon">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <h3>请检查您的收件箱</h3>
          <p class="auth-subtitle">我们已经发送了一封确认邮件到</p>
          <p class="auth-success-email">${this.escapeHtml(email)}</p>
          <p class="auth-subtitle">请点击邮件中的链接以完成注册。</p>
          <button id="auth-close-success-btn" class="auth-submit-btn">关闭</button>
        </div>
      `;
      container.innerHTML = successHTML;

      // 为新的关闭按钮绑定事件
      document.getElementById('auth-close-success-btn').addEventListener('click', () => this.closeAuthModal());
    }	
	
	

    // [最终优化版] 初始化收藏页的搜索功能（带高亮）
    initializeFavoritesSearch(inputElement, containerElement) {
      if (!inputElement || !containerElement) {
        console.error('搜索框或收藏容器未找到');
        return;
      }

      // 一个辅助函数，用于在文本节点中执行高亮
      const highlightTextInNode = (node, searchTerm) => {
        if (node.nodeType === 3) { // 3 代表文本节点
          const text = node.textContent;
          const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
          if (regex.test(text)) {
            const fragment = document.createDocumentFragment();
            text.split(regex).forEach((part, index) => {
              if (index % 2 === 1) { // 这是匹配到的关键词
                const mark = document.createElement('mark');
                mark.className = 'keyword-highlight';
                mark.textContent = part;
                fragment.appendChild(mark);
              } else if (part) {
                fragment.appendChild(document.createTextNode(part));
              }
            });
            node.parentNode.replaceChild(fragment, node);
          }
        } else if (node.nodeType === 1 && node.nodeName !== 'MARK') { // 1 代表元素节点
          // 递归遍历所有子节点
          Array.from(node.childNodes).forEach(child => highlightTextInNode(child, searchTerm));
        }
      };

      // 一个辅助函数，用于移除高亮
      const removeHighlightInCard = (card) => {
        const marks = card.querySelectorAll('mark.keyword-highlight');
        marks.forEach(mark => {
          const parent = mark.parentNode;
          parent.replaceChild(document.createTextNode(mark.textContent), mark);
          parent.normalize(); // 合并相邻的文本节点
        });
      };

      inputElement.addEventListener('input', () => {
        const searchTerm = inputElement.value.trim();
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const allCards = containerElement.querySelectorAll('.analects-result-card');

        allCards.forEach(card => {
          // 1. 先移除旧的高亮
          removeHighlightInCard(card);

          const cardText = card.textContent.toLowerCase();
        
          // 2. 检查是否匹配，并显示/隐藏卡片
          if (!searchTerm || cardText.includes(lowerCaseSearchTerm)) {
            card.style.display = 'block';
          
            // 3. 如果匹配且有搜索词，则添加新的高亮
            if (searchTerm) {
              highlightTextInNode(card, searchTerm);
            }
          } else {
            card.style.display = 'none';
          }
        });
      });
    }
	
  
}

// 全局复制方法
if (typeof window !== 'undefined') {
  window.AnalectsSDK = AnalectsSDK;
  
  window.AnalectsSDK.copyText = async function(text, button) {
    const originalTitle = button.title;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
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
        if (!successful) throw new Error('Copy command failed');
      }
      
      button.title = '已复制！';
      setTimeout(() => button.title = originalTitle, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      button.title = '复制失败';
      setTimeout(() => button.title = originalTitle, 2000);
    }
  };
  
  window.initAnalects = (config) => new AnalectsSDK(config);
}

// 自动初始化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-analects-auto-init]');
    if (!autoInit) return;
    
    const supabaseUrl = autoInit.getAttribute('data-supabase-url');
    const supabaseKey = autoInit.getAttribute('data-supabase-key');
    
    if (supabaseUrl && supabaseKey) {
      const config = { supabaseUrl, supabaseKey };
      const sdk = new AnalectsSDK(config);
      
      document.querySelectorAll('[data-analects-search]')
        .forEach(container => sdk.renderSearchInterface(container));
      
      document.querySelectorAll('[data-analects-daily]')
        .forEach(container => sdk.renderDailyAnalect(container));
    }
  });
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalectsSDK;
}


export default AnalectsSDK;