import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Rocket, 
  Calendar, 
  BarChart3, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/overview' },
  { icon: Package, label: 'Plugins', path: '/plugins' },
  { icon: Rocket, label: 'Releases', path: '/releases' },
  { icon: Calendar, label: 'Timeline', path: '/timeline' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) {
  return (
    <aside className={cn(
      "border-r border-border bg-card/50 backdrop-blur-xl flex flex-col h-full transition-all duration-300 relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <button 
        onClick={onToggle}
        className={cn(
          "absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-center z-50",
          "bg-white dark:bg-zinc-900 border border-border shadow-[0_4px_20px_rgba(0,0,0,0.1)] rounded-xl",
          "hover:bg-primary hover:text-white transition-all duration-300 group/toggle"
        )}
      >
        <div className="absolute inset-0 bg-primary/10 rounded-xl opacity-0 group-hover/toggle:opacity-100 transition-opacity"></div>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 relative z-10 transition-transform group-hover/toggle:translate-x-0.5" />
        ) : (
          <ChevronLeft className="w-4 h-4 relative z-10 transition-transform group-hover/toggle:-translate-x-0.5" />
        )}
      </button>

      <div className={cn("p-6 flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
        <div className={cn(
          "w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066cc] to-[#3894ff] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 transition-all duration-300",
          isCollapsed && "scale-90"
        )}>
          <Rocket className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Release<span className="text-[#0066cc]">Bot</span>
            </h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-60">Engine v1.0</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
              isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? item.label : ""}
          >
            <item.icon className="w-4 h-4" />
            {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        {isCollapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center cursor-help" title="Help">?</div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-accent/50 border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs text-muted-foreground mb-2">Need help?</p>
            <button className="text-xs font-medium text-foreground hover:underline">Documentation</button>
          </div>
        )}
      </div>
    </aside>
  );
}
