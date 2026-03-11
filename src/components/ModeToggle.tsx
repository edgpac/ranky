import { useState } from 'react';

interface Props {
  isOwner?: boolean;
  automatedUnlocked?: boolean;
}

export default function ModeToggle({ automatedUnlocked }: Props) {
  const [showCard, setShowCard] = useState(false);

  if (automatedUnlocked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.375rem 0.75rem', borderRadius: '2rem',
        background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
        fontSize: '0.75rem', fontWeight: 600, color: '#34d399',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0, boxShadow: '0 0 6px #34d399' }} />
        Automated Mode
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        {/* Active: Manual */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.375rem 0.75rem', borderRadius: '2rem',
          background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)',
          fontSize: '0.75rem', fontWeight: 600, color: '#4f8ef7',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f8ef7', flexShrink: 0, boxShadow: '0 0 6px #4f8ef7' }} />
          Manual Mode
        </div>
        {/* Locked: Automated */}
        <button
          onClick={() => setShowCard((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.75rem', borderRadius: '2rem',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.75rem', fontWeight: 600, color: 'rgba(232,238,255,0.35)',
            cursor: 'pointer',
          }}
        >
          🔒 Automated
        </button>
      </div>

      {/* Status popover */}
      {showCard && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowCard(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0, zIndex: 50,
            width: 280, background: 'rgba(15,23,42,0.97)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.875rem',
            padding: '1.125rem', boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(20px)',
          }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(232,238,255,0.9)', marginBottom: '0.25rem' }}>
              Automated Mode
            </p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(232,238,255,0.45)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Posts, replies, and Q&A answers will publish automatically on schedule — no copy-paste needed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <CheckItem done={false} label="GBP API partner access approved" />
              <CheckItem done={false} label="5+ reviews on your Google listing" />
              <CheckItem done={false} label="10+ photos on your listing" />
              <CheckItem done={true} label="AI Memory built" />
              <CheckItem done={true} label="Subscription active" />
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(79,142,247,0.07)', borderRadius: '0.5rem', border: '1px solid rgba(79,142,247,0.15)' }}>
              <p style={{ fontSize: '0.72rem', color: 'rgba(232,238,255,0.55)', lineHeight: 1.5 }}>
                While you wait: use <strong style={{ color: '#4f8ef7' }}>Manual Mode</strong> to generate AI content and copy it into GBP. Everything Claude learns carries over when automation turns on.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
        border: done ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.1)',
        fontSize: 9, color: done ? '#34d399' : 'rgba(232,238,255,0.25)',
      }}>
        {done ? '✓' : '·'}
      </span>
      <span style={{ fontSize: '0.75rem', color: done ? 'rgba(232,238,255,0.75)' : 'rgba(232,238,255,0.4)' }}>
        {label}
      </span>
    </div>
  );
}
