import chalk from 'chalk';

export type HookEvent = 'beforeRelease' | 'afterRelease' | 'syncStart' | 'syncEnd';

export async function triggerHook(event: HookEvent, data: any) {
  // Currently, we just log the event. 
  // In a real scenario, this could execute external scripts or notify a webhook.
  const timestamp = new Date().toISOString();
  
  switch (event) {
    case 'beforeRelease':
      console.log(chalk.gray(`[HOOK] ${timestamp} - Executing beforeRelease for ${data.plugin} v${data.version}`));
      break;
    case 'afterRelease':
      console.log(chalk.green(`[HOOK] ${timestamp} - Finished afterRelease for ${data.plugin} v${data.version}`));
      break;
    case 'syncStart':
      console.log(chalk.gray(`[HOOK] ${timestamp} - Starting sync for ${data.username || data.slug}`));
      break;
    case 'syncEnd':
      console.log(chalk.green(`[HOOK] ${timestamp} - Completed sync for ${data.username || data.slug}`));
      break;
  }
}
