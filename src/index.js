// 引入样式文件
import './styles/analects.css';

// 论语 SDK - 核心功能 Version 8
class AnalectsSDK {
  constructor(config = {}) {
    this.supabaseUrl = config.supabaseUrl || 'https://your-project.supabase.co';
    this.supabaseKey = config.supabaseKey || 'your-anon-key';
    this.apiBaseUrl = `${this.supabaseUrl}/rest/v1`;
    this.headers = {
      'apikey': this.supabaseKey,
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    
    // 缓存数据
    this.charactersCache = null;
    this.argumentsCache = null;
  }

  // API调用方法 - 使用客户端过滤处理关键词
  async fetchAnalects(filters = {}) {
    try {
      // 基础查询 - 获取所有数据，在客户端进行关键词过滤
      let url = `${this.apiBaseUrl}/analects_entries?select=*,entry_characters(character_id,characters(id,name)),entry_arguments(argument_id,arguments(id,title)),entry_proverbs(proverbs(*))`;
      
      const conditions = [];
      
      // 章节过滤（服务端）
      if (filters.chapter) {
        conditions.push(`chapter.eq.${encodeURIComponent(filters.chapter)}`);
      }
      
      // 应用服务端条件
      if (conditions.length > 0) {
        url += `&${conditions.join('&')}`;
      }
      
      console.log('基础API请求URL:', url);
      
      // 检查配置
      if (!this.supabaseUrl || this.supabaseUrl.includes('your-project')) {
        throw new Error('请先配置正确的 Supabase URL');
      }
      
      if (!this.supabaseKey || this.supabaseKey.includes('your-anon-key')) {
        throw new Error('请先配置正确的 Supabase Key');
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
        mode: 'cors',
      });
      
      console.log('响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误详情:', response.status, response.statusText, errorText);
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      let data = await response.json();
      console.log('基础查询结果数量:', data.length);
      
      // 客户端过滤 - 关键词搜索
      if (filters.keyword && filters.keyword.trim()) {
        const keyword = filters.keyword.trim().toLowerCase();
        data = data.filter(entry => {
          const originalText = (entry.original_text || '').toLowerCase();
          const translation = (entry.translation || '').toLowerCase();
          const annotation = (entry.annotation || '').toLowerCase();
          
          const hasKeyword = originalText.includes(keyword) || 
                           translation.includes(keyword) || 
                           annotation.includes(keyword);
          
          if (hasKeyword) {
            console.log(`条目${entry.id} 匹配关键词 "${keyword}": ${entry.original_text.substring(0, 20)}...`);
          }
          
          return hasKeyword;
        });
        console.log('关键词过滤后结果数量:', data.length);
      }
      
      // 客户端过滤 - 人物 AND 关系
      if (filters.characterIds && filters.characterIds.length > 0) {
        data = data.filter(entry => {
          const entryCharacterIds = (entry.entry_characters || [])
            .map(ec => ec.character_id)
            .filter(id => id != null);
          
          // 检查是否包含所有指定的人物ID (AND关系)
          const hasAllCharacters = filters.characterIds.every(id => 
            entryCharacterIds.includes(parseInt(id))
          );
          
          console.log(`条目${entry.id} 人物IDs:`, entryCharacterIds, '要求:', filters.characterIds, '匹配:', hasAllCharacters);
          return hasAllCharacters;
        });
        console.log('人物过滤后结果数量:', data.length);
      }
      
      // 客户端过滤 - 论点 AND 关系
      if (filters.argumentIds && filters.argumentIds.length > 0) {
        data = data.filter(entry => {
          const entryArgumentIds = (entry.entry_arguments || [])
            .map(ea => ea.argument_id)
            .filter(id => id != null);
          
          // 检查是否包含所有指定的论点ID (AND关系)
          const hasAllArguments = filters.argumentIds.every(id => 
            entryArgumentIds.includes(parseInt(id))
          );
          
          console.log(`条目${entry.id} 论点IDs:`, entryArgumentIds, '要求:', filters.argumentIds, '匹配:', hasAllArguments);
          return hasAllArguments;
        });
        console.log('论点过滤后结果数量:', data.length);
      }
      
      return data;
    } catch (error) {
      console.error('获取论语数据失败:', error);
      
      // 提供更详细的错误信息
      if (error.message === 'Failed to fetch') {
        throw new Error('网络连接失败，请检查:\n1. Supabase配置是否正确\n2. 网络连接是否正常\n3. Supabase服务是否可用');
      }
      
      throw error;
    }
  }

  // 获取每日论语
  async getDailyAnalect() {
    try {
      const url = `${this.apiBaseUrl}/analects_entries?select=chapter,section_number,original_text,translation&show_in_daily=eq.true`;
      
      console.log('每日论语API请求URL:', url);
      
      const response = await fetch(url, {
        headers: this.headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('每日论语API错误:', response.status, errorText);
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('每日论语数据:', data);
      
      // 随机选择一条
      if (data.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    } catch (error) {
      console.error('获取每日论语失败:', error);
      throw error;
    }
  }

  // 高级搜索 - 保持兼容性，实际调用fetchAnalects
  async advancedSearch(filters = {}) {
    return await this.fetchAnalects(filters);
  }

  // 按人物查询 - 支持AND关系
  async searchByCharacter(characterIds = []) {
    return await this.fetchAnalects({ characterIds });
  }

  // 根据论点查询 - 支持AND关系
  async searchByArgument(argumentIds = []) {
    return await this.fetchAnalects({ argumentIds });
  }

  // 获取所有人物 - 带缓存，使用真实Supabase数据
  async getCharacters() {
    try {
      if (this.charactersCache) {
        return this.charactersCache;
      }

      // 检查配置
      if (!this.supabaseUrl || this.supabaseUrl.includes('your-project')) {
        throw new Error('请先配置正确的 Supabase URL');
      }
      
      const url = `${this.apiBaseUrl}/characters?order=name.asc`;
      console.log('获取人物URL:', url);
      
      const response = await fetch(url, { 
        headers: this.headers,
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('获取人物失败:', response.status, response.statusText, errorText);
        throw new Error(`获取人物失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('获取到的人物数据:', data);
      this.charactersCache = data;
      return data;
    } catch (error) {
      console.error('获取人物列表失败:', error);
      
      if (error.message === 'Failed to fetch') {
        throw new Error('网络连接失败，请检查 Supabase 配置和网络连接');
      }
      
      throw error;
    }
  }

  // 获取所有论点 (保持兼容性)
  async getArguments() {
    return await this.getArgumentsList();
  }

  // 获取所有论点 - 带缓存，使用真实Supabase数据
  async getArgumentsList() {
    try {
      if (this.argumentsCache) {
        return this.argumentsCache;
      }

      // 检查配置
      if (!this.supabaseUrl || this.supabaseUrl.includes('your-project')) {
        throw new Error('请先配置正确的 Supabase URL');
      }
      
      const url = `${this.apiBaseUrl}/arguments?order=title.asc`;
      console.log('获取论点URL:', url);
      
      const response = await fetch(url, { 
        headers: this.headers,
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('获取论点失败:', response.status, response.statusText, errorText);
        throw new Error(`获取论点失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('获取到的论点数据:', data);
      this.argumentsCache = data;
      return data;
    } catch (error) {
      console.error('获取论点列表失败:', error);
      
      if (error.message === 'Failed to fetch') {
        throw new Error('网络连接失败，请检查 Supabase 配置和网络连接');
      }
      
      throw error;
    }
  }

  // 获取所有谚语
  async getProverbs() {
    try {
      const url = `${this.apiBaseUrl}/proverbs?order=content.asc`;
      const response = await fetch(url, { headers: this.headers });
      if (!response.ok) {
        throw new Error(`获取谚语失败: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('获取谚语列表失败:', error);
      throw error;
    }
  }

  // 格式化日期为中文显示
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

  // 生成分享链接 - 优化版
  generateShareLinks(entry, currentUrl = window.location.href) {
    const text = `每日论语：${entry.original_text}`;
    const url = currentUrl;
    
    // 为Facebook分享准备更好的URL，让Facebook自动抓取页面信息
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: facebookUrl,
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
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
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

  // UI渲染方法
  renderAnalectCard(entry, container) {
    if (!container) {
      console.error('未找到容器元素');
      return;
    }

    const card = document.createElement('div');
    card.className = 'analects-card';
    card.innerHTML = this.generateCardHTML(entry);
    
    container.appendChild(card);
  }

  generateCardHTML(entry) {
    // 安全获取关联数据
    const characters = (entry.entry_characters || [])
      .map(ec => ec.characters?.name)
      .filter(Boolean)
      .join(', ');
    
    const argumentsList = (entry.entry_arguments || [])
      .map(ea => ea.arguments?.title)
      .filter(Boolean);
    
    const proverbs = (entry.entry_proverbs || [])
      .map(ep => ep.proverbs?.content)
      .filter(Boolean);

    return `
      <div class="analects-header">
        <h3 class="analects-chapter">${entry.chapter || ''}</h3>
        <span class="analects-section">第${entry.section_number || ''}节</span>
      </div>
      
      <div class="analects-content">
        <div class="analects-original">${entry.original_text || ''}</div>
        
        ${entry.translation ? `<div class="analects-translation">${entry.translation}</div>` : ''}
        
        ${entry.annotation ? `<div class="analects-annotation">${entry.annotation}</div>` : ''}
      </div>

      <div class="analects-tags">
        ${characters ? `<div class="analects-tag analects-tag-character">人物: ${characters}</div>` : ''}
        
        ${argumentsList.map(arg => `<div class="analects-tag analects-tag-argument">${arg}</div>`).join('')}
        
        ${proverbs.map(proverb => `<div class="analects-tag analects-tag-proverb">${proverb}</div>`).join('')}
      </div>

      ${entry.personal_insight ? `<div class="analects-insight">${entry.personal_insight}</div>` : ''}
    `;
  }

  // 渲染优化后的搜索界面
  renderSearchInterface(container) {
    if (!container) {
      console.error('未找到容器元素');
      return;
    }

    const searchHTML = `
      <div class="analects-search">
        <!-- 搜索标题区域 -->
        <div class="analects-search-header">
          <h1 class="analects-search-title">论语搜索</h1>
          <p class="analects-search-subtitle">Search in the Analects of Confucius</p>
        </div>

        <!-- 搜索表单 -->
        <div class="analects-search-form">
          <!-- 关键词搜索 -->
          <div class="analects-keyword-section">
            <label class="analects-keyword-label" for="analects-keyword">
              🔍 关键词搜索
            </label>
            <input 
              type="text" 
              id="analects-keyword" 
              class="analects-input" 
              placeholder="输入关键词搜索论语原文、翻译或注释..."
            >
          </div>

          <!-- 高级筛选 -->
          <div class="analects-advanced-filters">
            <h3 class="analects-advanced-title">高级筛选</h3>
            
            <div class="analects-filters-grid">
              <!-- 人物筛选 -->
              <div class="analects-filter-section">
                <div class="analects-filter-header">
                  <h4 class="analects-filter-title characters">人物筛选</h4>
                  <span class="analects-filter-count" id="character-count">0</span>
                </div>
                <div class="analects-filter-search">
                  <input 
                    type="text" 
                    id="character-search" 
                    placeholder="搜索人物..."
                  >
                </div>
                <div 
                  id="character-filters" 
                  class="analects-filter-options"
                >
                  <div class="analects-loading">加载中...</div>
                </div>
              </div>

              <!-- 论点筛选 -->
              <div class="analects-filter-section">
                <div class="analects-filter-header">
                  <h4 class="analects-filter-title arguments">论点筛选</h4>
                  <span class="analects-filter-count" id="argument-count">0</span>
                </div>
                <div class="analects-filter-search">
                  <input 
                    type="text" 
                    id="argument-search" 
                    placeholder="搜索论点..."
                  >
                </div>
                <div 
                  id="argument-filters" 
                  class="analects-filter-options"
                >
                  <div class="analects-loading">加载中...</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="analects-search-actions">
            <button id="analects-search-btn" class="analects-btn">
              🔍 开始搜索
            </button>
            <button id="analects-clear-btn" class="analects-btn analects-btn-secondary">
              🧹 清空筛选
            </button>
            <button id="analects-reset-btn" class="analects-btn analects-btn-clear">
              🔄 重置全部
            </button>
          </div>
        </div>
        
        <!-- 搜索状态 -->
        <div id="analects-search-status" class="analects-search-status"></div>
        
        <!-- 搜索统计 -->
        <div id="analects-search-stats" class="analects-search-stats" style="display: none;">
          <div class="analects-stat-item">
            <span class="analects-stat-number" id="total-results">0</span>
            <span class="analects-stat-label">搜索结果</span>
          </div>
          <div class="analects-stat-item">
            <span class="analects-stat-number" id="selected-characters">0</span>
            <span class="analects-stat-label">选中人物</span>
          </div>
          <div class="analects-stat-item">
            <span class="analects-stat-number" id="selected-arguments">0</span>
            <span class="analects-stat-label">选中论点</span>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div class="analects-results">
          <div id="analects-results-container"></div>
        </div>
      </div>
    `;

    container.innerHTML = searchHTML;
    this.initializeSearchEvents();
    this.loadFilterOptions();
  }

  // 渲染每日论语组件 - 恢复原有的样式和图标效果
  renderDailyAnalect(container) {
    if (!container) {
      console.error('未找到容器元素');
      return;
    }

    // 显示加载状态
    container.innerHTML = '<div class="analects-loading">加载每日论语...</div>';

    this.getDailyAnalect().then(entry => {
      if (!entry) {
        container.innerHTML = '<div class="analects-daily-empty">暂无每日论语</div>';
        return;
      }

      const dateInfo = this.formatDate();
      const shareLinks = this.generateShareLinks(entry);

      const dailyHTML = `
        <div class="analects-daily">
          <!-- 标题区域 -->
          <div class="analects-daily-header">
            <h1 class="analects-daily-title">每日论语</h1>
            <p class="analects-daily-subtitle">Daily Analects of Confucius</p>
            <div class="analects-daily-date">
              ${dateInfo.full} · ${dateInfo.weekday}
            </div>
          </div>

          <!-- 论语内容卡片 -->
          <div class="analects-daily-card">
            <!-- 论语原文 - 突出显示，带引号装饰 -->
            <div class="analects-daily-original">${entry.original_text}</div>
            
            <!-- 翻译文本 -->
            ${entry.translation ? `<div class="analects-daily-translation">${entry.translation}</div>` : ''}
            
            <!-- 章节信息 - 弱化显示 -->
            <div class="analects-daily-reference">
              ${entry.chapter} · 第${entry.section_number || ''}节
            </div>
          </div>

          <!-- 分享区域 - 使用真实的图标SVG -->
          <div class="analects-daily-share">
            <span class="analects-daily-share-label">分享：</span>
            <div class="analects-share-buttons">
              <a href="${shareLinks.twitter}" 
                 class="analects-share-btn twitter" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 title="分享到 Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              
              <a href="${shareLinks.facebook}" 
                 class="analects-share-btn facebook" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 onclick="return window.open(this.href, 'facebook-share', 'width=626,height=436,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes')"
                 title="分享到 Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              
              <button class="analects-share-btn copy" 
                      onclick="window.AnalectsSDK.copyText('${shareLinks.copy.replace(/'/g, "\\'")}', this)"
                      title="复制分享内容">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
              
              <a href="${shareLinks.email}" 
                 class="analects-share-btn email"
                 title="通过邮件分享">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = dailyHTML;
    }).catch(error => {
      console.error('渲染每日论语失败:', error);
      container.innerHTML = '<div class="analects-daily-error">加载每日论语失败，请检查配置</div>';
    });
  }

  // 初始化搜索事件 - 全新优化
  initializeSearchEvents() {
    const searchBtn = document.getElementById('analects-search-btn');
    const clearBtn = document.getElementById('analects-clear-btn');
    const resetBtn = document.getElementById('analects-reset-btn');
    const keywordInput = document.getElementById('analects-keyword');
    const characterSearch = document.getElementById('character-search');
    const argumentSearch = document.getElementById('argument-search');
    
    // 主要按钮事件
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.performSearch());
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSearch());
    }
    
    // 回车键搜索
    if (keywordInput) {
      keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
    }

    // 实时搜索过滤器
    if (characterSearch) {
      characterSearch.addEventListener('input', (e) => {
        this.filterOptions('character', e.target.value);
      });
    }

    if (argumentSearch) {
      argumentSearch.addEventListener('input', (e) => {
        this.filterOptions('argument', e.target.value);
      });
    }
  }

  // 加载筛选选项 - 使用真实Supabase数据
  async loadFilterOptions() {
    try {
      const statusDiv = document.getElementById('analects-search-status');
      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-info">🔄 加载筛选选项...</div>';
      }

      // 从Supabase获取真实数据
      const [characters, argumentsList] = await Promise.all([
        this.getCharacters(),
        this.getArgumentsList()
      ]);

      console.log('加载的人物数据:', characters);
      console.log('加载的论点数据:', argumentsList);

      // 更新计数
      this.updateFilterCount('character', characters.length);
      this.updateFilterCount('argument', argumentsList.length);

      // 渲染筛选选项
      this.renderFilterOptions('character-filters', characters, 'character');
      this.renderFilterOptions('argument-filters', argumentsList, 'argument');
      
      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-success">✅ 筛选选项加载完成</div>';
        setTimeout(() => {
          statusDiv.innerHTML = '';
        }, 2000);
      }
    } catch (error) {
      console.error('加载筛选选项失败:', error);
      const statusDiv = document.getElementById('analects-search-status');
      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-error">❌ 加载筛选选项失败，请检查配置</div>';
      }
      
      // 显示错误时的占位内容
      const characterContainer = document.getElementById('character-filters');
      const argumentContainer = document.getElementById('argument-filters');
      
      if (characterContainer) {
        characterContainer.innerHTML = '<div class="analects-no-options">人物数据加载失败</div>';
      }
      if (argumentContainer) {
        argumentContainer.innerHTML = '<div class="analects-no-options">论点数据加载失败</div>';
      }
    }
  }

  // 更新筛选器计数
  updateFilterCount(type, count) {
    const countElement = document.getElementById(`${type}-count`);
    if (countElement) {
      countElement.textContent = count;
    }
  }

  // 渲染筛选选项 - 标签云模式，使用真实数据
  renderFilterOptions(containerId, options, type) {
    const container = document.getElementById(containerId);
    if (!container || !options || !Array.isArray(options)) {
      console.error('渲染筛选选项失败:', { containerId, options, type });
      if (container) {
        container.innerHTML = '<div class="analects-no-options">数据格式错误</div>';
      }
      return;
    }

    if (options.length === 0) {
      container.innerHTML = '<div class="analects-no-options">暂无选项</div>';
      return;
    }

    // 创建标签云容器
    const tagCloud = document.createElement('div');
    tagCloud.className = 'analects-tag-cloud';
    tagCloud.setAttribute('data-type', type);

    console.log(`开始渲染${type}选项，共${options.length}个:`, options.slice(0, 3));

    options.forEach((option, index) => {
      // 确保option有必要的属性
      if (!option || (!option.id && option.id !== 0)) {
        console.warn(`选项${index}缺少id:`, option);
        return;
      }

      const displayName = option.name || option.title || `选项${option.id}`;
      
      const tag = document.createElement('label');
      tag.className = 'analects-option-tag';
      tag.setAttribute('data-id', option.id);
      tag.setAttribute('data-name', displayName.toLowerCase());
      
      tag.innerHTML = `
        <input type="checkbox" value="${option.id}" data-type="${type}">
        <span>${displayName}</span>
      `;

      // 点击事件
      tag.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          const checkbox = tag.querySelector('input[type="checkbox"]');
          checkbox.checked = !checkbox.checked;
        }
        
        // 更新视觉状态
        setTimeout(() => {
          tag.classList.toggle('selected', tag.querySelector('input[type="checkbox"]').checked);
          this.updateSearchStats();
        }, 0);
      });

      tagCloud.appendChild(tag);
    });

    container.innerHTML = '';
    container.appendChild(tagCloud);
    
    console.log(`完成渲染${type}选项，共创建${tagCloud.children.length}个标签`);
  }

  // 过滤选项 - 支持实时搜索
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

    // 更新计数显示
    const countElement = document.getElementById(`${type}-count`);
    if (countElement) {
      const totalCount = tags.length;
      countElement.textContent = term ? `${visibleCount}/${totalCount}` : totalCount;
    }
  }

  // 更新搜索统计
  updateSearchStats() {
    const selectedCharacters = document.querySelectorAll('#character-filters input[type="checkbox"]:checked').length;
    const selectedArguments = document.querySelectorAll('#argument-filters input[type="checkbox"]:checked').length;

    const selectedCharactersElement = document.getElementById('selected-characters');
    const selectedArgumentsElement = document.getElementById('selected-arguments');

    if (selectedCharactersElement) selectedCharactersElement.textContent = selectedCharacters;
    if (selectedArgumentsElement) selectedArgumentsElement.textContent = selectedArguments;

    // 显示/隐藏统计区域
    const statsContainer = document.getElementById('analects-search-stats');
    if (statsContainer) {
      const hasFilters = selectedCharacters > 0 || selectedArguments > 0;
      statsContainer.style.display = hasFilters ? 'flex' : 'none';
    }
  }

  // 执行搜索 - 使用真实的Supabase数据
  async performSearch() {
    const keyword = document.getElementById('analects-keyword')?.value;
    const resultsContainer = document.getElementById('analects-results-container');
    const statusDiv = document.getElementById('analects-search-status');
    
    if (!resultsContainer) return;

    // 获取选中的人物
    const selectedCharacters = Array.from(
      document.querySelectorAll('#character-filters input[type="checkbox"]:checked')
    ).map(cb => parseInt(cb.value));
    
    // 获取选中的论点
    const selectedArguments = Array.from(
      document.querySelectorAll('#argument-filters input[type="checkbox"]:checked')
    ).map(cb => parseInt(cb.value));

    // 显示搜索状态
    if (statusDiv) {
      statusDiv.innerHTML = '<div class="analects-info">🔍 搜索中...</div>';
    }
    resultsContainer.innerHTML = '<div class="analects-loading">正在搜索论语条目...</div>';

    try {
      const filters = {
        keyword: keyword?.trim(),
        characterIds: selectedCharacters,
        argumentIds: selectedArguments
      };
      
      console.log('搜索过滤条件:', filters);
      
      // 使用真实的fetchAnalects方法
      const results = await this.fetchAnalects(filters);
      
      // 更新结果统计
      const totalResultsElement = document.getElementById('total-results');
      if (totalResultsElement) {
        totalResultsElement.textContent = results.length;
      }

      if (statusDiv) {
        if (results.length === 0) {
          statusDiv.innerHTML = '<div class="analects-warning">⚠️ 未找到匹配的条目</div>';
        } else {
          statusDiv.innerHTML = `<div class="analects-success">✅ 找到 ${results.length} 条结果</div>`;
        }
      }
      
      if (results.length === 0) {
        resultsContainer.innerHTML = `
          <div class="analects-no-results">
            <h3>未找到相关条目</h3>
            <p>请尝试：</p>
            <ul style="text-align: left; display: inline-block;">
              <li>使用不同的关键词</li>
              <li>减少筛选条件</li>
              <li>检查输入的关键词是否正确</li>
            </ul>
          </div>
        `;
        return;
      }

      // 显示搜索统计
      const statsContainer = document.getElementById('analects-search-stats');
      if (statsContainer) {
        statsContainer.style.display = 'flex';
      }

      // 渲染真实的搜索结果
      resultsContainer.innerHTML = '';
      results.forEach((entry, index) => {
        // 添加延迟渲染，提升用户体验
        setTimeout(() => {
          this.renderAnalectCard(entry, resultsContainer);
        }, index * 50);
      });

    } catch (error) {
      console.error('搜索失败:', error);
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
    }
  }

  // 清空筛选条件
  clearFilters() {
    // 清空搜索框
    const characterSearch = document.getElementById('character-search');
    const argumentSearch = document.getElementById('argument-search');
    
    if (characterSearch) {
      characterSearch.value = '';
      this.filterOptions('character', '');
    }
    if (argumentSearch) {
      argumentSearch.value = '';
      this.filterOptions('argument', '');
    }

    // 取消所有选中状态
    const checkboxes = document.querySelectorAll('.analects-tag-cloud input[type="checkbox"]');
    const tags = document.querySelectorAll('.analects-option-tag');
    
    checkboxes.forEach(cb => cb.checked = false);
    tags.forEach(tag => tag.classList.remove('selected'));

    // 更新统计
    this.updateSearchStats();

    // 清空状态信息
    const statusDiv = document.getElementById('analects-search-status');
    if (statusDiv) {
      statusDiv.innerHTML = '<div class="analects-info">🧹 已清空所有筛选条件</div>';
      setTimeout(() => {
        statusDiv.innerHTML = '';
      }, 2000);
    }
  }

  // 重置所有搜索内容
  resetSearch() {
    // 清空关键词
    const keywordInput = document.getElementById('analects-keyword');
    if (keywordInput) keywordInput.value = '';

    // 清空筛选条件
    this.clearFilters();

    // 清空结果
    const resultsContainer = document.getElementById('analects-results-container');
    const statsContainer = document.getElementById('analects-search-stats');
    
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (statsContainer) statsContainer.style.display = 'none';

    // 重置统计数字
    const totalResultsElement = document.getElementById('total-results');
    if (totalResultsElement) totalResultsElement.textContent = '0';

    const statusDiv = document.getElementById('analects-search-status');
    if (statusDiv) {
      statusDiv.innerHTML = '<div class="analects-success">🔄 已重置所有搜索条件</div>';
      setTimeout(() => {
        statusDiv.innerHTML = '';
      }, 2000);
    }
  }

  // 测试连接方法 - 用于验证Supabase配置
  async testConnection() {
    try {
      // 测试基本连接
      const url = `${this.apiBaseUrl}/characters?limit=1`;
      const response = await fetch(url, {
        headers: this.headers,
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`连接测试失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('连接测试成功，示例数据:', data);
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

// 全局复制方法
if (typeof window !== 'undefined') {
  window.AnalectsSDK = AnalectsSDK;
  window.AnalectsSDK.copyText = async function(text, button) {
    const originalTitle = button.title;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        button.title = '已复制！';
        setTimeout(() => {
          button.title = originalTitle;
        }, 2000);
      } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          button.title = '已复制！';
          setTimeout(() => {
            button.title = originalTitle;
          }, 2000);
        } else {
          button.title = '复制失败';
        }
      }
    } catch (err) {
      console.error('复制失败:', err);
      button.title = '复制失败';
    }
  };
  
  window.initAnalects = (config) => {
    return new AnalectsSDK(config);
  };
}

// 自动初始化（如果页面包含配置）
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-analects-auto-init]');
    if (autoInit) {
      const supabaseUrl = autoInit.getAttribute('data-supabase-url');
      const supabaseKey = autoInit.getAttribute('data-supabase-key');
      
      if (supabaseUrl && supabaseKey) {
        const config = { supabaseUrl, supabaseKey };
        const sdk = new AnalectsSDK(config);
        
        // 自动渲染组件
        const searchContainers = document.querySelectorAll('[data-analects-search]');
        searchContainers.forEach(container => sdk.renderSearchInterface(container));
        
        const dailyContainers = document.querySelectorAll('[data-analects-daily]');
        dailyContainers.forEach(container => sdk.renderDailyAnalect(container));
      }
    }
  });
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalectsSDK;
}

export default AnalectsSDK;