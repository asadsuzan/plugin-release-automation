import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchReport, fetchRawText } from '../services/api';
import type { Manifest } from '../services/api';
import { 
  FileJson, 
  Calendar, 
  Download, 
  FileText,
  ChevronRight,
  Rocket,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function Reports() {
  const { manifest } = useOutletContext<{ manifest: Manifest | null }>();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    if (selectedReport) {
      setLoading(true);
      fetchReport(selectedReport)
        .then(setReportData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedReport]);

  const handleDownload = async () => {
    if (!selectedReport) return;
    try {
      const content = await fetchRawText(selectedReport);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedReport;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleViewMarkdown = async () => {
    if (!selectedReport) return;
    const mdFile = selectedReport.replace('.json', '.md');
    setLoading(true);
    try {
      const content = await fetchRawText(mdFile);
      setMarkdownContent(content);
      setShowMarkdown(true);
    } catch (err) {
      console.error('Failed to load markdown', err);
    } finally {
      setLoading(false);
    }
  };

  if (!manifest) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Monthly Reports</h2>
        <p className="text-muted-foreground mt-1">Aggregated release summaries and analytics for stakeholders.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Available Reports</h3>
          <div className="space-y-1">
            {manifest.reports.filter(r => r.endsWith('.json')).map((report) => (
              <button
                key={report}
                onClick={() => setSelectedReport(report)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                  selectedReport === report 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>{report.replace('.json', '').replace('-', ' ')}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-all", selectedReport === report && "opacity-100")} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="h-64 bg-accent/20 rounded-2xl animate-pulse flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Processing report data...</span>
            </div>
          ) : reportData ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold capitalize">{selectedReport?.replace('.json', '').replace('-', ' ')} Summary</h3>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5" />
                      {reportData.releases?.length || 0} Total Releases
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <FileJson className="w-3.5 h-3.5" />
                      JSON Format
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-xl text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button 
                    onClick={handleViewMarkdown}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Markdown
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportData.releases?.map((rel: any, idx: number) => (
                  <div key={idx} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{rel.plugin}</span>
                      <span className="text-xs font-mono bg-accent px-2 py-0.5 rounded-full">v{rel.version}</span>
                    </div>
                    <div className="space-y-3">
                      {rel.features?.slice(0, 3).map((f: any, i: number) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                          <p className="text-muted-foreground line-clamp-2">{f.title}</p>
                        </div>
                      ))}
                      {rel.features?.length > 3 && (
                        <p className="text-[10px] text-muted-foreground italic pl-4">+{rel.features.length - 3} more items...</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-96 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 rounded-full bg-accent/50 flex items-center justify-center mb-4">
                <FileJson className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No Report Selected</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-2">
                Select a monthly report from the sidebar to visualize aggregated release data and distribution metrics.
              </p>
            </div>
          )}
        </div>
      </div>

      {showMarkdown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl h-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Markdown Report View</h3>
              </div>
              <button 
                onClick={() => setShowMarkdown(false)}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-accent/5 prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdownContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
