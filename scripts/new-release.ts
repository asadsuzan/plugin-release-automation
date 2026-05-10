import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import axios from 'axios';

async function main() {
  console.log(chalk.bold.blue('\n📦 Create New Plugin Release\n'));

  const pluginsDir = path.join(process.cwd(), 'plugins');
  await fs.ensureDir(pluginsDir);
  
  const pluginFolders = (await fs.readdir(pluginsDir, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const choices = [...pluginFolders, new inquirer.Separator(), 'Add a new plugin...'];

  const initialAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'pluginChoice',
      message: 'Select plugin:',
      choices: choices
    }
  ]);

  let pluginSlug = initialAnswers.pluginChoice;
  let isNewPlugin = false;

  if (pluginSlug === 'Add a new plugin...') {
    isNewPlugin = true;
    const newPluginAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'slug',
        message: 'Enter the new plugin slug (as it appears on WordPress.org):',
        validate: (input) => input.trim().length > 0 || 'Slug is required'
      }
    ]);
    pluginSlug = newPluginAnswer.slug.trim();
  }

  const pluginDir = path.join(pluginsDir, pluginSlug);
  const releaseDir = path.join(pluginDir, 'releases');
  const readmePath = path.join(pluginDir, 'readme.txt');

  await fs.ensureDir(releaseDir);

  // If new plugin, try to sync from WP.org
  if (isNewPlugin && !await fs.pathExists(readmePath)) {
    console.log(chalk.cyan(`ℹ New plugin detected. Syncing history from WordPress.org for "${pluginSlug}"...`));
    const orgReadmeUrl = `https://plugins.svn.wordpress.org/${pluginSlug}/trunk/readme.txt`;
    try {
      const response = await axios.get(orgReadmeUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const readmeContent = response.data;
      await fs.writeFile(readmePath, readmeContent);
      console.log(chalk.green(`✔ Fetched readme.txt from WordPress.org`));

      // Parse and interpolate dates
      const legacyReleases = parseAndInterpolateReleases(readmeContent);
      
      if (legacyReleases.length > 0) {
        console.log(chalk.cyan(`ℹ Found ${legacyReleases.length} legacy releases. Creating .md files...`));
        for (const rel of legacyReleases) {
          const relPath = path.join(releaseDir, `${rel.version}.md`);
          if (!await fs.pathExists(relPath)) {
            const content = `---
version: ${rel.version}
date: ${rel.date}
plugin: ${pluginSlug}
status: published
type: patch
tags: []
---

# Features

${rel.items.map((item: string) => `- title: ${item}`).join('\n')}

# Improvements

# Fixes
`;
            await fs.writeFile(relPath, content);
          }
        }
        console.log(chalk.green(`✔ Created legacy release files with interpolated dates.`));
      }
    } catch (error: any) {
      console.warn(chalk.yellow(`! Could not sync from WordPress.org. Creating a blank plugin structure.`));
      await fs.writeFile(readmePath, `=== ${pluginSlug} ===\n\n== Changelog ==\n`);
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'version',
      message: 'New version (e.g., 2.6.0):',
      validate: (input) => /^\d+\.\d+\.\d+$/.test(input) || 'Please enter a valid version (x.y.z)'
    },
    {
      type: 'list',
      name: 'type',
      message: 'Release type:',
      choices: ['patch', 'minor', 'major', 'hotfix'],
      default: 'minor'
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma separated):',
      filter: (input: string) => input.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
    }
  ]);

  const releaseDate = new Date().toISOString().split('T')[0];
  const filePath = path.join(releaseDir, `${answers.version}.md`);

  if (await fs.pathExists(filePath)) {
    console.error(chalk.red(`✖ Release ${answers.version} already exists for ${pluginSlug}`));
    process.exit(1);
  }

  const template = `---
version: ${answers.version}
date: ${releaseDate}
plugin: ${pluginSlug}
status: draft
type: ${answers.type}
tags:
${answers.tags.map((t: string) => `  - ${t}`).join('\n')}
---

# Features

- title: 
  category: 
  screenshot: 
  description: 

# Improvements

- title: 

# Fixes

- title: 
`;

  await fs.writeFile(filePath, template);

  console.log(chalk.bold.green(`\n✔ Created new release draft: ${path.relative(process.cwd(), filePath)}`));
  console.log(chalk.cyan('Edit the file to add features and then set status to "published" to release.\n'));
}

function parseAndInterpolateReleases(content: string) {
  const changelogHeader = /==\s*Changelog\s*==/i;
  const match = content.match(changelogHeader);
  if (!match) return [];

  const changelogContent = content.substring(match.index! + match[0].length);
  const nextSection = changelogContent.match(/==\s*[^=]+\s*==/);
  const relevantContent = nextSection ? changelogContent.substring(0, nextSection.index) : changelogContent;

  const versionRegex = /=\s*([^=–\-\(\s]+)(?:\s*[–\-\(]\s*(.+?)\)?\s*)?=/g;
  const rawReleases: { version: string, date: string | null, items: string[] }[] = [];
  let m: RegExpExecArray | null;

  while ((m = versionRegex.exec(relevantContent)) !== null) {
    let version = m[1].trim();
    let dateStr = m[2] ? m[2].trim().replace(/\)$/, '') : null;
    
    const currentPos = versionRegex.lastIndex;
    const nextMatch = versionRegex.exec(relevantContent);
    const end = nextMatch ? nextMatch.index : relevantContent.length;
    versionRegex.lastIndex = currentPos;

    const block = relevantContent.substring(currentPos, end);
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (!dateStr && lines.length > 0) {
        if (parseWpDate(lines[0])) {
            dateStr = lines[0];
        }
    }

    const items = lines
      .filter(line => line.startsWith('*') || line.startsWith('-'))
      .map(line => line.substring(1).trim());

    if (version && !version.includes('Upgrade Notice')) {
      rawReleases.push({ version, date: parseWpDate(dateStr), items });
    }
  }

  // Interpolation logic
  // rawReleases is newest to oldest.
  for (let i = 0; i < rawReleases.length; i++) {
    if (!rawReleases[i].date) {
      // Find nearest upper (newer) date
      let upperDate: Date | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (rawReleases[j].date) {
          upperDate = new Date(rawReleases[j].date as string);
          break;
        }
      }

      // Find nearest lower (older) date
      let lowerDate: Date | null = null;
      for (let j = i + 1; j < rawReleases.length; j++) {
        if (rawReleases[j].date) {
          lowerDate = new Date(rawReleases[j].date as string);
          break;
        }
      }

      let finalDate: Date;
      if (upperDate && lowerDate) {
        // Random date between
        const diff = upperDate.getTime() - lowerDate.getTime();
        finalDate = new Date(lowerDate.getTime() + Math.random() * diff);
      } else if (upperDate) {
        // Subtract 15 days from upper
        finalDate = new Date(upperDate.getTime() - 15 * 24 * 60 * 60 * 1000);
      } else if (lowerDate) {
        // Add 15 days to lower
        finalDate = new Date(lowerDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      } else {
        // Default to current - 30 days
        finalDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
      
      rawReleases[i].date = finalDate.toISOString().split('T')[0];
    }
  }

  return rawReleases;
}

function parseWpDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const cleanDate = dateStr.trim().replace(/^[\-\–\s\(\)]+/, '').replace(/[\)\s\-\–]+$/, '');
  const d = new Date(cleanDate);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

main().catch(err => {
  console.error(chalk.red(err.message));
  process.exit(1);
});
