import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { WPPlugin } from './utils/wp-org';

const CACHE_DIR = path.join(process.cwd(), 'cache', 'wp-users');

export async function fetchUserPlugins(username: string): Promise<WPPlugin[]> {
  const cacheFile = path.join(CACHE_DIR, `${username}.json`);

  // Check cache first (valid for 24 hours)
  if (await fs.pathExists(cacheFile)) {
    const cacheData = await fs.readJson(cacheFile);
    const now = Date.now();
    const cacheAge = now - cacheData.timestamp;
    
    if (cacheAge < 24 * 60 * 60 * 1000) {
      console.log(chalk.gray(`ℹ Using cached plugin list for ${username}`));
      return cacheData.plugins;
    }
  }

  console.log(chalk.cyan(`ℹ Fetching plugins for WordPress.org user: ${username}...`));
  
  try {
    const profileUrl = `https://profiles.wordpress.org/${username}/`;
    const response = await axios.get(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const plugins: WPPlugin[] = [];
    const seenSlugs = new Set<string>();

    // Target the plugins section specifically if it exists
    const pluginsContainer = $('#content-plugins, .wp-profile-section-plugins');
    const searchScope = pluginsContainer.length > 0 ? pluginsContainer : $('body');

    searchScope.find('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('wordpress.org/plugins/')) {
        // Match slugs like: https://wordpress.org/plugins/slug/
        const match = href.match(/wordpress.org\/plugins\/([^/]+)\/?/);
        if (match) {
          const slug = match[1].toLowerCase();
          if (slug !== 'plugins' && !seenSlugs.has(slug)) {
            seenSlugs.add(slug);
            
            // Try to find a better name. In cards, it's often the text inside the link
            // or an h3/h2 inside the card.
            let name = $(el).text().trim();
            
            // If it's a card, the name might be in a header
            const card = $(el).closest('li, .plugin-card');
            if (card.length > 0) {
                const header = card.find('h3, h2').first().text().trim();
                if (header) name = header;
            }

            plugins.push({
              slug,
              name: name || slug,
              url: href
            });
          }
        }
      }
    });

    // Store in cache
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(cacheFile, {
      username,
      timestamp: Date.now(),
      plugins: plugins
    });

    return plugins;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`WordPress.org user "${username}" not found.`);
    }
    throw new Error(`Failed to fetch profile for "${username}": ${error.message}`);
  }
}
