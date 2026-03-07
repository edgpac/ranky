import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID as string | undefined;

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const error = params.get('error');
    if (error) {
      navigate('/signup?error=' + error);
      return;
    }

    // Persist JWT from OAuth redirect so it survives the Vercel→Railway proxy gap
    const token = params.get('token');
    if (token) {
      const maxAge = 30 * 24 * 60 * 60;
      document.cookie = `hayvista_token=${token}; path=/; max-age=${maxAge}; secure; samesite=lax; domain=hayvista.com`;
    }

    // Check subscription status — send unsubscribed users to Stripe, returning subscribers to dashboard
    (async () => {
      try {
        const me = await fetch('/api/me', { credentials: 'include' }).then((r) => r.json());
        const active = me?.subscription_status === 'active';

        if (active || !PRICE_ID) {
          navigate('/dashboard');
          return;
        }

        // New or unpaid user — create Stripe checkout session
        const res = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId: PRICE_ID }),
        });
        if (!res.ok) { navigate('/dashboard'); return; }
        const { url } = await res.json();
        window.location.href = url;
      } catch {
        navigate('/dashboard');
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Setting up your account…</p>
      </div>
    </div>
  );
}
