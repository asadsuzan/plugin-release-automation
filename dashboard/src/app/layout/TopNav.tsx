import { Search, Bell, User } from 'lucide-react';

export function TopNav() {
  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
      <div className="relative w-96">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search releases, plugins, or tags..." 
          className="w-full bg-accent/50 border border-border/50 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-background"></span>
        </button>
        <div className="h-8 w-[1px] bg-border mx-2"></div>
        <button className="flex items-center gap-3 pl-2 pr-4 py-1.5 hover:bg-accent rounded-full transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            AS
          </div>
          <span className="text-sm font-medium">Asad Suzan</span>
        </button>
      </div>
    </header>
  );
}
