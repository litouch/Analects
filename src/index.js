import { createClient } from '@supabase/supabase-js';
import CoreSDK from './CoreSDK'; // [核心修改] 引入基类

// 论语 SDK - 完整功能版
class AnalectsSDK extends CoreSDK { // [核心修改] 继承 CoreSDK
  constructor(config = {}) {
    // 这个 super() 调用现在会正确地、仅一次地触发我们在 AnalectsSDK 中重写的
    // _initializeSupabaseClient 方法，从而创建唯一的 Supabase 实例。
    super(config); // [核心修改] 调用父类的构造函数

    // [保留] 以下是完整版独有的属性
    this.currentUser = null;
	this.favoriteIds = new Set(); // [新增] 用于存储用户已收藏条目的ID
	this.favoritesDataCache = new Map();
	
    // [核心新增] 添加一个标志，用于跟踪初始会话是否已加载
    this.sessionInitialized = false; 
    
        // [新增] 为“我的笔记”页面添加独立的分页状态管理
    this.notesPagination = {
      pageSize: 10,
      currentPage: 0,
      isLoading: false,
      hasMore: true,
      totalCount: 0
    };

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
          // [最终修复] 处理第三方登录（如Google）成功后的回调
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
      this.renderGlobalHeader(); // [最终修复] 确保页头在初始化后立即渲染
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
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'verse-card';
      cardWrapper.setAttribute('data-entry-id', entry.id);
      cardWrapper.innerHTML = this.generateResultCardHTML(entry, { showTags: true });
      resultsContainer.appendChild(cardWrapper);
      
      // [修复] 添加 animate-in 类，让卡片可见。使用微小延迟确保CSS过渡生效。
      setTimeout(() => {
        cardWrapper.classList.add('animate-in');
      }, 10 * index); // staggered animation
    });

    // 在渲染完成后，为新生成的卡片绑定下拉菜单事件
    setTimeout(() => {
        this._attachCardActionListeners(resultsContainer);
        this._ensureIconsRendered();
    }, uniqueResults.length * 50 + 100);
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
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'verse-card';
            cardWrapper.setAttribute('data-entry-id', entry.id);
            cardWrapper.innerHTML = this.generateResultCardHTML(entry, { showTags: true });
            resultsContainer.appendChild(cardWrapper);

            // [修复] 为滚动加载出的卡片也添加 animate-in 类
            setTimeout(() => {
                cardWrapper.classList.add('animate-in');
            }, 10 * index); // staggered animation
        });
        
        // 为滚动加载出的新卡片也绑定事件
        setTimeout(() => {
            this._attachCardActionListeners(resultsContainer);
            this._ensureIconsRendered();
        }, uniqueResults.length * 50 + 100);

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
async _handleGlobalClick(event) {
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
      const card = editInsightButton.closest('.verse-card, .analects-result-card');
      
      const myInsightWrapper = card ? card.querySelector('.my-insight-wrapper') : null;
      const insightTextEl = myInsightWrapper ? myInsightWrapper.querySelector('.insight-text') : null;
      
      const currentInsight = insightTextEl ? insightTextEl.textContent : '';
      if (!isNaN(entryId)) {
        this.showNoteEditorModal(entryId, currentInsight);
      }
      return;
    }

    // [最终UI优化版 V2] 处理“查看对照”按钮的点击
    const comparisonButton = event.target.closest('.view-comparison-btn');
    if (comparisonButton) {
        event.preventDefault();
        const entryId = comparisonButton.dataset.entryId;
        const currentState = comparisonButton.dataset.state;
        const card = comparisonButton.closest('.verse-card');
        const container = card.querySelector('.comparison-notes-container');
        const buttonText = comparisonButton.querySelector('span');

        if (currentState === 'shown') {
            // 如果已显示，则收起
            container.innerHTML = '';
            buttonText.textContent = '查看对照笔记';
            comparisonButton.dataset.state = 'idle';
        } else if (currentState === 'idle') {
            // 如果是初次点击，则立即进入加载状态
            comparisonButton.dataset.state = 'loading';
            comparisonButton.classList.add('is-loading');
            buttonText.textContent = '加载中...'; // 立即提供文字反馈

            try {
                // 异步获取数据
                const { data: notes, error } = await this.supabase.rpc('get_comparison_notes_for_entry', { p_entry_id: entryId });
                if (error) throw error;
                
                const noteCount = notes ? notes.length : 0;

                if (noteCount > 0) {
                    container.innerHTML = notes.map(note => {
                        const noteTimestamp = this.formatTimeAgo(note.updated_at);
                        const insightText = this.escapeHtml(note.note_text);
                        const isLongInsight = (insightText.split('\n').length > 4 || insightText.length > 150);
                        return `
                        <div class="user-insight-wrapper sharer-insight-wrapper" style="background-color: #fefce8; border-color: #fef08a;">
                            <div class="user-insight-header">
                                <div class="user-insight-title" style="color: #a16207;">
                                    <span>Ta的笔记 (来自 ${this.escapeHtml(note.author_email)})</span>
                                </div>
                                <span class="insight-timestamp" style="color: #ca8a04;">${noteTimestamp}</span>
                            </div>
                            <div class="user-insight-content">
                                <p class="insight-text ${isLongInsight ? 'is-truncated' : ''}" style="color: #a16207;">${insightText}</p>
                                ${isLongInsight ? '<button class="insight-toggle-btn" style="color: #a16207;">展开阅读</button>' : ''}
                            </div>
                        </div>`;
                    }).join('');
                    buttonText.textContent = `收起对照笔记 (${noteCount})`;
                    comparisonButton.dataset.state = 'shown';
                } else {
                    buttonText.textContent = '无对照笔记';
                    comparisonButton.dataset.state = 'no_notes';
                    comparisonButton.disabled = true;
                }
            } catch (err) {
                console.error('获取对照笔记失败:', err);
                buttonText.textContent = '加载失败';
                comparisonButton.dataset.state = 'idle'; // 允许重试
            } finally {
                // 无论成功失败，都移除加载状态的CSS类
                comparisonButton.classList.remove('is-loading');
            }
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

    const moreOptionsButton = event.target.closest('.more-options-btn');
    if (!moreOptionsButton) {
        const activeCardDropdown = document.querySelector('.card-actions-dropdown.active');
        if (activeCardDropdown && !event.target.closest('.card-actions-container')) {
            activeCardDropdown.classList.remove('active');
        }
    }
}

  // [新增] 重写 renderDailyAnalect 以添加收藏按钮状态更新的逻辑
  async renderDailyAnalect(container) {
    // 1. 首先，调用父类 (CoreSDK) 的同名方法来完成基础的渲染工作
    await super.renderDailyAnalect(container);

    // 2. 在基础渲染完成后，执行只有完整版SDK才有的额外操作：更新收藏按钮的UI
    this._updateFavoriteButtonsUI();
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
  generateResultCardHTML(entry, options = {}, myFavoriteData = null, sharerFavoriteData = null, hasLenders = false, comparisonEntryIds = new Set()) {
      if (!entry) return '';

      const { showTags = false } = options;

      // --- 1. 数据准备 ---
      const currentKeyword = this.currentFilters?.keyword || '';
      
      const finalMyFavoriteData = myFavoriteData || this.favoritesDataCache.get(entry.id);
      const isFavoritedByMe = this.favoriteIds.has(entry.id);
      const timeAgo = isFavoritedByMe && finalMyFavoriteData?.favorited_at ? this.formatTimeAgo(finalMyFavoriteData.favorited_at) : '';
    
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

      // --- 3. 构建卡片内容区 (原文、译文、注释) ---
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
      if (showTags) {
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
            ${createTagGroup('论点', argumentsList, 'target', 'argument')}
            ${createTagGroup('谚语', proverbs, 'message-square-quote', 'proverb')}
          </div>
        ` : '';
      }

      // --- 5. 构建页脚 ---
      // [修复] 将接收到的 hasLenders 和 comparisonEntryIds 参数传递下去
      const footerHTML = this._generateCardFooterHTML(entry, finalMyFavoriteData, sharerFavoriteData, hasLenders, comparisonEntryIds);
    
      // --- 6. 组合成最终的卡片HTML ---
      return verseHeaderHTML + contentHTML + tagsHTML + footerHTML;
  }

// [修改] 函数名：getMyFavorites -> getMyNotes, 并更新注释和错误信息
// [升级版] 获取我的笔记列表（包含笔记更新时间）
async getMyNotes() {
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

      // [修改] 变量名 favorites -> myNotes
      const myNotes = data.map(item => {
        if (!item.analects_entries) return null;
        return {
          ...item.analects_entries,
          favorited_at: item.created_at,
          user_insight: item.user_insight,
          insight_updated_at: item.insight_updated_at
        };
      }).filter(Boolean);
      
      // [修改] 返回新的变量
      return myNotes;
    } catch (error) {
      // [修改] 更新错误日志文本
      console.error('获取我的笔记列表失败:', error);
      return [];
    }
}

// [优化版] 根据 email 生成带背景色的首字母头像 HTML
  _generateInitialsAvatar(email) {
    if (!email) return `<div class="initials">?</div>`;

    // [核心修改] 检查首字母是否为英文字母
    let initial = email[0].toUpperCase();
    if (!/^[A-Z]$/.test(initial)) {
      initial = 'U'; // 如果不是字母，则默认为 'U' (代表 User)
    }
    
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#34d399', '#22d3ee', '#60a5fa', '#818cf8', '#c084fc'];
    const color = colors[Math.abs(hash % colors.length)];

    return `<div class="initials" style="background-color: ${color}; color: white; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${initial}</div>`;
  }

  // [新增] 统一获取用户头像的 HTML (Google 或首字母)
  _getAvatarHTML(user) {
    if (!user) return this._generateInitialsAvatar('?');

    const metadata = user.user_metadata;
    if (metadata && metadata.avatar_url) {
      return `<img src="${metadata.avatar_url}" alt="用户头像">`;
    }
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
                            <a href="/my-notes.html" class="dropdown-item"><i data-lucide="bookmark"></i><span>我的笔记</span></a>
                            <a href="/shared-with-me.html" class="dropdown-item"><i data-lucide="users"></i><span>共享空间</span></a>
                            <a href="/share-management.html" class="dropdown-item"><i data-lucide="share-2"></i><span>分享管理</span></a>
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
        
        const dropdown = button.nextElementSibling;
        
        if (dropdown && dropdown.classList.contains('user-dropdown-menu')) {
          const wasActive = dropdown.classList.contains('active');
          
          document.querySelectorAll('.user-dropdown-menu').forEach(d => d.classList.remove('active'));
          
          if (!wasActive) {
            dropdown.classList.add('active');
          }
        }
      });
    });

    // 3. [核心修正] 为页面上“所有”的登出按钮绑定事件
    document.querySelectorAll('.dropdown-item.logout').forEach(logoutBtn => {
      logoutBtn.addEventListener('click', () => this.signOut());
    });
    
    // 4. 确保图标被正确渲染
    this._ensureIconsRendered();
  }
	
	// [最终统一版] 初始化页头动态效果
	_initializeHeaderAnimation() {
	    const sentinel = document.getElementById('header-sentinel');
	    const headerWrapper = document.getElementById('global-header-wrapper');

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

// [最终版] 渲染“我的笔记”页面，并实现完整的“对照模式”和“多彩徽章”功能
async renderMyNotesPage(container) {
    if (!container) {
      console.error('“我的笔记”页面的容器未找到');
      return;
    }

    if (!this.currentUser) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <p class="text-lg">请先登录以查看您的笔记。</p>
          <a href="/" class="text-blue-600 hover:underline mt-4 inline-block">&larr; 返回首页进行登录</a>
        </div>
      `;
      return;
    }

    // 重置分页状态
    this.notesPagination = { pageSize: 10, currentPage: 0, isLoading: false, hasMore: true, totalCount: 0 };

    try {
      // 在开始分页前，一次性获取所有存在对照笔记的ID列表
      const { data: comparisonIdsData, error: idsError } = await this.supabase.rpc('get_lender_note_entry_ids');
      if (idsError) throw idsError;
      this.currentComparisonIds = new Set(comparisonIdsData.map(item => item.entry_id));
      const hasLenders = this.currentComparisonIds.size > 0;

      const globalControls = document.getElementById('global-comparison-controls');
      if (globalControls) {
        globalControls.style.display = hasLenders ? 'block' : 'none';
      }
      
      const { data: count, error: countError } = await this.supabase.rpc('get_my_notes_count');
      if (countError) throw countError;
      
      this.notesPagination.totalCount = count;

      const countContainer = document.getElementById('notes-count');
      const countText = document.querySelector('#notes-count .count-text');

      if (countText && countContainer) {
          countText.textContent = count;

          // 根据笔记数量决定徽章颜色等级
          let tierClass = 'badge-tier-1';
          if (count >= 11) tierClass = 'badge-tier-2';
          if (count >= 51) tierClass = 'badge-tier-3';
          if (count >= 101) tierClass = 'badge-tier-4';
          if (count >= 512) tierClass = 'badge-tier-5';
          
          countContainer.classList.remove('badge-tier-1', 'badge-tier-2', 'badge-tier-3', 'badge-tier-4', 'badge-tier-5', 'animate');
          countContainer.classList.add(tierClass);

          // 触发动画
          setTimeout(() => {
            countContainer.classList.add('animate');
          }, 100);
      }
      
      // 确保 Lucide 图标被渲染
      this._ensureIconsRendered();

      if (count === 0) {
        if (countContainer) countContainer.style.display = 'none';

        container.innerHTML = `
          <div class="text-center text-gray-500 py-8">
              <p class="text-lg">您还没有任何笔记。</p>
              <a href="/" class="text-blue-600 hover:underline mt-4 inline-block">去首页浏览并收藏</a>
          </div>`;
        return;
      }

      // 加载第一页
      await this.loadMoreNotes();

      // 为全局开关绑定事件监听器
      const globalToggle = document.getElementById('global-comparison-toggle');
      if (globalToggle) {
        globalToggle.addEventListener('change', (event) => {
          if (event.target.checked) {
            const idleButtons = document.querySelectorAll('.view-comparison-btn[data-state="idle"]');
            idleButtons.forEach((btn, index) => {
              setTimeout(() => {
                btn.click();
              }, index * 200);
            });
          } else {
            const shownButtons = document.querySelectorAll('.view-comparison-btn[data-state="shown"]');
            shownButtons.forEach(btn => {
              btn.click();
            });
          }
        });
      }

      // 设置滚动监听器
      window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
          this.loadMoreNotes();
        }
      });

    } catch (error) {
      console.error('初始化笔记页面失败:', error);
      container.innerHTML = '<div class="analects-daily-error text-center py-8">加载笔记失败，请稍后重试。</div>';
    }
}

// [最终重构版] 初始化章节页，采用并行获取、同步渲染的稳定模式
	async initializeChapterPage() {
	  const verseCards = document.querySelectorAll('.verse-card');
	  if (verseCards.length === 0) return;

	  try {
	    // 1. 一次性收集所有需要获取数据的卡片ID
	    const entryIds = Array.from(verseCards).map(card => parseInt(card.dataset.entryId, 10)).filter(id => !isNaN(id));

	    // 2. 并行地、一次性地获取所有卡片所需的数据
	    const entriesData = await Promise.all(
	      entryIds.map(id => this._getEntryDataForHydration(id))
	    );
	    
	    // 将数据整理成一个 Map，方便快速查找
	    const entriesMap = new Map(entriesData.filter(e => e).map(e => [e.id, e]));

	    // 3. 同步地、快速地渲染所有卡片
	    verseCards.forEach(card => {
	      const entryId = parseInt(card.dataset.entryId, 10);
	      const entry = entriesMap.get(entryId);
	      if (entry) {
	        card.innerHTML = this.generateResultCardHTML(entry, { showTags: false });
	      }
	    });

	    // 4. 在所有卡片都稳定渲染后，再统一绑定事件
	    this._attachCardActionListeners(document);
	    this._ensureIconsRendered();

	  } catch (error) {
	    console.error('初始化章节页失败:', error);
	  }
	}
	
// [最终完整版] 生成卡片页脚
_generateCardFooterHTML(entry, myFavoriteData, sharerFavoriteData, hasLenders = false, comparisonEntryIds = new Set()) {
    if (!entry) return '';

    // 1. "我的" 收藏和笔记相关数据
    const isFavoritedByMe = this.favoriteIds.has(entry.id);
    const myInsight = myFavoriteData?.user_insight;
    const myInsightUpdatedAt = myFavoriteData?.insight_updated_at;
    const myFavoritedAt = myFavoriteData?.favorited_at;

    // 2. "分享者" 的笔记相关数据
    const sharerInsight = sharerFavoriteData?.sharer_insight;
    const sharerInsightUpdatedAt = sharerFavoriteData?.sharer_insight_updated_at;
    const sharerFavoritedAt = sharerFavoriteData?.sharer_favorited_at;

    // 3. 构建 "我的笔记" HTML区块
    let myNoteHTML = '';
    if (isFavoritedByMe && myInsight) {
        const insightText = this.escapeHtml(myInsight);
        const isLongInsight = (insightText.split('\n').length > 4 || insightText.length > 150);
        const noteTimestamp = this.formatTimeAgo(myInsightUpdatedAt || myFavoritedAt);
        myNoteHTML = `
        <div class="user-insight-wrapper my-insight-wrapper">
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

    // 4. 构建 "Ta的笔记" HTML区块
    let sharerNoteHTML = '';
    if (sharerInsight) {
        const insightText = this.escapeHtml(sharerInsight);
        const isLongInsight = (insightText.split('\n').length > 4 || insightText.length > 150);
        const noteTimestamp = this.formatTimeAgo(sharerInsightUpdatedAt || sharerFavoritedAt);
        sharerNoteHTML = `
        <div class="user-insight-wrapper sharer-insight-wrapper" style="background-color: #fefce8; border-color: #fef08a;">
            <div class="user-insight-header">
            <div class="user-insight-title" style="color: #a16207;">
                <span>Ta的笔记</span>
            </div>
            <span class="insight-timestamp" style="color: #ca8a04;">${noteTimestamp}</span>
            </div>
            <div class="user-insight-content">
            <p class="insight-text ${isLongInsight ? 'is-truncated' : ''}" style="color: #a16207;">${insightText}</p>
            ${isLongInsight ? '<button class="insight-toggle-btn" style="color: #a16207;">展开阅读</button>' : ''}
            </div>
        </div>
        `;
    }

    // 5. 构建收藏和编辑按钮
    const favoriteButtonHTML = `
    <button 
        class="favorite-btn ${isFavoritedByMe ? 'favorited' : ''}" 
        data-entry-id="${entry.id}" 
        title="${isFavoritedByMe ? '取消收藏' : '收藏此条'}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>
        <div class="spinner"></div>
    </button>
    `;

    const editNoteButtonHTML = isFavoritedByMe ? `<button class="edit-insight-btn pill-style" data-entry-id="${entry.id}"><span>编辑笔记</span></button>` : '';

    // [核心修改] 移除按钮内部的 spinner div
    const showComparisonButton = isFavoritedByMe && comparisonEntryIds.has(entry.id);
    const comparisonButtonHTML = showComparisonButton ? `
        <button class="view-comparison-btn pill-style-yellow" data-entry-id="${entry.id}" data-state="idle">
            <span>查看对照笔记</span>
        </button>
    ` : '';
  
    // 6. 构建分享菜单
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

    // 7. 最终组合
    return `
        <div class="analects-card-footer">
            <div class="footer-actions">
                <div class="flex items-center gap-2 flex-wrap">
                    ${favoriteButtonHTML}
                    ${editNoteButtonHTML}
                    ${comparisonButtonHTML}
                </div>
                ${shareMenuHTML}
            </div>
            
            <div class="comparison-notes-container"></div>
            
            ${sharerNoteHTML}
            ${myNoteHTML}
        </div>
    `;
}

// [最终修复版 V2] 一个更稳健的辅助函数，用于获取单条数据以供“注水”
  async _getEntryDataForHydration(entryId) {
    // 步骤 1: 确保我们一定能获取到完整的原文基础数据
    let baseEntry = this.entryCache.get(entryId);

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
      const userEntryData = this.favoritesDataCache.get(entryId);
      // 将用户数据（笔记等）合并到完整的原文基础数据上
      return { ...baseEntry, ...userEntryData };
    }

    // 步骤 3: 如果没有用户笔记数据，则直接返回完整的原文基础数据
    return baseEntry;
  }

  // [最终版] 渲染全局浮动组件
  renderGlobalWidget(container) {
    if (!container) return;
    this.widgetContainer = container;

    const currentPage = window.location.pathname;
    let widgetHTML = '';

    if (this.currentUser) {
      container.classList.add('logged-in');
      container.classList.remove('logged-out');

      const isHomeActive = (currentPage === '/' || currentPage.includes('/index.html'));
      const isNotesActive = currentPage.includes('/my-notes.html');

      widgetHTML = `
        <a href="/" class="app-footer-action ${isHomeActive ? 'active' : ''}">
          <i data-lucide="home"></i><span>首页</span>
        </a>
        <a href="/my-notes.html" class="app-footer-action ${isNotesActive ? 'active' : ''}">
          <i data-lucide="bookmark"></i><span>我的笔记</span>
        </a>

        <div class="app-footer-menu-container">
          <button id="global-account-btn" class="app-footer-action">
            <i data-lucide="user"></i><span>我的账号</span>
          </button>
          <div id="global-account-menu" class="app-footer-submenu">
            <a href="/shared-with-me.html" class="app-footer-submenu-item">
              <i data-lucide="users"></i><span>共享空间</span>
            </a>
            <a href="/share-management.html" class="app-footer-submenu-item">
              <i data-lucide="share-2"></i><span>分享管理</span>
            </a>
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

    if (accountBtn && accountMenu) {
      accountBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        accountMenu.classList.toggle('active');
      });
    }

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
		  redirectTo: window.location.origin
		}
	  });
	  if (error) {
	    // 如果跳转失败，最好把标志移除，以防万一
	    sessionStorage.removeItem('justLoggedIn');
	    console.error('Google 登录跳转失败:', error);
	  }
	}
	
  // [修改] 登出时需要检查的页面路径也需要更新
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
    
      const currentPage = window.location.pathname;
      if (
        currentPage.includes('/my-notes.html') || 
        currentPage.includes('/account.html') ||
        currentPage.includes('/shared-with-me.html') ||
        currentPage.includes('/view-notebook.html') ||
        currentPage.includes('/share-management.html') // <-- [新增] 添加新页面
      ) {
        setTimeout(() => {
          window.location.href = '/'; 
        }, 500);
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
  async deleteCurrentUser() {
    if (!this.currentUser) {
      return { error: new Error('用户未登录') };
    }
    
    console.warn('此为模拟删除。生产环境请替换为安全的 Edge Function 调用。');
    
    const { data, error } = await this.supabase.functions.invoke('delete-user', {
      method: 'POST',
    });

    if (error) {
      return { error };
    }

    await this.signOut(); 
    return { data };
  }
	
  // [新增] 显示模态窗口的主方法
  showAuthModal(view = 'login') {
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

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        // [核心修正] 根据当前是登录(login)还是注册(signup)视图，显示不同的文本
        submitBtn.textContent = view === 'login' ? '登录中...' : '注册中...';

        const email = form.email.value;
        const password = form.password.value;
        errorDiv.textContent = '';
        
        try {
            let result;
            if (view === 'login') {
              result = await this.signIn(email, password);
            } else {
              result = await this.signUp(email, password);
            }
    
            if (result.error) {
              errorDiv.textContent = result.error.message;
            } else {
              // [最终修复] 对于邮箱登录，在这里直接关闭弹窗并提示
              if (view === 'login') {
                this.closeAuthModal();
                if (window.showToast) {
                  window.showToast('登录成功，欢迎回来！');
                }
              }
              // 对于注册，显示成功视图
              if (view === 'signup') {
                const formContainer = document.getElementById('auth-modal-form-container');
                this._renderSignupSuccessView(formContainer, email);
              }
            }
        } finally {
            // [最终修复] 只有在登录失败或注册流程中才恢复按钮，成功登录则弹窗已关闭
            if (view === 'login' && errorDiv.textContent) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            } else if (view === 'signup' && errorDiv.textContent) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
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

  // [升级版] 显示自定义的居中确认弹窗（支持自定义按钮文字）
  async showConfirmationModal(title, message, confirmText = '确认') {
    return new Promise((resolve) => {
      if (document.getElementById('analects-confirm-modal')) return;

      const modalHTML = `
        <div id="analects-confirm-modal" class="confirm-modal-overlay">
          <div class="confirm-modal-content">
            <h3>${this.escapeHtml(title)}</h3>
            <p>${this.escapeHtml(message)}</p>
            <div class="confirm-modal-actions">
              <button id="confirm-cancel-btn" class="confirm-modal-btn cancel">取消</button>
              <button id="confirm-ok-btn" class="confirm-modal-btn confirm">${this.escapeHtml(confirmText)}</button>
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
        resolve(result);
      };

      confirmBtn.addEventListener('click', () => closeModal(true));
      cancelBtn.addEventListener('click', () => closeModal(false));
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'analects-confirm-modal') {
          closeModal(false);
        }
      });
    });
  }

// index.js

// 收藏或取消收藏 - [修改，增加新功能]
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
  
  // [新增] 判断是否是每日论语的收藏按钮
  const isDailyAnalect = !!targetButton.closest('.analects-daily');

  try {
    let error;
    if (isFavorited) {
      // --- 取消收藏 ---
      const hasNote = this.favoritesDataCache.get(entryId)?.user_insight;
      if (hasNote) {
        const confirmed = await this.showConfirmationModal('确认取消收藏？', '此条目包含您的笔记，取消收藏将会永久删除这条笔记。您确定要继续吗？', '确认删除');
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
      if (!error) {
        // [核心修改] 根据您的要求，使用升级版的 showToast
        if (isDailyAnalect) {
            const message = '已收藏至我的笔记本 > <a href="/my-notes.html" class="font-bold text-white underline hover:text-blue-200">立即添加笔记 &rarr;</a>';
            if (window.showToast) window.showToast(message);
        } else {
            if (window.showToast) window.showToast('收藏成功！');
        }
      }
    }
    if (error) throw error;

    await this._loadUserFavorites();
    
    const currentPagePath = window.location.pathname;
    if (isFavorited && currentPagePath.includes('/my-notes.html')) {
        const card = document.querySelector(`.verse-card[data-entry-id="${entryId}"]`);
        if (card) {
            card.style.setProperty('--card-height', `${card.offsetHeight}px`);
            card.classList.add('is-removing');
            setTimeout(() => {
                card.remove();
                const container = document.getElementById('notes-list-container');
                if (container && !container.querySelector('.verse-card')) {
                    container.innerHTML = `<div class="text-center text-gray-500 py-8"><p class="text-lg">您还没有任何笔记。</p><a href="/" class="text-blue-600 hover:underline mt-4 inline-block">去首页浏览并收藏</a></div>`;
                }
            }, 500);
        }
    } else if (currentPagePath.includes('/view-shared-notes.html')) {
        // [新增] 在共享页面，刷新整个容器来保证状态绝对正确
        const container = document.getElementById('notebook-view-container');
        const urlParams = new URLSearchParams(window.location.search);
        const lenderId = urlParams.get('lender_id');
        if (container && lenderId) {
            await this.renderSharedNotebook(container, lenderId);
        }
    } else {
        await this._refreshCardUI(entryId);
    }

  } catch (error) {
    console.error('收藏操作失败:', error);
    if (window.showToast) window.showToast('操作失败，请稍后重试', true);
  } finally {
    if (targetButton && targetButton.isConnected) {
        targetButton.classList.remove('is-loading');
        targetButton.disabled = false;
    }
  }
}
	
	// [最终修复版 V3] 统一的、智能的卡片UI刷新函数 (兼容每日论语)
	async _refreshCardUI(entryId) {
	  const card = document.querySelector(`.verse-card[data-entry-id="${entryId}"], .analects-result-card[data-entry-id="${entryId}"]`);
  
	  if (card) {
	    const fullEntryData = await this._getEntryDataForHydration(entryId);
	    if (!fullEntryData) return;
        
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
    
	    if (updatedFavorite) {
	        this.favoritesDataCache.set(entryId, {
	            user_insight: updatedFavorite.user_insight,
	            insight_updated_at: updatedFavorite.insight_updated_at,
	            favorited_at: updatedFavorite.created_at
	        });
	    }
        
        // [核心修改] 根据页面决定刷新策略
        if (window.location.pathname.includes('/view-shared-notes.html')) {
            // 在共享页面，刷新整个容器以保证状态绝对正确
            const container = document.getElementById('notebook-view-container');
            const urlParams = new URLSearchParams(window.location.search);
            const lenderId = urlParams.get('lender_id');
            if (container && lenderId) {
                await this.renderSharedNotebook(container, lenderId);
            }
        } else {
            // 在其他页面，只刷新当前卡片
            await this._refreshCardUI(entryId);
        }
    
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
    
      button.classList.toggle('favorited', isFavorited);
      button.title = isFavorited ? '取消收藏' : '收藏此条';
    
      const buttonTextSpan = button.querySelector('span');
      if (buttonTextSpan) {
        buttonTextSpan.textContent = isFavorited ? '已收藏' : '收藏';
      }
    });
  }
	
// [新增] 刷新页面上所有可见卡片的完整UI (用于登出后移除笔记等)
  _refreshVisibleCardsUI() {
    // [修复] 增加豁免规则：在“查看共享”页面，不执行此函数，以防止与专用渲染逻辑冲突
    if (window.location.pathname.includes('/view-shared-notes.html')) {
      return;
    }

    const allCards = document.querySelectorAll('.analects-result-card, .verse-card');
    allCards.forEach(card => {
      const entryId = parseInt(card.dataset.entryId, 10);
      if (isNaN(entryId)) return;
      
      this._getEntryDataForHydration(entryId).then(fullEntryData => {
        if (fullEntryData) {
          const isSearchResult = card.closest('#analects-results-container');
          card.innerHTML = this.generateResultCardHTML(fullEntryData, { showTags: !!isSearchResult });
          
          // [修复] 重新渲染后，需要为卡片重新绑定事件
          this._attachCardActionListeners(card);
        }
      });
    });
    this._ensureIconsRendered();
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

    document.getElementById('auth-close-success-btn').addEventListener('click', () => this.closeAuthModal());
  }	

// [修改] 函数名：initializeFavoritesSearch -> initializeNotesSearch, 并更新注释
// [最终优化版] 初始化笔记页面的搜索功能（带高亮）
initializeNotesSearch(inputElement, containerElement) {
    if (!inputElement || !containerElement) {
      // [修改] 更新错误日志文本
      console.error('笔记搜索框或容器未找到');
      return;
    }

    const highlightTextInNode = (node, searchTerm) => {
      if (node.nodeType === 3) { 
        const text = node.textContent;
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
        if (regex.test(text)) {
          const fragment = document.createDocumentFragment();
          text.split(regex).forEach((part, index) => {
            if (index % 2 === 1) { 
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
      } else if (node.nodeType === 1 && node.nodeName !== 'MARK') {
        Array.from(node.childNodes).forEach(child => highlightTextInNode(child, searchTerm));
      }
    };

    const removeHighlightInCard = (card) => {
      const marks = card.querySelectorAll('mark.keyword-highlight');
      marks.forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize(); 
      });
    };

    inputElement.addEventListener('input', () => {
      const searchTerm = inputElement.value.trim();
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const allCards = containerElement.querySelectorAll('.verse-card');

      allCards.forEach(card => {
        removeHighlightInCard(card);

        const cardText = card.textContent.toLowerCase();
      
        if (!searchTerm || cardText.includes(lowerCaseSearchTerm)) {
          card.style.display = 'block';
        
          if (searchTerm) {
            highlightTextInNode(card, searchTerm);
          }
        } else {
          card.style.display = 'none';
        }
      });
    });
}

  // [新增] 调用数据库函数来分享整本笔记
  async shareNotebook(borrowerEmail) {
    if (!this.currentUser) {
      return { success: false, message: '请先登录' };
    }
    if (!borrowerEmail) {
      return { success: false, message: '请输入接收方的Email' };
    }

    try {
      const { data, error } = await this.supabase.rpc('share_notebook_with_email', {
        borrower_email: borrowerEmail
      });

      if (error) throw error;
      
      return data; // 函数的返回值就是 { success, message }
    } catch (error) {
      console.error('分享笔记时出错:', error);
      return { success: false, message: '分享失败，请稍后重试' };
    }
  }

// AnalectsSDK class in index.js

  // [RPC最终版 - 修正数据传递] 获取当前用户已经分享给了哪些人
  async getSharedWithList() {
    if (!this.currentUser) return [];
    try {
      // 1. 调用数据库函数，它会返回正确且完整的数据
      const { data, error } = await this.supabase.rpc('get_shared_with_list');
      if (error) throw error;
      
      // 2. [核心修正] 在这里将数据库返回的所有字段，正确地映射到前端需要的对象结构中
      return data.map(item => ({
        borrower_user_id: item.borrower_user_id,
        created_at: item.created_at,
        updated_at: item.updated_at, // <-- [修正] 之前遗漏了这一行！
        status: item.status,
        borrower: {
          email: item.email,
          user_metadata: { avatar_url: item.avatar_url }
        }
      }));
    } catch (error) {
      console.error('获取分享列表失败:', error);
      return [];
    }
  }
  
  // [新增] 收回分享
  async revokeShare(borrowerId) {
    if (!this.currentUser) return { error: new Error('用户未登录') };
    
    try {
      const { error } = await this.supabase
        .from('notebook_shares')
        .update({ status: 'revoked' })
        .match({
          lender_user_id: this.currentUser.id,
          borrower_user_id: borrowerId
        });
        
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('收回分享失败:', error);
      return { error };
    }
  }

  // [新增] 渲染账户管理页面
  async renderAccountPage(container) {
    if (!container) return;
    if (!this.currentUser) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <p class="text-lg">请先登录以管理您的账户。</p>
          <a href="/" class="text-blue-600 hover:underline mt-4 inline-block">&larr; 返回首页</a>
        </div>`;
      return;
    }

    const sharedWithList = await this.getSharedWithList();

    const shareFormHTML = `
      <div class="card">
        <div class="p-6 md:p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">分享我的全部笔记</h2>
          <p class="text-gray-600 mb-6 text-sm">输入对方的注册邮箱，即可授权对方只读访问您全部的收藏和笔记。您可以随时在此页面收回授权。</p>
          <form id="share-notebook-form" class="flex flex-col sm:flex-row gap-4 items-start">
            <input type="email" id="share-email-input" required placeholder="接收方的注册邮箱" class="analects-input flex-grow">
            <button type="submit" id="share-submit-btn" class="analects-btn w-full sm:w-auto">确认分享</button>
          </form>
          <div id="share-status-message" class="mt-4 text-sm"></div>
        </div>
      </div>
    `;

    const managementListHTML = `
      <div class="card">
        <div class="p-6 md:p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">已分享列表</h2>
          <div id="shared-with-list-container" class="space-y-4">
            ${sharedWithList.length === 0 ? '<p class="text-gray-500">您还没有分享给任何人。</p>' : 
              sharedWithList.map(share => `
                <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p class="font-semibold text-gray-800">${this.escapeHtml(share.borrower.email)}</p>
                    <p class="text-sm text-gray-500">
                      分享于 ${new Date(share.created_at).toLocaleDateString()}
                      <span class="font-bold ${share.status === 'active' ? 'text-green-600' : 'text-red-600'}">
                        (${share.status === 'active' ? '生效中' : '已收回'})
                      </span>
                    </p>
                  </div>
                  ${share.status === 'active' ? `
                  <button class="revoke-share-btn analects-btn analects-btn-clear" data-borrower-id="${share.borrower_user_id}">
                    收回
                  </button>` : ''}
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    `;

    container.innerHTML = shareFormHTML + managementListHTML;

    this._attachAccountPageEvents(); // 绑定事件
  }

  // [新增] 为账户页面绑定事件
  _attachAccountPageEvents() {
    const shareForm = document.getElementById('share-notebook-form');
    if (shareForm) {
      shareForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('share-email-input');
        const submitBtn = document.getElementById('share-submit-btn');
        const statusDiv = document.getElementById('share-status-message');
        
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '处理中...';
        statusDiv.textContent = '';
        
        const result = await this.shareNotebook(emailInput.value);
        
        if (result.success) {
          statusDiv.className = 'text-green-600';
          if (window.showToast) window.showToast(result.message);
          // 重新渲染页面以更新列表
          this.renderAccountPage(document.getElementById('account-management-container'));
        } else {
          statusDiv.className = 'text-red-600';
          if (window.showToast) window.showToast(result.message, true);
        }
        statusDiv.textContent = result.message;

        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        emailInput.value = '';
      });
    }

    document.querySelectorAll('.revoke-share-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const borrowerId = e.target.dataset.borrowerId;
        const confirmed = await this.showConfirmationModal('确认收回？', '您确定要收回对此用户的笔记分享吗？对方将无法再查看您的笔记。');
        
        if (confirmed) {
          const result = await this.revokeShare(borrowerId);
          if (result.success) {
            if (window.showToast) window.showToast('已成功收回分享');
            this.renderAccountPage(document.getElementById('account-management-container'));
          } else {
            if (window.showToast) window.showToast('操作失败，请重试', true);
          }
        }
      });
    });
  }

  // [RPC最终版] 获取向我分享了笔记的用户列表
  async getSharedByList() {
    if (!this.currentUser) return [];
    try {
      // 直接调用我们创建的数据库函数
      const { data, error } = await this.supabase.rpc('get_shared_by_list');
      if (error) throw error;
      // 同样，手动映射字段以保持前端渲染代码不变
      return data.map(item => ({
        lender_user_id: item.lender_user_id,
        created_at: item.created_at,
        lender: {
          email: item.email,
          user_metadata: { avatar_url: item.avatar_url }
        }
      }));
    } catch (error) {
      console.error('获取分享来源列表失败:', error);
      return [];
    }
  }

  // [最终健壮版] 获取某个特定用户的全部收藏 (只读) - [修改]
  async getLenderNotebook(lenderId) {
    // 1. 检查当前用户是否登录，以及是否传入了目标用户ID
    if (!this.currentUser || !lenderId) return [];

    try {
      // 2. 向数据库发起查询
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
        .eq('user_id', lenderId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // 3. [核心修改] 将查询到的数据处理成前端需要的格式
      const favorites = data.map(item => {
        if (!item.analects_entries) return null;
        return {
          ...item.analects_entries,
          // [核心修改] 将分享者的数据明确标识，避免与当前用户的数据混淆
          sharer_favorite_data: {
            sharer_insight: item.user_insight,
            sharer_insight_updated_at: item.insight_updated_at,
            sharer_favorited_at: item.created_at
          }
        };
      }).filter(Boolean);
      
      return favorites;

    } catch (error) {
      console.error('获取分享的笔记内容失败:', error);
      return [];
    }
  }

// [修改] 函数名：renderBorrowedNotesList -> renderSharedWithMeList, 并更新注释和内部文本
// [修正版] 渲染“共享空间”列表页面
async renderSharedWithMeList(container) {
    if (!container) return;
    if (!this.currentUser) {
      // [修改] 更新提示文本
      container.innerHTML = `<div class="text-center text-gray-500 py-8"><p>请先登录查看共享给您的笔记。</p></div>`;
      return;
    }
    
    const sharedByList = await this.getSharedByList();
    
    if (sharedByList.length === 0) {
      container.innerHTML = `<div class="text-center text-gray-500 py-8"><p>目前还没有人向您分享笔记。</p></div>`;
      return;
    }
    
    container.innerHTML = sharedByList.map(share => {
      const lender = share.lender;
      const avatarHTML = this._getAvatarHTML(lender);
      // [修改] 将链接指向新的文件名 view-shared-notes.html
      const viewUrl = `/view-shared-notes.html?lender_id=${share.lender_user_id}&email=${encodeURIComponent(lender.email)}`;
      
      return `
        <a href="${viewUrl}" class="flex items-center p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
          <div class="user-avatar-display mr-4">${avatarHTML}</div>
          <div class="flex-grow">
            <p class="font-semibold text-gray-900">${this.escapeHtml(lender.email)}</p>
            <p class="text-sm text-gray-500">分享于 ${new Date(share.created_at).toLocaleDateString()}</p>
          </div>
          <span class="text-blue-600 font-semibold">查看 &rarr;</span>
        </a>
      `;
    }).join('');
}

// [重构版] 渲染共享笔记页面
async renderSharedNotebook(container, lenderId) {
    if (!container || !lenderId) return;

    // 1. 获取经过处理的、包含 sharer_favorite_data 的笔记数据
    const notebook = await this.getLenderNotebook(lenderId);

    if (notebook.length === 0) {
      container.innerHTML = `<div class="text-center text-gray-500 py-8"><p>无法加载笔记，可能分享已被收回或内容为空。</p></div>`;
      return;
    }

    // 2. 清空容器，准备渲染
    container.innerHTML = '';

    // 3. 遍历分享的笔记，为每一条生成卡片
    notebook.forEach(entry => {
      // 3.1 获取当前用户自己的收藏数据（如果有的话）
      const myFavoriteData = this.favoritesDataCache.get(entry.id);

      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'verse-card';
      cardWrapper.setAttribute('data-entry-id', entry.id);

      // 3.2 调用核心渲染函数，传入原文数据、我自己的收藏数据、分享者的收藏数据
      cardWrapper.innerHTML = this.generateResultCardHTML(entry, { 
        showTags: false 
      }, myFavoriteData, entry.sharer_favorite_data);

      container.appendChild(cardWrapper);
    });

    // 4. 添加“已全部显示完毕”的提示
    const allDisplayedMessage = document.createElement('div');
    allDisplayedMessage.className = 'analects-load-complete';
    allDisplayedMessage.style.display = 'block';
    allDisplayedMessage.innerHTML = '<span class="analects-load-complete-text">—— ✨ 已全部显示完毕 ✨ ——</span>';
    container.appendChild(allDisplayedMessage);
    
    // 5. [新增] 确保图标渲染并为新卡片绑定事件
    this._attachCardActionListeners(container);
    this._ensureIconsRendered();
}

// [新增] 为卡片操作（如下拉菜单）绑定专属的、独立的事件监听器
  _attachCardActionListeners(container) {
    if (!container) return;

    const moreOptionsButtons = container.querySelectorAll('.more-options-btn');
    moreOptionsButtons.forEach(button => {
        // [核心] 为每个按钮添加独立的监听器，避免在全局函数中产生冲突
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const parentContainer = button.closest('.card-actions-container');
            if (!parentContainer) return;

            const dropdown = parentContainer.querySelector('.card-actions-dropdown');
            if (!dropdown) return;
            
            const wasActive = dropdown.classList.contains('active');
            
            // 先关闭页面上所有其他的下拉菜单
            document.querySelectorAll('.card-actions-dropdown.active').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('active');
                }
            });
    
            // 切换当前点击的菜单
            dropdown.classList.toggle('active', !wasActive);
        });
    });
  }

// [最终版] “我的笔记”页面的按需加载核心函数
async loadMoreNotes() {
    if (this.notesPagination.isLoading || !this.notesPagination.hasMore) {
      return;
    }

    this.notesPagination.isLoading = true;
    const container = document.getElementById('notes-list-container');
    
    // [新增] 获取并显示“加载中”提示
    const loadingMoreDiv = document.getElementById('notes-loading-more');
    if (loadingMoreDiv) loadingMoreDiv.style.display = 'block';
    
    try {
      // 不再重复获取ID列表，直接使用已暂存的 this.currentComparisonIds
      const comparisonEntryIds = this.currentComparisonIds || new Set();

      const { data: newNotes, error } = await this.supabase.rpc('get_my_notes', {
        page_size: this.notesPagination.pageSize,
        start_offset: this.notesPagination.currentPage * this.notesPagination.pageSize
      });

      if (error) throw error;
      
      const skeleton = container.querySelector('.verse-card-skeleton');
      if (skeleton && this.notesPagination.currentPage === 0) {
        container.innerHTML = '';
      }

      newNotes.forEach(note => {
        const entryData = note.entry;
        const fullEntryData = { ...entryData, user_insight: note.user_insight, insight_updated_at: note.insight_updated_at, favorited_at: note.favorited_at };

        this.entryCache.set(entryData.id, fullEntryData);
        this.favoritesDataCache.set(entryData.id, { user_insight: note.user_insight, insight_updated_at: note.insight_updated_at, favorited_at: note.favorited_at });

        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'verse-card';
        cardWrapper.setAttribute('data-entry-id', entryData.id);

        cardWrapper.innerHTML = this.generateResultCardHTML(fullEntryData, { showTags: false }, fullEntryData, null, true, comparisonEntryIds);
        container.appendChild(cardWrapper);
      });

      this._attachCardActionListeners(container);
      this._ensureIconsRendered();

      this.notesPagination.currentPage++;
      this.notesPagination.hasMore = (this.notesPagination.currentPage * this.notesPagination.pageSize) < this.notesPagination.totalCount;

      if (!this.notesPagination.hasMore) {
        const allDisplayedMessage = document.createElement('div');
        allDisplayedMessage.className = 'analects-load-complete';
        allDisplayedMessage.style.display = 'block';
        allDisplayedMessage.innerHTML = '<span class="analects-load-complete-text">—— ✨ 已全部显示完毕 ✨ ——</span>';
        container.appendChild(allDisplayedMessage);
      }
    } catch (error) {
      console.error('加载更多笔记失败:', error);
      if (loadingMoreDiv) loadingMoreDiv.textContent = '加载失败，请刷新重试。';
    } finally {
      this.notesPagination.isLoading = false;
      // [新增] 无论成功或失败，都隐藏“加载中”提示
      if (loadingMoreDiv) loadingMoreDiv.style.display = 'none';
    }
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