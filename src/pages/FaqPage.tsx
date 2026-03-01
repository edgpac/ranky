import SubPageLayout from '../components/SubPageLayout';
import { useAppT } from '../contexts/LanguageContext';

export default function FaqPage() {
  const t = useAppT().faq;

  return (
    <SubPageLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.heading}</h1>
        <p className="text-sm text-slate-500 mb-10">{t.sub}</p>

        <section className="space-y-10">
          {t.faqs.map((faq, i) => (
            <div key={i}>
              <h2 className="text-base font-semibold text-slate-900 mb-2">{i + 1}. {faq.q}</h2>
              <p className="text-slate-700 leading-relaxed text-sm">{faq.a}</p>
            </div>
          ))}
        </section>

        <div className="mt-16 pt-8 border-t border-gray-100 text-sm text-slate-500">
          {t.contact}{' '}
          <a href="mailto:hayvista@gmail.com" className="text-blue-600 hover:underline">hayvista@gmail.com</a>
        </div>
      </div>
    </SubPageLayout>
  );
}
