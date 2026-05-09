import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';
import chalk from 'chalk';
import yaml from 'js-yaml';

export type ReleaseItem = {
  title: string;
  description?: string;
  screenshot?: string;
  tags?: string[];
  category?: string;
};

export type Release = {
  plugin: string;
  version: string;
  date: string;
  status: 'draft' | 'published';
  type: 'patch' | 'minor' | 'major' | 'hotfix';
  features: ReleaseItem[];
  improvements: ReleaseItem[];
  fixes: ReleaseItem[];
  tags?: string[];
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
        console.error(chalk.red(`✖ Missing required sections (Features, Improvements, Fixes) in ${filePath}`));
        throw new Error(`Missing sections in ${filePath}`);
    }

    let status = data.status || 'published';
    if (status === 'publish') status = 'published';

    releases.push({
      plugin: data.plugin,
      version: data.version,
      date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : String(data.date),
      status: status as 'draft' | 'published',
      type: data.type || 'minor',
      tags: data.tags || [],
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

function parseSections(content: string): Record<string, ReleaseItem[]> {
  const sections: Record<string, ReleaseItem[]> = {
    features: [],
    improvements: [],
    fixes: []
  };

  const lines = content.split('\n');
  let currentSection = '';
  let currentItemLines: string[] = [];

  const flushItem = () => {
    if (currentItemLines.length > 0 && currentSection) {
      const itemContent = currentItemLines.join('\n');
      // Check if it's structured metadata (YAML-ish)
      if (itemContent.includes(':')) {
        try {
          const parsed = yaml.load(itemContent) as any;
          if (parsed && typeof parsed === 'object') {
            if (parsed.title && parsed.title.trim() !== '') {
              sections[currentSection].push({
                title: parsed.title,
                description: parsed.description,
                screenshot: parsed.screenshot,
                tags: parsed.tags,
                category: parsed.category
              });
              return;
            } else if (parsed.title === undefined) {
               // Not structured, just a string with a colon
            } else {
               // Empty title, skip it
               return;
            }
          }
        } catch (e) {
          // Fallback
        }
      }
      
      const simpleTitle = itemContent.trim();
      if (simpleTitle) {
        sections[currentSection].push({ title: simpleTitle });
      }
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      flushItem();
      currentItemLines = [];
      const header = trimmed.substring(2).toLowerCase();
      if (header === 'features') currentSection = 'features';
      else if (header === 'improvements') currentSection = 'improvements';
      else if (header === 'fixes') currentSection = 'fixes';
      else currentSection = '';
    } else if (trimmed.startsWith('- ')) {
      flushItem();
      currentItemLines = [trimmed.substring(2).trim()];
    } else if (line.startsWith('  ') && currentItemLines.length > 0) {
      currentItemLines.push(line.trim());
    }
  }
  flushItem();

  return sections;
}
