import SubPageLayout from '../components/SubPageLayout';
import { useAppT } from '../contexts/LanguageContext';

export default function TermsPage() {
  const t = useAppT().terms;

  return (
    <SubPageLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.heading}</h1>
        <p className="text-sm text-slate-500 mb-10">{t.lastUpdated}</p>

        <section className="space-y-8 text-slate-700 leading-relaxed">
          {t.sections.map((sec) => (
            <div key={sec.title}>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{sec.title}</h2>

              {'bullets' in sec && sec.bullets ? (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {sec.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              ) : 'bodyLinkText' in sec && sec.bodyLinkText ? (
                <p>
                  {sec.body}{' '}
                  <a
                    href={sec.bodyLinkHref}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {sec.bodyLinkText}
                  </a>
                  {sec.bodySuffix}
                </p>
              ) : sec.title.startsWith('7') ? (
                <p>
                  {sec.body}{' '}
                  <a href="mailto:hayvista@gmail.com" className="text-blue-600 hover:underline">
                    hayvista@gmail.com
                  </a>
                  .
                </p>
              ) : (
                <p>{sec.body}</p>
              )}
            </div>
          ))}
        </section>
      </div>
    </SubPageLayout>
  );
}
