import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditProfileTab from '../components/tabs/EditProfileTab';
import ReviewsTab from '../components/tabs/ReviewsTab';
import PhotosTab from '../components/tabs/PhotosTab';
import PostsTab from '../components/tabs/PostsTab';
import InsightsTab from '../components/tabs/InsightsTab';
import ServicesTab from '../components/tabs/ServicesTab';
import ProductsTab from '../components/tabs/ProductsTab';
import BookingsTab from '../components/tabs/BookingsTab';
import GetReviewsTab from '../components/tabs/GetReviewsTab';

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
  whatsapp?: string;
  review_link?: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
}

const TABS = [
  { id: 'profile',     label: 'Edit Profile',  icon: '◈' },
  { id: 'reviews',     label: 'Reviews',        icon: '★' },
  { id: 'photos',      label: 'Photos',         icon: '⬡' },
  { id: 'posts',       label: 'Posts',          icon: '⊞' },
  { id: 'insights',    label: 'Performance',    icon: '◎' },
  { id: 'services',    label: 'Services',       icon: '◇' },
  { id: 'products',    label: 'Products',       icon: '⬙' },
  { id: 'bookings',    label: 'Bookings',       icon: '◷' },
  { id: 'getreviews',  label: 'Get Reviews',    icon: '✦' },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Ambient orb layer ───────────────────────────────────────────────────────
function AmbientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true" style={{ zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: '-12%', left: '-5%',
        width: 750, height: 750, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,142,247,0.13) 0%, transparent 65%)',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,90,247,0.10) 0%, transparent 65%)',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-5%', left: '30%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%)',
        filter: 'blur(50px)',
      }} />
    </div>
  );
}

// ─── Logout button with hover state ─────────────────────────────────────────
function LogoutButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-[12px] px-3 py-1.5 rounded-lg"
      style={{
        color: hovered ? '#f87171' : 'rgba(232,238,255,0.60)',
        border: `1px solid ${hovered ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.11)'}`,
        background: hovered ? 'rgba(239,68,68,0.07)' : 'transparent',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      }}
    >
      Log Out
    </button>
  );
}

// ─── GBP connection gate card ────────────────────────────────────────────────
function GbpGate({
  connectState,
  cooldown,
  onRetry,
  isGuest,
}: {
  connectState: string | null;
  cooldown: number;
  onRetry: () => void;
  isGuest?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-12 flex flex-col items-center gap-6 text-center"
      style={{
        background: 'rgba(255,255,255,0.036)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.09)',
      }}
    >
      {(connectState === null || connectState === 'checking') && (
        <>
          <div
            className="w-11 h-11 rounded-full border-[3px] animate-spin"
            style={{ borderColor: 'rgba(79,142,247,0.45)', borderTopColor: 'transparent' }}
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(232,238,255,0.92)' }}>
              Connecting to your Google Business Profile
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(232,238,255,0.45)' }}>
              Verifying your account access — just a moment.
            </p>
          </div>
        </>
      )}

      {connectState === 'rate-limited' && (
        <>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'rgba(251,191,36,0.10)',
              border: '1px solid rgba(251,191,36,0.22)',
              boxShadow: '0 0 20px rgba(251,191,36,0.12)',
            }}
          >
            ⏳
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(232,238,255,0.92)' }}>
              Google's API is temporarily throttled
            </p>
            <p className="text-xs mt-1 max-w-sm" style={{ color: 'rgba(232,238,255,0.45)' }}>
              Google limits how often we can verify your account. Once the countdown ends, hit retry.
            </p>
          </div>
          <button
            onClick={onRetry}
            disabled={cooldown > 0}
            className="text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: cooldown > 0
                ? 'rgba(79,142,247,0.15)'
                : 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
              color: '#fff',
              border: '1px solid rgba(79,142,247,0.30)',
              boxShadow: cooldown > 0 ? 'none' : '0 0 24px rgba(79,142,247,0.30)',
              transition: 'all 0.15s ease',
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {cooldown > 0 ? `Retry in ${cooldown}s` : 'Retry now →'}
          </button>
        </>
      )}

      {connectState === 'error' && (
        <>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'rgba(79,142,247,0.10)',
              border: '1px solid rgba(79,142,247,0.22)',
              boxShadow: '0 0 20px rgba(79,142,247,0.12)',
            }}
          >
            🔑
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(232,238,255,0.92)' }}>
              {isGuest ? 'Connect your Google Business Profile' : 'Google Business Profile access needed'}
            </p>
            <p className="text-xs mt-1 max-w-sm" style={{ color: 'rgba(232,238,255,0.45)' }}>
              {isGuest
                ? 'Create a free account and link your Google profile to start managing your content.'
                : "Your Google connection doesn't include Business Profile permissions. Reconnect to fix it."}
            </p>
          </div>
          {isGuest ? (
            <a
              href="/signup"
              className="text-sm font-semibold px-6 py-2.5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
                color: '#fff',
                border: '1px solid rgba(79,142,247,0.35)',
                boxShadow: '0 0 24px rgba(79,142,247,0.25)',
                textDecoration: 'none',
              }}
            >
              Connect Google
            </a>
          ) : (
            <a
              href="/auth/reauth"
              className="text-sm font-semibold px-6 py-2.5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                color: '#fff',
                border: '1px solid rgba(217,119,6,0.35)',
                boxShadow: '0 0 24px rgba(217,119,6,0.25)',
                textDecoration: 'none',
              }}
            >
              Connect Google
            </a>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [isGuest, setIsGuest] = useState(false);
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
      .then((r) => {
        if (!r.ok) {
          setIsGuest(true);
          setConnectState('error');
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setClient(data.client);
        setPosts(data.posts || []);
        setProducts(data.products || []);
        setLoading(false);
        setTimeout(() => runPermissionCheck(), 3000);
      })
      .catch(() => {
        setIsGuest(true);
        setConnectState('error');
        setLoading(false);
      });
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
      <div className="h-screen flex items-center justify-center" style={{ background: '#060b18' }}>
        <AmbientOrbs />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
            style={{
              background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
              boxShadow: '0 0 32px rgba(79,142,247,0.45)',
            }}
          >
            R
          </div>
          <div
            className="w-8 h-8 rounded-full border-[3px] animate-spin"
            style={{ borderColor: 'rgba(79,142,247,0.5)', borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    );
  }

  const bizType = client?.business_type && client.business_type !== 'general' ? client.business_type : 'Business';

  const freeTabIds: TabId[] = ['profile', 'posts', 'products', 'bookings', 'getreviews'];
  const tabNeedsGbp = !freeTabIds.includes(activeTab);

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ background: '#060b18', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#e8eeff', position: 'relative' }}
    >
      <AmbientOrbs />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 py-3"
        style={{
          position: 'relative', zIndex: 20,
          background: 'rgba(255,255,255,0.052)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.40)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3.5"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <img
            src="/hayvista-logo.png"
            alt="HayVista"
            style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }}
          />
          {!isGuest && (
            <div style={{ textAlign: 'left' }}>
              <div className="text-[15px] font-bold" style={{ color: 'rgba(232,238,255,0.96)' }}>
                {client?.business_name}
              </div>
              <span
                className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5"
                style={{
                  color: '#4f8ef7',
                  background: 'rgba(79,142,247,0.12)',
                  border: '1px solid rgba(79,142,247,0.25)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {bizType}
              </span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-3">
          {!isGuest && (
            <div
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full"
              style={locationReady ? {
                color: '#34d399',
                background: 'rgba(52,211,153,0.09)',
                border: '1px solid rgba(52,211,153,0.22)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 0 12px rgba(52,211,153,0.12)',
              } : {
                color: '#fbbf24',
                background: 'rgba(251,191,36,0.09)',
                border: '1px solid rgba(251,191,36,0.22)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
                style={{ boxShadow: locationReady ? '0 0 6px #34d399' : '0 0 6px #fbbf24' }}
              />
              {locationReady ? 'GBP Connected' : 'API Approval Pending'}
            </div>
          )}
          {isGuest ? (
            <a
              href="/signup"
              className="text-sm font-semibold px-5 py-2 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
                color: '#fff',
                textDecoration: 'none',
                boxShadow: '0 0 20px rgba(79,142,247,0.3)',
              }}
            >
              Sign In / Sign Up
            </a>
          ) : (
            <LogoutButton onClick={logout} />
          )}
        </div>
      </header>

      {/* ── Guest banner ─────────────────────────────────────────────── */}
      {isGuest && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-2 py-2 text-xs font-medium"
          style={{
            background: 'rgba(79,142,247,0.08)',
            borderBottom: '1px solid rgba(79,142,247,0.18)',
            color: 'rgba(232,238,255,0.55)',
          }}
        >
          <span>Browsing as guest —</span>
          <a href="/signup" style={{ color: '#4f8ef7', textDecoration: 'none', fontWeight: 600 }}>
            Connect Google to manage your real profile
          </a>
        </div>
      )}

      {/* ── Tab nav ──────────────────────────────────────────────────── */}
      <nav
        className="flex-shrink-0"
        style={{
          position: 'relative', zIndex: 10,
          background: 'rgba(255,255,255,0.022)',
          borderBottom: '1px solid rgba(255,255,255,0.065)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div
          className="flex items-end gap-0.5 px-5 pt-2"
          style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3.5 pb-2.5 pt-2 text-[13px] font-medium rounded-t-lg whitespace-nowrap -mb-px"
                style={{
                  color: isActive ? '#4f8ef7' : 'rgba(232,238,255,0.45)',
                  borderBottom: isActive ? '2px solid #4f8ef7' : '2px solid transparent',
                  background: isActive ? 'rgba(79,142,247,0.07)' : 'transparent',
                  boxShadow: isActive ? 'inset 0 1px 0 rgba(79,142,247,0.15)' : 'none',
                  backdropFilter: isActive ? 'blur(8px)' : 'none',
                  WebkitBackdropFilter: isActive ? 'blur(8px)' : 'none',
                  transition: 'all 0.16s ease',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,238,255,0.75)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,238,255,0.45)';
                }}
              >
                <span style={{ fontSize: '10px', opacity: 0.65, letterSpacing: '-0.5px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto p-6"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="max-w-3xl mx-auto">

          {activeTab === 'profile' && <EditProfileTab client={client} onClientUpdated={setClient} />}
          {activeTab === 'posts' && (
            <PostsTab
              posts={posts}
              onPostGenerated={(p) => setPosts((prev) => [p, ...prev])}
              onPostUpdated={(p) => setPosts((prev) => prev.map((x) => x.id === p.id ? p : x))}
            />
          )}
          {activeTab === 'products' && (
            <ProductsTab initialProducts={products} />
          )}
          {activeTab === 'bookings' && <BookingsTab />}
          {activeTab === 'getreviews' && (
            <GetReviewsTab
              reviewLink={client?.review_link || ''}
              onReviewLinkSaved={(link) => setClient((c) => c ? { ...c, review_link: link } : c)}
            />
          )}

          {tabNeedsGbp && !locationReady && !isGuest ? (
            <GbpGate connectState={connectState} cooldown={cooldown} onRetry={runPermissionCheck} isGuest={isGuest} />
          ) : tabNeedsGbp ? (
            <>
              {isGuest && (
                <div
                  className="mb-5 flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.20)' }}
                >
                  <p className="text-xs" style={{ color: 'rgba(232,238,255,0.55)' }}>
                    Connect your Google Business Profile to see your live data here.
                  </p>
                  <a
                    href="/signup"
                    className="shrink-0 text-xs font-semibold px-4 py-1.5 rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff', textDecoration: 'none' }}
                  >
                    Connect Google
                  </a>
                </div>
              )}
              {activeTab === 'reviews'  && <ReviewsTab ready={locationReady} />}
              {activeTab === 'photos'   && <PhotosTab ready={locationReady} />}
              {activeTab === 'insights' && <InsightsTab businessName={client?.business_name || ''} ready={locationReady} />}
              {activeTab === 'services' && <ServicesTab ready={locationReady} />}
            </>
          ) : null}

        </div>
      </main>
    </div>
  );
}
