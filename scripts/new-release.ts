import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import axios from 'axios';
import { importPlugin, parseAndInterpolateReleases } from './utils/wp-org';
import { fetchUserPlugins } from './fetch-wp-user-plugins';
import { triggerHook } from './utils/hooks';

async function main() {
  console.log(chalk.bold.blue('\n📦 Create New Plugin Release\n'));

  const pluginsDir = path.join(process.cwd(), 'plugins');
  await fs.ensureDir(pluginsDir);

  const pluginFolders = (await fs.readdir(pluginsDir, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const choices = [
    'Import plugins from WordPress.org profile',
    'Add single plugin manually',
    new inquirer.Separator(),
    ...pluginFolders
  ];

  const initialAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: choices
    }
  ]);

  let pluginSlug = '';

  if (initialAnswers.action === 'Import plugins from WordPress.org profile') {
    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter WordPress.org username:',
        validate: (input) => input.trim().length > 0 || 'Username is required'
      }
    ]);

    try {
      const plugins = await fetchUserPlugins(username);

      if (plugins.length === 0) {
        console.log(chalk.yellow(`\n⚠ No plugins found for user "${username}"`));
        return;
      }

      console.log(chalk.green(`\n✔ Found ${plugins.length} plugins`));

      const { selectedPlugins } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedPlugins',
          message: 'Select plugins to import:',
          choices: plugins.map(p => ({
            name: `${p.name} (${p.slug})`,
            value: p.slug,
            checked: !pluginFolders.includes(p.slug)
          }))
        }
      ]);

      if (selectedPlugins.length === 0) {
        console.log(chalk.yellow('No plugins selected.'));
        return;
      }

      // Trigger Hook: syncStart
      await triggerHook('syncStart', { username, count: selectedPlugins.length });

      for (const slug of selectedPlugins) {
        await importPlugin(slug);
      }

      // Trigger Hook: syncEnd
      await triggerHook('syncEnd', { username });

      console.log(chalk.bold.green('\n✔ Bulk import finished successfully!\n'));
      return; // Exit or continue to release? Usually exit after bulk import as per request.
    } catch (error: any) {
      console.error(chalk.red(`\n✖ Error: ${error.message}`));
      return;
    }
  }

  if (initialAnswers.action === 'Add single plugin manually') {
    const newPluginAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'slug',
        message: 'Enter the new plugin slug (as it appears on WordPress.org):',
        validate: (input) => input.trim().length > 0 || 'Slug is required'
      }
    ]);
    pluginSlug = newPluginAnswer.slug.trim();

    // Check if exists
    if (pluginFolders.includes(pluginSlug)) {
      console.log(chalk.yellow(`Plugin "${pluginSlug}" already exists.`));
    } else {
      await importPlugin(pluginSlug);
    }
  } else {
    pluginSlug = initialAnswers.action;
  }

  const pluginDir = path.join(pluginsDir, pluginSlug);
  const releaseDir = path.join(pluginDir, 'releases');
  const readmePath = path.join(pluginDir, 'readme.txt');

  await fs.ensureDir(releaseDir);

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'version',
      message: 'New version (e.g., 2.6.0):',
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
      filter: (input: string) => input.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
    }
  ]);

  const releaseDate = new Date().toISOString().split('T')[0];
  const filePath = path.join(releaseDir, `${answers.version}.md`);

  if (await fs.pathExists(filePath)) {
    console.error(chalk.red(`✖ Release ${answers.version} already exists for ${pluginSlug}`));
    process.exit(1);
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
