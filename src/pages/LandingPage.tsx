import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-20 h-[72px] bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand" />
          <span className="text-xl font-bold text-slate-900">Ranky</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-slate-500 text-sm font-medium hover:text-slate-800">Log in</button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-dark transition-colors"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-slate-900 px-40 py-24 flex flex-col items-center gap-7">
        <div className="flex items-center gap-2 bg-green-900/30 px-4 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-brand text-xs font-semibold tracking-widest">AUTOMATED GBP POSTING</span>
        </div>
        <h1 className="text-6xl font-extrabold text-slate-50 text-center leading-tight max-w-3xl">
          Your Google Business Profile posts itself.
        </h1>
        <p className="text-slate-400 text-xl text-center max-w-xl leading-relaxed">
          We use your real job photos and what locals are already searching for to write and post to your GBP every week. Automatically.
        </p>
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => navigate('/signup')}
            className="bg-brand text-white font-bold text-base px-9 py-4 rounded-xl hover:bg-brand-dark transition-colors"
          >
            Connect My Google Profile
          </button>
          <a href="#how" className="text-slate-300 font-medium text-base px-9 py-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            See How It Works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-50 px-40 py-20 flex flex-col items-center gap-14">
        <div className="text-center">
          <p className="text-brand text-xs font-bold tracking-widest mb-3">HOW IT WORKS</p>
          <h2 className="text-4xl font-extrabold text-slate-900">Three steps. Zero effort after setup.</h2>
        </div>
        <div className="grid grid-cols-3 gap-8 w-full">
          {[
            {
              n: '1',
              title: 'Connect your Google account',
              desc: 'One login with Google. We get read access to your photos and search data. You never share a password.',
            },
            {
              n: '2',
              title: 'We match photos to searches',
              desc: 'Claude reads your photos and your real local search data to find the best match — then writes a post that answers what people are already looking for.',
            },
            {
              n: '3',
              title: 'Posts go live automatically',
              desc: 'Your GBP gets fresh posts on your schedule — 1 to 4 times a week. You get a WhatsApp showing what went up.',
            },
          ].map((s) => (
            <div key={s.n} className="bg-white rounded-2xl p-8 flex flex-col gap-4 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-white font-bold text-base">{s.n}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-900 px-40 py-20 flex flex-col items-center gap-12">
        <div className="text-center">
          <p className="text-brand text-xs font-bold tracking-widest mb-3">PRICING</p>
          <h2 className="text-4xl font-extrabold text-slate-50">Simple pricing. No surprises.</h2>
        </div>
        <div className="grid grid-cols-3 gap-6 w-full">
          {[
            { name: 'Starter', price: '$79', freq: '1 post per week', highlight: false, priceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID },
            { name: 'Growth', price: '$149', freq: '2 posts per week', highlight: true, priceId: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID },
            { name: 'Pro', price: '$199', freq: 'Up to 4 posts per week', highlight: false, priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID },
          ].map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-9 flex flex-col gap-5 ${p.highlight ? 'bg-brand' : 'bg-slate-800'}`}
            >
              {p.highlight && (
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full w-fit">Most Popular</span>
              )}
              <p className={`text-sm font-semibold ${p.highlight ? 'text-green-100' : 'text-slate-400'}`}>{p.name}</p>
              <div className="flex items-end gap-1">
                <span className={`text-4xl font-extrabold ${p.highlight ? 'text-white' : 'text-slate-50'}`}>{p.price}</span>
                <span className={`text-base mb-1 ${p.highlight ? 'text-green-100' : 'text-slate-400'}`}>/mo</span>
              </div>
              <p className={`text-sm font-semibold ${p.highlight ? 'text-white' : 'text-brand'}`}>{p.freq}</p>
              <ul className={`text-sm space-y-2 ${p.highlight ? 'text-green-100' : 'text-slate-400'}`}>
                <li>✓ Photo + search matching</li>
                <li>✓ Auto-posting to GBP</li>
                <li>✓ Weekly WhatsApp update</li>
                <li>✓ Cancel anytime</li>
              </ul>
              <button
                onClick={() => navigate('/signup')}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                  p.highlight
                    ? 'bg-white text-brand hover:bg-green-50'
                    : 'bg-brand/20 text-brand hover:bg-brand/30'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-50 px-40 py-20 flex flex-col items-center gap-6">
        <h2 className="text-4xl font-extrabold text-slate-900 text-center max-w-2xl leading-tight">
          Start showing up where your customers are searching.
        </h2>
        <p className="text-slate-500 text-lg">Login with Google once. Posts go up every week.</p>
        <button
          onClick={() => navigate('/signup')}
          className="bg-brand text-white font-bold text-base px-10 py-4 rounded-xl hover:bg-brand-dark transition-colors mt-2"
        >
          Connect My Google Profile — Free
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 px-20 h-[72px] flex items-center justify-between">
        <span className="text-white font-bold text-lg">Ranky</span>
        <span className="text-slate-500 text-sm">© 2026 Ranky. Automated GBP posting for local businesses.</span>
      </footer>

    </div>
  );
}
