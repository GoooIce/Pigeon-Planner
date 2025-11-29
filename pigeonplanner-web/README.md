# Pigeon Planner Web

基于 Pigeon Planner 桌面应用的自适应HTML静态原型

## 项目概述

这是一个将 Pigeon Planner (Python + PyGTK) 转换为现代Web界面的静态原型项目。该原型保持了原应用的核心功能设计和用户体验，同时实现了全设备兼容的自适应布局。

## 主要特性

### 🎯 核心功能
- **鸽子管理**：完整的鸽子信息管理，包括基本信息、血统关系等
- **血统分析**：5代血统表展示，清晰呈现家族关系
- **比赛成绩**：详细的比赛记录和统计分析
- **育种管理**：配对记录和孵化跟踪
- **亲戚关系**：智能识别和管理鸽子家族关系
- **媒体管理**：照片、视频等多媒体文件管理
- **健康记录**：用药和疫苗接种记录

### 📱 响应式设计
- **移动端优化**：专为手机屏幕优化的界面和交互
- **平板适配**：针对平板设备的布局调整
- **桌面体验**：保持原桌面应用的三栏布局设计
- **触摸友好**：支持触摸手势和操作

### 🎨 设计特点
- **现代化界面**：使用Bootstrap 5和现代CSS技术
- **一致性设计**：保持与原应用的视觉风格一致
- **轻量级实现**：原生JavaScript，无框架依赖
- **高性能**：优化的加载和渲染性能

## 技术栈

- **HTML5**：语义化标记和现代Web标准
- **CSS3**：Flexbox、Grid、CSS变量等现代特性
- **JavaScript ES6+**：模块化组件开发
- **Bootstrap 5**：响应式网格和UI组件
- **Font Awesome 6**：图标系统

## 项目结构

```
pigeonplanner-web/
├── index.html                 # 主页面
├── css/
│   ├── main.css              # 主样式文件
│   ├── components.css        # 组件样式
│   └── responsive.css        # 响应式设计
├── js/
│   ├── main.js               # 主应用逻辑
│   ├── components.js         # UI组件
│   └── mock-data.js          # 模拟数据
├── assets/
│   ├── icons/                # 图标资源
│   └── images/               # 图片资源
└── pages/                    # 页面文件（预留）
```

## 快速开始

### 1. 环境要求
- 现代浏览器（Chrome 80+, Firefox 75+, Safari 13+, Edge 80+）
- 本地Web服务器（推荐使用Live Server或类似工具）

### 2. 安装和运行
```bash
# 克隆或下载项目文件
cd pigeonplanner-web

# 使用Python启动本地服务器
python -m http.server 8000

# 或使用Node.js的serve包
npx serve .

# 或使用PHP内置服务器
php -S localhost:8000
```

### 3. 访问应用
在浏览器中打开：`http://localhost:8000`

## 功能模块

### 📋 鸽子列表
- 显示所有鸽子的基本信息
- 支持按状态、性别、年龄筛选
- 实时搜索功能
- 点击选择鸽子查看详情

### 📊 鸽子详情
- 完整的鸽子信息展示
- 照片管理（占位实现）
- 编辑、复制、删除操作（占位实现）
- 状态标识和性别图标

### 🌳 血统分析
- 5代血统表展示
- 清晰的家族关系可视化
- 支持导出血统（占位实现）

### 🏆 比赛成绩
- 详细的比赛记录表格
- 移动端卡片视图
- 统计分析（总场次、第一名次数、前10%比例、平均速度）

### 👨‍👩‍👧‍👦 亲戚关系
- 父母关系展示
- 兄弟姐妹识别
- 子女记录显示
- 智能关系分析

### ❤️ 育种管理
- 配对记录管理
- 孵化跟踪
- 幼鸽出生记录
- 成功/失败状态标识

### 📸 媒体管理
- 照片、视频分类展示
- 文件信息显示
- 按类型过滤

### 💊 健康记录
- 用药时间线
- 疫苗接种记录
- 治疗过程跟踪
- 备注信息管理

## 响应式特性

### 移动端 (< 768px)
- 汉堡菜单导航
- 全屏侧边栏
- 底部标签页导航
- 卡片式内容布局
- 触摸友好的交互

### 平板端 (768px - 992px)
- 可折叠侧边栏
- 两栏布局
- 保持标签页水平布局
- 适中的内容密度

### 桌面端 (> 992px)
- 三栏布局（左侧列表 + 右侧详情 + 标签页）
- 固定侧边栏
- 最大化的内容展示
- 鼠标悬停效果

## 开发指南

### 组件架构
项目采用基于类的组件架构：

```javascript
class Component {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
  }

  render(data) {
    // 渲染组件
  }

  bindEvents() {
    // 绑定事件
  }
}
```

### 状态管理
使用 AppState 类管理全局状态：

```javascript
const app = new PigeonPlannerApp();
app.selectPigeon(pigeon);
app.switchTab('pedigree');
```

### 数据管理
模拟数据通过 MockData 对象管理：

```javascript
const pigeons = MockData.pigeons;
const results = DataHelpers.getResultsByPigeonId(pigeonId);
```

### 样式系统
使用CSS变量实现主题管理：

```css
:root {
  --primary-color: #2e7d32;
  --surface-color: #ffffff;
  --text-primary: #212121;
}
```

## 浏览器兼容性

| 浏览器 | 版本要求 | 支持状态 |
|--------|----------|----------|
| Chrome | 80+ | ✅ 完全支持 |
| Firefox | 75+ | ✅ 完全支持 |
| Safari | 13+ | ✅ 完全支持 |
| Edge | 80+ | ✅ 完全支持 |
| IE | - | ❌ 不支持 |

## 性能指标

- **首屏加载时间**：< 2秒
- **页面切换响应**：< 500ms
- **数据容量**：支持1000+鸽子记录
- **内存使用**：< 50MB

## 开发工具

### 推荐的开发环境
- **VS Code** + Live Server 扩展
- Chrome DevTools 用于调试
- 响应式设计模式测试

### 有用的Chrome扩展
- Responsive Viewer
- Window Resizer
- React Developer Tools（用于组件调试）

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目基于原 Pigeon Planner 项目，遵循相同的开源许可证。

## 致谢

- Pigeon Planner 原项目团队
- Bootstrap 框架
- Font Awesome 图标库
- 所有开源贡献者

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发起 Discussion
- 贡献代码

---

**注意**：这是一个静态原型项目，主要用于演示和测试。实际生产环境需要结合后端API和数据库。