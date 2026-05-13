import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';

export interface WPPlugin {
  slug: string;
  name: string;
  url: string;
}

export async function importPlugin(pluginSlug: string) {
  const pluginsDir = path.join(process.cwd(), 'plugins');
  const pluginDir = path.join(pluginsDir, pluginSlug);
  const releaseDir = path.join(pluginDir, 'releases');
  const readmePath = path.join(pluginDir, 'readme.txt');

  if (await fs.pathExists(pluginDir)) {
    console.log(chalk.yellow(`Skipping ${pluginSlug} (already exists)`));
    return;
  }

  await fs.ensureDir(releaseDir);

  console.log(chalk.cyan(`ℹ Syncing history from WordPress.org for "${pluginSlug}"...`));
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
    const legacyReleases = parseAndInterpolateReleases(readmeContent, pluginSlug);
    
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
      console.log(chalk.green(`✔ Created legacy release files for ${pluginSlug}.`));
    }
  } catch (error: any) {
    console.warn(chalk.yellow(`! Could not sync ${pluginSlug} from WordPress.org. Creating a blank plugin structure.`));
    await fs.writeFile(readmePath, `=== ${pluginSlug} ===\n\n== Changelog ==\n`);
  }
}

export function parseAndInterpolateReleases(content: string, pluginSlug: string) {
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
  for (let i = 0; i < rawReleases.length; i++) {
    if (!rawReleases[i].date) {
      let upperDate: Date | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (rawReleases[j].date) {
          upperDate = new Date(rawReleases[j].date as string);
          break;
        }
      }

      let lowerDate: Date | null = null;
      for (let j = i + 1; j < rawReleases.length; j++) {
        if (rawReleases[j].date) {
          lowerDate = new Date(rawReleases[j].date as string);
          break;
        }
      }

      let finalDate: Date;
      if (upperDate && lowerDate) {
        const diff = upperDate.getTime() - lowerDate.getTime();
        finalDate = new Date(lowerDate.getTime() + Math.random() * diff);
      } else if (upperDate) {
        finalDate = new Date(upperDate.getTime() - 15 * 24 * 60 * 60 * 1000);
      } else if (lowerDate) {
        finalDate = new Date(lowerDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      } else {
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
