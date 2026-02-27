import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostsTab from '../components/tabs/PostsTab';
import ReviewsTab from '../components/tabs/ReviewsTab';
import InsightsTab from '../components/tabs/InsightsTab';
import PhotosTab from '../components/tabs/PhotosTab';
import ServicesTab from '../components/tabs/ServicesTab';

interface Post {
  id: number;
  photo_url: string;
  post_text: string;
  search_query: string;
  posted_at: string;
  status: 'posted' | 'pending' | 'approved';
}

interface Client {
  business_name: string;
  name: string;
  posts_per_week: number;
  tone: string;
  business_type: string;
  subscription_status: string;
}

const TABS = [
  { id: 'posts',    label: 'Posts' },
  { id: 'reviews',  label: 'Reviews' },
  { id: 'photos',   label: 'Photos' },
  { id: 'services', label: 'Services' },
  { id: 'insights', label: 'Performance' },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Styles ────────────────────────────────────────────────────────────────
const S = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-glass)',
  } as React.CSSProperties,
  header: {
    background: 'rgba(255,255,255,0.04)',
    borderBottom: '1px solid var(--border)',
    backdropFilter: 'blur(12px)',
  } as React.CSSProperties,
  nav: {
    background: 'rgba(255,255,255,0.02)',
    borderBottom: '1px solid var(--border)',
  } as React.CSSProperties,
  avatar: {
    background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
  } as React.CSSProperties,
  badge: {
    color: 'var(--accent)',
    background: 'rgba(79,142,247,0.15)',
    border: '1px solid rgba(79,142,247,0.3)',
  } as React.CSSProperties,
  statusPending: {
    color: 'var(--warning)',
    background: 'rgba(251,191,36,0.1)',
    border: '1px solid rgba(251,191,36,0.25)',
  } as React.CSSProperties,
  statusLive: {
    color: 'var(--success)',
    background: 'rgba(52,211,153,0.1)',
    border: '1px solid rgba(52,211,153,0.25)',
  } as React.CSSProperties,
  disconnectBtn: {
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    background: 'none',
  } as React.CSSProperties,
  btnPrimary: {
    background: 'var(--accent)',
    color: '#fff',
  } as React.CSSProperties,
  btnAmber: {
    background: '#d97706',
    color: '#fff',
  } as React.CSSProperties,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('posts');
  const [locationReady, setLocationReady] = useState(false);
  const [connectState, setConnectState] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
      requestIdRef.current++;
    };
  }, []);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => { if (!r.ok) { navigate('/signup'); return null; } return r.json(); })
      .then((data) => {
        if (!data) return;
        setClient(data.client);
        setPosts(data.posts || []);
        setLoading(false);
        setTimeout(() => runPermissionCheck(), 3000);
      })
      .catch(() => navigate('/signup'));
  }, []);

  function startCooldown(seconds: number) {
    if (cooldownRef.current) return;
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; } return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function runPermissionCheck() {
    if (connectState === 'checking') return;
    const requestId = ++requestIdRef.current;
    setConnectState('checking');
    try {
      const r = await fetch('/api/permission-check', { credentials: 'include' });
      const d = await r.json();
      if (requestId !== requestIdRef.current) return;
      if (d.locationReady) { setLocationReady(true); setConnectState('done'); }
      else if (d.ok === false) { setConnectState('error'); }
      else { setConnectState('rate-limited'); startCooldown(d.cooldownSec ?? 70); }
    } catch {
      if (requestId !== requestIdRef.current) return;
      setConnectState('error');
    }
  }

  const logout = () =>
    fetch('/auth/logout', { method: 'POST', credentials: 'include' }).then(() => navigate('/'));

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const bizInitial = (client?.business_name?.[0] || 'R').toUpperCase();
  const bizType = client?.business_type && client.business_type !== 'general' ? client.business_type : 'Business';

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'var(--bg)', fontFamily: "'DM Sans', system-ui, sans-serif", color: 'var(--text)' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3" style={S.header}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={S.avatar}>
            {bizInitial}
          </div>
          <div>
            <div className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{client?.business_name}</div>
            <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5" style={S.badge}>
              {bizType}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-full"
            style={locationReady ? S.statusLive : S.statusPending}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {locationReady ? 'GBP Connected' : 'API Approval Pending'}
          </div>
          <button
            onClick={logout}
            className="text-[12px] px-3 py-1.5 rounded-lg transition-all"
            style={S.disconnectBtn}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = 'var(--danger)'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)'; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.target as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* ── Nav Tabs ────────────────────────────────────────────────── */}
      <nav className="flex-shrink-0" style={S.nav}>
        <div className="flex items-end gap-0.5 px-5 pt-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3.5 pb-2.5 pt-2 text-[13px] font-medium rounded-t-lg whitespace-nowrap transition-all border-b-2 -mb-px"
              style={{
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                borderBottomColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                background: activeTab === tab.id ? 'rgba(79,142,247,0.06)' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Panel ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.10) transparent' }}>
        <div className="max-w-3xl mx-auto">

          {activeTab === 'posts' ? (
            <PostsTab
              posts={posts}
              onPostGenerated={(p) => setPosts((prev) => [p, ...prev])}
              onPostUpdated={(p) => setPosts((prev) => prev.map((x) => x.id === p.id ? p : x))}
            />
          ) : !locationReady ? (

            /* ── Connection gate ─────────────────────────────────── */
            <div className="rounded-2xl p-12 flex flex-col items-center gap-6 text-center" style={S.card}>
              {(connectState === null || connectState === 'checking') && (
                <>
                  <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Connecting to your Google Business Profile</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Verifying your account access — just a moment.</p>
                  </div>
                </>
              )}
              {connectState === 'rate-limited' && (
                <>
                  <span className="text-4xl">⏳</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Google's API is temporarily throttled</p>
                    <p className="text-xs mt-1 max-w-sm" style={{ color: 'var(--text-muted)' }}>
                      Google limits how often we can verify your account. Once the countdown ends, hit retry — it only takes one successful call and your data loads instantly from then on.
                    </p>
                  </div>
                  <button
                    onClick={runPermissionCheck}
                    disabled={cooldown > 0}
                    className="text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={S.btnPrimary}
                  >
                    {cooldown > 0 ? `Retry in ${cooldown}s` : 'Retry now →'}
                  </button>
                </>
              )}
              {connectState === 'error' && (
                <>
                  <span className="text-4xl">🔑</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Google Business Profile access needed</p>
                    <p className="text-xs mt-1 max-w-sm" style={{ color: 'var(--text-muted)' }}>
                      Your Google connection doesn't include Business Profile permissions. Reconnect to fix it.
                    </p>
                  </div>
                  <a
                    href="/auth/reauth"
                    className="text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                    style={S.btnAmber}
                  >
                    Reconnect Google Account
                  </a>
                </>
              )}
            </div>

          ) : (
            <>
              {activeTab === 'insights'  && <InsightsTab businessName={client?.business_name || ''} ready={locationReady} />}
              {activeTab === 'reviews'   && <ReviewsTab ready={locationReady} />}
              {activeTab === 'photos'    && <PhotosTab ready={locationReady} />}
              {activeTab === 'services'  && <ServicesTab ready={locationReady} />}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
