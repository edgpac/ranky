import type { ReactNode } from 'react';
import { useAppT } from '../contexts/LanguageContext';

interface Props {
  children: ReactNode;
}

export default function SubPageLayout({ children }: Props) {
  const t = useAppT().subLayout;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-8 md:px-16 h-[76px] bg-white border-b border-gray-100 sticky top-0 z-50">
        <a href="/">
          <img src="/hayvista-logo.png" alt="HayVista" style={{ width: 80, height: 80, objectFit: 'contain' }} />
        </a>
        <a
          href="/signup"
          className="font-medium rounded-xl transition-all text-sm"
          style={{
            height: '2.25rem',
            paddingLeft: '1.1em',
            paddingRight: '1.1em',
            display: 'inline-flex',
            alignItems: 'center',
            background: '#4f8ef7',
            color: '#fff',
            border: 'none',
          }}
        >
          {t.navCta}
        </a>
      </nav>

      {/* ── Page content ── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="px-8 md:px-16 py-8 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/hayvista-logo.png" alt="HayVista" style={{ width: 56, height: 56, objectFit: 'contain' }} />
          <div className="flex flex-col items-center md:items-end gap-1">
            <span className="text-xs sm:text-sm text-center md:text-right text-gray-400">
              HayVista Inc. · Cabo San Lucas, BCS, Mexico ·{' '}
              <a href="mailto:hayvista@gmail.com" className="text-blue-500 hover:underline">hayvista@gmail.com</a>
            </span>
            <span className="text-xs text-center md:text-right text-gray-300">
              {t.copyright}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-xs text-gray-400">
          <a href="/privacy" className="hover:underline">{t.privacy}</a>
          <a href="/terms" className="hover:underline">{t.terms}</a>
          <a href="/faq" className="hover:underline">{t.faq}</a>
          <a href="/about" className="hover:underline">{t.about}</a>
        </div>
      </footer>

    </div>
  );
}
