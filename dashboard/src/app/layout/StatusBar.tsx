import { Wifi, RefreshCw, Terminal } from 'lucide-react';

export function StatusBar({ lastUpdated }: { lastUpdated?: string }) {
  return (
    <footer className="h-8 border-t border-border bg-card/50 backdrop-blur-xl px-6 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span>Engine: Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3" />
          <span>v1.0.0-stable</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3" />
          <span>WP.org Sync: Connected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3" />
          <span>Last Sync: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Loading...'}</span>
        </div>
      </div>
    </footer>
  );
}
