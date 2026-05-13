import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { StatusBar } from './StatusBar';
import { useEffect, useState } from 'react';
import { fetchManifest } from '../../services/api';
import type { Manifest } from '../../services/api';

export function Layout() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchManifest().then(setManifest).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-background/50">
          <div className="max-w-[1600px] mx-auto p-8">
            <Outlet context={{ manifest }} />
          </div>
        </main>
        <StatusBar lastUpdated={manifest?.lastUpdated} />
      </div>
    </div>
  );
}
