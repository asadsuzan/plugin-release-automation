import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';

async function syncData() {
    const rootDir = process.cwd();
    const dashboardPublicData = path.join(rootDir, 'dashboard', 'public', 'data');
    
    await fs.ensureDir(dashboardPublicData);
    await fs.emptyDir(dashboardPublicData);

    // 1. Copy plugin changelogs
    const changelogs = globSync('plugins/*/generated/changelog.json');
    const plugins = [];

    for (const file of changelogs) {
        const data = await fs.readJson(file);
        const slug = path.basename(path.dirname(path.dirname(file)));
        const targetFile = path.join(dashboardPublicData, `changelog-${slug}.json`);
        await fs.copy(file, targetFile);
        plugins.push({ slug, name: data.plugin, lastVersion: data.releases[0]?.version });
    }

    // 2. Copy monthly reports
    const reports = globSync('reports/*.json');
    const reportList = [];
    for (const file of reports) {
        const fileName = path.basename(file);
        await fs.copy(file, path.join(dashboardPublicData, fileName));
        reportList.push(fileName);
    }

    // 3. Create a manifest
    await fs.writeJson(path.join(dashboardPublicData, 'manifest.json'), {
        plugins,
        reports: reportList,
        lastUpdated: new Date().toISOString()
    }, { spaces: 2 });

    console.log('✅ Dashboard data synchronized.');
}

syncData().catch(console.error);
