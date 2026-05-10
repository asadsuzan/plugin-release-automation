import { useState, useEffect } from 'react'
import './App.css'

interface ReleaseItem {
  title: string;
  category?: string;
  description?: string;
}

interface Release {
  version: string;
  date: string;
  status: string;
  type: string;
  features: ReleaseItem[];
  improvements: ReleaseItem[];
  fixes: ReleaseItem[];
  tags: string[];
}

interface PluginHistory {
  plugin: string;
  releases: Release[];
}

interface Manifest {
  plugins: { slug: string; name: string; lastVersion: string }[];
  reports: string[];
  lastUpdated: string;
}

function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [history, setHistory] = useState<PluginHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/manifest.json')
      .then(res => res.json())
      .then(data => {
        setManifest(data);
        if (data.plugins.length > 0) {
          setSelectedPlugin(data.plugins[0].slug);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load manifest:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedPlugin) {
      setLoading(true);
      fetch(`/data/changelog-${selectedPlugin}.json`)
        .then(res => res.json())
        .then(data => {
          setHistory(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load history:', err);
          setLoading(false);
        });
    }
  }, [selectedPlugin]);

  if (loading && !manifest) {
    return <div className="loading">Initializing Dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar glass">
        <div className="logo-section">
          <h1 className="gradient-text">ReleaseBot</h1>
          <p className="subtitle">v1.0.0</p>
        </div>

        <nav className="plugin-list">
          <h3 className="nav-title">Plugins</h3>
          {manifest?.plugins.map(p => (
            <button 
              key={p.slug}
              className={`plugin-nav-item ${selectedPlugin === p.slug ? 'active' : ''}`}
              onClick={() => setSelectedPlugin(p.slug)}
            >
              <div className="plugin-info">
                <span className="p-name">{p.name}</span>
                <span className="p-version">v{p.lastVersion}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Sync: {manifest?.lastUpdated ? new Date(manifest.lastUpdated).toLocaleString() : 'Never'}</p>
        </div>
      </aside>

      <main className="content">
        {history ? (
          <>
            <header className="content-header">
              <div className="header-meta">
                <h2>{history.plugin}</h2>
                <div className="stats">
                  <div className="stat-card glass">
                    <span className="val">{history.releases.length}</span>
                    <span className="lab">Releases</span>
                  </div>
                </div>
              </div>
            </header>

            <section className="timeline">
              {history.releases.map((rel, idx) => (
                <div key={rel.version} className="release-card glass" style={{animationDelay: `${idx * 0.1}s`}}>
                  <div className="release-header">
                    <div className="v-pill">
                      <span className="version">v{rel.version}</span>
                      <span className={`badge badge-${rel.type}`}>{rel.type}</span>
                    </div>
                    <span className="date">{new Date(rel.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>

                  <div className="release-body">
                    {rel.features.length > 0 && (
                      <div className="sec">
                        <h4>Features</h4>
                        <ul>
                          {rel.features.map((f, i) => (
                            <li key={i}>
                              <strong>{f.title}</strong>
                              {f.description && <p>{f.description}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rel.improvements.length > 0 && (
                      <div className="sec">
                        <h4>Improvements</h4>
                        <ul>
                          {rel.improvements.map((im, i) => <li key={i}>{im.title}</li>)}
                        </ul>
                      </div>
                    )}

                    {rel.fixes.length > 0 && (
                      <div className="sec">
                        <h4>Fixes</h4>
                        <ul>
                          {rel.fixes.map((fx, i) => <li key={i}>{fx.title}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {rel.tags.length > 0 && (
                    <div className="release-footer">
                      {rel.tags.map(t => <span key={t} className="tag">#{t}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </section>
          </>
        ) : (
          <div className="empty-state">Select a plugin to view its history</div>
        )}
      </main>
    </div>
  )
}

export default App
