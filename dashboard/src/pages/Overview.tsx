import { useOutletContext } from 'react-router-dom';
import type { Manifest } from '../services/api';
import { 
  Package, 
  Rocket, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { cn } from '../utils/cn';

export function Overview() {
  const { manifest } = useOutletContext<{ manifest: Manifest | null }>();

  if (!manifest) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-accent/20 rounded-2xl"></div>
    <div className="h-64 bg-accent/20 rounded-2xl"></div>
  </div>;

  const stats = [
    { label: 'Total Plugins', value: manifest.plugins.length, icon: Package, color: 'text-blue-500' },
    { label: 'Total Releases', value: manifest.plugins.reduce((acc, p) => acc + p.releaseCount, 0), icon: Rocket, color: 'text-purple-500' },
    { label: 'Sync Health', value: '100%', icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Active Alerts', value: 0, icon: AlertCircle, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening with your plugins.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-6 rounded-2xl bg-card border border-border shadow-sm group hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 rounded-xl bg-accent group-hover:scale-110 transition-transform", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Real-time</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-8 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Release Velocity</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-foreground">Weekly</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground">Monthly</button>
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            [Chart Component Placeholder]
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
          <div className="space-y-3 flex-1">
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 group transition-all">
              <div className="flex items-center gap-3">
                <Rocket className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">New Release</span>
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 group transition-all">
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Import Plugin</span>
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 group transition-all">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Generate Report</span>
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          </div>
          <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <p className="text-xs font-medium text-indigo-400 mb-1">System Status</p>
            <p className="text-[11px] text-muted-foreground">All systems operational. No pending tasks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const FileText = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
