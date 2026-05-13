export interface ReleaseItem {
  title: string;
  category?: string;
  description?: string;
  screenshot?: string;
}

export interface Release {
  version: string;
  date: string;
  status: string;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  features: ReleaseItem[];
  improvements: ReleaseItem[];
  fixes: ReleaseItem[];
  tags: string[];
  plugin: string;
}

export interface PluginData {
  slug: string;
  name: string;
  lastVersion: string;
  releaseCount: number;
  lastSync: string;
  activeInstalls?: string;
  lastUpdated?: string;
  yesterdayDownloads?: number;
  icon?: string;
  banner?: string;
  downloadHistory?: number[];
  supportThreads?: number;
  supportThreadsResolved?: number;
}

export interface Manifest {
  plugins: PluginData[];
  reports: string[];
  lastUpdated: string;
}

export async function fetchManifest(): Promise<Manifest> {
  const response = await fetch('/data/manifest.json');
  if (!response.ok) throw new Error('Failed to fetch manifest');
  return response.json();
}

export async function fetchPluginHistory(slug: string): Promise<{ plugin: string; releases: Release[] }> {
  const response = await fetch(`/data/changelog-${slug}.json`);
  if (!response.ok) throw new Error(`Failed to fetch history for ${slug}`);
  return response.json();
}

export async function fetchReport(fileName: string): Promise<any> {
  const response = await fetch(`/data/${fileName}`);
  if (!response.ok) throw new Error(`Failed to fetch report ${fileName}`);
  return response.json();
}

export async function fetchReadme(slug: string): Promise<string> {
  const response = await fetch(`/data/readme-${slug}.txt`);
  if (!response.ok) throw new Error(`Failed to fetch readme for ${slug}`);
  return response.text();
}

export async function fetchRawText(fileName: string): Promise<string> {
  const response = await fetch(`/data/${fileName}`);
  if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);
  return response.text();
}
