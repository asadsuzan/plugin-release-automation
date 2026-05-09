import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import axios from 'axios';

async function main() {
  console.log(chalk.bold.blue('\n📦 Create New Plugin Release\n'));

  const pluginsDir = path.join(process.cwd(), 'plugins');
  await fs.ensureDir(pluginsDir);
  
  const pluginFolders = (await fs.readdir(pluginsDir, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const choices = [...pluginFolders, new inquirer.Separator(), 'Add a new plugin...'];

  const initialAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'pluginChoice',
      message: 'Select plugin:',
      choices: choices
    }
  ]);

  let pluginSlug = initialAnswers.pluginChoice;

  if (pluginSlug === 'Add a new plugin...') {
    const newPluginAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'slug',
        message: 'Enter the new plugin slug (as it appears on WordPress.org):',
        validate: (input) => input.trim().length > 0 || 'Slug is required'
      }
    ]);
    pluginSlug = newPluginAnswer.slug.trim();
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'version',
      message: 'Version (e.g., 2.6.0):',
      validate: (input) => /^\d+\.\d+\.\d+$/.test(input) || 'Please enter a valid version (x.y.z)'
    },
    {
      type: 'list',
      name: 'type',
      message: 'Release type:',
      choices: ['patch', 'minor', 'major', 'hotfix'],
      default: 'minor'
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma separated):',
      filter: (input) => input.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
    }
  ]);

  const pluginDir = path.join(pluginsDir, pluginSlug);
  const releaseDir = path.join(pluginDir, 'releases');
  const releaseDate = new Date().toISOString().split('T')[0];
  const filePath = path.join(releaseDir, `${answers.version}.md`);
  const readmePath = path.join(pluginDir, 'readme.txt');

  await fs.ensureDir(releaseDir);

  if (await fs.pathExists(filePath)) {
    console.error(chalk.red(`✖ Release ${answers.version} already exists for ${pluginSlug}`));
    process.exit(1);
  }

  // Auto-generate readme.txt from WP.org if it doesn't exist
  if (!await fs.pathExists(readmePath)) {
    console.log(chalk.cyan(`ℹ readme.txt not found. Fetching from WordPress.org for "${pluginSlug}"...`));
    const orgReadmeUrl = `https://plugins.svn.wordpress.org/${pluginSlug}/trunk/readme.txt`;
    try {
      const response = await axios.get(orgReadmeUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      await fs.writeFile(readmePath, response.data);
      console.log(chalk.green(`✔ Auto-generated readme.txt from WordPress.org`));
    } catch (error: any) {
      console.warn(chalk.yellow(`! Could not fetch from WordPress.org (404 or timeout). Creating a blank readme.txt.`));
      await fs.writeFile(readmePath, `=== ${pluginSlug} ===\n\n== Changelog ==\n`);
    }
  }

  const template = `---
version: ${answers.version}
date: ${releaseDate}
plugin: ${pluginSlug}
status: draft
type: ${answers.type}
tags:
${answers.tags.map((t: string) => `  - ${t}`).join('\n')}
---

# Features

- title: 
  category: 
  screenshot: 
  description: 

# Improvements

- title: 

# Fixes

- title: 
`;

  await fs.writeFile(filePath, template);

  console.log(chalk.bold.green(`\n✔ Created new release draft: ${path.relative(process.cwd(), filePath)}`));
  console.log(chalk.cyan('Edit the file to add features and then set status to "published" to release.\n'));
}

main().catch(err => {
  console.error(chalk.red(err.message));
  process.exit(1);
});
