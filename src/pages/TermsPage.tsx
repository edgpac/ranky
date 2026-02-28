export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="flex items-center px-8 md:px-16 h-[68px] bg-white border-b border-gray-100">
        <a href="/">
          <img src="/hayvista-logo.png" alt="HayVista" className="h-[56px] w-[56px] object-contain" />
        </a>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: February 2026</p>

        <section className="space-y-8 text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Acceptance</h2>
            <p>
              By using HayVista, you agree to these Terms of Service. If you do not agree, do not
              use the platform.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Description of Service</h2>
            <p>
              HayVista is a platform that connects to your Google Business Profile via OAuth to help
              you manage business information, posts, and profile data. You must have legitimate
              owner or manager access to any Google Business Profile you connect.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Your Responsibilities</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You may only connect Business Profiles you own or are authorized to manage</li>
              <li>You agree not to use the service for unlawful purposes</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Google Services</h2>
            <p>
              HayVista integrates with Google APIs. Your use of Google services through HayVista is
              also subject to{' '}
              <a
                href="https://policies.google.com/terms"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google's Terms of Service
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Limitation of Liability</h2>
            <p>
              HayVista is provided "as is" without warranties of any kind. We are not liable for
              any indirect or consequential damages arising from use of the service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Continued use of the service after changes
              constitutes acceptance of the updated terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibent text-slate-900 mb-2">7. Contact</h2>
            <p>
              Questions about these terms? Contact us at{' '}
              <a href="mailto:hayvista@gmail.com" className="text-blue-600 hover:underline">
                hayvista@gmail.com
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
