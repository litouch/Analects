import { createClient } from '@supabase/supabase-js';
import CoreSDK from './CoreSDK'; // [核心修改] 引入基类

// 论语 SDK - 完整功能版
class AnalectsSDK extends CoreSDK { // [核心修改] 继承 CoreSDK
  constructor(config = {}) {
    super(config); // [核心修改] 调用父类的构造函数

    // 3. [新增] 增加一个属性来存储当前用户信息
    this.currentUser = null;
	this.favoriteIds = new Set(); // [新增] 用于存储用户已收藏条目的ID
	this.favoritesDataCache = new Map();
	
    // [核心新增] 添加一个标志，用于跟踪初始会话是否已加载
    this.sessionInitialized = false; 
    
    // 在构造函数中提前绑定事件处理函数的 this，确保其上下文正确
    this._handleGlobalClick = this._handleGlobalClick.bind(this);
	this._handleNoteFormSubmit = this._handleNoteFormSubmit.bind(this);
	this._handleGlobalKeyPress = this._handleGlobalKeyPress.bind(this);
  }
  
  // [新增] 重写父类的客户端初始化方法
  // 这个版本会创建带有持久化认证功能的、功能完备的客户端。
  // 这也是现在项目中唯一一处创建完整版客户端的地方。
  _initializeSupabaseClient() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
	    auth: {
	      persistSession: true,
	      storage: window.localStorage,
	      autoRefreshToken: true
	    }
	});
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

  // [核心修正] 覆盖基类的方法，为搜索结果注入用户收藏和笔记信息
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
  
  // [核心修正] 覆盖基类的方法，为滚动加载的结果也注入用户收藏和笔记信息
  async loadMoreResults() {
    if (this.pagination.isLoading || !this.pagination.hasMore || !this.isAutoLoadingEnabled) {
      return;
    }

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

      if (searchId === this.latestSearchId) {
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
      }
    } catch (error) {
      console.error('加载更多结果失败:', error);
      const statusDiv = document.getElementById('analects-search-status');
      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-error">❌ 加载更多结果失败，请稍后重试</div>';
      }
    } finally {
      if (searchId === this.latestSearchId) {
        this.pagination.isLoading = false;
      }
      if (loadingMoreDiv) loadingMoreDiv.style.display = 'none';
    }
  }

  // [最终修正版] 统一处理全局点击事件
  _handleGlobalClick(event) {
    // 处理收藏按钮的点击
    const favoriteButton = event.target.closest('.favorite-btn');
    if (favoriteButton) {
      const entryId = parseInt(favoriteButton.dataset.entryId, 10);
      if (!isNaN(entryId)) {
        this.toggleFavorite(entryId, favoriteButton);
      }
      return;
    }

    // 处理编辑笔记按钮的点击
    const editInsightButton = event.target.closest('.edit-insight-btn');
    if (editInsightButton) {
      const entryId = parseInt(editInsightButton.dataset.entryId, 10);
      // [核心修正] 确保能从两种卡片 (.verse-card, .analects-result-card) 中找到笔记
      const card = editInsightButton.closest('.verse-card, .analects-result-card');
      const insightTextEl = card ? card.querySelector('.insight-text') : null;
      const currentInsight = insightTextEl ? insightTextEl.textContent : '';
      if (!isNaN(entryId)) {
        this.showNoteEditorModal(entryId, currentInsight);
      }
      return;
    }

    // 处理卡片上“更多选项”按钮的点击
    const moreOptionsButton = event.target.closest('.more-options-btn');
    if (moreOptionsButton) {
      event.stopPropagation();
      const dropdown = moreOptionsButton.nextElementSibling;
      const wasActive = dropdown.classList.contains('active');
      
      document.querySelectorAll('.card-actions-dropdown.active').forEach(d => d.classList.remove('active'));

      if (!wasActive) {
        dropdown.classList.add('active');
      }
      return;
    }

    // 处理笔记展开/收起按钮的点击
    const insightToggleButton = event.target.closest('.insight-toggle-btn');
    if (insightToggleButton) {
      const insightText = insightToggleButton.previousElementSibling;
      if (insightText && insightText.classList.contains('insight-text')) {
        insightText.classList.toggle('is-truncated');
        insightToggleButton.textContent = insightText.classList.contains('is-truncated') ? '展开阅读' : '收起';
      }
      return;
    }

    // 处理点击页面其他地方关闭菜单的逻辑
    const activeHeaderDropdown = document.querySelector('.user-dropdown-menu.active');
    if (activeHeaderDropdown && !event.target.closest('.user-avatar-container')) {
        activeHeaderDropdown.classList.remove('active');
    }

    const activeFooterMenu = document.querySelector('.app-footer-submenu.active');
    if (activeFooterMenu && !event.target.closest('.app-footer-menu-container')) {
        activeFooterMenu.classList.remove('active');
    }

    const activeCardDropdown = document.querySelector('.card-actions-dropdown.active');
    if (activeCardDropdown && !event.target.closest('.card-actions-container')) {
      activeCardDropdown.classList.remove('active');
    }
  }

// [核心修正] 覆盖基类的方法，为“每日论语”组件添加功能完备的收藏按钮
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
        <div class="spinner"></div>
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

  // [核心覆盖] 完整版的卡片HTML生成，依赖用户状态
  generateResultCardHTML(entry, options = {}) {
      if (!entry) return '';

      const { showTags = false } = options; // 默认不显示标签

      // --- 1. 数据准备 ---
      const currentKeyword = this.currentFilters?.keyword || '';
      const isFavorited = this.favoriteIds.has(entry.id);
      const timeAgo = isFavorited && entry.favorited_at ? this.formatTimeAgo(entry.favorited_at) : '';
    
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
      const highlightedAnnotation = entry.annotation ? this.highlightKeywords(entry.annotation, currentKeyword) : '';

      const contentHTML = `
        <blockquote class="verse-original">${highlightedOriginal}</blockquote>
        ${highlightedTranslation ? `<p class="verse-translation">【译文】${highlightedTranslation}</p>` : ''}
        ${highlightedAnnotation ? `<div class="verse-annotation-wrapper">
                                    <div class="verse-annotation-title">【注释】</div>
                                    <div class="verse-annotation">${highlightedAnnotation}</div>
                                  </div>` : ''}
      `;

      // --- 4. 构建标签区 (变为条件化渲染) ---
      let tagsHTML = '';
      if (showTags) { // [核心修正] 只有在 showTags 为 true 时才生成标签区HTML
        const createTagGroup = (label, items, icon, type) => 
          items.length > 0 ? `
            <div class="card-tag-group">
              <div class="card-tag-label"><i data-lucide="${icon}"></i><span>${label}</span></div>
              <div class="card-tag-items">
                ${items.map(item => `<span class="card-tag ${type}">${this.escapeHtml(item)}</span>`).join('')}
              </div>
            </div>
          ` : '';

        tagsHTML = (characters.length > 0 || argumentsList.length > 0 || proverbs.length > 0) ? `
          <div class="card-tags-section">
            ${createTagGroup('人物', characters, 'users', 'character')}
            ${createTagGroup('论点', argumentsList, 'message-square-quote', 'argument')}
            ${createTagGroup('谚语', proverbs, 'scroll-text', 'proverb')}
          </div>
        ` : '';
      }

      // --- 5. 构建页脚 ---
      const footerHTML = this._generateCardFooterHTML(entry);
    
      // --- 6. 组合成最终的卡片HTML ---
      return verseHeaderHTML + contentHTML + tagsHTML + footerHTML;
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

  // [最终版] 渲染“我的收藏”页面 (头部元数据 & 交互占位符)
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
        container.innerHTML = '';
      
        favorites.forEach(entry => {
          this.entryCache.set(entry.id, entry);
          const cardWrapper = document.createElement('div');
          cardWrapper.className = 'verse-card'; 
          cardWrapper.setAttribute('data-entry-id', entry.id);

          const timeAgo = this.formatTimeAgo(entry.favorited_at);

          // [核心] 构建包含收藏时间的头部
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
    
      // [核心新增] 添加注释的显示逻辑
      const annotationHTML = entry.annotation ? `
        <div class="verse-annotation-wrapper">
          <div class="verse-annotation-title">【注释】</div>
          <div class="verse-annotation">${this.escapeHtml(entry.annotation)}</div>
        </div>
      ` : '';
    
          // 卡片结构现在非常干净
        cardWrapper.innerHTML = `
          ${verseHeaderHTML}
          <blockquote class="verse-original">${this.escapeHtml(entry.original_text)}</blockquote>
          <p class="verse-translation">【译文】${this.escapeHtml(entry.translation)}</p>
          ${annotationHTML}
          <div class="analects-card-footer-placeholder"></div>
        `;

          container.appendChild(cardWrapper);
        });
      
        this.initializeChapterPage();

        const allDisplayedMessage = document.createElement('div');
        allDisplayedMessage.className = 'analects-load-complete';
        allDisplayedMessage.style.display = 'block';
        allDisplayedMessage.innerHTML = '<span class="analects-load-complete-text">—— ✨ 已全部显示完毕 ✨ ——</span>';
        container.appendChild(allDisplayedMessage);
      }
    } catch (error) {
      console.error('渲染收藏页面失败:', error);
      container.innerHTML = '<div class="analects-daily-error text-center py-8">加载收藏失败，请稍后重试。</div>';
    }
  }

	// [最终修复版 V2] 初始化章节页，确保使用完整数据重新渲染卡片
	async initializeChapterPage() {
	  if (!this.sessionInitialized) {
	    await new Promise(resolve => setTimeout(resolve, 100));
	    return this.initializeChapterPage();
	  }

	  const verseCards = document.querySelectorAll('.verse-card');
	  if (verseCards.length === 0) return;

	  for (const card of verseCards) {
	    const entryId = parseInt(card.dataset.entryId, 10);
	    if (isNaN(entryId)) continue;

	    const entry = await this._getEntryDataForHydration(entryId);
	    if (!entry) continue;

	    // [核心修正] 在章节页和收藏页，明确指出不显示标签
	    card.innerHTML = this.generateResultCardHTML(entry, { showTags: false });
	  }

	  this._ensureIconsRendered();
	}
	
	// [最终完整版] 生成卡片页脚
	_generateCardFooterHTML(entry) {
	  if (!entry) return '';

	  const isFavorited = this.favoriteIds.has(entry.id);

	  let noteHTML = '';
	  if (isFavorited && entry.user_insight) {
	    const insightText = this.escapeHtml(entry.user_insight);
	    const isLongInsight = (insightText.split('\n').length > 4 || insightText.length > 150);
	    const noteTimestamp = this.formatTimeAgo(entry.insight_updated_at || entry.favorited_at);
      noteHTML = `
        <div class="user-insight-wrapper">
          <div class="user-insight-header">
            <div class="user-insight-title">
              <span>我的笔记</span>
            </div>
            <span class="insight-timestamp">${noteTimestamp}</span>
          </div>
          <div class="user-insight-content">
            <p class="insight-text ${isLongInsight ? 'is-truncated' : ''}">${insightText}</p>
            ${isLongInsight ? '<button class="insight-toggle-btn">展开阅读</button>' : ''}
          </div>
        </div>
      `;
    }

	  const favoriteButtonHTML = `
      <button 
        class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
        data-entry-id="${entry.id}" 
        title="${isFavorited ? '取消收藏' : '收藏此条'}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>
        <div class="spinner"></div>
      </button>
    `;

	  const editNoteButtonHTML = isFavorited ? `<button class="edit-insight-btn pill-style" data-entry-id="${entry.id}"><span>${entry.user_insight ? '编辑笔记' : '添加笔记'}</span></button>` : '<div></div>';
  
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
	        <div class="flex items-center gap-2">
	          ${favoriteButtonHTML}
	          ${editNoteButtonHTML}
	        </div>
	        ${shareMenuHTML}
	      </div>
	      ${noteHTML}
	    </div>
	  `;
	}

// [最终修复版 V2] 一个更稳健的辅助函数，用于获取单条数据以供“注水”
  async _getEntryDataForHydration(entryId) {
    // 步骤 1: 确保我们一定能获取到完整的原文基础数据
    let baseEntry = this.entryCache.get(entryId);

    // 如果缓存中没有，或者缓存中的数据不完整，则从网络获取
    // 我们通过检查一个只有网络请求才会有的字段（比如 entry_characters）来判断数据是否完整
    if (!baseEntry || !baseEntry.hasOwnProperty('entry_characters')) {
      try {
        const data = await this.apiRequest('analects_entries_expanded', {
          select: '*,entry_characters(character_id,characters(id,name)),entry_arguments(argument_id,arguments(id,title)),entry_proverbs(proverbs(*))',
          id: `eq.${entryId}`
        });
        if (data && data.length > 0) {
          baseEntry = data[0];
          this.entryCache.set(entryId, baseEntry); // 用从网络获取的完整数据更新缓存
        } else {
          console.error(`无法找到 ID 为 ${entryId} 的条目`);
          return null;
        }
      } catch (error) {
        console.error(`获取 ID 为 ${entryId} 的条目数据失败:`, error);
        return null;
      }
    }

    // 步骤 2: 检查是否存在用户笔记数据，如果存在，则进行合并
    if (this.favoritesDataCache.has(entryId)) {
      const userEntry = this.favoritesDataCache.get(entryId);
      // 将用户数据（笔记等）合并到完整的原文基础数据上
      return { ...baseEntry, ...userEntry };
    }

    // 步骤 3: 如果没有用户笔记数据，则直接返回完整的原文基础数据
    return baseEntry;
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
    // const successDiv = document.getElementById('auth-success-message');

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

  // [最终修复版 V2] 收藏或取消收藏 (恢复了收藏页的移除动画)
	async toggleFavorite(entryId, targetButton) {
	  if (!this.currentUser) {
	    this.showAuthModal('login');
	    return;
	  }
	  if (!targetButton || targetButton.classList.contains('is-loading')) {
	    return;
	  }

	  targetButton.classList.add('is-loading');
	  targetButton.disabled = true;
	  const isFavorited = this.favoriteIds.has(entryId);
  
	  try {
	    let error;
	    if (isFavorited) {
	      // --- 取消收藏 ---
	      const hasNote = this.favoritesDataCache.get(entryId)?.user_insight;
	      if (hasNote) {
	        const confirmed = await this.showConfirmationModal('确认取消收藏？', '此条目包含您的笔记，取消收藏将会永久删除这条笔记。您确定要继续吗？');
	        if (!confirmed) {
	          targetButton.classList.remove('is-loading');
            targetButton.disabled = false;
	          return;
	        }
	      }
	      const result = await this.supabase.from('user_favorites').delete().match({ user_id: this.currentUser.id, entry_id: entryId });
	      error = result.error;
	      if (!error && window.showToast) window.showToast('已取消收藏');
	    } else {
	      // --- 收藏 ---
	      const { data: insertedData, error: insertError } = await this.supabase.from('user_favorites').insert({ user_id: this.currentUser.id, entry_id: entryId }).select().single();
	      error = insertError;
	      if (!error && window.showToast) window.showToast('收藏成功！');
	    }
	    if (error) throw error;
    
	    // 操作成功后，重新加载最新的收藏状态
	    await this._loadUserFavorites();

	    // [核心修正] 判断当前页面并执行不同的UI更新策略
	    if (isFavorited && window.location.pathname.includes('/my-favorites.html')) {
	        // 如果是在收藏页取消收藏，则执行移除动画
	        const card = document.querySelector(`.verse-card[data-entry-id="${entryId}"]`);
	        if (card) {
	            // 为了动画效果，先记录卡片高度
	            card.style.setProperty('--card-height', `${card.offsetHeight}px`);
	            card.classList.add('is-removing');
	            setTimeout(() => {
	                card.remove();
	            }, 500); // 动画时长为0.5秒
	        }
	    } else {
	        // 在其他页面，或者在执行“收藏”操作时，正常刷新卡片状态
	        await this._refreshCardUI(entryId);
	    }

	  } catch (error) {
	    console.error('收藏操作失败:', error);
	    if (window.showToast) window.showToast('操作失败，请稍后重试', true);
	  } finally {
	    targetButton.classList.remove('is-loading');
		targetButton.disabled = false;
	  }
	}
	
	// [最终修复版 V3] 统一的、智能的卡片UI刷新函数 (兼容每日论语)
	async _refreshCardUI(entryId) {
	  const card = document.querySelector(`.verse-card[data-entry-id="${entryId}"], .analects-result-card[data-entry-id="${entryId}"]`);
  
	  if (card) {
	    const fullEntryData = await this._getEntryDataForHydration(entryId);
	    if (!fullEntryData) return;
        
        // [核心修正] 判断卡片是否在搜索结果区，来决定是否显示标签
        const isSearchResult = card.closest('#analects-results-container');
	    card.innerHTML = this.generateResultCardHTML(fullEntryData, { showTags: !!isSearchResult });

	  } else {
	    const dailyFavoriteBtn = document.querySelector(`.analects-daily .favorite-btn[data-entry-id="${entryId}"]`);
	    if (dailyFavoriteBtn) {
	      const isFavorited = this.favoriteIds.has(entryId);
	      dailyFavoriteBtn.classList.toggle('favorited', isFavorited);
	      dailyFavoriteBtn.title = isFavorited ? '取消收藏' : '收藏此条';
	    }
	  }
  
	  this._ensureIconsRendered();
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
	
	// [最终修复版 V4] 处理笔记表单的提交
	async _handleNoteFormSubmit(event) {
	  event.preventDefault();
	  const form = event.target;
	  const saveButton = form.querySelector('button[type="submit"]');
	  const originalButtonText = saveButton.textContent;
	  const entryId = parseInt(form.dataset.entryId, 10);
	  const newInsight = form.insight.value;
	  const errorDiv = form.querySelector('#note-error-message');
	  if (isNaN(entryId)) return;

	  saveButton.disabled = true;
	  saveButton.textContent = '保存中...';
	  errorDiv.textContent = '';

	  try {
	    const { data: updatedFavorite, error } = await this.updateFavoriteInsight(entryId, newInsight);
	    if (error) throw error;
    
	    // [核心] 保存成功后，更新缓存并调用统一的刷新函数
	    if (updatedFavorite) {
	        this.favoritesDataCache.set(entryId, {
	            user_insight: updatedFavorite.user_insight,
	            insight_updated_at: updatedFavorite.insight_updated_at,
	            favorited_at: updatedFavorite.created_at
	        });
	    }
	    await this._refreshCardUI(entryId);
    
	    if (window.showToast) window.showToast('笔记已保存！');
	    this.closeNoteEditorModal();
	  } catch (error) {
	    console.error('保存笔记失败:', error); 
	    errorDiv.textContent = '保存失败，请稍后重试。';
	    if (window.showToast) window.showToast('保存失败', true);
	  } finally {
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
    const allCards = document.querySelectorAll('.analects-result-card, .verse-card');
    allCards.forEach(card => {
      const entryId = parseInt(card.dataset.entryId, 10);
      if (isNaN(entryId)) return;

      const originalEntry = this.entryCache.get(entryId);
      if (originalEntry) {
        // [核心修正] 判断卡片是否在搜索结果区，并传递正确的 options
        const isSearchResult = card.closest('#analects-results-container');
        card.innerHTML = this.generateResultCardHTML(originalEntry, { showTags: !!isSearchResult });
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
      const allCards = containerElement.querySelectorAll('.verse-card');

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