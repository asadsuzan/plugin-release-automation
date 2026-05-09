import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import { Release } from './parse-release';

export async function updateReadme(pluginDir: string, release: Release, dryRun: boolean = false) {
  if (release.status !== 'published') {
    return;
  }

  const readmePath = path.join(pluginDir, 'readme.txt');
  let content = '';

  // Attempt to fetch from WordPress.org first as requested
  const orgReadmeUrl = `https://plugins.svn.wordpress.org/${release.plugin}/trunk/readme.txt`;
  
  try {
    const response = await axios.get(orgReadmeUrl, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    content = response.data;
  } catch (error: any) {
    // If org fetch fails, check local
    if (await fs.pathExists(readmePath)) {
      content = await fs.readFile(readmePath, 'utf-8');
      // console.log(chalk.gray(`  ℹ Using local readme.txt for ${release.plugin} (org fetch failed/skipped)`));
    } else {
      console.warn(chalk.yellow(`  ! Could not fetch from .org and local readme.txt not found for ${release.plugin}. Skipping.`));
      return;
    }
  }

  const changelogHeader = '== Changelog ==';
  const changelogHeaderAlt = '== changelog ==';
  
  let headerToUse = changelogHeader;
  if (!content.includes(changelogHeader)) {
    if (content.includes(changelogHeaderAlt)) {
      headerToUse = changelogHeaderAlt;
    } else {
      // If no changelog section, maybe add it at the end?
      content += `\n\n${changelogHeader}\n`;
      headerToUse = changelogHeader;
    }
  }

  // Check if version already exists
  const versionMarker = `= ${release.version} =`;
  if (content.includes(versionMarker)) {
    return;
  }

  const newChangelogEntry = `\n= ${release.version} =\n` + [
    ...release.features.map(f => `- ${f.title}`),
    ...release.improvements.map(i => `- ${i.title}`),
    ...release.fixes.map(f => `- ${f.title}`)
  ].join('\n') + '\n';

  const parts = content.split(headerToUse);
  // Insert at the top of the changelog section (right after the header)
  const updatedContent = parts[0] + headerToUse + '\n' + newChangelogEntry + parts[1].trimStart();

  if (dryRun) {
    console.log(chalk.cyan(`  [Dry Run] Would update readme.txt for ${release.plugin} v${release.version}`));
  } else {
    await fs.writeFile(readmePath, updatedContent);
    console.log(chalk.green(`  ✔ Updated readme.txt for ${release.plugin} v${release.version}`));
  }
}
