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
const STAR_COLOR: Record<string, string> = {
  ONE: 'text-red-500', TWO: 'text-orange-400', THREE: 'text-yellow-400',
  FOUR: 'text-green-500', FIVE: 'text-green-600',
};

export default function ReviewsTab({ ready }: { ready: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // per-review state
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
        method: 'POST',
        credentials: 'include',
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
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewName: review.name, replyText: text }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setPosted((p) => ({ ...p, [review.reviewId]: true }));
      setReviews((prev) =>
        prev.map((r) =>
          r.reviewId === review.reviewId
            ? { ...r, reviewReply: { comment: text, updateTime: new Date().toISOString() } }
            : r
        )
      );
    } catch (e: any) {
      alert(`Failed to post reply: ${e.message}`);
    } finally {
      setPosting((p) => ({ ...p, [review.reviewId]: false }));
    }
  };

  if (!ready) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-9 h-9 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Pulling your business data from Google</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to your Business Profile — this only takes a moment on first load.</p>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-4">{error}</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      {avg !== null && (
        <div className="flex gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 px-7 py-5 flex items-center gap-4">
            <span className="text-4xl font-extrabold text-slate-900">{Number(avg).toFixed(1)}</span>
            <div>
              <div className="text-yellow-400 text-lg tracking-tight">{'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}</div>
              <p className="text-xs text-slate-400 mt-0.5">{total} reviews total</p>
            </div>
          </div>
          <div className="bg-brand/5 border border-brand/20 rounded-2xl px-6 py-4 flex items-center">
            <p className="text-sm text-slate-600 max-w-xs">Claude reads each review and writes a reply that matches the reviewer's tone — expert or casual, happy or unhappy.</p>
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400 text-sm">No reviews found for this location.</div>
      )}

      {/* Review cards */}
      <div className="flex flex-col gap-4">
        {reviews.map((review) => (
          <div key={review.reviewId} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {review.reviewer.profilePhotoUrl ? (
                  <img src={review.reviewer.profilePhotoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold">
                    {review.reviewer.displayName?.[0] || '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800">{review.reviewer.displayName}</p>
                  <p className="text-xs text-slate-400">{new Date(review.createTime).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-base font-bold ${STAR_COLOR[review.starRating]}`}>{STARS[review.starRating]}</span>
            </div>

            {/* Review text */}
            {review.comment && <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>}

            {/* Existing reply */}
            {review.reviewReply && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">Your reply</p>
                <p className="text-sm text-slate-700">{review.reviewReply.comment}</p>
              </div>
            )}

            {/* AI reply controls */}
            {!review.reviewReply && !posted[review.reviewId] && (
              <div className="flex flex-col gap-3">
                {drafts[review.reviewId] ? (
                  <>
                    <textarea
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                      rows={3}
                      value={drafts[review.reviewId]}
                      onChange={(e) => setDrafts((d) => ({ ...d, [review.reviewId]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateReply(review)}
                        disabled={generating[review.reviewId]}
                        className="text-xs text-brand hover:underline"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={() => postReply(review)}
                        disabled={posting[review.reviewId]}
                        className="ml-auto bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
                      >
                        {posting[review.reviewId] ? 'Posting…' : 'Post Reply'}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => generateReply(review)}
                    disabled={generating[review.reviewId]}
                    className="self-start flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generating[review.reviewId] ? (
                      <><span className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />Writing reply…</>
                    ) : '✨ Write AI Reply'}
                  </button>
                )}
              </div>
            )}

            {posted[review.reviewId] && (
              <p className="text-xs text-green-600 font-semibold">Reply posted to Google ✓</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
