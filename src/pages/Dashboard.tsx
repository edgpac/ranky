import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppT } from '../contexts/LanguageContext';
import EditProfileTab from '../components/tabs/EditProfileTab';
import ReviewsTab from '../components/tabs/ReviewsTab';
import PhotosTab from '../components/tabs/PhotosTab';
import PostsTab, { MOCK_POSTS } from '../components/tabs/PostsTab';
import InsightsTab from '../components/tabs/InsightsTab';
import ServicesTab from '../components/tabs/ServicesTab';
import ProductsTab from '../components/tabs/ProductsTab';
import BookingsTab from '../components/tabs/BookingsTab';
import QATab from '../components/tabs/QATab';
import GetReviewsTab from '../components/tabs/GetReviewsTab';
import MemoryTab from '../components/tabs/MemoryTab';
import OwnerStudioTab from '../components/tabs/OwnerStudioTab';
import ManualTab from '../components/tabs/ManualTab';
import ModeToggle from '../components/ModeToggle';

interface Post {
  id: number;
  photo_url: string;
  post_text: string;
  search_query: string;
  posted_at: string;
  status: 'posted' | 'pending' | 'approved';
  cta_type?: string;
  cta_url?: string;
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
  isOwner?: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  url?: string;
}

const TABS = [
  { id: 'profile' },
  { id: 'reviews' },
  { id: 'qa' },
  { id: 'photos' },
  { id: 'posts' },
  { id: 'insights' },
  { id: 'services' },
  { id: 'products' },
  { id: 'bookings' },
  { id: 'getreviews' },
  { id: 'memory' },
  { id: 'manual' },
  { id: 'owner' },
] as const;

type TabId = typeof TABS[number]['id'];

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  profile:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  reviews:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  qa:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  photos:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  posts:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  insights:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  services:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  products:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  bookings:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  getreviews: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  memory:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="4" r="3" fill="currentColor" stroke="none" opacity="0.5"/></svg>,
  manual:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  owner:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const SECTIONS_BY_CATEGORY: Record<string, TabId[]> = {
  contractor:  ['profile', 'reviews', 'qa', 'photos', 'posts', 'insights', 'services', 'products', 'bookings', 'getreviews', 'memory', 'manual'],
  restaurant:  ['profile', 'reviews', 'qa', 'photos', 'posts', 'insights', 'products', 'bookings', 'getreviews', 'memory', 'manual'],
  store:       ['profile', 'reviews', 'qa', 'photos', 'posts', 'insights', 'products', 'getreviews', 'memory', 'manual'],
  salon:       ['profile', 'reviews', 'qa', 'photos', 'posts', 'insights', 'services', 'bookings', 'getreviews', 'memory', 'manual'],
  hotel:       ['profile', 'reviews', 'qa', 'photos', 'posts', 'insights', 'services', 'bookings', 'getreviews', 'memory', 'manual'],
  doctor:      ['profile', 'reviews', 'qa', 'photos', 'posts', 'insights', 'services', 'bookings', 'getreviews', 'memory', 'manual'],
  real_estate: ['profile', 'reviews', 'qa', 'photos', 'posts', 'insights', 'services', 'getreviews', 'memory', 'manual'],
};


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
  const dt = useAppT().dash;
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
      {dt.logOut}
    </button>
  );
}

// ─── GBP connection gate card ────────────────────────────────────────────────
function GbpGate({
  connectState,
  cooldown,
  onRetry,
  isGuest,
  onLocationSet,
}: {
  connectState: string | null;
  cooldown: number;
  onRetry: () => void;
  isGuest?: boolean;
  onLocationSet?: (name: string) => void;
}) {
  const dt = useAppT().dash;
  const [locationInput, setLocationInput] = useState('');
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState('');

  async function saveLocation() {
    const val = locationInput.trim();
    if (!val) return;
    setLocationSaving(true);
    setLocationError('');
    try {
      const r = await fetch('/api/gbp/set-location', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName: val }),
      });
      const d = await r.json();
      if (!r.ok) { setLocationError(d.error || 'Invalid location name'); }
      else { onLocationSet?.(d.gbp_account_name); }
    } catch { setLocationError('Request failed — try again'); }
    finally { setLocationSaving(false); }
  }

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
              {dt.gateChecking}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(232,238,255,0.45)' }}>
              {dt.gateCheckingSub}
            </p>
          </div>
        </>
      )}

      {connectState === 'waiting' && (
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
              {dt.gateWaitingTitle}
            </p>
            <p className="text-xs mt-1 max-w-sm" style={{ color: 'rgba(232,238,255,0.45)' }}>
              {dt.gateWaitingSub}
            </p>
          </div>

          {/* Manual paste — bypasses accounts.list quota */}
          <div className="w-full max-w-sm flex flex-col gap-2">
            <p className="text-xs font-semibold" style={{ color: 'rgba(232,238,255,0.55)' }}>
              {dt.gatePasteLabel}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="accounts/123456/locations/789012"
                className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(232,238,255,0.85)',
                  fontFamily: 'monospace',
                }}
                onKeyDown={(e) => e.key === 'Enter' && saveLocation()}
              />
              <button
                onClick={saveLocation}
                disabled={locationSaving || !locationInput.trim()}
                className="text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
                  color: '#fff',
                  border: '1px solid rgba(79,142,247,0.30)',
                  cursor: locationSaving || !locationInput.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {locationSaving ? '…' : dt.gateSave}
              </button>
            </div>
            {locationError && (
              <p className="text-xs" style={{ color: '#f87171' }}>{locationError}</p>
            )}
            <p className="text-xs" style={{ color: 'rgba(232,238,255,0.30)' }}>
              {dt.gatePasteHint}
            </p>
          </div>

          <button
            onClick={onRetry}
            className="text-xs"
            style={{ color: 'rgba(232,238,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {dt.gateRetryOauth}
          </button>
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
              {dt.gateRateLimited}
            </p>
            <p className="text-xs mt-1 max-w-sm" style={{ color: 'rgba(232,238,255,0.45)' }}>
              {dt.gateRateLimitedSub}
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
            {cooldown > 0 ? `${dt.gateRetryIn} ${cooldown}s` : dt.gateRetry}
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
              {isGuest ? dt.gateGuestTitle : dt.gateAuthTitle}
            </p>
            <p className="text-xs mt-1 max-w-sm" style={{ color: 'rgba(232,238,255,0.45)' }}>
              {isGuest ? dt.gateGuestSub : dt.gateAuthSub}
            </p>
          </div>
          {!isGuest && (
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
              {dt.connectGoogle}
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
  const dt = useAppT().dash;
  const [client, setClient] = useState<Client | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [isGuest, setIsGuest] = useState(false);
  const [demoCategory, setDemoCategory] = useState('contractor');
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
        // If GBP is already linked, mark ready immediately — no round-trip to Google
        if (data.client?.gbp_account_name) {
          setLocationReady(true);
          setConnectState('done');
        } else {
          // GBP account not saved yet — the OAuth background task may still be running.
          // Poll /api/me every 15s instead of calling permission-check (which hits the
          // rate-limited accounts.list endpoint). User can also click "Connect" manually.
          setConnectState('waiting');
          pollForGbpAccount();
        }
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

  // Poll /api/me every 15s to pick up gbp_account_name saved by the OAuth background task.
  // Stops after 10 attempts (~2.5 min), when account is found, or on unmount.
  function pollForGbpAccount(attempt = 0) {
    if (attempt >= 10) return;
    const capturedId = requestIdRef.current;
    setTimeout(async () => {
      if (requestIdRef.current !== capturedId) return; // unmounted
      try {
        const r = await fetch('/api/me', { credentials: 'include' });
        if (!r.ok) return;
        const data = await r.json();
        if (requestIdRef.current !== capturedId) return; // unmounted
        if (data.client?.gbp_account_name) {
          setClient(data.client);
          setLocationReady(true);
          setConnectState('done');
        } else {
          pollForGbpAccount(attempt + 1);
        }
      } catch { /* silent */ }
    }, 15_000);
  }

  // Retry = go through OAuth again so accounts.list runs once during the callback.
  // Never call /api/permission-check directly — that endpoint hits the quota endpoint.
  function runPermissionCheck() {
    window.location.href = '/auth/google';
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

  const freeTabIds: TabId[] = ['profile', 'posts', 'products', 'bookings', 'getreviews', 'memory', 'manual'];
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
          <ModeToggle automatedUnlocked={false} onManualClick={() => setActiveTab('manual')} />
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
              {locationReady ? dt.gbpConnected : dt.apiPending}
            </div>
          )}
          {!isGuest && <LogoutButton onClick={logout} />}
        </div>
      </header>


      {/* ── Category simulator (guest only) ──────────────────────────── */}
      {isGuest && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-5 py-2"
          style={{
            background: 'rgba(79,142,247,0.04)',
            borderBottom: '1px dashed rgba(79,142,247,0.18)',
            fontSize: '12px',
            color: 'rgba(232,238,255,0.45)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontWeight: 600, color: 'rgba(232,238,255,0.55)' }}>{dt.simulateLabel}</span>
          <select
            value={demoCategory}
            onChange={(e) => {
              setDemoCategory(e.target.value);
              const tabs = SECTIONS_BY_CATEGORY[e.target.value];
              if (tabs && !tabs.includes(activeTab)) setActiveTab(tabs[0]);
            }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(232,238,255,0.80)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {(Object.entries(dt.categories) as [string, string][]).map(([value, label]) => (
              <option key={value} value={value} style={{ background: '#080d1a' }}>{label}</option>
            ))}
          </select>
          <span style={{ marginLeft: 'auto', fontStyle: 'italic', opacity: 0.6, fontSize: '11px' }}>
            {dt.simulateNote}
          </span>
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
          className="flex items-center gap-0.5 px-5 pt-2"
          style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
        >
          {(isGuest ? SECTIONS_BY_CATEGORY[demoCategory] ?? TABS.map(tab => tab.id) : TABS.map(tab => tab.id).filter(id => id !== 'owner' || client?.isOwner)).map((tabId) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId as TabId)}
                className="flex items-center gap-1.5 h-10 px-3.5 py-2 text-[13px] font-medium rounded-t-lg whitespace-nowrap -mb-px"
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
                <span style={{ opacity: isActive ? 1 : 0.6, display: 'flex' }}>{TAB_ICONS[tabId as TabId]}</span>
                {dt.tabs[tabId as TabId]}
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

          {activeTab === 'profile' && <EditProfileTab client={client} ready={locationReady} onClientUpdated={setClient} />}
          {activeTab === 'posts' && (
            <PostsTab
              posts={isGuest ? MOCK_POSTS : posts}
              postsPerWeek={client?.posts_per_week ?? 3}
              tone={client?.tone ?? 'Friendly'}
              onPostGenerated={(p) => setPosts((prev) => [p, ...prev])}
              onPostUpdated={(p) => setPosts((prev) => prev.map((x) => x.id === p.id ? p : x))}
              onPostDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
            />
          )}
          {activeTab === 'products' && (
            <ProductsTab initialProducts={products} />
          )}
          {activeTab === 'bookings' && (
            <BookingsTab
              whatsapp={client?.whatsapp || ''}
              onSaved={(phone) => setClient((c) => c ? { ...c, whatsapp: phone } : c)}
            />
          )}
          {activeTab === 'getreviews' && (
            <GetReviewsTab
              reviewLink={client?.review_link || ''}
              onReviewLinkSaved={(link) => setClient((c) => c ? { ...c, review_link: link } : c)}
            />
          )}
          {activeTab === 'memory' && !isGuest && <MemoryTab />}
          {activeTab === 'manual' && <ManualTab isGuest={isGuest} />}
          {activeTab === 'owner' && client?.isOwner && <OwnerStudioTab />}

          {tabNeedsGbp && !locationReady && !isGuest ? (
            <GbpGate
              connectState={connectState}
              cooldown={cooldown}
              onRetry={runPermissionCheck}
              isGuest={isGuest}
              onLocationSet={(name) => {
                setClient((c) => c ? { ...c, gbp_account_name: name } as Client & { gbp_account_name: string } : c);
                setLocationReady(true);
                setConnectState('done');
              }}
            />
          ) : tabNeedsGbp ? (
            <>
                  {activeTab === 'reviews'  && <ReviewsTab ready={locationReady} />}
              {activeTab === 'qa'       && <QATab ready={locationReady} />}
              {activeTab === 'photos'   && <PhotosTab ready={locationReady} />}
              {activeTab === 'insights' && <InsightsTab businessName={client?.business_name || ''} ready={locationReady} onNavigate={(tab) => setActiveTab(tab as Parameters<typeof setActiveTab>[0])} />}
              {activeTab === 'services' && <ServicesTab ready={locationReady} />}
            </>
          ) : null}

        </div>
      </main>
    </div>
  );
}
