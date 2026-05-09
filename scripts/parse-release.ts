import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';
import chalk from 'chalk';

export type Release = {
  plugin: string;
  version: string;
  date: string;
  features: string[];
  improvements: string[];
  fixes: string[];
  filePath: string;
};

export async function parseReleases(pluginsDir: string): Promise<Release[]> {
  const releaseFiles = await glob('**/releases/*.md', { cwd: pluginsDir, absolute: true });
  const releases: Release[] = [];

  for (const filePath of releaseFiles) {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    // Validation: Frontmatter
    if (!data.version || !data.plugin || !data.date) {
      console.error(chalk.red(`✖ Missing required frontmatter in ${filePath}`));
      throw new Error(`Missing frontmatter in ${filePath}`);
    }

    const sections = parseSections(content);

    // Validation: Required sections
    if (!sections.features || !sections.improvements || !sections.fixes) {
        // According to Step 8, throw error if missing
        console.error(chalk.red(`✖ Missing required sections (Features, Improvements, Fixes) in ${filePath}`));
        throw new Error(`Missing sections in ${filePath}`);
    }

    releases.push({
      plugin: data.plugin,
      version: data.version,
      date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : String(data.date),
      features: sections.features,
      improvements: sections.improvements,
      fixes: sections.fixes,
      filePath: filePath
    });
  }

  // Validation: Duplicate Version Protection
  const seenVersions = new Set<string>();
  for (const rel of releases) {
    const key = `${rel.plugin}-${rel.version}`;
    if (seenVersions.has(key)) {
        console.error(chalk.red(`✖ Duplicate version detected: ${rel.plugin} v${rel.version}`));
        throw new Error(`Duplicate version: ${key}`);
    }
    seenVersions.add(key);
  }

  return releases;
}

function parseSections(content: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {
    features: [],
    improvements: [],
    fixes: []
  };

  const lines = content.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      const header = trimmed.substring(2).toLowerCase();
      if (header === 'features') currentSection = 'features';
      else if (header === 'improvements') currentSection = 'improvements';
      else if (header === 'fixes') currentSection = 'fixes';
      else currentSection = '';
    } else if (trimmed.startsWith('- ') && currentSection) {
      sections[currentSection].push(trimmed.substring(2).trim());
    }
  }

  return sections;
}
