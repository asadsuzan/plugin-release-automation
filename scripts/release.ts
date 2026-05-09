import path from 'path';
import chalk from 'chalk';
import { parseReleases } from './parse-release';
import { updateReadme } from './generate-readme';
import { generateAdminChangelog } from './generate-admin-changelog';
import { generateMonthlyReport } from './generate-monthly-report';

async function main() {
  const dryRun = process.argv.includes('--dry');
  const rootDir = process.cwd();
  const pluginsDir = path.join(rootDir, 'plugins');
  const reportsDir = path.join(rootDir, 'reports');

  console.log(chalk.bold.blue('\n🚀 Starting Plugin Release Automation System...\n'));

  try {
    const releases = await parseReleases(pluginsDir);
    
    for (const release of releases) {
      console.log(chalk.blue(`Processing ${release.plugin} v${release.version}...`));
      
      const pluginDir = path.dirname(path.dirname(release.filePath));

      await updateReadme(pluginDir, release, dryRun);
      await generateAdminChangelog(pluginDir, release, dryRun);
      
      console.log(chalk.cyan(`✔ Parsed ${release.plugin} v${release.version}`));
    }

    await generateMonthlyReport(releases, reportsDir, dryRun);

    console.log(chalk.bold.green('\n✨ Release process completed successfully!\n'));
  } catch (error: any) {
    console.error(chalk.bold.red('\n❌ Release process failed:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

main();
