import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';

async function syncData() {
    const rootDir = process.cwd();
    const dashboardPublicData = path.join(rootDir, 'dashboard', 'public', 'data');
    
    await fs.ensureDir(dashboardPublicData);
    await fs.emptyDir(dashboardPublicData);

    // 1. Copy plugin changelogs and readmes
    const changelogs = globSync('plugins/*/generated/changelog.json');
    const plugins = [];

    for (const file of changelogs) {
        const data = await fs.readJson(file);
        const slug = path.basename(path.dirname(path.dirname(file)));
        
        // Copy changelog
        const targetChangelog = path.join(dashboardPublicData, `changelog-${slug}.json`);
        await fs.copy(file, targetChangelog);
        
        // Copy readme.txt if it exists
        const readmePath = path.join(rootDir, 'plugins', slug, 'readme.txt');
        if (await fs.pathExists(readmePath)) {
            await fs.copy(readmePath, path.join(dashboardPublicData, `readme-${slug}.txt`));
        }

        // 1.2 Fetch real-time stats from WordPress.org
        let activeInstalls = 'Unknown';
        let lastUpdated = 'Unknown';
        let yesterdayDownloads = 0;
        let icon = '';
        let banner = '';
        let downloadHistory: number[] = [];
        try {
            const statsRes = await fetch(`https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${slug}`);
            if (statsRes.ok) {
                const stats = await statsRes.json();
                activeInstalls = stats.active_installs?.toLocaleString() + '+' || 'Unknown';
                lastUpdated = stats.last_updated || 'Unknown';
                icon = stats.icons?.['128x128'] || stats.icons?.default || `https://ps.w.org/${slug}/assets/icon-128x128.png`;
                banner = stats.banners?.['high'] || stats.banners?.['low'] || `https://ps.w.org/${slug}/assets/banner-772x250.png`;
                
                // Fetch 15-day download history
                const dlHistoryRes = await fetch(`https://api.wordpress.org/stats/plugin/1.0/downloads.php?plugin=${slug}&limit=15`);
                if (dlHistoryRes.ok) {
                    const dlStats = await dlHistoryRes.json();
                    downloadHistory = Object.values(dlStats);
                    const dates = Object.keys(dlStats);
                    if (dates.length > 0) {
                        yesterdayDownloads = dlStats[dates[dates.length - 1]]; 
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to fetch stats for ${slug}`);
        }

        plugins.push({ 
            slug, 
            name: data.plugin, 
            lastVersion: data.releases[0]?.version,
            releaseCount: data.releases.length,
            lastSync: new Date().toISOString(),
            activeInstalls,
            lastUpdated,
            yesterdayDownloads,
            icon,
            banner,
            downloadHistory
        });
    }

    // 2. Copy monthly reports (JSON & Markdown)
    const reports = globSync('reports/*.*');
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
