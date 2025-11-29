/**
 * Pigeon Planner - 主应用逻辑
 * 集成所有组件，处理应用交互
 */

// 应用状态管理
class AppState {
  constructor() {
    this.currentPigeon = null;
    this.currentTab = 'pedigree';
    this.filterType = 'all';
    this.isSidebarOpen = false;
    this.components = {};
  }

  setCurrentPigeon(pigeon) {
    this.currentPigeon = pigeon;
  }

  getCurrentPigeon() {
    return this.currentPigeon;
  }

  setCurrentTab(tab) {
    this.currentTab = tab;
  }

  getCurrentTab() {
    return this.currentTab;
  }

  setFilterType(filterType) {
    this.filterType = filterType;
  }

  getFilterType() {
    return this.filterType;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    return this.isSidebarOpen;
  }
}

// 主应用类
class PigeonPlannerApp {
  constructor() {
    this.state = new AppState();
    this.isInitialized = false;
  }

  // 初始化应用
  async init() {
    if (this.isInitialized) return;

    console.log('正在初始化 Pigeon Planner Web 应用...');

    try {
      // 等待DOM加载完成
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
          } else {
            resolve();
          }
        });
      }

      // 初始化组件
      this.initComponents();
      this.initEventListeners();
      this.initResponsiveHandlers();

      // 加载初始数据
      this.loadInitialData();

      // 标记为已初始化
      this.isInitialized = true;
      console.log('应用初始化完成');

    } catch (error) {
      console.error('应用初始化失败:', error);
      this.showError('应用初始化失败，请刷新页面重试');
    }
  }

  // 初始化组件
  initComponents() {
    // 初始化鸽子列表组件
    const pigeonListContainer = document.getElementById('pigeonList');
    if (pigeonListContainer) {
      this.state.components.pigeonList = new Components.PigeonList(pigeonListContainer);
      this.state.components.pigeonList.on('select', (pigeon) => {
        this.selectPigeon(pigeon);
      });
    }

    // 初始化鸽子详情组件
    const pigeonDetailsContainer = document.getElementById('pigeonDetails');
    if (pigeonDetailsContainer) {
      this.state.components.pigeonDetails = new Components.PigeonDetails(pigeonDetailsContainer);
      this.state.components.pigeonDetails.on('edit', (pigeon) => {
        this.editPigeon(pigeon);
      });
      this.state.components.pigeonDetails.on('delete', (pigeon) => {
        this.deletePigeon(pigeon);
      });
      this.state.components.pigeonDetails.on('copy', (pigeon) => {
        this.copyPigeon(pigeon);
      });
      this.state.components.pigeonDetails.on('change-photo', (pigeon) => {
        this.changePigeonPhoto(pigeon);
      });
    }
  }

  // 初始化事件监听器
  initEventListeners() {
    // 移动端菜单切换
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }

    // 侧边栏遮罩点击
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => {
        this.closeSidebar();
      });
    }

    // 添加鸽子按钮
    const addPigeonBtn = document.getElementById('addPigeonBtn');
    if (addPigeonBtn) {
      addPigeonBtn.addEventListener('click', () => {
        this.addPigeon();
      });
    }

    // 标签页导航
    const tabButtons = document.querySelectorAll('[data-tab]');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 过滤选择器
    const filterSelect = document.querySelector('.form-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.setFilter(e.target.value);
      });
    }

    // 搜索功能
    const searchInput = document.querySelector('input[placeholder="搜索鸽子..."]');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchPigeons(e.target.value);
        }, 300);
      });
    }

    // 窗口大小改变事件
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  // 初始化响应式处理器
  initResponsiveHandlers() {
    // 检测屏幕尺寸
    this.checkScreenSize();
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
  }

  // 加载初始数据
  loadInitialData() {
    // 数据已在 mock-data.js 中自动加载
    if (MockData.pigeons.length > 0) {
      // 渲染鸽子列表
      this.state.components.pigeonList.render(MockData.pigeons);

      // 选择第一只鸽子
      const firstPigeon = MockData.pigeons[0];
      if (firstPigeon) {
        this.selectPigeon(firstPigeon);
      }
    }
  }

  // 选择鸽子
  selectPigeon(pigeon) {
    this.state.setCurrentPigeon(pigeon);

    // 更新详情面板
    if (this.state.components.pigeonDetails) {
      this.state.components.pigeonDetails.render(pigeon);
    }

    // 更新当前标签页内容
    this.updateTabContent();

    // 移动端关闭侧边栏
    if (this.isMobile()) {
      this.closeSidebar();
    }

    // 更新地址栏（可选）
    if (history.pushState) {
      const newUrl = `${window.location.pathname}?pigeon=${pigeon.id}`;
      window.history.pushState({ pigeonId: pigeon.id }, '', newUrl);
    }
  }

  // 切换标签页
  switchTab(tabName) {
    this.state.setCurrentTab(tabName);

    // 更新标签页按钮状态
    const tabButtons = document.querySelectorAll('[data-tab]');
    tabButtons.forEach(button => {
      button.classList.remove('active');
      if (button.dataset.tab === tabName) {
        button.classList.add('active');
      }
    });

    // 更新标签页内容
    this.updateTabContent();
  }

  // 更新标签页内容
  updateTabContent() {
    const currentPigeon = this.state.getCurrentPigeon();
    const currentTab = this.state.getCurrentTab();
    const tabContent = document.getElementById('tabContent');

    if (!currentPigeon || !tabContent) return;

    // 显示加载状态
    tabContent.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin me-2"></i>
        加载中...
      </div>
    `;

    // 异步加载标签页内容
    setTimeout(() => {
      const content = this.generateTabContent(currentPigeon, currentTab);
      tabContent.innerHTML = content;
    }, 100);
  }

  // 生成标签页内容
  generateTabContent(pigeon, tabName) {
    switch (tabName) {
      case 'pedigree':
        return this.generatePedigreeContent(pigeon);
      case 'results':
        return this.generateResultsContent(pigeon);
      case 'relatives':
        return this.generateRelativesContent(pigeon);
      case 'breeding':
        return this.generateBreedingContent(pigeon);
      case 'media':
        return this.generateMediaContent(pigeon);
      case 'medication':
        return this.generateMedicationContent(pigeon);
      default:
        return '<div class="empty-state"><i class="fas fa-question-circle"></i><h5>未知标签页</h5></div>';
    }
  }

  // 生成血统内容
  generatePedigreeContent(pigeon) {
    const pedigreeTable = new Components.PedigreeTable(null);
    return pedigreeTable.render(pigeon).outerHTML;
  }

  // 生成比赛结果内容
  generateResultsContent(pigeon) {
    const results = DataHelpers.getResultsByPigeonId(pigeon.id);
    const resultsTable = new Components.ResultsTable(null);
    return resultsTable.render(results).outerHTML;
  }

  // 生成亲戚关系内容
  generateRelativesContent(pigeon) {
    const relatives = DataHelpers.getRelatives(pigeon.id);

    let html = '<div class="relatives-container">';

    // 父母
    if (relatives.parents.length > 0) {
      html += `
        <div class="relatives-section">
          <h5><i class="fas fa-users me-2"></i>父母</h5>
          <div class="relatives-grid">
            ${relatives.parents.map(parent => this.createRelativeCard(parent)).join('')}
          </div>
        </div>
      `;
    }

    // 兄弟姐妹
    if (relatives.siblings.length > 0) {
      html += `
        <div class="relatives-section">
          <h5><i class="fas fa-users me-2"></i>兄弟姐妹</h5>
          <div class="relatives-grid">
            ${relatives.siblings.map(sibling => this.createRelativeCard(sibling)).join('')}
          </div>
        </div>
      `;
    }

    // 子女
    if (relatives.children.length > 0) {
      html += `
        <div class="relatives-section">
          <h5><i class="fas fa-users me-2"></i>子女</h5>
          <div class="relatives-grid">
            ${relatives.children.map(child => this.createRelativeCard(child)).join('')}
          </div>
        </div>
      `;
    }

    if (relatives.parents.length === 0 && relatives.siblings.length === 0 && relatives.children.length === 0) {
      html += `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <h5>暂无亲戚信息</h5>
          <p>没有找到这只鸽子的亲戚关系记录</p>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  // 创建亲戚卡片
  createRelativeCard(relative) {
    const sexIcon = relative.sex === 'male' ? '♂' : relative.sex === 'female' ? '♀' : '🐣';
    const sexClass = relative.sex === 'male' ? 'male' : relative.sex === 'female' ? 'female' : 'unknown';

    return `
      <div class="relative-card" data-pigeon-id="${relative.id}">
        <div class="relative-header">
          <div class="relative-avatar">
            <i class="fas fa-dove"></i>
          </div>
          <div class="relative-info">
            <div class="relative-name">${relative.name || '未命名'}</div>
            <div class="relative-band">${relative.id}</div>
          </div>
        </div>
        <div class="relation-type">
          <span class="sex-icon ${sexClass}">${sexIcon}</span>
          ${relative.relation}
        </div>
        <div class="relative-details">
          <div class="relative-detail">
            <div class="relative-detail-label">出生年份</div>
            <div class="relative-detail-value">${relative.year}</div>
          </div>
          <div class="relative-detail">
            <div class="relative-detail-label">品系</div>
            <div class="relative-detail-value">${relative.strain || '未知'}</div>
          </div>
        </div>
      </div>
    `;
  }

  // 生成育种内容
  generateBreedingContent(pigeon) {
    const breeding = DataHelpers.getBreedingByPigeonId(pigeon.id);

    let html = '<div class="breeding-container">';

    if (breeding.length === 0) {
      html += `
        <div class="empty-state">
          <i class="fas fa-heart"></i>
          <h5>暂无育种记录</h5>
          <p>这只鸽子还没有育种记录</p>
        </div>
      `;
    } else {
      html += '<div class="breeding-list">';

      breeding.forEach(record => {
        const sire = DataHelpers.getPigeonById(record.sire);
        const dam = DataHelpers.getPigeonById(record.dam);

        html += `
          <div class="breeding-item">
            <div class="breeding-header">
              <div class="breeding-pair">
                <div class="breeding-pigeon">
                  <div class="breeding-pigeon-avatar">
                    <i class="fas fa-mars text-primary"></i>
                  </div>
                  <div class="breeding-pigeon-info">
                    <div class="breeding-pigeon-name">${sire ? sire.name : '未知'}</div>
                    <div class="breeding-pigeon-band">${record.sire}</div>
                  </div>
                </div>
                <div class="mx-2">❤️</div>
                <div class="breeding-pigeon">
                  <div class="breeding-pigeon-avatar">
                    <i class="fas fa-venus text-danger"></i>
                  </div>
                  <div class="breeding-pigeon-info">
                    <div class="breeding-pigeon-name">${dam ? dam.name : '未知'}</div>
                    <div class="breeding-pigeon-band">${record.dam}</div>
                  </div>
                </div>
              </div>
              <div class="breeding-date">
                <div class="text-muted small">配对日期</div>
                <div>${record.date}</div>
              </div>
            </div>

            ${(record.pindex1 || record.pindex2) ? `
              <div class="breeding-offspring">
                ${record.pindex1 ? `
                  <div class="offspring-item">
                    <div class="offspring-avatar">
                      <i class="fas fa-dove"></i>
                    </div>
                    <div class="offspring-info">
                      <div class="offspring-name">${DataHelpers.getPigeonById(record.pindex1)?.name || '未命名'}</div>
                      <div class="offspring-band">${record.pindex1}</div>
                      <div class="offspring-success ${record.success1 ? 'text-success' : 'text-muted'}">
                        <i class="fas fa-check-circle"></i> ${record.success1 ? '孵化成功' : '孵化失败'}
                      </div>
                    </div>
                  </div>
                ` : ''}
                ${record.pindex2 ? `
                  <div class="offspring-item">
                    <div class="offspring-avatar">
                      <i class="fas fa-dove"></i>
                    </div>
                    <div class="offspring-info">
                      <div class="offspring-name">${DataHelpers.getPigeonById(record.pindex2)?.name || '未命名'}</div>
                      <div class="offspring-band">${record.pindex2}</div>
                      <div class="offspring-success ${record.success2 ? 'text-success' : 'text-muted'}">
                        <i class="fas fa-check-circle"></i> ${record.success2 ? '孵化成功' : '孵化失败'}
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${record.comment ? `
              <div class="mt-3">
                <small class="text-muted">${record.comment}</small>
              </div>
            ` : ''}
          </div>
        `;
      });

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // 生成媒体内容
  generateMediaContent(pigeon) {
    const media = DataHelpers.getMediaByPigeonId(pigeon.id);

    let html = '<div class="media-container">';

    if (media.length === 0) {
      html += `
        <div class="empty-state">
          <i class="fas fa-photo-video"></i>
          <h5>暂无媒体文件</h5>
          <p>这只鸽子还没有照片或视频</p>
        </div>
      `;
    } else {
      // 过滤器
      html += `
        <div class="media-filters">
          <button class="media-filter-btn active" data-filter="all">全部</button>
          <button class="media-filter-btn" data-filter="photo">照片</button>
          <button class="media-filter-btn" data-filter="video">视频</button>
          <button class="media-filter-btn" data-filter="document">文档</button>
        </div>
      `;

      // 媒体网格
      html += '<div class="media-grid">';

      media.forEach(item => {
        const icon = item.type === 'photo' ? 'fa-image' : item.type === 'video' ? 'fa-video' : 'fa-file';
        const typeName = item.type === 'photo' ? '照片' : item.type === 'video' ? '视频' : '文档';

        html += `
          <div class="media-item" data-type="${item.type}">
            <div class="position-relative">
              ${item.type === 'photo' ?
                `<img src="${item.filePath}" alt="${item.name}" class="media-thumbnail" onerror="this.src='assets/images/default-image.jpg'">` :
                `<div class="media-thumbnail d-flex align-items-center justify-content-center bg-light">
                  <i class="fas ${icon} fa-3x text-muted"></i>
                </div>`
              }
              <div class="media-type-badge">
                <i class="fas ${icon}"></i>
                ${typeName}
              </div>
            </div>
            <div class="media-info">
              <div class="media-name">${item.name}</div>
              <div class="media-date">${item.uploadDate}</div>
              <div class="text-muted small">${item.fileSize}</div>
            </div>
          </div>
        `;
      });

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // 生成用药记录内容
  generateMedicationContent(pigeon) {
    const medication = DataHelpers.getMedicationByPigeonId(pigeon.id);

    let html = '<div class="medication-container">';

    if (medication.length === 0) {
      html += `
        <div class="empty-state">
          <i class="fas fa-pills"></i>
          <h5>暂无用药记录</h5>
          <p>这只鸽子还没有用药或健康记录</p>
        </div>
      `;
    } else {
      html += '<div class="medication-timeline">';

      medication.forEach(record => {
        const typeColor = record.type.includes('疫苗') ? 'success' : record.type.includes('治疗') ? 'warning' : 'info';

        html += `
          <div class="medication-item">
            <div class="medication-header">
              <div class="medication-name">
                <span class="badge bg-${typeColor}">${record.type}</span>
                <span class="ms-2">${record.medicine}</span>
              </div>
              <div class="medication-date">${record.date}</div>
            </div>

            <div class="medication-details">
              <div class="medication-detail">
                <div class="medication-detail-label">剂量</div>
                <div class="medication-detail-value">${record.dosage}</div>
              </div>
              <div class="medication-detail">
                <div class="medication-detail-label">疗程</div>
                <div class="medication-detail-value">${record.duration}</div>
              </div>
              <div class="medication-detail">
                <div class="medication-detail-label">目的</div>
                <div class="medication-detail-value">${record.purpose}</div>
              </div>
            </div>

            ${record.notes ? `
              <div class="medication-notes">
                <strong>备注：</strong>${record.notes}
              </div>
            ` : ''}
          </div>
        `;
      });

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // 设置过滤器
  setFilter(filterType) {
    this.state.setFilterType(filterType);
    if (this.state.components.pigeonList) {
      this.state.components.pigeonList.setFilter(filterType);
    }
  }

  // 搜索鸽子
  searchPigeons(query) {
    if (!query) {
      // 如果搜索框为空，显示所有鸽子
      this.state.components.pigeonList.render(MockData.pigeons);
      return;
    }

    const filtered = MockData.pigeons.filter(pigeon =>
      pigeon.name?.toLowerCase().includes(query.toLowerCase()) ||
      pigeon.id.toLowerCase().includes(query.toLowerCase()) ||
      pigeon.strain?.toLowerCase().includes(query.toLowerCase()) ||
      pigeon.colour?.toLowerCase().includes(query.toLowerCase())
    );

    this.state.components.pigeonList.render(filtered);
  }

  // 切换侧边栏
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (this.state.toggleSidebar()) {
      sidebar.classList.add('show');
      overlay.classList.add('show');
    } else {
      this.closeSidebar();
    }
  }

  // 关闭侧边栏
  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    sidebar.classList.remove('show');
    overlay.classList.remove('show');
    this.state.isSidebarOpen = false;
  }

  // 检查屏幕尺寸
  checkScreenSize() {
    const isMobile = window.innerWidth < 768;
    this.state.isMobile = () => isMobile;

    // 在桌面端自动关闭移动端侧边栏
    if (!isMobile) {
      this.closeSidebar();
    }
  }

  // 检测是否为移动端
  isMobile() {
    return window.innerWidth < 768;
  }

  // 处理窗口大小改变
  handleResize() {
    this.checkScreenSize();
    // 其他响应式处理...
  }

  // 添加鸽子
  addPigeon() {
    this.showInfo('添加鸽子功能待实现');
  }

  // 编辑鸽子
  editPigeon(pigeon) {
    this.showInfo(`编辑鸽子: ${pigeon.name || pigeon.id}`);
  }

  // 删除鸽子
  deletePigeon(pigeon) {
    if (confirm(`确定要删除鸽子 "${pigeon.name || pigeon.id}" 吗？`)) {
      this.showInfo(`删除鸽子功能待实现`);
    }
  }

  // 复制鸽子
  copyPigeon(pigeon) {
    this.showInfo(`复制鸽子功能待实现`);
  }

  // 更换鸽子照片
  changePigeonPhoto(pigeon) {
    this.showInfo(`更换照片功能待实现`);
  }

  // 显示信息消息
  showInfo(message) {
    // 创建 toast 消息
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-primary border-0';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    // 添加到页面
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    // 显示并自动隐藏
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // 清理
    setTimeout(() => {
      toastContainer.remove();
    }, 5000);
  }

  // 显示错误消息
  showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-danger border-0';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    setTimeout(() => {
      toastContainer.remove();
    }, 5000);
  }
}

// 创建全局应用实例
let app;

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
  app = new PigeonPlannerApp();
  app.init();
});

// 导出应用实例
window.PigeonPlannerApp = app;