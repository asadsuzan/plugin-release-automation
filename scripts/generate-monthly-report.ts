import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Release } from './parse-release';

export async function generateMonthlyReport(allReleases: Release[], reportsDir: string, dryRun: boolean = false) {
  const publishedReleases = allReleases.filter(r => r.status === 'published');
  const releasesByMonth: Record<string, Release[]> = {};

  for (const rel of publishedReleases) {
    const dateObj = new Date(rel.date);
    if (isNaN(dateObj.getTime())) continue;
    const month = dateObj.toISOString().substring(0, 7); // YYYY-MM
    if (!releasesByMonth[month]) releasesByMonth[month] = [];
    releasesByMonth[month].push(rel);
  }

  for (const [month, releases] of Object.entries(releasesByMonth)) {
    const [year, monthNum] = month.split('-');
    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });
    const fileName = `${monthName.toLowerCase()}-${year}.md`;
    const reportPath = path.join(reportsDir, fileName);

    const reportJson = {
      month: month,
      plugins: releases.map(r => ({
        plugin: r.plugin,
        version: r.version,
        date: r.date,
        type: r.type,
        features: r.features.length,
        improvements: r.improvements.length,
        fixes: r.fixes.length,
        tags: r.tags
      }))
    };

    let markdown = `# Monthly Report — ${monthName} ${year}\n\n`;
    for (const r of releases) {
      markdown += `## ${r.plugin.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (v${r.version})\n`;
      if (r.tags && r.tags.length > 0) {
        markdown += `*Tags: ${r.tags.join(', ')}*\n`;
      }
      markdown += `\n`;

      if (r.features.length) {
        markdown += `### Features\n${r.features.map(f => `- **${f.title}**${f.category ? ` [${f.category}]` : ''}${f.description ? `: ${f.description}` : ''}`).join('\n')}\n\n`;
      }
      if (r.improvements.length) {
        markdown += `### Improvements\n${r.improvements.map(i => `- ${i.title}`).join('\n')}\n\n`;
      }
      if (r.fixes.length) {
        markdown += `### Fixes\n${r.fixes.map(f => `- ${f.title}`).join('\n')}\n\n`;
      }
    }

    if (dryRun) {
      console.log(chalk.cyan(`[Dry Run] Would generate monthly report: ${reportPath}`));
    } else {
      await fs.ensureDir(reportsDir);
      await fs.writeFile(reportPath, markdown);
      
      for (const r of releases) {
          const pluginGeneratedDir = path.join(path.dirname(path.dirname(r.filePath)), 'generated');
          await fs.ensureDir(pluginGeneratedDir);
          await fs.writeJson(path.join(pluginGeneratedDir, 'monthly-report.json'), reportJson, { spaces: 2 });
      }
      console.log(chalk.green(`✔ Generated monthly report for ${month}`));
    }
  }
}
