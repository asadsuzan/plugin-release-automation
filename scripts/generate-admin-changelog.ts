import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import semver from 'semver';
import { Release } from './parse-release';

const config = fs.readJsonSync(path.join(process.cwd(), 'config.json'));

export async function generateAdminChangelog(pluginDir: string, release: Release, dryRun: boolean = false) {
  if (release.status !== 'published') return;

  const generatedDir = path.join(pluginDir, 'generated');
  const outputPath = path.join(generatedDir, 'changelog.json');

  const releaseData = {
    version: release.version,
    date: release.date,
    status: release.status,
    type: release.type,
    tags: release.tags || [],
    features: release.features,
    improvements: release.improvements,
    fixes: release.fixes
  };

  if (dryRun) {
    console.log(chalk.cyan(`[Dry Run] Would update ${outputPath} with v${release.version}`));
    return;
  }

  await fs.ensureDir(generatedDir);

  let data: any = {
    plugin: release.plugin,
    releases: []
  };

  if (await fs.pathExists(outputPath)) {
    try {
      const existing = await fs.readJson(outputPath);
      if (existing && existing.releases) {
        data = existing;
      } else if (existing && existing.version) {
        // Migration: convert old single-release format to array format
        data = {
          plugin: existing.plugin,
          releases: [existing]
        };
      }
    } catch (e) {
      // If invalid JSON, we'll start fresh
    }
  }

  // Update or push
  const index = data.releases.findIndex((r: any) => r.version === release.version);
  if (index !== -1) {
    data.releases[index] = releaseData;
  } else {
    data.releases.push(releaseData);
  }

  // Preserve previous changelogs by sorting
  data.releases.sort((a: any, b: any) => semver.compare(b.version, a.version));

  await fs.writeJson(outputPath, data, { spaces: config.changelog.spaces || 2 });
  console.log(chalk.green(`✔ Updated changelog.json for ${release.plugin} v${release.version}`));
}
