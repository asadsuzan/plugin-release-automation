import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import semver from 'semver';
import { parseReleases, Release } from './parse-release';
import { updateReadme } from './generate-readme';
import { generateAdminChangelog } from './generate-admin-changelog';
import { generateMonthlyReport } from './generate-monthly-report';

import { triggerHook } from './utils/hooks';

const config = fs.readJsonSync(path.join(process.cwd(), 'config.json'));

async function main() {
  const dryRun = process.argv.includes('--dry');
  const jsonOutput = process.argv.includes('--json');
  const rootDir = process.cwd();
  
  const pluginsDir = path.join(rootDir, config.paths.plugins || 'plugins');
  const reportsDir = path.join(rootDir, config.paths.reports || 'reports');

  if (!jsonOutput) {
    console.log(chalk.bold.blue('\n🚀 Starting Plugin Release Automation System...\n'));
  }

  const results: any = {
    processed: [],
    skipped: [],
    errors: []
  };

  try {
    const allReleases = await parseReleases(pluginsDir);
    
    // Group releases by plugin
    const pluginGroups: Record<string, Release[]> = {};
    for (const rel of allReleases) {
      if (!pluginGroups[rel.plugin]) pluginGroups[rel.plugin] = [];
      pluginGroups[rel.plugin].push(rel);
    }

    for (const [pluginSlug, releases] of Object.entries(pluginGroups)) {
      // Sort releases by version ascending (oldest first)
      const sortedReleases = releases.sort((a, b) => {
        return semver.compare(a.version, b.version);
      });

      if (!jsonOutput) console.log(chalk.bold.magenta(`\n📦 Plugin: ${pluginSlug}`));

      for (const release of sortedReleases) {
        if (release.status === 'draft') {
          if (!jsonOutput) console.log(chalk.yellow(`  ! Skipping v${release.version} (Draft)`));
          results.skipped.push({ plugin: pluginSlug, version: release.version, reason: 'draft' });
          continue;
        }

        const pluginDir = path.dirname(path.dirname(release.filePath));

        // Trigger Hook: beforeRelease
        if (!dryRun) await triggerHook('beforeRelease', { plugin: pluginSlug, version: release.version });

        // Update readme.txt
        await updateReadme(pluginDir, release, dryRun);

        // Update changelog.json for all published versions to preserve history
        await generateAdminChangelog(pluginDir, release, dryRun);

        // Trigger Hook: afterRelease
        if (!dryRun) await triggerHook('afterRelease', { plugin: pluginSlug, version: release.version });

        results.processed.push({ plugin: pluginSlug, version: release.version });
      }
    }

    // Generate monthly reports from all releases
    await generateMonthlyReport(allReleases, reportsDir, dryRun);

    if (jsonOutput) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(chalk.bold.green('\n✨ Release process completed successfully!\n'));
    }
  } catch (error: any) {
    if (jsonOutput) {
      results.errors.push({ message: error.message });
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.error(chalk.bold.red('\n❌ Release process failed:'));
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
}

main();
