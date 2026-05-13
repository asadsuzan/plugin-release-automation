import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Manifest, PluginData } from '../services/api';
import { fetchReadme } from '../services/api';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  History, 
  RefreshCw,
  FileText,
  X,
  Download,
  Eye,
  Star,
  BarChart2,
  TrendingUp,
  Award,
  ChevronRight,
  ChevronLeft,
  Headset,
  ShieldCheck,
  Activity,
  HelpCircle,
  Settings
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid,
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '../utils/cn';

interface ReadmeMeta {
  contributors: string[];
  tags: string[];
  requiresAtLeast: string;
  testedUpTo: string;
  stableTag: string;
  requiresPHP: string;
  donateLink: string;
  activeInstalls: string;
  lastUpdated: string;
}

export function Plugins() {
  const { manifest } = useOutletContext<{ manifest: Manifest | null }>();
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeTitle, setIframeTitle] = useState<string>('');
  const [isIframeCollapsed, setIsIframeCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(800);
  const [isResizing, setIsResizing] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string>('');

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, 300), window.innerWidth - 100);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const [readmeMeta, setReadmeMeta] = useState<ReadmeMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Details');

  const handleOpenIframe = (url: string, title: string) => {
    setIframeUrl(url);
    setIframeTitle(title);
  };


  const handleOpenPreview = async (slug: string) => {
    setPreviewSlug(slug);
    setLoading(true);
    setActiveTab('Details');
    const plugin = manifest?.plugins.find(p => p.slug === slug);
    try {
      let content = await fetchReadme(slug);
      
      const meta: ReadmeMeta = {
        contributors: content.match(/Contributors:\s*(.+)/)?.[1]?.split(',').map(s => s.trim()) || [],
        tags: content.match(/Tags:\s*(.+)/)?.[1]?.split(',').map(s => s.trim()) || [],
        requiresAtLeast: content.match(/Requires at least:\s*(.+)/)?.[1] || '6.2',
        testedUpTo: content.match(/Tested up to:\s*(.+)/)?.[1] || '6.9',
        stableTag: content.match(/Stable tag:\s*(.+)/)?.[1] || '1.0.0',
        requiresPHP: content.match(/Requires PHP:\s*(.+)/)?.[1] || '7.4',
        donateLink: content.match(/Donate link:\s*(.+)/)?.[1] || '',
        activeInstalls: plugin?.activeInstalls || '0+',
        lastUpdated: plugin?.lastUpdated || 'Recently'
      };
      setReadmeMeta(meta);

      content = content.replace(/^===\s*(.+?)\s*===/gm, '# $1');
      content = content.replace(/^==\s*(.+?)\s*==/gm, '## $1');
      content = content.replace(/^=\s*(.+?)\s*=/gm, '### $1');
      content = content.replace(/Contributors:[\s\S]*?License URI:.*?\n/g, '');
      
      setReadmeContent(content);
    } catch (err) {
      setReadmeContent('Could not load readme.txt');
    } finally {
      setLoading(false);
    }
  };

  if (!manifest) return <div>Loading...</div>;


  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plugins</h2>
          <p className="text-muted-foreground mt-1">Manage your plugin registry and sync state.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" />
          Add Plugin
        </button>
      </header>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Filter plugins by name or slug..." 
          className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {manifest.plugins.map((plugin) => (
          <PluginCard key={plugin.slug} plugin={plugin} onPreview={handleOpenPreview} onOpenIframe={handleOpenIframe} />
        ))}
      </div>

      {/* Intelligence Sidebar (Iframe Preview) */}
      {iframeUrl && (
        <div 
          className={cn(
            "fixed inset-y-0 right-0 z-[110] bg-white dark:bg-zinc-950 shadow-2xl border-l border-border animate-in slide-in-from-right",
            isIframeCollapsed ? "w-[300px]" : "",
            !isResizing && "transition-all duration-300 ease-in-out"
          )}
          style={{ width: !isIframeCollapsed ? `${sidebarWidth}px` : undefined }}
        >
          {/* Resize Handle */}
          {!isIframeCollapsed && (
            <div 
              onMouseDown={handleMouseDown}
              className={cn(
                "absolute left-0 top-0 w-1.5 h-full cursor-col-resize z-[120] group/resize transition-colors",
                isResizing ? "bg-primary" : "hover:bg-primary/30"
              )}
            >
              <div className={cn(
                "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-0.5 h-12 rounded-full transition-colors",
                isResizing ? "bg-white" : "bg-border group-hover/resize:bg-primary"
              )}></div>
            </div>
          )}

          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-[#f8f9fa] dark:bg-zinc-900">
               <div className="flex items-center gap-3 overflow-hidden">
                 <button 
                   onClick={() => setIsIframeCollapsed(!isIframeCollapsed)}
                   className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-muted-foreground transition-colors"
                   title={isIframeCollapsed ? "Expand" : "Collapse"}
                 >
                   {isIframeCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                 </button>
                 <h3 className="font-bold text-lg truncate">{iframeTitle}</h3>
               </div>
               <button onClick={() => setIframeUrl(null)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="flex-1 bg-white relative">
               <iframe 
                 src={iframeUrl} 
                 className={cn(
                   "w-full h-full border-none transition-opacity",
                   isResizing ? "opacity-40 pointer-events-none" : "opacity-100"
                 )}
                 title={iframeTitle}
                 loading="lazy"
               ></iframe>
               {isResizing && (
                 <div className="absolute inset-0 z-[130] cursor-col-resize"></div>
               )}
               {isIframeCollapsed && (
                 <div className="absolute inset-0 bg-black/5 pointer-events-none flex items-center justify-center">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground rotate-90 whitespace-nowrap">Preview Minimized</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* WP.org Preview Modal */}
      {previewSlug && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f0f2f5] dark:bg-black/95 animate-in fade-in duration-300">
          <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="h-10 bg-[#23282d] flex items-center justify-between px-6 shrink-0">
              <div className="flex gap-4 text-xs text-[#c3c4c7] font-medium">
                <span className="hover:text-white cursor-pointer">WordPress.org</span>
                <span className="hover:text-white cursor-pointer text-white border-b-2 border-white pb-1">Plugins</span>
              </div>
              <button onClick={() => setPreviewSlug(null)} className="text-white/60 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[1200px] mx-auto bg-white dark:bg-zinc-950 shadow-xl my-8 rounded-lg overflow-hidden min-h-[1000px]">
                <div className="relative aspect-[1544/500] bg-[#2271b1] overflow-hidden">
                  {manifest.plugins.find(p => p.slug === previewSlug)?.banner ? (
                    <img 
                      src={manifest.plugins.find(p => p.slug === previewSlug)?.banner} 
                      alt="Banner" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2271b1] to-[#135e96]">
                      <h1 className="text-6xl font-black text-white uppercase tracking-tighter opacity-10">PLUGIN PREVIEW</h1>
                    </div>
                  )}
                </div>
                <div className="px-8 py-6 border-b border-border flex gap-8 items-start relative bg-white dark:bg-zinc-950">
                   <div className="w-32 h-32 -mt-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border-4 border-white dark:border-zinc-800 flex items-center justify-center shrink-0 z-10 overflow-hidden">
                     {manifest.plugins.find(p => p.slug === previewSlug)?.icon ? (
                       <img 
                         src={manifest.plugins.find(p => p.slug === previewSlug)?.icon} 
                         alt="Icon" 
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                           e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full bg-[#2271b1] flex items-center justify-center text-white text-5xl font-black">${previewSlug.charAt(0).toUpperCase()}</div>`;
                         }}
                       />
                     ) : (
                       <div className="w-full h-full bg-[#2271b1] flex items-center justify-center text-white text-5xl font-black">
                          {previewSlug.charAt(0).toUpperCase()}
                       </div>
                     )}
                   </div>
                   <div className="flex-1 pt-2">
                     <div className="flex items-center justify-between">
                       <h1 className="text-4xl font-bold text-[#1e1e1e] dark:text-white">{manifest.plugins.find(p => p.slug === previewSlug)?.name}</h1>
                       <button className="flex items-center gap-2 px-6 py-2.5 bg-[#2271b1] text-white rounded font-bold text-sm transition-all"><Download className="w-4 h-4" />Download</button>
                     </div>
                   </div>
                </div>
                <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-10 gap-12 bg-white dark:bg-zinc-950">
                  {/* Left Column: Description */}
                  <div className="md:col-span-7">
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-[#1e1e1e] dark:prose-headings:text-white prose-a:text-[#2271b1] prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4">
                      {loading ? (
                        <div className="space-y-6 animate-pulse">
                           <div className="h-8 bg-zinc-100 rounded w-3/4"></div>
                           <div className="h-4 bg-zinc-100 rounded w-full"></div>
                           <div className="h-4 bg-zinc-100 rounded w-full"></div>
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {readmeContent}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Sidebar */}
                  <div className="md:col-span-3 space-y-12">
                    <section className="space-y-1.5">
                      {[
                        { label: 'Version', value: readmeMeta?.stableTag },
                        { label: 'Last updated', value: readmeMeta?.lastUpdated },
                        { label: 'Active installations', value: readmeMeta?.activeInstalls },
                        { label: 'WordPress version', value: `${readmeMeta?.requiresAtLeast} or higher` },
                        { label: 'Tested up to', value: readmeMeta?.testedUpTo },
                        { label: 'PHP version', value: `${readmeMeta?.requiresPHP} or higher` }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 border-b border-[#f0f0f1] dark:border-zinc-800 text-[14px]">
                          <span className="text-[#646970] dark:text-zinc-500">{item.label}</span>
                          <span className="font-semibold text-[#1e1e1e] dark:text-white">{item.value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-start py-2.5 border-b border-[#f0f0f1] dark:border-zinc-800 text-[14px]">
                        <span className="text-[#646970] dark:text-zinc-500 mt-1">Tags</span>
                        <div className="flex flex-wrap gap-1.5 justify-end max-w-[200px]">
                          {readmeMeta?.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-[#f0f0f1] dark:bg-zinc-800 text-[#2271b1] text-[12px] rounded hover:bg-[#dcdcde] cursor-pointer transition-colors">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="py-2.5">
                         <span className="text-[#2271b1] text-[14px] hover:underline cursor-pointer">Advanced View</span>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xl font-bold text-[#1e1e1e] dark:text-white">Ratings</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 text-[#ffb900]">
                          {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                        </div>
                        <span className="text-sm text-[#3c434a] dark:text-zinc-400">5 out of 5 stars.</span>
                      </div>
                      
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(stars => (
                          <div key={stars} className="flex items-center gap-3 text-[13px]">
                            <span className="w-12 text-[#2271b1] hover:underline cursor-pointer">{stars} stars</span>
                            <div className="flex-1 h-3 bg-[#f0f0f1] dark:bg-zinc-800 rounded-sm overflow-hidden">
                              <div className={`h-full bg-[#d63638] ${stars === 5 ? 'w-full' : 'w-0'}`}></div>
                            </div>
                            <span className="w-4 text-[#2271b1] text-right">{stars === 5 ? '1' : '0'}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xl font-bold text-[#1e1e1e] dark:text-white">Support</h3>
                      <p className="text-sm text-[#3c434a] dark:text-zinc-400">Got something to say? Need help?</p>
                      <button className="text-[#2271b1] text-sm font-semibold hover:underline">View support forum</button>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xl font-bold text-[#1e1e1e] dark:text-white">Donate</h3>
                      <p className="text-sm text-[#3c434a] dark:text-zinc-400">Would you like to support the advancement of this plugin?</p>
                      <a href={readmeMeta?.donateLink} target="_blank" rel="noreferrer" className="text-[#2271b1] text-sm font-semibold hover:underline block">
                        Donate to this plugin
                      </a>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function PluginCard({ plugin, onPreview, onOpenIframe }: { plugin: PluginData, onPreview: (slug: string) => void, onOpenIframe: (url: string, title: string) => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:border-[#2271b1] hover:shadow-xl hover:shadow-blue-500/5 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#2271b1]/5 rounded-full -mr-16 -mt-16 group-hover:bg-[#2271b1]/10 transition-colors"></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-black text-white shadow-inner overflow-hidden border border-border">
            {plugin.icon ? (
              <img 
                src={plugin.icon} 
                alt={plugin.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full bg-[#2271b1] flex items-center justify-center text-white text-2xl font-black">${plugin.slug.charAt(0).toUpperCase()}</div>`;
                }}
              />
            ) : (
              <div className="w-full h-full bg-[#2271b1] flex items-center justify-center">
                {plugin.slug.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onPreview(plugin.slug)}
              className="p-2 hover:bg-blue-500/10 rounded-lg text-muted-foreground hover:text-[#2271b1] transition-colors" 
              title="WP.org Preview"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Sync">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          <h3 className="text-xl font-bold group-hover:text-[#2271b1] transition-colors line-clamp-1">{plugin.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">{plugin.slug}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-accent rounded font-bold uppercase tracking-wider">v{plugin.lastVersion}</span>
          </div>
        </div>

        {/* Intelligence Quick Links */}
        <div className="flex items-center gap-3 mb-6">
           <button 
             onClick={() => onOpenIframe(`https://wp-rankings.com/plugins/${plugin.slug}/`, `WP Rankings: ${plugin.name}`)}
             className="p-1.5 hover:bg-purple-500/10 rounded text-muted-foreground hover:text-purple-600 transition-colors"
             title="WP Rankings"
           >
             <TrendingUp className="w-4 h-4" />
           </button>
           <button 
             onClick={() => onOpenIframe(`https://wphive.com/plugins/${plugin.slug}/`, `WP Hive: ${plugin.name}`)}
             className="p-1.5 hover:bg-orange-500/10 rounded text-muted-foreground hover:text-orange-600 transition-colors"
             title="WP Hive"
           >
             <Activity className="w-4 h-4" />
           </button>
           <button 
             onClick={() => onOpenIframe(`https://patchstack.com/database`, `Patchstack Database`)}
             className="p-1.5 hover:bg-emerald-500/10 rounded text-muted-foreground hover:text-emerald-600 transition-colors"
             title="Patchstack"
           >
             <ShieldCheck className="w-4 h-4" />
           </button>
           <button 
             onClick={() => onOpenIframe(`https://plugintests.com/plugins/wporg/${plugin.slug}/latest`, `Plugin Tests: ${plugin.name}`)}
             className="p-1.5 hover:bg-blue-500/10 rounded text-muted-foreground hover:text-blue-600 transition-colors"
             title="Plugin Tests"
           >
             <HelpCircle className="w-4 h-4" />
           </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-accent/30 border border-border/50 group-hover:bg-accent/50 transition-colors">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Downloads Yesterday</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-black">{plugin.yesterdayDownloads?.toLocaleString() || 0}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-accent/30 border border-border/50 group-hover:bg-accent/50 transition-colors">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Active Users</p>
            <p className="text-lg font-black">{plugin.activeInstalls || '0+'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
             <span>Updated {plugin.lastUpdated || 'Recently'}</span>
          </div>
          <div className="flex items-center gap-1 text-[#2271b1] font-bold">
            Live <RefreshCw className="w-3 h-3 animate-spin-slow" />
          </div>
        </div>
      </div>
    </div>
  );
}
