import SubPageLayout from '../components/SubPageLayout';

export default function FaqPage() {
  const faqs = [
    {
      q: "Why do I need a Google Business Profile if I'm already viral on social media?",
      a: "Going viral gets attention — but Google doesn't watch your Reels. When someone uploads a video or photo to Instagram or TikTok, Google sees random content on the internet. It doesn't know who made it, what service they offer, where they're located, or whether customers were happy. A Google Business Profile is how you tell Google: here's my name, here's what I do, here's where I am, here's what my customers think, and here's fresh proof that I'm still open and working. Without that structure, Google has no reason to recommend you — no matter how many followers you have.",
    },
    {
      q: "What is Google Business Profile and why does it matter?",
      a: "Google Business Profile (GBP) is the structured record Google uses to decide which local businesses to show in Search and Maps when someone nearby is looking for a service. It holds your hours, photos, services, reviews, and posts — all organized in a way Google can read and rank. Think of it as your business's permanent address on Google's internet, not just a post that floats past and disappears.",
    },
    {
      q: "What happens if I never post to my GBP?",
      a: "An inactive GBP signals to Google that your business might be closed, outdated, or not worth recommending. Google favors profiles that show recent activity — posts, new photos, fresh reviews, updated hours. When you go months without touching your profile, competitors who do post consistently start appearing above you, even if your work is better. Visibility on Google isn't something you earn once. It requires consistent upkeep.",
    },
    {
      q: "Does posting on social media help my Google ranking?",
      a: "Not directly. Social media posts live inside closed platforms — Instagram, Facebook, TikTok — and Google has very limited access to that content. Even if a post about your business goes viral, it doesn't update your GBP, doesn't add a keyword to your services list, and doesn't tell Google you're actively open for business this week. Social media builds your audience. GBP builds your discoverability on Google Search and Maps — two completely different places customers find you.",
    },
    {
      q: "How often should I post to my GBP?",
      a: "Google's own guidance recommends posting consistently, up to a few times per week. HayVista posts up to 4 times per week — which sits right at Google's recommended limit for healthy profiles. Posting more than that can look spammy and may work against you. The goal is a steady, professional rhythm: new content every week that keeps your profile active without flooding it.",
    },
    {
      q: "What kind of content does HayVista publish to my GBP?",
      a: "HayVista rotates through four post formats that Google supports: Updates (general business news or tips), Offers (promotions or seasonal deals), Events (anything date-specific at your business), and What's New posts (showcasing work, photos, or services). Each post uses real photos from your GBP and is written around the search terms people in your area are actually using — so every post is both relevant to Google and useful to the customer reading it.",
    },
    {
      q: "How does HayVista know what to write about my business?",
      a: "On day one, HayVista reads your entire Google Business Profile: your business name, category, services, description, photos, and location. It also analyzes what people near you are searching for in your category. From that, it builds a content strategy specific to your business — no generic filler, no posts that could belong to any other shop. Your photos are matched to relevant search queries so the content actually reflects the work you do.",
    },
    {
      q: "What about reviews — does HayVista help with those?",
      a: "Yes. HayVista drafts a reply for every incoming customer review. Whether it's a glowing 5-star or a frustrated 1-star, you get a suggested response that matches your tone — professional, friendly, or bilingual. Responding to reviews tells Google that you're engaged with your customers, which is a positive signal for your ranking. It also shows future customers that you care about the experience you deliver.",
    },
    {
      q: "Is HayVista allowed to post to my GBP? Is it Google-compliant?",
      a: "Yes. HayVista uses the official Google Business Profile API, which is the Google-approved way for software to manage GBP content on a business owner's behalf. We follow all Google API Services User Data Policy requirements, including Limited Use rules. Your data is accessed only to manage your profile — nothing else. You authorize HayVista through Google's own OAuth login, and you can revoke that access at any time from your Google Account settings.",
    },
    {
      q: "Can I cancel anytime? What happens to my GBP when I do?",
      a: "You can cancel at any time — no contracts, no cancellation fees, no lock-in. When you cancel, HayVista stops posting to your GBP. Everything that was already published stays on your profile permanently — those posts belong to your Google Business Profile, not to HayVista. Your profile doesn't get wiped. It just stops receiving new content until you decide to restart.",
    },
  ];

  return (
    <SubPageLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-sm text-slate-500 mb-10">Answers about Google Business Profile, local SEO, and how HayVista works.</p>

        <section className="space-y-10">
          {faqs.map((faq, i) => (
            <div key={i}>
              <h2 className="text-base font-semibold text-slate-900 mb-2">{i + 1}. {faq.q}</h2>
              <p className="text-slate-700 leading-relaxed text-sm">{faq.a}</p>
            </div>
          ))}
        </section>

        <div className="mt-16 pt-8 border-t border-gray-100 text-sm text-slate-500">
          Still have questions?{' '}
          <a href="mailto:hayvista@gmail.com" className="text-blue-600 hover:underline">hayvista@gmail.com</a>
        </div>
      </div>
    </SubPageLayout>
  );
}
