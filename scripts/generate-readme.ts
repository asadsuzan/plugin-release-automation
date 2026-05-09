import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Release } from './parse-release';

export async function updateReadme(pluginDir: string, release: Release, dryRun: boolean = false) {
  const readmePath = path.join(pluginDir, 'readme.txt');
  if (!await fs.pathExists(readmePath)) {
    console.warn(chalk.yellow(`! readme.txt not found in ${pluginDir}. Skipping.`));
    return;
  }

  let content = await fs.readFile(readmePath, 'utf-8');
  const changelogHeader = '== Changelog ==';
  
  if (!content.includes(changelogHeader)) {
    console.warn(chalk.yellow(`! "== Changelog ==" section not found in ${readmePath}. Skipping.`));
    return;
  }

  // Check if version already exists
  const versionMarker = `= ${release.version} =`;
  if (content.includes(versionMarker)) {
    // console.log(chalk.blue(`ℹ Version ${release.version} already exists in readme.txt. skipping.`));
    return;
  }

  const newChangelogEntry = `\n= ${release.version} =\n` + [
    ...release.features.map(f => `- ${f}`),
    ...release.improvements.map(i => `- ${i}`),
    ...release.fixes.map(f => `- ${f}`)
  ].join('\n') + '\n';

  const parts = content.split(changelogHeader);
  // Insert at the top of the changelog section (right after the header)
  const updatedContent = parts[0] + changelogHeader + '\n' + newChangelogEntry + parts[1].trimStart();

  if (dryRun) {
    console.log(chalk.cyan(`[Dry Run] Would update ${readmePath} with version ${release.version}`));
    console.log(chalk.gray(newChangelogEntry));
  } else {
    await fs.writeFile(readmePath, updatedContent);
    console.log(chalk.green(`✔ Updated readme.txt for ${release.plugin} v${release.version}`));
  }
}
