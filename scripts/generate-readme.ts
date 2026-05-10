import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import { Release } from './parse-release';

const config = fs.readJsonSync(path.join(process.cwd(), 'config.json'));

export async function updateReadme(pluginDir: string, release: Release, dryRun: boolean = false) {
  if (release.status !== 'published') {
    return;
  }

  const readmePath = path.join(pluginDir, 'readme.txt');
  let content = '';

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
    if (await fs.pathExists(readmePath)) {
      content = await fs.readFile(readmePath, 'utf-8');
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
      content += `\n\n${changelogHeader}\n`;
      headerToUse = changelogHeader;
    }
  }

  // Check if version already exists
  const versionMarker = `= ${release.version}`; // Partial match to avoid date mismatches
  if (content.includes(versionMarker)) {
    return;
  }

  // Formatting Date
  const dateObj = new Date(release.date);
  const dateFormatted = dateObj.toLocaleDateString(config.readme.dateLocale, { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Formatting Header
  const header = config.readme.versionFormat
    .replace('{version}', release.version)
    .replace('{date}', dateFormatted);

  const bullet = config.readme.bullet || '*';
  const emptyLines = config.readme.emptyLines ?? 2;
  const spacing = '\n'.repeat(emptyLines + 1);

  const newChangelogEntry = `\n${header}\n` + [
    ...release.features.map(f => `${bullet} ${f.title}`),
    ...release.improvements.map(i => `${bullet} ${i.title}`),
    ...release.fixes.map(f => `${bullet} ${f.title}`)
  ].join('\n') + spacing;

  const parts = content.split(headerToUse);
  const updatedContent = parts[0] + headerToUse + '\n' + newChangelogEntry + parts[1].trimStart();

  if (dryRun) {
    console.log(chalk.cyan(`  [Dry Run] Would update readme.txt for ${release.plugin} v${release.version}`));
  } else {
    await fs.writeFile(readmePath, updatedContent);
    console.log(chalk.green(`  ✔ Updated readme.txt for ${release.plugin} v${release.version}`));
  }
}
