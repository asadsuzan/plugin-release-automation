# Plugin Release Automation 

This document details the architecture, features, and technical implementation of the `plugin-release-automation` system.

## 🏛️ Core Architecture
The system follows a **One Source of Truth** philosophy where all release data is derived from structured Markdown files.

- **Data Source**: `/plugins/{slug}/releases/{version}.md`
- **Engine**: TypeScript/Node.js
- **Configuration**: `config.json` centralizes all paths, formatting rules, and behavior toggles.
- **Key Dependencies**: 
    - `gray-matter`: Frontmatter parsing.
    - `js-yaml`: Structured metadata parsing.
    - `inquirer`: Interactive CLI.
    - `axios`: Remote README fetching from WordPress.org.
    - `semver`: Version sorting and logic.

---

## 🚀 Key Features

### 1. Interactive Release & Sync (`npm run new-release`)
- **How**: Uses `inquirer` for interactive scaffolding.
- **What**: 
    - **WP.org History Sync**: When adding a new plugin, it automatically fetches the `readme.txt` from the WordPress SVN and **backfills all legacy releases** as `.md` files.
    - **Smart Date Interpolation**: If a legacy version is missing a date on WP.org, the system interpolates a random date between the nearest newer and older versions to maintain a realistic timeline.
    - **Legacy Mapping**: Automatically maps unstructured legacy changelogs into the `# Features` section of the new `.md` format.

### 2. Robust Release Parsing (`scripts/parse-release.ts`)
- **How**: Uses `glob` for discovery and `gray-matter` + custom regex for content extraction.
- **What**: 
    - Supports simple items (`- Title`) and structured objects (`- title: X, category: Y`).
    - **Type Safety**: Strictly typed interfaces for `Release` and `ReleaseItem` to prevent data corruption.
    - **Validation**: Enforces version integrity and prevents duplicate version definitions.

### 3. Configurable Readme Updating (`scripts/generate-readme.ts`)
- **How**: Patches local `readme.txt` using configurations from `config.json`.
- **What**: 
    - **Custom Formatting**: Supports configurable bullets (`*` vs `-`), custom date formats, and specific empty line spacing between entries.
    - **SVN Sync**: Always fetches the latest `readme.txt` from WP.org trunk as a base to ensure no local drift.
    - **Idempotency**: Detects existing version markers to prevent duplicate entries.

### 4. Admin Dashboard History (`scripts/generate-admin-changelog.ts`)
- **How**: Maintains a historical record in `/plugins/{slug}/generated/changelog.json`.
- **What**: 
    - **Array Preservation**: Unlike standard changelogs, this maintains a full array of all published releases, sorted by version (newest first).
    - **Automatic Migration**: Converts old single-release JSON files to the new array-based history format automatically.

### 5. Consolidated Monthly Reporting (`scripts/generate-monthly-report.ts`)
- **How**: Aggregates all published releases into the central `reports/` directory.
- **What**: 
    - **Performance Optimized**: Generates a single monthly report for the entire system instead of duplicating files per plugin.
    - **Multi-Format**: Produces both human-readable Markdown (`reports/may-2026.md`) and machine-readable JSON (`reports/may-2026.json`) for analytics.

---

## 🛠️ Workflows

### The Onboarding Workflow
1. Run `npm run new-release` ➡️ "Add a new plugin...".
2. System fetches WP.org history and scaffolds dozens of `.md` files in seconds.
3. System interpolates missing dates to build a clean historical timeline.

### The Release Workflow
1. Edit a release `.md` file and set `status: published`.
2. Run `npm run release`.
3. System updates:
    - `readme.txt` (with custom bullets/spacing).
    - `changelog.json` (appending to history).
    - Centralized monthly reports.

### 🖥️ Visualization Dashboard
You can now visualize your release history in a modern, dark-mode dashboard.
1. Run `npm run dashboard`.
2. Open the URL provided in the terminal (usually `http://localhost:5173`).
3. Explore plugin timelines, release types, and metadata in a premium interface.

---

## 📁 Folder Structure Audit
```text
plugin-release-bot/
├── config.json                 (Central Control Plane)
├── plugins/
│   └── {plugin-slug}/
│       ├── readme.txt          (Mirrored from .org)
│       ├── releases/
│       │   └── {version}.md    (Markdown Source of Truth)
│       └── generated/
│           └── changelog.json  (Historical JSON Data)
├── scripts/                    (TypeScript Automation Engine)
├── reports/                    (Centralized MD/JSON Reports)
├── package.json                (Tooling & Scripts)
└── tsconfig.json               (TS Configuration)
```
