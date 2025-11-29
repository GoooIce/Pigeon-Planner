# Pigeon Planner

A modern, cross-platform pigeon management application built with Rust and Tauri.

## Overview

Pigeon Planner is a comprehensive solution for pigeon breeders and racers to manage their pigeon loft, track pedigrees, record race results, and manage health records. This is a complete rewrite of the original Python-based application using modern technologies for better performance and user experience.

## Technology Stack

### Backend
- **Rust** - Systems programming language for performance and safety
- **Tauri** - Lightweight framework for building cross-platform desktop apps
- **SQLite** - Reliable, file-based database
- **SQLx** - Async SQL toolkit for Rust

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching

### Key Features
- 🚀 **Blazing fast** startup and performance
- 💾 **Cross-platform** (Windows, macOS, Linux)
- 🎨 **Modern, responsive UI** with dark mode support
- 🔒 **Type-safe** with end-to-end TypeScript
- 📱 **Mobile-friendly** responsive design
- 🗄️ **Reliable data storage** with SQLite
- 🏃 **Async/await** throughout for non-blocking operations

## Features

- **Pigeon Management**: Complete CRUD operations for pigeon records
- **Pedigree Tracking**: Multi-generation pedigree visualization
- **Race Results**: Comprehensive race result tracking and analysis
- **Breeding Management**: Pairing and breeding record management
- **Health Tracking**: Medication and health record management
- **Import/Export**: CSV data import and export capabilities
- **Calculators**: Built-in calculators for speed and distance
- **Multi-language**: Internationalization support

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pigeonplanner/pigeon-planner-rs.git
   cd pigeon-planner-rs
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install Tauri CLI (if not already installed):
   ```bash
   cargo install tauri-cli
   ```

### Development

To start the development server:

```bash
npm run tauri dev
```

This will start both the frontend development server and the Tauri backend.

### Building

To build the application for production:

```bash
npm run tauri build
```

The built application will be in the `src-tauri/target/release/bundle/` directory.

## Project Structure

```
pigeon-planner-rs/
├── src-tauri/                 # Rust backend
│   ├── src/
│   │   ├── commands/         # Tauri commands (API)
│   │   ├── models/           # Data models
│   │   ├── services/         # Business logic
│   │   ├── database/         # Database layer
│   │   └── utils/            # Utility functions
│   ├── migrations/           # Database migrations
│   └── Cargo.toml
├── src/                      # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # State management
│   │   ├── services/        # API calls
│   │   ├── utils/           # Frontend utilities
│   │   └── types/           # TypeScript types
│   └── package.json
├── tests/                    # Test files
└── docs/                     # Documentation
```

## Development

### Adding New Features

1. **Backend**: Add new commands in `src-tauri/src/commands/`
2. **Frontend**: Create components in `src/src/components/`
3. **Database**: Add migrations in `src-tauri/migrations/`

### Database Migrations

The application uses SQLx for database migrations. To add a new migration:

```bash
cd src-tauri
sqlx migrate add <migration_name>
```

### Testing

```bash
# Frontend tests
npm test

# Rust tests
cargo test

# Integration tests
npm run tauri test
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)

## Support

For support and questions:
- [GitHub Issues](https://github.com/pigeonplanner/pigeon-planner-rs/issues)
- [Documentation](https://pigeonplanner.github.io/pigeon-planner-rs/)

---

**Pigeon Planner** - Modern pigeon management for the digital age 🕊️