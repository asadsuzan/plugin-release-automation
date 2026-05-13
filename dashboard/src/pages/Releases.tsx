import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchPluginHistory } from '../services/api';
import type { Manifest, Release } from '../services/api';
import { 
  Filter, 
  ChevronRight, 
  Tag, 
  Calendar,
  Layers,
  Search
} from 'lucide-react';
import { cn } from '../utils/cn';

export function Releases() {
  const { manifest } = useOutletContext<{ manifest: Manifest | null }>();
  const [selectedPlugin, setSelectedPlugin] = useState<string>('');
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (manifest && manifest.plugins.length > 0 && !selectedPlugin) {
      setSelectedPlugin(manifest.plugins[0].slug);
    }
  }, [manifest]);

  useEffect(() => {
    if (selectedPlugin) {
      setLoading(true);
      fetchPluginHistory(selectedPlugin)
        .then(data => {
          setReleases(data.releases);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [selectedPlugin]);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Release Timeline</h2>
          <p className="text-muted-foreground mt-1">Explore and manage release history across your portfolio.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-64">
          <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <select 
            className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            value={selectedPlugin}
            onChange={(e) => setSelectedPlugin(e.target.value)}
          >
            {manifest?.plugins.map(p => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-48">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <select className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            <option value="">All Types</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="patch">Patch</option>
            <option value="hotfix">Hotfix</option>
          </select>
        </div>

        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search in release notes..." 
            className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-accent/20 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="space-y-6">
          {releases.map((release) => (
            <ReleaseRow key={release.version} release={release} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReleaseRow({ release }: { release: Release }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeColors = {
    major: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    minor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    patch: 'bg-green-500/10 text-green-500 border-green-500/20',
    hotfix: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300",
      isExpanded ? "ring-2 ring-primary/20 border-primary/50" : "hover:border-border-foreground/20"
    )}>
      <div 
        className="p-6 flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold tracking-tight">v{release.version}</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mt-1", typeColors[release.type])}>
              {release.type}
            </span>
          </div>
          <div className="h-10 w-[1px] bg-border"></div>
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{new Date(release.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex gap-2">
              {release.tags.slice(0, 3).map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-md">
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
              {release.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{release.tags.length - 3} more</span>}
            </div>
          </div>
        </div>

        <button className={cn("p-2 rounded-full bg-accent group-hover:bg-primary group-hover:text-primary-foreground transition-all", isExpanded && "rotate-90")}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-6 pb-8 pt-2 border-t border-border bg-accent/5 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {release.features.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                    Features
                  </h4>
                  <ul className="space-y-4">
                    {release.features.map((item, i) => (
                      <li key={i} className="group/item">
                        <div className="flex gap-3">
                          <div className="w-1 h-auto bg-border group-hover/item:bg-indigo-400 transition-colors rounded-full"></div>
                          <div>
                            <p className="text-sm font-bold group-hover/item:text-indigo-400 transition-colors">{item.title}</p>
                            {item.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {release.improvements.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    Improvements
                  </h4>
                  <ul className="space-y-2">
                    {release.improvements.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-3">
                        <div className="w-1 h-1 rounded-full bg-border"></div>
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {release.fixes.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    Fixes
                  </h4>
                  <ul className="space-y-2">
                    {release.fixes.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-3">
                        <div className="w-1 h-1 rounded-full bg-border"></div>
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                <h5 className="text-xs font-bold uppercase tracking-wider mb-4">Metadata</h5>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-bold text-green-500 uppercase tracking-widest">{release.status}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Internal ID</span>
                    <span className="font-mono">{release.version.replace(/\./g, '')}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
                  Generate Readme
                </button>
                <button className="w-full py-2.5 rounded-xl bg-accent border border-border text-xs font-bold hover:bg-accent/80 transition-colors">
                  Export JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
