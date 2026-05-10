import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import semver from 'semver';
import { parseReleases, Release } from './parse-release';
import { updateReadme } from './generate-readme';
import { generateAdminChangelog } from './generate-admin-changelog';
import { generateMonthlyReport } from './generate-monthly-report';

const config = fs.readJsonSync(path.join(process.cwd(), 'config.json'));

async function main() {
  const dryRun = process.argv.includes('--dry');
  const rootDir = process.cwd();
  
  const pluginsDir = path.join(rootDir, config.paths.plugins || 'plugins');
  const reportsDir = path.join(rootDir, config.paths.reports || 'reports');

  console.log(chalk.bold.blue('\n🚀 Starting Plugin Release Automation System...\n'));

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

      console.log(chalk.bold.magenta(`\n📦 Plugin: ${pluginSlug}`));

      for (const release of sortedReleases) {
        if (release.status === 'draft') {
          console.log(chalk.yellow(`  ! Skipping v${release.version} (Draft)`));
          continue;
        }

        const pluginDir = path.dirname(path.dirname(release.filePath));

        // Update readme.txt
        await updateReadme(pluginDir, release, dryRun);

        // Update changelog.json for all published versions to preserve history
        await generateAdminChangelog(pluginDir, release, dryRun);
      }
    }

    // Generate monthly reports from all releases
    await generateMonthlyReport(allReleases, reportsDir, dryRun);

    console.log(chalk.bold.green('\n✨ Release process completed successfully!\n'));
  } catch (error: any) {
    console.error(chalk.bold.red('\n❌ Release process failed:'));
    console.error(chalk.red(error.message));
    console.error(error.stack);
    process.exit(1);
  }
}

main();
