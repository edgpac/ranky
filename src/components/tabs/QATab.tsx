import { useEffect, useState } from 'react';
import { useCountdown } from './PostsTab';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QAItem {
  id: number;
  question_id: string;
  question_text: string;
  author_name: string;
  create_time: string;
  answer_text: string | null;
  status: 'unanswered' | 'draft' | 'approved' | 'posted';
  auto_approve_at: string | null;
}

interface Props {
  ready: boolean;
}

// ─── Mock data (guest preview) ────────────────────────────────────────────────

const MOCK_QA: QAItem[] = [
  {
    id: -1,
    question_id: 'q1',
    question_text: 'Do you offer free estimates for plumbing repairs?',
    author_name: 'Carlos M.',
    create_time: new Date(Date.now() - 2 * 3600000).toISOString(),
    answer_text: "Yes! We offer free estimates on all plumbing repairs in Cabo San Lucas and the surrounding area. Just give us a call or send a message and we'll schedule a visit at your convenience.",
    status: 'draft',
    auto_approve_at: new Date(Date.now() + 22 * 3600000).toISOString(),
  },
  {
    id: -2,
    question_id: 'q2',
    question_text: 'Are you available on weekends for emergency work?',
    author_name: 'Jennifer R.',
    create_time: new Date(Date.now() - 1 * 86400000).toISOString(),
    answer_text: 'Absolutely — we handle emergency calls 7 days a week. For urgent issues like leaks or electrical problems, call us directly and we\'ll do our best to respond the same day.',
    status: 'posted',
    auto_approve_at: null,
  },
  {
    id: -3,
    question_id: 'q3',
    question_text: 'What areas do you serve outside of Cabo San Lucas?',
    author_name: 'Robert K.',
    create_time: new Date(Date.now() - 3 * 86400000).toISOString(),
    answer_text: null,
    status: 'unanswered',
    auto_approve_at: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
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
  fontFamily: 'inherit',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(240,244,255,0.7)',
  borderRadius: '0.5rem',
  padding: '0.3rem 0.75rem',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnApprove: React.CSSProperties = {
  background: 'rgba(52,211,153,0.12)',
  border: '1px solid rgba(52,211,153,0.30)',
  color: '#34d399',
  borderRadius: '0.5rem',
  padding: '0.3rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnDanger: React.CSSProperties = {
  ...btnGhost,
  border: '1px solid rgba(248,113,113,0.18)',
  color: 'rgba(248,113,113,0.65)',
};

// ─── Automation banner ────────────────────────────────────────────────────────

function AutomationBanner() {
  return (
    <div style={{
      background: 'rgba(79,142,247,0.04)',
      border: '1px solid rgba(79,142,247,0.14)',
      borderRadius: '0.875rem',
      padding: '1rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginTop: '0.1rem' }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#4f8ef7', display: 'inline-block',
          boxShadow: '0 0 6px rgba(79,142,247,0.6)',
        }} />
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4f8ef7', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          Active
        </span>
      </div>
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(240,244,255,0.92)', margin: 0 }}>
          Q&amp;A Automation
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1.5, margin: '0.2rem 0 0' }}>
          Every 6 hours — scans for new customer questions, drafts AI answers, auto-approves after 24h
        </p>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{
        fontSize: '0.6875rem', fontWeight: 700,
        padding: '0.1rem 0.4rem', borderRadius: '9999px',
        background: 'rgba(255,255,255,0.07)',
        color: 'rgba(240,244,255,0.4)',
      }}>
        {count}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

// ─── Q&A card ─────────────────────────────────────────────────────────────────

function QACard({
  item,
  isMock,
  onUpdated,
  onDeleted,
}: {
  item: QAItem;
  isMock: boolean;
  onUpdated: (q: QAItem) => void;
  onDeleted: (id: number) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.answer_text || '');
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState('');

  const countdown = useCountdown(item.status === 'draft' ? item.auto_approve_at : null);
  const isDraft = item.status === 'draft' || item.status === 'approved';
  const isPosted = item.status === 'posted';
  const isUnanswered = !item.answer_text && item.status === 'unanswered';

  const generateAnswer = async () => {
    if (isMock) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/qa/generate-answer', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onUpdated(data.question);
      setDraft(data.question.answer_text || '');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally { setGenerating(false); }
  };

  const saveEdit = async () => {
    if (isMock) { onUpdated({ ...item, answer_text: draft, status: 'draft' }); setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/qa/${item.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_text: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.question);
      setEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const postAnswer = async () => {
    if (isMock) { onUpdated({ ...item, status: 'posted', auto_approve_at: null }); return; }
    setPosting(true);
    try {
      const res = await fetch('/api/qa/answer', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.question);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Post failed');
    } finally { setPosting(false); }
  };

  const discard = async () => {
    if (isMock) { onDeleted(item.id); return; }
    setDiscarding(true);
    try {
      await fetch(`/api/qa/${item.id}`, { method: 'DELETE', credentials: 'include' });
    } catch { /* optimistic */ } finally { onDeleted(item.id); }
  };

  return (
    <div style={card}>
      {/* Question */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: '2.125rem', height: '2.125rem', borderRadius: '9999px', flexShrink: 0,
          background: isPosted
            ? 'linear-gradient(135deg, #4f8ef7, #34d399)'
            : isDraft
            ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
            : 'linear-gradient(135deg, #a78bfa, #7c5af7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.875rem',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(240,244,255,0.88)' }}>
              {item.author_name || 'Customer'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(240,244,255,0.30)' }}>
              {relativeTime(item.create_time)}
            </span>
            {isPosted && (
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700,
                padding: '0.1rem 0.45rem', borderRadius: '9999px',
                background: 'rgba(52,211,153,0.10)',
                border: '1px solid rgba(52,211,153,0.25)',
                color: '#34d399',
              }}>
                ✓ Answered
              </span>
            )}
            {isDraft && countdown && (
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700,
                padding: '0.15rem 0.5rem', borderRadius: '9999px',
                background: 'rgba(251,191,36,0.10)',
                border: '1px solid rgba(251,191,36,0.25)',
                color: '#fbbf24',
              }}>
                ⏱ auto-posts in {countdown}
              </span>
            )}
            {isUnanswered && (
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700,
                padding: '0.1rem 0.45rem', borderRadius: '9999px',
                background: 'rgba(167,139,250,0.10)',
                border: '1px solid rgba(167,139,250,0.25)',
                color: '#a78bfa',
              }}>
                Unanswered
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'rgba(240,244,255,0.82)', margin: '0.35rem 0 0', lineHeight: 1.55 }}>
            {item.question_text}
          </p>
        </div>
      </div>

      {/* Answer area */}
      {!isUnanswered && item.answer_text && (
        <div style={{
          margin: '0 0 0.75rem 2.75rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '0.5rem',
          padding: '0.625rem 0.75rem',
        }}>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'rgba(240,244,255,0.80)',
                fontSize: '0.8125rem',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.65)', lineHeight: 1.6, margin: 0 }}>
              {item.answer_text}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#f87171', margin: '0 0 0.5rem 2.75rem' }}>{error}</p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '2.75rem', flexWrap: 'wrap' }}>
        {isUnanswered && (
          <button
            style={{ ...btnPrimary, background: generating ? 'rgba(79,142,247,0.2)' : '#4f8ef7', opacity: generating ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            onClick={generateAnswer}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="animate-spin" style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white' }} />
                Generating…
              </>
            ) : 'Generate Answer'}
          </button>
        )}

        {isDraft && !editing && (
          <>
            <button style={btnApprove} onClick={postAnswer} disabled={posting}>
              {posting ? 'Posting…' : 'Post Answer →'}
            </button>
            <button style={btnGhost} onClick={() => { setDraft(item.answer_text || ''); setEditing(true); }}>
              Edit
            </button>
            <button style={btnGhost} onClick={generateAnswer} disabled={generating} title="Regenerate">
              {generating ? '…' : '↺'}
            </button>
            <button style={btnDanger} onClick={discard} disabled={discarding}>
              Discard
            </button>
          </>
        )}

        {isDraft && editing && (
          <>
            <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button style={btnGhost} onClick={() => { setEditing(false); setDraft(item.answer_text || ''); }}>
              Cancel
            </button>
          </>
        )}

        {isPosted && (
          <span style={{ fontSize: '0.75rem', color: 'rgba(52,211,153,0.7)' }}>
            Reply posted ✓
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QATab({ ready }: Props) {
  const [items, setItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isMock = !ready;

  useEffect(() => {
    if (!ready) {
      setItems(MOCK_QA);
      return;
    }
    setLoading(true);
    fetch('/api/qa', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.questions) setItems(d.questions);
        else setError(d.error || 'Failed to load');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [ready]);

  const unanswered = items.filter((q) => !q.answer_text || q.status === 'unanswered');
  const pending = items.filter((q) => q.answer_text && q.status === 'draft');
  const answered = items.filter((q) => q.status === 'posted' || q.status === 'approved');

  const handleUpdated = (updated: QAItem) => {
    setItems((prev) => prev.map((q) => q.id === updated.id ? updated : q));
  };

  const handleDeleted = (id: number) => {
    setItems((prev) => prev.filter((q) => q.id !== id));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
        <div className="animate-spin" style={{
          width: '1.5rem', height: '1.5rem', borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#4f8ef7',
        }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)', margin: 0 }}>
          Q&amp;A
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.35)', margin: '0.2rem 0 0' }}>
          AI-drafted answers for customer questions on your Google Business Profile.
        </p>
      </div>

      <AutomationBanner />

      {error && (
        <p style={{ fontSize: '0.8125rem', color: '#f87171' }}>{error}</p>
      )}

      {/* Unanswered */}
      {unanswered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <SectionLabel label="Unanswered" count={unanswered.length} color="#a78bfa" />
          {unanswered.map((q) => (
            <QACard key={q.id} item={q} isMock={isMock} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      {/* Drafts pending review */}
      {pending.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <SectionLabel label="Pending Review" count={pending.length} color="#fbbf24" />
          {pending.map((q) => (
            <QACard key={q.id} item={q} isMock={isMock} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      {/* Answered */}
      {answered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <SectionLabel label="Answered" count={answered.length} color="#34d399" />
          {answered.map((q) => (
            <QACard key={q.id} item={q} isMock={isMock} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      {items.length === 0 && !loading && (
        <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.25)', textAlign: 'center', padding: '2rem 0' }}>
          No customer questions yet — check back after the next automation scan.
        </p>
      )}
    </div>
  );
}
