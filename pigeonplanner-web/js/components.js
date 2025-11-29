/**
 * Pigeon Planner - 组件系统
 * 定义可复用的UI组件
 */

// 组件基类
class Component {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = options;
    this.element = null;
    this.data = null;
    this.callbacks = {};
  }

  // 渲染组件
  render(data) {
    this.data = data;
    if (this.element) {
      this.element.remove();
    }
    this.element = this.createElement(data);
    this.container.appendChild(this.element);
    this.bindEvents();
    return this.element;
  }

  // 创建DOM元素
  createElement(data) {
    throw new Error('createElement method must be implemented');
  }

  // 绑定事件
  bindEvents() {
    // 子类可以重写此方法
  }

  // 销毁组件
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.data = null;
  }

  // 添加回调
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  // 触发回调
  emit(event, ...args) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(...args));
    }
  }
}

// 鸽子列表项组件
class PigeonListItem extends Component {
  createElement(pigeon) {
    const div = document.createElement('div');
    div.className = 'pigeon-item';
    div.dataset.pigeonId = pigeon.id;

    const sexIcon = pigeon.sex === 'male' ? '♂' : pigeon.sex === 'female' ? '♀' : '🐣';
    const statusClass = pigeon.status === 'active' ? 'status-indicator' : 'status-indicator inactive';

    div.innerHTML = `
      <div class="pigeon-avatar">
        <i class="fas fa-dove"></i>
      </div>
      <div class="pigeon-info">
        <div class="pigeon-name">${pigeon.name || '未命名'}</div>
        <div class="pigeon-band">${pigeon.id}</div>
        <div class="pigeon-status">
          <span class="${statusClass}"></span>
          <span class="sex-icon ${pigeon.sex}">${sexIcon}</span>
          <span class="text-muted">${pigeon.year}年</span>
        </div>
      </div>
    `;

    return div;
  }

  bindEvents() {
    if (this.element) {
      this.element.addEventListener('click', () => {
        this.emit('select', this.data);
      });

      this.element.addEventListener('mouseenter', () => {
        this.emit('hover', this.data);
      });
    }
  }
}

// 鸽子列表组件
class PigeonList extends Component {
  constructor(container, options = {}) {
    super(container, options);
    this.items = [];
    this.selectedItem = null;
    this.filterType = 'all';
  }

  createElement(pigeons) {
    const div = document.createElement('div');
    div.className = 'pigeon-list';

    // 过滤鸽子
    const filteredPigeons = this.filterPigeons(pigeons);

    // 创建列表项
    filteredPigeons.forEach(pigeon => {
      const item = new PigeonListItem(null, this.options);
      const itemElement = item.render(pigeon);

      item.on('select', (selectedPigeon) => {
        this.selectPigeon(selectedPigeon);
      });

      item.on('hover', (hoveredPigeon) => {
        this.emit('hover', hoveredPigeon);
      });

      div.appendChild(itemElement);
      this.items.push(item);
    });

    // 如果没有鸽子，显示空状态
    if (filteredPigeons.length === 0) {
      div.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-dove"></i>
          <h5>没有找到鸽子</h5>
          <p>尝试调整筛选条件或添加新鸽子</p>
        </div>
      `;
    }

    return div;
  }

  filterPigeons(pigeons) {
    switch (this.filterType) {
      case 'active':
        return pigeons.filter(p => p.status === 'active');
      case 'male':
        return pigeons.filter(p => p.sex === 'male');
      case 'female':
        return pigeons.filter(p => p.sex === 'female');
      case 'young':
        return pigeons.filter(p => p.sex === 'young');
      default:
        return pigeons;
    }
  }

  selectPigeon(pigeon) {
    // 移除之前的选中状态
    if (this.selectedItem) {
      this.selectedItem.classList.remove('active');
    }

    // 设置新的选中状态
    const newItem = this.element.querySelector(`[data-pigeon-id="${pigeon.id}"]`);
    if (newItem) {
      newItem.classList.add('active');
      this.selectedItem = newItem;
      this.emit('select', pigeon);
    }
  }

  setFilter(filterType) {
    this.filterType = filterType;
    this.refresh();
  }

  refresh() {
    if (this.data) {
      this.render(this.data);
    }
  }
}

// 鸽子详情面板组件
class PigeonDetails extends Component {
  createElement(pigeon) {
    const div = document.createElement('div');
    div.className = 'pigeon-details';

    const sexText = pigeon.sex === 'male' ? '雄鸽' : pigeon.sex === 'female' ? '雌鸽' : '幼鸽';
    const sexIcon = pigeon.sex === 'male' ? 'fa-mars text-primary' : pigeon.sex === 'female' ? 'fa-venus text-danger' : 'fa-dove text-secondary';

    div.innerHTML = `
      <div class="row">
        <div class="col-md-3 text-center">
          <div class="pigeon-photo mb-3">
            <img src="${pigeon.image || 'assets/images/default-pigeon.jpg'}"
                 alt="${pigeon.name || '鸽子照片'}"
                 class="img-fluid rounded"
                 onerror="this.src='assets/images/default-pigeon.jpg'">
          </div>
          <button class="btn btn-sm btn-outline-primary w-100 mb-2">
            <i class="fas fa-camera me-1"></i> 更换照片
          </button>
          <div class="pigeon-status-badges">
            <span class="badge bg-primary">${pigeon.id}</span>
            <span class="badge ${this.getStatusBadgeClass(pigeon.status)} ms-1">
              ${this.getStatusText(pigeon.status)}
            </span>
          </div>
        </div>
        <div class="col-md-9">
          <div class="pigeon-info">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <h4 class="pigeon-name">${pigeon.name || '未命名'}</h4>
              <div class="pigeon-actions">
                <button class="btn btn-sm btn-primary me-2 edit-btn">
                  <i class="fas fa-edit me-1"></i> 编辑
                </button>
                <button class="btn btn-sm btn-outline-secondary me-2 copy-btn">
                  <i class="fas fa-copy me-1"></i> 复制
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn">
                  <i class="fas fa-trash me-1"></i> 删除
                </button>
              </div>
            </div>

            <!-- 基本信息网格 -->
            <div class="row g-2 mb-3">
              <div class="col-sm-6">
                <small class="text-muted">性别</small>
                <div><i class="fas ${sexIcon} me-1"></i> ${sexText}</div>
              </div>
              <div class="col-sm-6">
                <small class="text-muted">出生年份</small>
                <div>${pigeon.year}</div>
              </div>
              <div class="col-sm-6">
                <small class="text-muted">颜色</small>
                <div>${pigeon.colour || '未知'}</div>
              </div>
              <div class="col-sm-6">
                <small class="text-muted">品系</small>
                <div>${pigeon.strain || '未知'}</div>
              </div>
              <div class="col-sm-6">
                <small class="text-muted">鸽舍</small>
                <div>${pigeon.loft || '主鸽舍'}</div>
              </div>
              <div class="col-sm-6">
                <small class="text-muted">父亲</small>
                <div>${pigeon.sire || '未知'}</div>
              </div>
              <div class="col-sm-6">
                <small class="text-muted">母亲</small>
                <div>${pigeon.dam || '未知'}</div>
              </div>
            </div>

            <!-- 扩展信息 -->
            ${this.renderExtraInfo(pigeon)}
          </div>
        </div>
      </div>
    `;

    return div;
  }

  renderExtraInfo(pigeon) {
    const hasExtra = pigeon.extra1 || pigeon.extra2 || pigeon.extra3 ||
                    pigeon.extra4 || pigeon.extra5 || pigeon.extra6;

    if (!hasExtra) return '';

    return `
      <div class="extra-info mt-3">
        <h6 class="text-muted mb-2">扩展信息</h6>
        <div class="row g-2">
          ${pigeon.extra1 ? `
            <div class="col-sm-6">
              <small class="text-muted">扩展字段1</small>
              <div>${pigeon.extra1}</div>
            </div>
          ` : ''}
          ${pigeon.extra2 ? `
            <div class="col-sm-6">
              <small class="text-muted">扩展字段2</small>
              <div>${pigeon.extra2}</div>
            </div>
          ` : ''}
          ${pigeon.extra3 ? `
            <div class="col-sm-6">
              <small class="text-muted">扩展字段3</small>
              <div>${pigeon.extra3}</div>
            </div>
          ` : ''}
          ${pigeon.extra4 ? `
            <div class="col-sm-6">
              <small class="text-muted">扩展字段4</small>
              <div>${pigeon.extra4}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  getStatusBadgeClass(status) {
    const classes = {
      'active': 'bg-success',
      'sold': 'bg-warning',
      'lost': 'bg-danger',
      'dead': 'bg-secondary',
      'breeder': 'bg-info'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusText(status) {
    const texts = {
      'active': '活跃',
      'sold': '已售',
      'lost': '丢失',
      'dead': '死亡',
      'breeder': '种鸽'
    };
    return texts[status] || '未知';
  }

  bindEvents() {
    if (this.element) {
      // 编辑按钮
      const editBtn = this.element.querySelector('.edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.emit('edit', this.data);
        });
      }

      // 复制按钮
      const copyBtn = this.element.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          this.emit('copy', this.data);
        });
      }

      // 删除按钮
      const deleteBtn = this.element.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          this.emit('delete', this.data);
        });
      }

      // 更换照片按钮
      const photoBtn = this.element.querySelector('.pigeon-photo button');
      if (photoBtn) {
        photoBtn.addEventListener('click', () => {
          this.emit('change-photo', this.data);
        });
      }
    }
  }
}

// 血统表组件
class PedigreeTable extends Component {
  createElement(pigeon) {
    const div = document.createElement('div');
    div.className = 'pedigree-container';

    // 生成血统数据
    const pedigreeData = this.generatePedigreeData(pigeon);

    div.innerHTML = `
      <div class="row mb-3">
        <div class="col-md-6">
          <h5 class="text-primary">
            <i class="fas fa-sitemap me-2"></i>${pigeon.name || '未命名'} 的血统
          </h5>
        </div>
        <div class="col-md-6 text-end">
          <button class="btn btn-sm btn-outline-primary">
            <i class="fas fa-download me-1"></i> 导出血统
          </button>
        </div>
      </div>
      <div class="table-responsive">
        ${this.createPedigreeTable(pedigreeData)}
      </div>
    `;

    return div;
  }

  generatePedigreeData(pigeon) {
    // 简化的血统数据生成（实际应用中需要更复杂的算法）
    const generation = 5; // 5代血统
    const pedigree = [];

    // 第0代：目标鸽子
    pedigree.push({
      generation: 0,
      position: 0,
      pigeon: pigeon
    });

    // 第1代：父母
    if (pigeon.sire) {
      pedigree.push({
        generation: 1,
        position: 1,
        pigeon: DataHelpers.getPigeonById(pigeon.sire) || this.createUnknownParent('父亲')
      });
    } else {
      pedigree.push({
        generation: 1,
        position: 1,
        pigeon: this.createUnknownParent('父亲')
      });
    }

    if (pigeon.dam) {
      pedigree.push({
        generation: 1,
        position: 2,
        pigeon: DataHelpers.getPigeonById(pigeon.dam) || this.createUnknownParent('母亲')
      });
    } else {
      pedigree.push({
        generation: 1,
        position: 2,
        pigeon: this.createUnknownParent('母亲')
      });
    }

    // 生成更远代的祖父母（简化版）
    for (let gen = 2; gen < generation; gen++) {
      const parentCount = Math.pow(2, gen);
      for (let pos = 0; pos < parentCount; pos++) {
        pedigree.push({
          generation: gen,
          position: pos,
          pigeon: this.createUnknownParent(`第${gen}代祖先`)
        });
      }
    }

    return pedigree;
  }

  createUnknownParent(relation) {
    return {
      id: '',
      name: relation,
      band: '未知',
      sex: Math.random() > 0.5 ? 'male' : 'female'
    };
  }

  createPedigreeTable(data) {
    let table = '<table class="pedigree-table">';

    // 按代分组
    const generations = {};
    data.forEach(item => {
      if (!generations[item.generation]) {
        generations[item.generation] = [];
      }
      generations[item.generation].push(item);
    });

    // 生成表格
    Object.keys(generations).forEach(gen => {
      const genData = generations[gen];
      const rows = Math.ceil(genData.length / 5); // 每行5个

      for (let row = 0; row < rows; row++) {
        table += '<tr>';
        for (let col = 0; col < 5; col++) {
          const index = row * 5 + col;
          const item = genData[index];

          table += '<td class="pedigree-cell generation-' + gen + '">';
          if (item) {
            const sexIcon = item.pigeon.sex === 'male' ? '♂' : '♀';
            table += `
              <div class="pedigree-name">${item.pigeon.name} ${sexIcon}</div>
              <div class="pedigree-band">${item.pigeon.band || item.pigeon.id || '未知'}</div>
            `;
          }
          table += '</td>';
        }
        table += '</tr>';
      }
    });

    table += '</table>';
    return table;
  }
}

// 比赛结果表格组件
class ResultsTable extends Component {
  createElement(results) {
    const div = document.createElement('div');
    div.className = 'results-container';

    if (results.length === 0) {
      div.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy"></i>
          <h5>暂无比赛成绩</h5>
          <p>这只鸽子还没有参加过比赛</p>
        </div>
      `;
      return div;
    }

    // 计算统计数据
    const stats = this.calculateStats(results);

    div.innerHTML = `
      <div class="results-header">
        <div>
          <h5 class="mb-2">
            <i class="fas fa-trophy me-2 text-primary"></i>比赛成绩
          </h5>
          <div class="results-stats">
            <div class="stat-item">
              <div class="stat-value">${results.length}</div>
              <div class="stat-label">总场次</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.firstPlace}</div>
              <div class="stat-label">第一名</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.topTenPercent}</div>
              <div class="stat-label">前10%</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.avgSpeed}</div>
              <div class="stat-label">平均速度</div>
            </div>
          </div>
        </div>
        <div>
          <button class="btn btn-sm btn-primary">
            <i class="fas fa-plus me-1"></i> 添加成绩
          </button>
        </div>
      </div>

      <!-- 桌面端表格视图 -->
      <div class="results-table">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>日期</th>
              <th>比赛地点</th>
              <th>距离</th>
              <th>名次</th>
              <th>参赛数</th>
              <th>百分比</th>
              <th>速度</th>
              <th>天气</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(result => this.createResultRow(result)).join('')}
          </tbody>
        </table>
      </div>

      <!-- 移动端卡片视图 -->
      <div class="results-cards">
        ${results.map(result => this.createResultCard(result)).join('')}
      </div>
    `;

    return div;
  }

  createResultRow(result) {
    const placeClass = result.place <= 3 ? `result-place-${result.place}` : '';
    const percentage = ((result.place / result.out) * 100).toFixed(1);

    return `
      <tr>
        <td>${result.date}</td>
        <td>${result.point}</td>
        <td>${result.distance}km</td>
        <td class="${placeClass}">${result.place}</td>
        <td>${result.out}</td>
        <td><span class="result-percentage">${percentage}%</span></td>
        <td>${result.speed}m/min</td>
        <td>${result.weather}</td>
      </tr>
    `;
  }

  createResultCard(result) {
    const percentage = ((result.place / result.out) * 100).toFixed(1);

    return `
      <div class="result-card">
        <div class="result-card-header">
          <div class="result-date">${result.date}</div>
          <div class="result-place-badge">${result.place}/${result.out}</div>
        </div>
        <div class="result-card-body">
          <div class="result-card-item">
            <div class="result-card-label">比赛地点</div>
            <div class="result-card-value">${result.point}</div>
          </div>
          <div class="result-card-item">
            <div class="result-card-label">距离</div>
            <div class="result-card-value">${result.distance}km</div>
          </div>
          <div class="result-card-item">
            <div class="result-card-label">速度</div>
            <div class="result-card-value">${result.speed}m/min</div>
          </div>
          <div class="result-card-item">
            <div class="result-card-label">天气</div>
            <div class="result-card-value">${result.weather}</div>
          </div>
        </div>
      </div>
    `;
  }

  calculateStats(results) {
    const firstPlace = results.filter(r => r.place === 1).length;
    const topTenPercent = results.filter(r => (r.place / r.out) <= 0.1).length;
    const avgSpeed = (results.reduce((sum, r) => sum + r.speed, 0) / results.length).toFixed(0);

    return {
      firstPlace,
      topTenPercent,
      avgSpeed
    };
  }
}

// 导出组件类
window.Components = {
  Component,
  PigeonListItem,
  PigeonList,
  PigeonDetails,
  PedigreeTable,
  ResultsTable
};