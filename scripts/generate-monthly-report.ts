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
    const dateForName = new Date(parseInt(year), parseInt(monthNum) - 1);
    const monthName = dateForName.toLocaleString('default', { month: 'long' });
    
    const baseFileName = `${monthName.toLowerCase()}-${year}`;
    const mdPath = path.join(reportsDir, `${baseFileName}.md`);
    const jsonPath = path.join(reportsDir, `${baseFileName}.json`);

    const reportJson = {
      month: month,
      monthName: monthName,
      year: year,
      totalReleases: releases.length,
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
      console.log(chalk.cyan(`[Dry Run] Would generate monthly reports: ${mdPath} and ${jsonPath}`));
    } else {
      await fs.ensureDir(reportsDir);
      await fs.writeFile(mdPath, markdown);
      await fs.writeJson(jsonPath, reportJson, { spaces: 2 });
      console.log(chalk.green(`✔ Generated monthly reports in ${reportsDir} for ${month}`));
    }
  }
}
