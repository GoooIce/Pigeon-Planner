# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

Pigeon Planner 是一个现代化的跨平台赛鸽管理应用程序，从 Python+PyGTK 重写为 Rust+Tauri+React。该项目为赛鸽爱好者提供完整的鸽群繁殖、比赛和健康记录管理解决方案。

## 当前开发状态 (2025-11-29)

**项目完成度：70%**
- ✅ 核心数据层完成 (database.sqlx, models, migrations)
- ✅ 基础 CRUD 后端命令完成 (pigeon.rs, breed.rs, loft.rs, color.rs)
- ✅ 前端数据管理完成 (hooks, providers, contexts)
- ✅ 基础 UI 组件完成 (shadcn/ui)
- ✅ 高级功能完成 (pedigree 系统，繁殖管理)
- 🚧 **紧急问题：缺失关键 UI 组件导致应用无法正常运行**
- ❌ 比赛管理模块完全缺失
- ❌ 测试覆盖为 0%

**第一优先级：修复缺失的 UI 组件**
- alert-dialog: 导致删除确认对话框无法显示
- toast: 导致通知消息无法显示
- progress: 导致进度条显示失败
- skeleton: 导致加载状态显示失败
- popover: 导致悬停提示无法显示

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Rust + Tauri + SQLite + SQLx
- **状态管理**: React Query + Zustand
- **构建工具**: Vite + Tauri CLI

## 开发命令

### 环境设置
```bash
# 安装 Node.js 依赖
npm install

# 安装 Rust 工具链 (如果未安装)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Tauri CLI
cargo install tauri-cli
```

### 开发工作流
```bash
# 启动开发服务器 (前端 + 后端)
npm run tauri dev

# 仅前端开发
npm run dev

# 生产构建
npm run tauri build

# 运行测试
npm test
cargo test

# 代码检查
npm run lint
npm run lint:fix
```

### 数据库管理
```bash
cd src-tauri

# 创建新迁移
sqlx migrate add <migration_name>

# 运行迁移 (应用启动时自动执行)
sqlx migrate run

# 重置数据库
rm pigeon_planner.db
```

## 关键架构概览

### 项目结构
```
pigeon-planner-rs/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── ui/            # shadcn/ui 基础组件 (已存在，但缺失关键组件)
│   │   ├── layout/        # 布局组件
│   │   ├── pigeons/       # 鸽子管理组件 (已完成)
│   │   ├── pedigree/      # 血统书组件 (已完成)
│   │   └── breeding/      # 繁殖管理组件 (已完成)
│   ├── lib/               # 工具函数
│   ├── hooks/             # React Query hooks (已完成)
│   ├── contexts/          # React 上下文 (已完成)
│   └── styles/            # 全局样式
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── commands/      # Tauri 命令 (API 端点)
│   │   ├── models/        # 数据模型 (已完成)
│   │   ├── database/      # 数据库层 (已完成)
│   │   └── services/      # 业务逻辑 (已完成)
│   ├── migrations/        # 数据库迁移 (已完成)
│   └── Cargo.toml         # Rust 依赖
├── tests/                  # 测试文件 (需要创建)
└── docs/                   # 文档
```

### 数据库设计

#### 已完成的核心表
- **pigeons**: 鸽子主记录，包含环号、血统信息和元数据
- **breeds**: 鸽子品种参考表
- **lofts**: 鸽舍位置参考表
- **colors**: 鸽子颜色参考表
- **pedigrees**: 血统关系表 (支持复杂血统追踪)
- **breeding_pairs**: 繁殖配对记录
- **breeding_records**: 繁殖记录 (产蛋、孵化、出飞等)
- **nest_boxes**: 巢箱管理

#### 缺失的功能表
- **races**: 比赛信息表 (紧急需要)
- **race_results**: 比赛结果表 (紧急需要)
- **health_records**: 健康记录表

### 前端架构

#### 组件层次结构
```
App
├── Layout
│   ├── Header
│   ├── Navigation
│   └── Main
│       ├── Dashboard
│       ├── PigeonList
│       │   ├── PigeonTable (数据显示)
│       │   ├── PigeonForm (添加/编辑)
│       │   └── SearchBar (过滤)
│       ├── PedigreeView
│       └── BreedingManagement
│           ├── BreedingPairs
│           ├── BreedingRecords
│           └── NestBoxManagement
└── RaceManagement (需要创建)
    ├── RaceCalendar
    ├── RaceRegistration
    └── RaceResults
```

#### UI 系统状态
- **shadcn/ui**: 现代 Radix UI 组件，使用 Tailwind 样式
- **路径别名**: `@/` 映射到 `src/` (在 vite.config.ts 中配置)
- **样式**: Tailwind CSS 与自定义设计系统
- **图标**: Lucide React 图标库

#### 紧急缺失的 UI 组件
以下组件在 `src/components/ui/` 中**缺失**，导致运行时错误：
1. **alert-dialog.tsx** - 删除确认对话框
2. **toast.tsx** - 通知消息系统
3. **progress.tsx** - 进度条组件
4. **skeleton.tsx** - 加载状态骨架屏
5. **popover.tsx** - 悬停提示组件

### 后端架构

#### 命令系统状态
Tauri 命令提供前端和后端之间的 API 桥梁：

##### ✅ 已完成的核心鸽子管理命令
```rust
get_all_pigeons(limit, offset)
get_pigeon_by_id(id)
create_pigeon(pigeon_data)
update_pigeon(id, pigeon_data)
delete_pigeon(id)
search_pigeons(params)
```

##### ✅ 已完成的高级功能命令
```rust
// 血统管理
get_pedigree(pigeon_id, generations)
add_pedigree_entry(pigeon_id, sire_id, dam_id)

// 繁殖管理
get_all_breeding_pairs()
create_breeding_pair(pair_data)
get_breeding_records(pair_id)
create_breeding_record(record_data)
get_all_nest_boxes()
```

##### ❌ 缺失的比赛管理命令 (紧急需要)
```rust
// 需要实现的比赛管理命令
get_all_races()
create_race(race_data)
register_pigeon_for_race(race_id, pigeon_id)
record_race_result(race_id, pigeon_id, result_data)
get_race_statistics(race_id)
```

## 紧急开发优先级

### 第一阶段 (立即执行)：修复缺失的 UI 组件
**目标**：让应用程序能够正常运行

1. **创建 alert-dialog.tsx** - 基于 Radix UI AlertDialog
   - 支持删除确认对话框
   - 可自定义标题和内容
   - 包含取消和确认按钮

2. **创建 toast.tsx** - 基于 Radix UI Toast
   - 支持成功、错误、警告、信息消息
   - 自动消失和手动关闭
   - 支持多消息堆叠

3. **创建 progress.tsx** - 进度条组件
   - 支持确定和不确定进度
   - 可自定义颜色和尺寸
   - 支持标签显示

4. **创建 skeleton.tsx** - 加载骨架屏
   - 支持不同形状 (文本、头像、卡片)
   - 动画效果
   - 可配置的加载状态

5. **创建 popover.tsx** - 悬停提示组件
   - 支持自定义触发方式
   - 可定位和样式化
   - 支持复杂内容

### 第二阶段：实现比赛管理模块
**目标**：添加核心比赛功能

1. **数据库迁移** - 创建 `004_race_management.sql`
   - races 表 (比赛信息)
   - race_results 表 (比赛结果)
   - race_participants 表 (参赛鸽子)
   - 相关索引和视图

2. **Rust 后端命令**
   - 创建 `src-tauri/src/commands/race.rs`
   - 实现 CRUD 操作
   - 添加统计计算功能

3. **前端组件**
   - 创建 `src/components/race/` 目录
   - RaceCalendar 组件
   - RaceRegistration 组件
   - RaceResults 组件

### 第三阶段：测试覆盖
**目标**：实现基本测试覆盖

1. **后端测试** - 使用 Rust 内置测试框架
2. **前端测试** - Vitest + React Testing Library
3. **集成测试** - 端到端测试

## 开发工作模式

### 修复 UI 组件的工作模式
1. **复制现有组件结构** - 参考 `dropdown-menu.tsx` 或 `textarea.tsx`
2. **使用 Radix UI Primitive** - 作为基础实现
3. **应用 Tailwind 样式** - 保持设计系统一致性
4. **添加 TypeScript 类型** - 确保类型安全
5. **测试组件** - 确保功能正常

### 实现新功能的工作模式
1. **先数据库迁移** - 创建表结构
2. **后端命令先行** - 实现 CRUD 操作
3. **React Query hooks** - 连接前端和后端
4. **UI 组件开发** - 实现用户界面
5. **集成测试** - 确保功能完整

## 重要配置文件

### `package.json`
- 定义前端依赖和脚本
- 关键脚本：`tauri dev`、`tauri build`、`test`、`lint`

### `src-tauri/Cargo.toml`
- Rust 依赖，包括 Tauri、SQLx 和工具 crate
- 不同构建配置的特性标志

### `tauri.conf.json`
- Tauri 应用程序配置
- 文件系统访问和对话框的安全权限
- 不同平台的构建设置

### `vite.config.ts`
- 前端构建配置和路径别名
- 开发服务器设置和代理配置

### `tailwind.config.js`
- 设计系统配置和自定义颜色
- 深色模式支持和动画工具

## 开发注意事项

### 性能考虑
- Rust 后端为数据操作提供出色性能
- React Query 缓存减少不必要的 API 调用
- SQLite 数据库适合桌面应用程序规模

### 安全注意事项
- Tauri 安全模型防止任意代码执行
- 文件系统访问在权限中明确配置
- 数据库操作使用参数化查询防止 SQL 注入

### 平台特定注意事项
- Windows：使用 MSVC 工具链，确保安装 Visual Studio Build Tools
- macOS：需要 Xcode 命令行工具
- Linux：标准 Rust 工具链安装即可

### 测试策略
- 前端：Vitest 用于单元测试，React Testing Library 用于组件测试
- 后端：Rust 内置测试框架与模拟数据库连接
- 集成：通过 Tauri 命令接口进行端到端测试

## 常见问题和解决方案

### UI 组件导入错误
**问题**：`Cannot find module '@/components/ui/alert-dialog'`
**解决**：立即创建缺失的组件，参考现有组件结构

### SQLx 编译时查询
- 使用运行时查询 (`sqlx::query()`) 当 DATABASE_URL 不可用时
- 编译时查询 (`sqlx::query_as!`) 需要环境设置

### 导入路径解析
- `@/` 别名在 `vite.config.ts` 和 `tsconfig.json` 中配置
- 确保路径导入使用精确的大小写匹配

### 数据库迁移
- 迁移文件必须按顺序命名 (001_, 002_ 等)
- 在运行破坏性迁移前始终备份数据库

### Tauri 开发
- 首次编译因 Rust 依赖需要大量时间
- 使用增量编译后，后续构建快得多

## Architecture Overview

### Project Structure
```
pigeon-planner-rs/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── ui/            # shadcn/ui base components
│   │   ├── layout/        # Layout components
│   │   └── pigeons/       # Pigeon management components
│   ├── lib/               # Utilities
│   └── styles/            # Global styles
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/      # Tauri commands (API endpoints)
│   │   ├── models/        # Data models
│   │   ├── database/      # Database layer
│   │   └── services/      # Business logic
│   ├── migrations/        # Database migrations
│   └── Cargo.toml         # Rust dependencies
├── tests/                  # Test files
└── docs/                   # Documentation
```

### Database Design

#### Core Tables
- **pigeons**: Main pigeon records with ring numbers, pedigree info, and metadata
- **breeds**: Reference table for pigeon breeds
- **lofts**: Reference table for loft locations
- **colors**: Reference table for pigeon colors

#### Key Schema Notes
- Uses SQLite with SQLx for type-safe database operations
- Migrations managed in `src-tauri/migrations/`
- Supports JSON fields for extensible metadata
- Foreign key relationships for pedigree tracking

### Frontend Architecture

#### Component Hierarchy
```
App
└── Layout
    └── PigeonList
        ├── PigeonTable (data display)
        ├── PigeonForm (add/edit)
        └── SearchBar (filtering)
```

#### UI System
- **shadcn/ui**: Modern Radix UI components with Tailwind styling
- **Path aliases**: `@/` mapped to `src/` (configured in vite.config.ts)
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React icon library

### Backend Architecture

#### Command System
Tauri commands provide the API bridge between frontend and backend:

```rust
// Core pigeon management commands
get_all_pigeons(limit, offset)
get_pigeon_by_id(id)
create_pigeon(pigeon_data)
update_pigeon(id, pigeon_data)
delete_pigeon(id)
search_pigeons(params)
```

#### Error Handling
- Unified `AppError` type with detailed error categories
- Serialized error responses for frontend consumption
- Proper logging with tracing crate

#### Database Layer
- SQLx with compile-time query checking (when DATABASE_URL is set)
- Connection pooling with SqlitePool
- Runtime queries for maximum compatibility

## Key Development Patterns

### Frontend Patterns
- **React Query**: Server state management with caching and optimistic updates
- **Component Composition**: Reusable UI components with clear separation of concerns
- **Type Safety**: Full TypeScript integration with Rust backend types
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Backend Patterns
- **Command Pattern**: Tauri commands as clean API boundaries
- **Repository Pattern**: Database abstraction through connection module
- **Service Layer**: Business logic separated from data access
- **Error Propagation**: Result types with detailed error context

### Development Workflow
- **Hot Reload**: Frontend changes reflect immediately, Rust requires recompile
- **Type Safety**: TypeScript and Rust provide end-to-end type checking
- **Database Migrations**: Automatic migration on application startup
- **Testing**: Unit tests for business logic, integration tests for commands

## Important Configuration Files

### `package.json`
- Defines frontend dependencies and scripts
- Key scripts: `tauri dev`, `tauri build`, `test`, `lint`

### `src-tauri/Cargo.toml`
- Rust dependencies including Tauri, SQLx, and utility crates
- Feature flags for different build configurations

### `tauri.conf.json`
- Tauri application configuration
- Security permissions for file system access and dialogs
- Build settings for different platforms

### `vite.config.ts`
- Frontend build configuration with path aliases
- Development server settings and proxy configuration

### `tailwind.config.js`
- Design system configuration with custom colors and components
- Dark mode support and animation utilities

## Development Notes

### Performance Considerations
- Rust backend provides excellent performance for data operations
- React Query caching reduces unnecessary API calls
- SQLite database suitable for desktop application scale

### Security Notes
- Tauri security model prevents arbitrary code execution
- File system access explicitly configured in permissions
- Database operations use parameterized queries preventing SQL injection

### Platform-Specific Notes
- Windows: Uses MSVC toolchain, ensure Visual Studio Build Tools installed
- macOS: Requires Xcode command line tools
- Linux: Standard Rust toolchain installation sufficient

### Testing Strategy
- Frontend: Vitest for unit tests, React Testing Library for component tests
- Backend: Rust's built-in testing framework with mock database connections
- Integration: End-to-end testing through Tauri command interface

## Common Issues and Solutions

### SQLx Compile-Time Queries
- Use runtime queries (`sqlx::query()`) when DATABASE_URL not available
- Compile-time queries (`sqlx::query_as!`) require environment setup

### Import Path Resolution
- `@/` alias configured in both `vite.config.ts` and `tsconfig.json`
- Ensure path imports use exact case matching

### Database Migrations
- Migration files must be named sequentially (001_, 002_, etc.)
- Always backup database before running destructive migrations

### Tauri Development
- First compilation takes significant time due to Rust dependencies
- Subsequent builds are much faster with incremental compilation