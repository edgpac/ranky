import { useEffect, useState } from 'react';

interface ReviewAuthor {
  displayName: string;
  profilePhotoUrl?: string;
}

interface Review {
  name: string;
  reviewId: string;
  reviewer: ReviewAuthor;
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

const MOCK_REVIEWS: Review[] = [
  {
    name: 'accounts/123/locations/456/reviews/r1',
    reviewId: 'r1',
    reviewer: { displayName: 'Carlos M.' },
    starRating: 'FIVE',
    comment: 'Incredible work on our bathroom renovation. The tile installation was flawless and the team cleaned up perfectly. Highly recommend for any home project!',
    createTime: '2026-01-15T10:00:00Z',
    updateTime: '2026-01-15T10:00:00Z',
  },
  {
    name: 'accounts/123/locations/456/reviews/r2',
    reviewId: 'r2',
    reviewer: { displayName: 'Sarah K.' },
    starRating: 'FIVE',
    comment: "Fixed our drywall after a water leak — you can't even tell there was ever a problem. Fast, professional, and fairly priced. Will definitely call again.",
    createTime: '2026-02-03T14:30:00Z',
    updateTime: '2026-02-03T14:30:00Z',
  },
  {
    name: 'accounts/123/locations/456/reviews/r3',
    reviewId: 'r3',
    reviewer: { displayName: 'Mike T.' },
    starRating: 'FIVE',
    comment: 'Had them repaint the entire exterior of our house. The prep work was thorough and the finish looks brand new. Great communication throughout the whole project.',
    createTime: '2026-02-20T09:15:00Z',
    updateTime: '2026-02-20T09:15:00Z',
  },
];

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
  borderRadius: '1rem',
  padding: '1.25rem',
};

const btnPrimary: React.CSSProperties = {
  background: '#4f8ef7',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(240,244,255,0.7)',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.8125rem',
  cursor: 'pointer',
};

function starStr(n: number) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

// ─── AI capability bullets ────────────────────────────────────────────────────
const AI_BULLETS = [
  { icon: '◎', text: 'Reads the exact words in each review — not just the star rating' },
  { icon: '◇', text: 'Handles 1-star reviews with calm professionalism and a specific resolution offer' },
  { icon: '◈', text: "Mirrors the reviewer's expertise — a food critic gets a culinary-level reply; a quick \"great service!\" gets a warm, brief one" },
  { icon: '✦', text: "Never starts with \"Thank you for your review\" — every reply feels personal" },
  { icon: '⊞', text: 'Written in your configured tone (Friendly / Professional / Bilingual), under 80 words' },
];

function AiBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: 'rgba(79,142,247,0.07)',
        border: '1px solid rgba(79,142,247,0.20)',
        backdropFilter: 'blur(12px)',
        borderRadius: '0.875rem',
        padding: '0.875rem 1.125rem',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: '1rem' }}>🤖</span>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(232,238,255,0.88)' }}>
            AI Reply Assistant — powered by Claude
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            fontSize: '0.75rem',
            color: '#4f8ef7',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            fontWeight: 600,
          }}
        >
          {open ? 'Hide' : 'How it works'}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(79,142,247,0.15)' }}>
          {AI_BULLETS.map((b) => (
            <div key={b.icon} className="flex items-start gap-2.5">
              <span style={{ fontSize: '0.625rem', color: '#4f8ef7', marginTop: '0.2rem', flexShrink: 0 }}>{b.icon}</span>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.70)', lineHeight: 1.5 }}>{b.text}</p>
            </div>
          ))}
          <p style={{ fontSize: '0.75rem', color: 'rgba(232,238,255,0.38)', marginTop: '0.25rem' }}>
            Click "Write with AI" on any review to generate a draft. Edit it before posting.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [localReply, setLocalReply] = useState(review.reviewReply?.comment ?? null);

  const stars = STAR_MAP[review.starRating] ?? 5;
  const initial = review.reviewer.displayName?.[0]?.toUpperCase() || '?';
  const date = new Date(review.createTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const text = review.comment || '';
  const isLong = text.length > 200;

  const generateReply = async () => {
    setGenerating(true);
    setReplyOpen(true);
    setReplyText('');
    try {
      const res = await fetch('/api/reviews/generate-reply', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReplyText(data.reply);
    } catch {
      setReplyText('');
    } finally {
      setGenerating(false);
    }
  };

  const postReply = async () => {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewName: review.name, replyText }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setLocalReply(replyText);
      setReplyOpen(false);
      setReplyText('');
    } catch {
      setLocalReply(replyText);
      setReplyOpen(false);
      setReplyText('');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={glassCard}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '9999px',
              background: 'linear-gradient(135deg, #7c5af7, #4f8ef7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.9375rem', flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(240,244,255,0.95)' }}>
              {review.reviewer.displayName}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.5)', marginTop: '0.1rem' }}>{date}</p>
          </div>
        </div>
        <span style={{ fontSize: '1rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.05em' }}>
          {starStr(stars)}
        </span>
      </div>

      {/* Review text */}
      {text && (
        <div style={{ marginBottom: '0.875rem' }}>
          <p
            style={{
              fontSize: '0.875rem', lineHeight: 1.6, color: 'rgba(240,244,255,0.8)',
              display: expanded ? 'block' : '-webkit-box',
              WebkitLineClamp: expanded ? undefined : 3,
              WebkitBoxOrient: 'vertical',
              overflow: expanded ? 'visible' : 'hidden',
            } as React.CSSProperties}
          >
            {text}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{ fontSize: '0.8125rem', color: '#4f8ef7', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.25rem', padding: 0 }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Reply section */}
      {localReply ? (
        <div
          style={{
            borderLeft: '2px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '0 0.5rem 0.5rem 0',
            padding: '0.625rem 0.875rem',
          }}
        >
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(240,244,255,0.45)', marginBottom: '0.25rem' }}>Your reply</p>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.75)', lineHeight: 1.5 }}>{localReply}</p>
        </div>
      ) : replyOpen ? (
        <div className="flex flex-col gap-2">
          {generating ? (
            <div
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.18)' }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                style={{ borderColor: 'rgba(79,142,247,0.5)', borderTopColor: 'transparent' }}
              />
              <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.60)' }}>
                Claude is reading this review and writing a reply…
              </p>
            </div>
          ) : (
            <textarea
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'white',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                width: '100%',
                lineHeight: 1.5,
              }}
              rows={3}
              placeholder="Edit reply before posting…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus={!generating}
            />
          )}
          <div className="flex gap-2 justify-end">
            <button style={btnGhost} onClick={() => { setReplyOpen(false); setReplyText(''); }}>Discard</button>
            {!generating && (
              <>
                <button
                  style={{ ...btnGhost, color: '#4f8ef7', borderColor: 'rgba(79,142,247,0.35)' }}
                  onClick={generateReply}
                >
                  Rewrite with AI
                </button>
                <button
                  style={{ ...btnPrimary, opacity: posting || !replyText.trim() ? 0.5 : 1 }}
                  onClick={postReply}
                  disabled={posting || !replyText.trim()}
                >
                  {posting ? 'Posting…' : 'Post Reply'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Two-button trigger row */
        <div className="flex gap-2">
          <button
            onClick={() => setReplyOpen(true)}
            style={{
              flex: 1, fontSize: '0.8125rem', color: 'rgba(240,244,255,0.5)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0.5rem', padding: '0.375rem 0.75rem', cursor: 'pointer', textAlign: 'left',
            }}
          >
            Write a reply...
          </button>
          <button
            onClick={generateReply}
            style={{
              fontSize: '0.8125rem', fontWeight: 600, color: '#4f8ef7',
              background: 'rgba(79,142,247,0.10)', border: '1px solid rgba(79,142,247,0.25)',
              borderRadius: '0.5rem', padding: '0.375rem 0.875rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '0.75rem' }}>✦</span> Write with AI
          </button>
        </div>
      )}
    </div>
  );
}

type FilterTab = 'all' | 'unreplied' | 'replied';

export default function ReviewsTab({ ready }: { ready: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    if (!ready) { setLoading(false); return; }
    fetch('/api/reviews', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        const fetched: Review[] = d.reviews || [];
        setReviews(fetched.length > 0 ? fetched : MOCK_REVIEWS);
        setAvg(d.averageRating ?? 5.0);
        setTotal(d.totalReviewCount ?? MOCK_REVIEWS.length);
      })
      .catch(() => {
        setReviews(MOCK_REVIEWS);
        setAvg(5.0);
        setTotal(MOCK_REVIEWS.length);
      })
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready && !loading) {
    return (
      <div style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(240,244,255,0.5)', fontSize: '0.875rem' }}>GBP not connected</p>
        <p style={{ color: 'rgba(240,244,255,0.35)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
          Connect your Google Business Profile to see reviews.
        </p>
      </div>
    );
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }} />
    </div>
  );

  const displayAvg = avg ?? 5.0;
  const displayTotal = total ?? reviews.length;

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'unreplied') return !r.reviewReply;
    if (filter === 'replied') return !!r.reviewReply;
    return true;
  });

  const starCounts = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => STAR_MAP[r.starRating] === n).length,
  }));

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unreplied', label: 'Unreplied' },
    { id: 'replied', label: 'Replied' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Section description */}
      <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.45)' }}>
        Respond to customer reviews with AI-matched tone — HayVista reads the review and replies in your voice.
      </p>

      {/* AI capability banner */}
      <AiBanner />

      {/* Rating overview */}
      <div style={{ ...glassCard, display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'rgba(240,244,255,0.95)', lineHeight: 1 }}>
            {displayAvg.toFixed(1)}
          </div>
          <div style={{ fontSize: '1.25rem', color: '#fbbf24', marginTop: '0.25rem', letterSpacing: '0.05em' }}>
            {starStr(Math.round(displayAvg))}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.5)', marginTop: '0.375rem' }}>
            {displayTotal} reviews
          </p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {starCounts.map(({ n, count }) => (
            <div key={n} className="flex items-center gap-2">
              <span style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.5)', width: '0.875rem', textAlign: 'right' }}>{n}</span>
              <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>★</span>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: displayTotal > 0 ? `${(count / displayTotal) * 100}%` : '0%',
                    background: 'linear-gradient(90deg, #4f8ef7, #7c5af7)',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.4)', width: '1.25rem' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '0.375rem 1rem', borderRadius: '9999px', fontSize: '0.8125rem',
              fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
              background: filter === tab.id ? 'rgba(79,142,247,0.15)' : 'transparent',
              borderColor: filter === tab.id ? 'rgba(79,142,247,0.4)' : 'rgba(255,255,255,0.12)',
              color: filter === tab.id ? '#4f8ef7' : 'rgba(240,244,255,0.55)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review cards */}
      <div className="flex flex-col gap-4">
        {filteredReviews.length === 0 ? (
          <div style={{ ...glassCard, textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'rgba(240,244,255,0.4)', fontSize: '0.875rem' }}>No reviews in this category.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <ReviewCard key={review.reviewId} review={review} />
          ))
        )}
      </div>
    </div>
  );
}
