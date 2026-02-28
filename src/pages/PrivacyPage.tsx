export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="flex items-center px-20 h-[72px] bg-white border-b border-gray-100">
        <a href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand" />
          <span className="text-xl font-bold text-slate-900">HayVista</span>
        </a>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: February 2026</p>

        <section className="space-y-8 text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Overview</h2>
            <p>
              HayVista is a SaaS platform that allows business owners to connect and manage their
              Google Business Profile. This policy explains what data we collect, how we use it,
              and your rights regarding that data.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Data We Collect</h2>
            <p>When you sign in with Google, we receive:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Your Google account email address and display name</li>
              <li>An OAuth access token to interact with your Google Business Profile on your behalf</li>
              <li>Business location data from your connected Google Business Profile</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. How We Use Your Data</h2>
            <p>Your data is used exclusively to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Authenticate you and maintain your session</li>
              <li>Connect to your Google Business Profile on your behalf</li>
              <li>Display and manage your business profile information within the platform</li>
            </ul>
            <p className="mt-2">We do not sell, share, or expose your data to third parties.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Google API Data</h2>
            <p>
              HayVista's use of data obtained from Google APIs adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Access is read/write only for the
              authenticated user's own Business Profile. No data is transferred to third parties
              except as necessary to operate the service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Data Retention</h2>
            <p>
              We store your account information and OAuth tokens in a secure database for as long
              as your account is active. You may request deletion at any time by contacting us.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the data we hold about you</li>
              <li>Request deletion of your account and associated data</li>
              <li>Revoke Google OAuth access at any time via your Google Account settings</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Contact</h2>
            <p>
              For privacy questions or data deletion requests, contact us at{' '}
              <a href="mailto:support@hayvista.com" className="text-blue-600 hover:underline">
                support@hayvista.com
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
