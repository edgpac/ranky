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
  { id: 'insights',  label: 'Insights',  icon: '📊' },
  { id: 'posts',     label: 'Posts',     icon: '📝' },
  { id: 'reviews',   label: 'Reviews',   icon: '⭐' },
  { id: 'photos',    label: 'Photos',    icon: '📸' },
  { id: 'services',  label: 'Services',  icon: '🔧' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('posts');
  const [locationReady, setLocationReady] = useState(false);
  // 'checking' | 'rate-limited' | 'error' | 'done' | null
  const [connectState, setConnectState] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestIdRef = useRef(0);

  // Cleanup on unmount: clear timer + invalidate any in-flight requests
  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
      requestIdRef.current++;
    };
  }, []);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) { navigate('/signup'); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setClient(data.client);
        setPosts(data.posts || []);
        setLoading(false);
        // Auto-check once on load after a short delay
        setTimeout(() => runPermissionCheck(), 3000);
      })
      .catch(() => navigate('/signup'));
  }, []);

  function startCooldown(seconds: number) {
    if (cooldownRef.current) return; // prevent duplicate timers
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) {
            clearInterval(cooldownRef.current);
            cooldownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function runPermissionCheck() {
    if (connectState === 'checking') return; // guard against double-fire
    const requestId = ++requestIdRef.current;
    setConnectState('checking');
    try {
      const r = await fetch('/api/permission-check', { credentials: 'include' });
      const d = await r.json();
      if (requestId !== requestIdRef.current) return; // stale response — a newer call is in flight
      if (d.locationReady) {
        setLocationReady(true);
        setConnectState('done');
      } else if (d.ok === false) {
        setConnectState('error');
      } else {
        setConnectState('rate-limited');
        startCooldown(d.cooldownSec ?? 70);
      }
    } catch {
      if (requestId !== requestIdRef.current) return;
      setConnectState('error');
    }
  }

  const logout = () =>
    fetch('/auth/logout', { method: 'POST', credentials: 'include' }).then(() => navigate('/'));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand" />
          <span className="font-bold text-slate-900">Ranky</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{client?.business_name}</span>
          {client?.subscription_status === 'trial' && (
            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-1 rounded-full">Free trial</span>
          )}
          <button onClick={logout} className="text-xs text-slate-400 hover:text-slate-700">Log out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {client?.business_name}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {client?.posts_per_week}× posts/week · {client?.tone} tone
            {client?.business_type && client.business_type !== 'general' && ` · ${client.business_type}`}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content — hard gate: posts always renders; GBP tabs blocked until locationReady */}
        <div>
          {activeTab === 'posts' ? (
            <PostsTab posts={posts} onPostGenerated={(p) => setPosts((prev) => [p, ...prev])} onPostUpdated={(p) => setPosts((prev) => prev.map((x) => x.id === p.id ? p : x))} />
          ) : !locationReady ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center gap-5 text-center">
              {(connectState === null || connectState === 'checking') && (
                <>
                  <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Connecting to your Google Business Profile</p>
                    <p className="text-xs text-slate-400 mt-1">Verifying your account access — just a moment.</p>
                  </div>
                </>
              )}
              {connectState === 'rate-limited' && (
                <>
                  <span className="text-4xl">⏳</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Google's API is temporarily throttled</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Google limits how often we can verify your account. Once the countdown ends, hit retry — it only takes one successful call and your data loads instantly from then on.
                    </p>
                  </div>
                  <button
                    onClick={runPermissionCheck}
                    disabled={cooldown > 0}
                    className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {cooldown > 0 ? `Retry in ${cooldown}s` : 'Retry now →'}
                  </button>
                </>
              )}
              {connectState === 'error' && (
                <>
                  <span className="text-4xl">🔑</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Google Business Profile access needed</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Your Google connection doesn't include Business Profile permissions. Reconnect to fix it.
                    </p>
                  </div>
                  <a href="/auth/reauth" className="bg-amber-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-amber-700 transition-colors">
                    Reconnect Google Account
                  </a>
                </>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'insights' && <InsightsTab businessName={client?.business_name || ''} ready={locationReady} />}
              {activeTab === 'reviews'  && <ReviewsTab ready={locationReady} />}
              {activeTab === 'photos'   && <PhotosTab ready={locationReady} />}
              {activeTab === 'services' && <ServicesTab ready={locationReady} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
