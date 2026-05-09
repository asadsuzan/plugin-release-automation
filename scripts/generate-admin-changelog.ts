import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Release } from './parse-release';

export async function generateAdminChangelog(pluginDir: string, release: Release, dryRun: boolean = false) {
  if (release.status !== 'published') return;

  const generatedDir = path.join(pluginDir, 'generated');
  const outputPath = path.join(generatedDir, 'changelog.json');

  const data = {
    plugin: release.plugin,
    version: release.version,
    date: release.date,
    status: release.status,
    type: release.type,
    tags: release.tags,
    features: release.features,
    improvements: release.improvements,
    fixes: release.fixes
  };

  if (dryRun) {
    console.log(chalk.cyan(`[Dry Run] Would generate ${outputPath}`));
  } else {
    await fs.ensureDir(generatedDir);
    await fs.writeJson(outputPath, data, { spaces: 2 });
    console.log(chalk.green(`✔ Generated changelog.json for ${release.plugin} v${release.version}`));
  }
}
