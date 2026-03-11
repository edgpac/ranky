import { useState } from 'react';

interface Props {
  text: string;
  label?: string;
  size?: 'sm' | 'md';
}

export default function CopyButton({ text, label = 'Copy', size = 'md' }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const px = size === 'sm' ? '0.5rem 0.875rem' : '0.5rem 1.125rem';
  const fs = size === 'sm' ? '0.75rem' : '0.8125rem';

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: px,
        fontSize: fs,
        fontWeight: 600,
        borderRadius: '0.5rem',
        border: copied ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(79,142,247,0.35)',
        background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(79,142,247,0.12)',
        color: copied ? '#34d399' : '#4f8ef7',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          {label}
        </>
      )}
    </button>
  );
}
