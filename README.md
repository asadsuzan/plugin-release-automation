## Plugin Release Automation System

This system automates the release process for WordPress plugins. It generates changelogs, creates monthly reports, and automates the release process to the WordPress Plugin Repository.

### Features

🚀 Key Features Implemented:
- Centralized Release Management: All data is parsed from /plugins/*/releases/*.md.
- Automatic Readme Updates: Inserts the latest changelog at the top of the == Changelog == section in readme.txt while preserving other content.
- Admin Dashboard Integration: Generates changelog.json for each plugin to power future UI components.
- Monthly Reporting: Aggregates all plugin releases into a readable Markdown report and a JSON summary.
- Validation Suite: Enforces strict frontmatter and category requirements (Features, Improvements, Fixes).
- Dry Run Support: Preview changes using npm run release -- --dry.

### How it works


        
## 📂 Project Structure

```bash
plugin-release-bot/
├── plugins/
│   ├── offcanvas-block/
│   │   ├── readme.txt
│   │   ├── releases/
│   │   │   └── 2.5.0.md                # Your source of truth
│   │   └── generated/
│   │       ├── changelog.json
│   │       └── monthly-report.json
├── scripts/
│   ├── parse-release.ts               # Parses the release markdown file
│   ├── generate-readme.ts             # Generates the changelog.json
│   ├── generate-admin-changelog.ts    # Generates the monthly report
│   └── release.ts                     # Master command (orchestrator)
├── reports/
│   └── may-2026.md                    # Auto-generated
├── templates/
│   └── changelog.template.txt         # Template for the changelog 
├── package.json
└── tsconfig.json
```




### Setup

1. Install dependencies:

```bash
npm install
```

2. Run the release process:

```bash
npm run release
```

### Usage

The system uses a configuration-driven approach to manage plugin releases. Each plugin has its own configuration file in the `plugins` directory that specifies the release settings.
