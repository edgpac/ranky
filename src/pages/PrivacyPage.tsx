import SubPageLayout from '../components/SubPageLayout';
import { useAppT } from '../contexts/LanguageContext';

export default function PrivacyPage() {
  const t = useAppT().privacy;

  return (
    <SubPageLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.heading}</h1>
        <p className="text-sm text-slate-500 mb-10">{t.lastUpdated}</p>

        <section className="space-y-8 text-slate-700 leading-relaxed">
          {t.sections.map((sec) => (
            <div key={sec.title}>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{sec.title}</h2>

              {'body' in sec && sec.body && (
                <p>{sec.body}</p>
              )}

              {'intro' in sec && sec.intro && (
                <p>{sec.intro}</p>
              )}

              {'bullets' in sec && sec.bullets && (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {sec.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              )}

              {'footer' in sec && sec.footer && (
                <p className="mt-2">{sec.footer}</p>
              )}

              {/* Section 4 special links */}
              {'revoke' in sec && sec.revoke && (
                <p className="mb-3 mt-3">
                  {sec.revoke}{' '}
                  <a
                    href="https://myaccount.google.com/permissions"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    myaccount.google.com/permissions
                  </a>
                  {sec.revokeSuffix}
                </p>
              )}

              {'policy' in sec && sec.policy && (
                <p>
                  {sec.policy}{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {sec.policyLink}
                  </a>
                  {sec.policySuffix}
                </p>
              )}

              {/* Contact section */}
              {(sec.title.startsWith('7') || sec.title.startsWith('8')) && (
                <p>
                  {sec.body}{' '}
                  <a href="mailto:hayvista@gmail.com" className="text-blue-600 hover:underline">
                    hayvista@gmail.com
                  </a>
                  .
                </p>
              )}
            </div>
          ))}
        </section>
      </div>
    </SubPageLayout>
  );
}
