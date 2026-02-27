import { useState } from 'react';

interface Post {
  id: number;
  photo_url: string;
  post_text: string;
  search_query: string;
  posted_at: string;
  status: 'posted' | 'pending' | 'approved';
}

interface Props {
  posts: Post[];
  onPostGenerated: (post: Post) => void;
  onPostUpdated: (post: Post) => void;
}

const STATUS_STYLE: Record<string, string> = {
  posted:   'bg-green-100 text-green-700',
  approved: 'bg-blue-100 text-blue-700',
  pending:  'bg-yellow-100 text-yellow-700',
};

const DATA_SOURCES = [
  { icon: '📸', title: 'Your GBP photos',           desc: 'Real photos from your Google Business Profile — no stock images.' },
  { icon: '🔍', title: 'What locals search',         desc: 'GSC shows the exact queries people type. Posts match those searches.' },
  { icon: '✍️', title: 'Your tone & business type',  desc: 'Claude writes in your chosen voice, tailored to your industry.' },
  { icon: '📅', title: 'Auto-schedule',               desc: 'Posts go live every week without you touching anything.' },
];

function PostCard({ post, onUpdated }: { post: Post; onUpdated: (p: Post) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.post_text);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const save = async () => {
    if (draft.trim() === post.post_text) { setEditing(false); return; }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.post);
      setEditing(false);
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(post.post_text);
    setEditing(false);
    setSaveError('');
  };

  return (
    <div className="bg-white rounded-2xl p-6 flex gap-5 shadow-sm">
      {post.photo_url && (
        <img src={post.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
      )}
      <div className="flex flex-col gap-2 flex-1">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[post.status] || STATUS_STYLE.pending}`}>
              {post.status}
            </span>
            <span className="text-xs text-slate-400">{new Date(post.posted_at).toLocaleDateString()}</span>
            {post.search_query && (
              <span className="text-xs text-slate-400">· matched: <span className="text-brand">{post.search_query}</span></span>
            )}
          </div>
          {!editing && (
            <button
              onClick={() => { setDraft(post.post_text); setEditing(true); }}
              className="shrink-0 text-xs text-slate-400 hover:text-slate-700 border border-gray-200 hover:border-gray-300 px-3 py-1 rounded-lg transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {/* Text / editor */}
        {editing ? (
          <>
            <textarea
              className="w-full rounded-xl border border-brand/40 bg-gray-50 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none leading-relaxed"
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 mr-auto">{draft.length} chars</span>
              <button onClick={cancel} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !draft.trim()}
                className="text-xs font-semibold bg-brand text-white px-4 py-1.5 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed">{post.post_text}</p>
        )}
      </div>
    </div>
  );
}

export default function PostsTab({ posts, onPostGenerated, onPostUpdated }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [newPost, setNewPost] = useState<Post | null>(null);

  const generate = async () => {
    setGenerating(true);
    setError('');
    setNewPost(null);
    try {
      const res = await fetch('/api/generate-post', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setNewPost(data.post);
      onPostGenerated(data.post);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top action */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Posts are generated from your GBP photos + top local search queries.</p>
        <button
          onClick={generate}
          disabled={generating}
          className="shrink-0 bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
          ) : '+ Generate Post Now'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-3">{error}</div>
      )}

      {/* New post highlight */}
      {newPost && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex gap-5">
          {newPost.photo_url && <img src={newPost.photo_url} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Just generated</span>
              {newPost.search_query && <span className="text-xs text-slate-400">Matched: <span className="text-brand">{newPost.search_query}</span></span>}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{newPost.post_text}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && !newPost && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <p className="text-slate-500 text-sm mb-6">No posts yet. Here's what Ranky does automatically every week:</p>
          <div className="grid grid-cols-2 gap-5">
            {DATA_SOURCES.map((s) => (
              <div key={s.title} className="flex gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={generate}
              disabled={generating}
              className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating…' : 'Generate my first post'}
            </button>
          </div>
        </div>
      )}

      {/* Post history */}
      {posts.length > 0 && (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onUpdated={onPostUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
