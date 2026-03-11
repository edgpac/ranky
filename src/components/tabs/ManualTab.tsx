import { useState } from 'react';
import WritePostTool from './manual/WritePostTool';
import ReviewReplyTool from './manual/ReviewReplyTool';
import QAAnswerTool from './manual/QAAnswerTool';
import ImageProcessorTool from './manual/ImageProcessorTool';
import ContentLibrary from './manual/ContentLibrary';

type SubTab = 'post' | 'review' | 'qa' | 'images' | 'library';

const SUB_TABS: { id: SubTab; label: string; emoji: string; desc: string }[] = [
  { id: 'post', label: 'Write Post', emoji: '✍️', desc: 'Create GBP posts with AI' },
  { id: 'review', label: 'Reply to Review', emoji: '⭐', desc: 'Craft tone-matched replies' },
  { id: 'qa', label: 'Answer Q&A', emoji: '❓', desc: 'SEO-optimized answers' },
  { id: 'images', label: 'Process Images', emoji: '🖼️', desc: 'EXIF + GPS + SEO filenames' },
  { id: 'library', label: 'Library', emoji: '📚', desc: 'All your generated content' },
];

const HEADINGS: Record<SubTab, { title: string; subtitle: string }> = {
  post: {
    title: 'Write a GBP Post',
    subtitle: 'Upload a photo, answer 3 quick questions, and Claude writes a polished post you can copy into GBP.',
  },
  review: {
    title: 'Reply to a Review',
    subtitle: 'Paste the review, select the star rating — Claude mirrors the customer\'s tone and adds local SEO naturally.',
  },
  qa: {
    title: 'Answer a Customer Question',
    subtitle: 'Paste the Q&A question and choose a style. SEO Mode weaves in your city and service keywords.',
  },
  images: {
    title: 'Process Images for GBP',
    subtitle: 'Upload up to 10 photos. Claude Vision captions each one. EXIF, GPS, and SEO filenames are injected automatically.',
  },
  library: {
    title: 'Content Library',
    subtitle: 'Every post, reply, and answer Claude has written for you. Mark as posted to update your AI Memory.',
  },
};

interface Props {
  isGuest?: boolean;
}

export default function ManualTab({ isGuest }: Props) {
  const [activeTab, setActiveTab] = useState<SubTab>('post');
  const h = HEADINGS[activeTab];

  return (
    <div>
      {/* Guest banner */}
      {isGuest && (
        <div style={{
          marginBottom: '1.5rem', padding: '1rem 1.25rem',
          background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)',
          borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(232,238,255,0.9)', marginBottom: '0.25rem' }}>
              Sign in to use these AI tools
            </p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(232,238,255,0.5)' }}>
              Generate posts, replies, answers, and optimized images — all free while we await GBP API approval.
            </p>
          </div>
          <a href="/signup" style={{
            padding: '0.5rem 1rem', background: '#4f8ef7', color: '#fff',
            borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Sign in free
          </a>
        </div>
      )}

      {/* Sub-nav */}
      <div style={{
        display: 'flex', gap: '0.375rem', marginBottom: '1.5rem',
        overflowX: 'auto', paddingBottom: '2px',
        scrollbarWidth: 'none',
      }}>
        {SUB_TABS.map(({ id, label, emoji }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.15s',
              border: activeTab === id ? '1px solid #4f8ef7' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === id ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.03)',
              color: activeTab === id ? '#4f8ef7' : 'rgba(232,238,255,0.55)',
            }}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Heading */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'rgba(232,238,255,0.95)', marginBottom: '0.375rem' }}>
          {h.title}
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.45)', lineHeight: 1.5 }}>{h.subtitle}</p>
      </div>

      {/* Tool content — disabled for guests */}
      <div style={{ opacity: isGuest ? 0.5 : 1, pointerEvents: isGuest ? 'none' : 'auto' }}>
        {activeTab === 'post' && <WritePostTool />}
        {activeTab === 'review' && <ReviewReplyTool />}
        {activeTab === 'qa' && <QAAnswerTool />}
        {activeTab === 'images' && <ImageProcessorTool />}
        {activeTab === 'library' && <ContentLibrary />}
      </div>
    </div>
  );
}
