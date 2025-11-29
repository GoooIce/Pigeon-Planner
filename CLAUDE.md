# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pigeon Planner 是一个多平台赛鸽管理应用程序，包含三个主要版本：

1. **经典版本**：Python 2.7 + PyGTK (稳定版本 2.2.4) - 完整功能，生产就绪
2. **现代化版本**：Rust + Tauri + React - 70% 完成度，现代化架构
3. **Web原型版本**：HTML5 + CSS3 + JavaScript - 响应式Web界面概念验证

## 开发命令

### 经典版本 (Python + PyGTK)
```bash
# 运行应用
python pigeonplanner.py

# 开发安装
export PYTHONPATH=dev
python setup.py develop --install-dir dev

# 系统安装
sudo python setup.py install

# 测试
make test
nosetests-2.7 tests

# 国际化
python i18n.py -p  # 更新翻译模板
python i18n.py -m  # 编译翻译文件

# 清理和打包
make clean
make sdist
make release
```

### 现代化版本 (Rust + Tauri + React)
```bash
cd pigeon-planner-rs

# 环境设置
npm install
cargo install tauri-cli

# 开发工作流
npm run tauri dev     # 启动开发服务器
npm run dev           # 仅前端开发
npm run tauri build   # 生产构建

# 测试和代码质量
npm test && cargo test
npm run lint

# 数据库管理
cd src-tauri
sqlx migrate add <name>  # 创建迁移
sqlx migrate run          # 运行迁移
```

### Web原型版本 (HTML5 + JavaScript)
```bash
cd pigeonplanner-web

# 启动本地服务器
python -m http.server 8000
npx serve .
php -S localhost:8000
```

## 项目架构

### 整体结构
```
Pigeon-Planner/
├── pigeonplanner/           # Python 经典版本 (主代码)
├── pigeon-planner-rs/      # Rust 现代化版本
├── pigeonplanner-web/      # Web原型版本
├── glade/                  # GTK 界面设计文件
├── images/                 # 图像和图标资源
├── po/                     # 翻译文件
├── resultparsers/          # 比赛结果解析器插件
├── tests/                  # 测试文件
├── data/                   # 应用程序数据文件
└── 配置文件 (setup.py, Makefile等)
```

### 经典版本架构 (Python + PyGTK)
- **pigeonplanner/core/** - 核心配置和常量
- **pigeonplanner/database/** - SQLite 数据库操作
- **pigeonplanner/ui/** - GTK 界面组件
- **pigeonplanner/export/** - 数据导出功能
- **pigeonplanner/reports/** - 报告生成

### 现代化版本架构 (Rust + Tauri + React)
```
pigeon-planner-rs/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── lib/               # 工具函数
│   ├── hooks/             # React Query hooks
│   └── contexts/          # React 上下文
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── commands/      # Tauri 命令
│   │   ├── models/        # 数据模型
│   │   ├── database/      # SQLx 数据库层
│   │   └── services/      # 业务逻辑
│   └── migrations/        # 数据库迁移
└── Cargo.toml             # Rust 依赖
```

### Web原型架构 (HTML5 + JavaScript)
```
pigeonplanner-web/
├── index.html             # 主页面
├── css/                   # 样式文件
├── js/                    # 原生JavaScript组件
└── assets/                # 静态资源
```

## 技术栈

### 经典版本
- **Python 2.7** + **PyGTK/GTK+**
- **SQLite** 数据库
- **setuptools** 构建
- **nose** 测试框架
- **gettext** 国际化

### 现代化版本
- **前端**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Rust + Tauri + SQLite + SQLx
- **状态管理**: React Query + Zustand
- **构建工具**: Vite + Tauri CLI

### Web原型版本
- **HTML5** + **CSS3** + **JavaScript ES6+**
- **Bootstrap 5** + **Font Awesome 6**
- **响应式设计** + **原生组件**

## 功能状态对比

| 功能模块 | 经典版本 | 现代化版本 | Web版本 |
|---------|---------|-----------|---------|
| 鸽子管理 | ✅ 完整 | ✅ 完整 | ✅ 原型 |
| 血统分析 | ✅ 完整 | ✅ 完整 | ✅ 原型 |
| 比赛管理 | ✅ 完整 | ❌ 缺失 | ✅ 原型 |
| 育种管理 | ✅ 完整 | ✅ 完整 | ✅ 原型 |
| 健康记录 | ✅ 完整 | ❌ 缺失 | ✅ 原型 |
| 数据导出 | ✅ 多格式 | ❌ 待实现 | ❌ 原型 |

## 数据库设计

### 经典版本 (SQLite)
主要数据表：
- **pigeons** - 鸽子基本信息
- **pedigrees** - 血统关系
- **results** - 比赛结果
- **strains** - 品种信息

### 现代化版本 (SQLite + SQLx)
#### 已完成的核心表
- **pigeons** - 鸽子主记录，支持环号和元数据
- **breeds/lofts/colors** - 参考数据表
- **pedigrees** - 血统关系，支持复杂家族追踪
- **breeding_pairs/breeding_records** - 繁殖管理
- **nest_boxes** - 巢箱管理

#### 缺失的功能表
- **races** - 比赛信息 (紧急需要)
- **race_results** - 比赛结果 (紧急需要)
- **health_records** - 健康记录

## 开发优先级

### 现代化版本紧急修复
1. **创建缺失的UI组件**：
   - alert-dialog (删除确认)
   - toast (通知消息)
   - progress (进度条)
   - skeleton (加载状态)
   - popover (悬停提示)

2. **实现比赛管理模块**：
   - 数据库迁移
   - Rust 后端命令
   - React 前端组件

3. **添加测试覆盖**：
   - 前端 Vitest 测试
   - 后端 Rust 测试
   - 集成测试

## 配置文件

### 经典版本
- **setup.py** - Python 构建配置
- **Makefile** - 构建和开发命令
- **pigeonplanner/core/const.py** - 核心常量和配置

### 现代化版本
- **package.json** - 前端依赖和脚本
- **src-tauri/Cargo.toml** - Rust 依赖
- **tauri.conf.json** - Tauri 应用配置
- **vite.config.ts** - 前端构建配置

### Web版本
- ** pigeonplanner-web/README.md** - 详细开发文档

## 开发注意事项

### 经典版本
- **Python 2.7** 兼容性要求
- 使用 `unicode` 类型处理文本
- 使用 `print` 语句而非函数
- 平台特定的代码路径

### 现代化版本
- **类型安全**：TypeScript + Rust 全程类型检查
- **热重载**：前端即时更新，Rust 需要重编译
- **SQLx**：编译时查询检查 (需要 DATABASE_URL)
- **Tauri 安全**：明确的文件系统权限配置

### Web版本
- **响应式设计**：移动端优先
- **原生 JavaScript**：无框架依赖
- **模块化组件**：基于类的组件架构
- **性能优化**：轻量级实现

## 测试策略

### 经典版本
```bash
make test  # 运行所有测试
nosetests-2.7 tests/specific_test.py  # 单个测试
```

### 现代化版本
```bash
npm test          # 前端测试
cargo test        # 后端测试
npm run lint      # 代码检查
```

## 平台支持

### 经典版本
- **Windows**: 使用 py2exe 打包
- **Linux**: 标准安装包
- **macOS**: 支持，需要特定配置

### 现代化版本
- **跨平台**: Tauri 原生支持
- **Windows**: 需要 MSVC 工具链
- **macOS**: 需要 Xcode 命令行工具
- **Linux**: 标准工具链

### Web版本
- **浏览器支持**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **响应式**: 移动端、平板、桌面全支持