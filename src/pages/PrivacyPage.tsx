import SubPageLayout from '../components/SubPageLayout';

export default function PrivacyPage() {
  return (
    <SubPageLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
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
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Google Business Profile API Data</h2>
            <p className="mb-3">
              HayVista accesses Google Business Profile (GBP) data solely on behalf of authenticated
              users who have explicitly granted permission via Google OAuth 2.0. This includes business
              information, photos, posts, reviews, and performance insights belonging to the user's own
              GBP listing.
            </p>
            <p className="mb-2">This data is used exclusively to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 mb-3">
              <li>Generate and publish posts to the user's own Google Business Profile</li>
              <li>Display profile information within the HayVista dashboard</li>
              <li>Match the user's real photos to local search queries for content creation</li>
              <li>Read reviews and performance insights to inform post strategy</li>
            </ul>
            <p className="mb-3">
              We do not sell, share, transfer, or use GBP data for any purpose beyond delivering
              the HayVista service to the authenticated user. We do not access any GBP data beyond
              what is necessary to perform the actions explicitly requested by the user.
            </p>
            <p className="mb-3">
              Users can revoke HayVista's access to their Google account at any time by visiting{' '}
              <a
                href="https://myaccount.google.com/permissions"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                myaccount.google.com/permissions
              </a>
              . Upon revocation, all associated GBP data will be deleted from our systems within 30 days.
            </p>
            <p>
              HayVista's use of data obtained from Google APIs adheres strictly to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Access is scoped only to the authenticated
              user's own Business Profile. No GBP data is transferred to third parties except as
              strictly necessary to operate the service (e.g., Anthropic Claude for AI post generation,
              under strict data processing terms).
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
              <a href="mailto:hayvista@gmail.com" className="text-blue-600 hover:underline">
                hayvista@gmail.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </SubPageLayout>
  );
}
