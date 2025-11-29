# 🕊️ Pigeon Planner

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Platform: macOS, Windows, Linux](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)]

现代化的赛鸽管理应用程序，为赛鸽爱好者提供完整的鸽群管理、血统追踪、繁殖管理和比赛记录功能。

## 📋 项目概述

Pigeon Planner 是一个多平台赛鸽管理应用程序，包含三个主要版本：

### 🏛️ 经典版本 (Python + PyGTK)
- **位置**: `pigeonplanner-classic/`
- **技术栈**: Python 2.7 + PyGTK + SQLite
- **状态**: ✅ 完整功能，生产就绪
- **功能**: 鸽子管理、血统分析、比赛管理、育种管理、健康记录、数据导出

### 🚀 现代化版本 (Rust + Tauri + React)
- **位置**: `pigeon-planner-rs/`
- **技术栈**: Rust + Tauri + React + TypeScript + Tailwind CSS
- **状态**: 🚀 85% 完成度，核心功能完整
- **功能**: 鸽子管理、血统分析、育种管理、比赛管理（健康记录待实现）

### 🌐 Web原型版本 (HTML5 + JavaScript)
- **位置**: `pigeonplanner-web/`
- **技术栈**: HTML5 + CSS3 + JavaScript ES6+ + Bootstrap 5
- **状态**: ✅ 响应式Web界面概念验证
- **功能**: 完整的原型界面，移动端友好

## 🚀 快速开始

### 经典版本 (推荐用于生产环境)

```bash
cd pigeonplanner-classic/
python pigeonplanner.py
```

### 现代化版本 (推荐用于开发)

```bash
cd pigeon-planner-rs/
npm install
npm run tauri dev
```

### Web原型版本 (浏览器体验)

```bash
cd pigeonplanner-web/
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 📊 功能对比

| 功能模块 | 经典版本 | 现代化版本 | Web版本 |
|---------|---------|-----------|---------|
| 鸽子管理 | ✅ 完整 | ✅ 完整 | ✅ 原型 |
| 血统分析 | ✅ 完整 | ✅ 完整 | ✅ 原型 |
| 比赛管理 | ✅ 完整 | ✅ 完整 | ✅ 原型 |
| 育种管理 | ✅ 完整 | ✅ 完整 | ✅ 原型 |
| 健康记录 | ✅ 完整 | ❌ 缺失 | ✅ 原型 |
| 数据导出 | ✅ 多格式 | ❌ 待实现 | ❌ 原型 |

## 🛠️ 开发环境

### 经典版本要求
- Python 2.7
- PyGTK 2.0+
- SQLite 3

### 现代化版本要求
- Node.js 18+
- Rust 1.70+
- Tauri CLI

### Web版本要求
- 现代浏览器 (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)

## 📖 文档

- [用户指南](USER_GUIDE.md) - 详细的使用说明
- [快速开始](QUICK_START.md) - 快速上手指南
- [发布说明](RELEASE_NOTES.md) - 版本更新日志
- [开发指南](CLAUDE.md) - 开发者文档

## 🤝 贡献

欢迎贡献代码！请查看各个版本目录中的具体贡献指南。

## 📄 许可证

本项目使用 **GNU General Public License v3.0** 开源许可证。详见 [LICENSE](LICENSE) 文件。

所有版本均在相同的 GPL v3.0 许可证下发布。

## 🙏 致谢

- 所有为 Pigeon Planner 项目贡献的开发者
- 开源社区提供的优秀工具和库
- 用户反馈和建议

## 📞 联系方式

- 项目主页: https://github.com/GoooIce/Pigeon-Planner
- 问题反馈: https://github.com/GoooIce/Pigeon-Planner/issues

---

**选择适合您需求的版本开始使用 Pigeon Planner！**