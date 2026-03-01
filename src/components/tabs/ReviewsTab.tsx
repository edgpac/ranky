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
  totalMediaItemCount?: number;
}

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

const MOCK_REVIEWS: Review[] = [
  {
    name: 'accounts/123/locations/456/reviews/r1',
    reviewId: 'r1',
    reviewer: { displayName: 'Kevin Meisler' },
    starRating: 'FIVE',
    comment: "I hired this handyman for art hanging, paint touch-ups, and a faucet replacement. They were professional, tidy, and I'll definitely use them again.",
    createTime: new Date(Date.now() - 7 * 86400000).toISOString(),
    updateTime: new Date(Date.now() - 7 * 86400000).toISOString(),
    totalMediaItemCount: 1,
  },
  {
    name: 'accounts/123/locations/456/reviews/r2',
    reviewId: 'r2',
    reviewer: { displayName: 'Maria L.' },
    starRating: 'FIVE',
    comment: 'Excellent work fixing our plumbing issue in the vacation rental. Fast response, great communication in both English and Spanish. Will definitely hire again!',
    createTime: new Date(Date.now() - 21 * 86400000).toISOString(),
    updateTime: new Date(Date.now() - 21 * 86400000).toISOString(),
    reviewReply: {
      comment: "Thank you Maria! It was a pleasure working with you. We're always here whenever you need us.",
      updateTime: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
  },
  {
    name: 'accounts/123/locations/456/reviews/r3',
    reviewId: 'r3',
    reviewer: { displayName: 'Mike T.' },
    starRating: 'FIVE',
    comment: 'Had them repaint the entire exterior of our house. The prep work was thorough and the finish looks brand new. Great communication throughout.',
    createTime: new Date(Date.now() - 35 * 86400000).toISOString(),
    updateTime: new Date(Date.now() - 35 * 86400000).toISOString(),
    reviewReply: {
      comment: 'Thank you Mike! We take pride in thorough prep work. Call us anytime!',
      updateTime: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

function starStr(n: number) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '0.875rem',
  padding: '1rem',
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

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [localReply, setLocalReply] = useState(review.reviewReply?.comment ?? null);
  const [localReplyTime, setLocalReplyTime] = useState(review.reviewReply?.updateTime ?? null);

  const stars = STAR_MAP[review.starRating] ?? 5;
  const initial = review.reviewer.displayName?.[0]?.toUpperCase() || '?';
  const dateStr = relativeTime(review.createTime);
  const photoCount = review.totalMediaItemCount;
  const metaStr = photoCount ? `${dateStr} · ${photoCount} photo${photoCount > 1 ? 's' : ''}` : dateStr;

  const generateReply = async () => {
    setGenerating(true);
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
    } catch {
      // optimistically update
    } finally {
      setLocalReply(replyText);
      setLocalReplyTime(new Date().toISOString());
      setReplyText('');
      setPosting(false);
    }
  };

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '2.125rem', height: '2.125rem', borderRadius: '9999px',
              background: 'linear-gradient(135deg, #7c5af7, #4f8ef7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(240,244,255,0.95)', lineHeight: 1.2 }}>
              {review.reviewer.displayName}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.45)', marginTop: '0.125rem' }}>{metaStr}</p>
          </div>
        </div>
        <span style={{ fontSize: '0.8125rem', color: '#fbbf24', letterSpacing: '0.04em', flexShrink: 0 }}>
          {starStr(stars)}
        </span>
      </div>

      {/* Review text */}
      {review.comment && (
        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'rgba(240,244,255,0.82)', marginBottom: '0.75rem' }}>
          {review.comment}
        </p>
      )}

      {/* Reply area */}
      {localReply ? (
        /* Replied: show subtle indicator */
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            marginTop: '0.25rem',
            paddingTop: '0.5rem',
            fontSize: '0.75rem',
            color: 'rgba(240,244,255,0.40)',
          }}
        >
          ✓ Replied {localReplyTime ? relativeTime(localReplyTime) : ''}
        </div>
      ) : generating ? (
        /* AI generating */
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.18)',
            borderRadius: '0.5rem', padding: '0.625rem 0.75rem',
          }}
        >
          <div
            className="animate-spin"
            style={{
              width: '0.875rem', height: '0.875rem', borderRadius: '9999px',
              border: '2px solid rgba(79,142,247,0.4)', borderTopColor: 'transparent', flexShrink: 0,
            }}
          />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.55)' }}>
            Claude is writing a reply…
          </p>
        </div>
      ) : (
        /* Reply input — always open for unreplied */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '0.8125rem',
              padding: '0.5rem 0.75rem',
              resize: 'none',
              outline: 'none',
              width: '100%',
              lineHeight: 1.5,
              fontFamily: 'inherit',
              transition: 'border-color 0.18s',
            }}
            rows={2}
            placeholder={`Write a public reply to ${review.reviewer.displayName.split(' ')[0]}'s review...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(79,142,247,0.45)'; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.10)'; }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={generateReply}
              style={{
                fontSize: '0.75rem', fontWeight: 600, color: 'rgba(79,142,247,0.8)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0',
                marginRight: 'auto',
              }}
            >
              ✦ Write with AI
            </button>
            <button
              style={{ ...btnGhost, padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              onClick={() => setReplyText('')}
            >
              Discard
            </button>
            <button
              style={{ ...btnPrimary, padding: '0.3rem 0.875rem', opacity: posting || !replyText.trim() ? 0.45 : 1 }}
              onClick={postReply}
              disabled={posting || !replyText.trim()}
            >
              {posting ? 'Posting…' : 'Post Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

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

  const unreplied = reviews.filter((r) => !r.reviewReply);
  const replied   = reviews.filter((r) => !!r.reviewReply);

  const filteredReviews = filter === 'unreplied' ? unreplied
    : filter === 'replied' ? replied
    : reviews;

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all',       label: 'All',       count: reviews.length },
    { id: 'unreplied', label: 'Unreplied', count: unreplied.length },
    { id: 'replied',   label: 'Replied',   count: replied.length },
  ];

  return (
    <div className="flex flex-col gap-4">

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Reviews</h2>
        <button style={btnGhost}>Filter</button>
      </div>

      {/* Rating summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <span style={{ fontSize: '2.625rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>
          {displayAvg.toFixed(1)}
        </span>
        <div>
          <div style={{ fontSize: '1.25rem', color: '#fbbf24', letterSpacing: '0.06em' }}>
            {starStr(Math.round(displayAvg))}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.45)', marginTop: '0.125rem' }}>
            {displayTotal} reviews total
          </p>
        </div>
      </div>

      {/* Filter pills with counts */}
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '0.3125rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              background: filter === tab.id ? '#4f8ef7' : 'transparent',
              borderColor: filter === tab.id ? 'transparent' : 'rgba(255,255,255,0.12)',
              color: filter === tab.id ? 'white' : 'rgba(240,244,255,0.55)',
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Review cards */}
      <div className="flex flex-col gap-3.5">
        {filteredReviews.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '2.5rem' }}>
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
