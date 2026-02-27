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

const STARS: Record<string, string> = {
  ONE: '★☆☆☆☆', TWO: '★★☆☆☆', THREE: '★★★☆☆', FOUR: '★★★★☆', FIVE: '★★★★★',
};

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
};

export default function ReviewsTab({ ready }: { ready: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [posting, setPosting] = useState<Record<string, boolean>>({});
  const [posted, setPosted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!ready) return;
    fetch('/api/reviews', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setReviews(d.reviews || []);
        setAvg(d.averageRating ?? null);
        setTotal(d.totalReviewCount ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready]);

  const generateReply = async (review: Review) => {
    setGenerating((g) => ({ ...g, [review.reviewId]: true }));
    try {
      const res = await fetch('/api/reviews/generate-reply', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDrafts((d) => ({ ...d, [review.reviewId]: data.reply }));
    } catch (e: any) {
      setDrafts((d) => ({ ...d, [review.reviewId]: `Error: ${e.message}` }));
    } finally {
      setGenerating((g) => ({ ...g, [review.reviewId]: false }));
    }
  };

  const postReply = async (review: Review) => {
    const text = drafts[review.reviewId];
    if (!text) return;
    setPosting((p) => ({ ...p, [review.reviewId]: true }));
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewName: review.name, replyText: text }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setPosted((p) => ({ ...p, [review.reviewId]: true }));
      setReviews((prev) => prev.map((r) =>
        r.reviewId === review.reviewId ? { ...r, reviewReply: { comment: text, updateTime: new Date().toISOString() } } : r
      ));
    } catch (e: any) {
      alert(`Failed to post reply: ${e.message}`);
    } finally {
      setPosting((p) => ({ ...p, [review.reviewId]: false }));
    }
  };

  if (!ready || loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="rounded-xl px-5 py-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }}>{error}</div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      {avg !== null && (
        <div className="flex gap-4">
          <div className="rounded-2xl px-6 py-4 flex items-center gap-4" style={card}>
            <span className="text-4xl font-extrabold" style={{ color: 'var(--warning)' }}>{Number(avg).toFixed(1)}</span>
            <div>
              <div className="text-lg tracking-tight" style={{ color: 'var(--warning)' }}>{'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}</div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{total} reviews total</p>
            </div>
          </div>
          <div className="rounded-2xl px-5 py-4 flex items-center flex-1" style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)' }}>
            <p className="text-sm max-w-xs" style={{ color: 'rgba(240,244,255,0.75)' }}>Claude reads each review and writes a reply that matches the reviewer's tone — expert or casual, happy or unhappy.</p>
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <div className="rounded-2xl p-10 text-center text-sm" style={card}>
          <span style={{ color: 'var(--text-muted)' }}>No reviews found for this location.</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {reviews.map((review) => (
          <div key={review.reviewId} className="rounded-2xl p-5 flex flex-col gap-4" style={card}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {review.reviewer.profilePhotoUrl ? (
                  <img src={review.reviewer.profilePhotoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #7c5af7, #4f8ef7)' }}>
                    {review.reviewer.displayName?.[0] || '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{review.reviewer.displayName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(review.createTime).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="text-base font-bold" style={{ color: 'var(--warning)' }}>{STARS[review.starRating]}</span>
            </div>

            {review.comment && (
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.8)' }}>{review.comment}</p>
            )}

            {review.reviewReply && (
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Your reply</p>
                <p className="text-sm" style={{ color: 'rgba(240,244,255,0.8)' }}>{review.reviewReply.comment}</p>
              </div>
            )}

            {!review.reviewReply && !posted[review.reviewId] && (
              <div className="flex flex-col gap-3">
                {drafts[review.reviewId] ? (
                  <>
                    <textarea
                      className="w-full rounded-xl text-sm p-3 focus:outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      rows={3}
                      value={drafts[review.reviewId]}
                      onChange={(e) => setDrafts((d) => ({ ...d, [review.reviewId]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => generateReply(review)} disabled={generating[review.reviewId]}
                        className="text-xs" style={{ color: 'var(--accent)' }}>
                        Regenerate
                      </button>
                      <button onClick={() => postReply(review)} disabled={posting[review.reviewId]}
                        className="ml-auto text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ background: 'var(--accent)', color: '#fff' }}>
                        {posting[review.reviewId] ? 'Posting…' : 'Post Reply'}
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => generateReply(review)} disabled={generating[review.reviewId]}
                    className="self-start flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    {generating[review.reviewId] ? (
                      <><span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />Writing reply…</>
                    ) : '✨ Write AI Reply'}
                  </button>
                )}
              </div>
            )}

            {posted[review.reviewId] && (
              <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Reply posted to Google ✓</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
