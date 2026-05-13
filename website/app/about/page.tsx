import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/posts';
import { SITE_NAME, TWITTER_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'AI Tools Hub publishes independent, hands-on reviews of AI software. Learn about our founder, review process, and editorial standards.',
};

// ─── Replace these with your real details ────────────────────────────────────
const FOUNDER = {
  name:       'Alex Morgan',            // ← your name
  title:      'Founder & Lead Reviewer',
  bio:        `I spent 6 years as a digital marketing consultant recommending software to clients. 
               In 2024 I got tired of AI review sites that ranked tools based on who paid the most, 
               not which tool actually worked best. So I built the resource I always wanted — 
               one where every tool gets tested with a real account, benchmarked against alternatives, 
               and reviewed honestly even when the affiliate commission is zero.`,
  linkedin:   'https://linkedin.com/in/yourprofile',   // ← your LinkedIn URL
  twitter:    TWITTER_URL,
  avatarText: 'AM',   // initials shown in avatar until you add a real photo
  avatarGrad: 'from-blue-600 to-violet-600',
};
// ─────────────────────────────────────────────────────────────────────────────

const PROCESS = [
  {
    step: '01',
    title: 'Sign up with a real account',
    desc:  'Every reviewed tool is tested on a real paid or free plan — no reviews from screenshots, press kits, or vendor demos.',
  },
  {
    step: '02',
    title: 'Benchmark against alternatives',
    desc:  'We run the same tasks across competing tools so comparisons reflect actual performance differences, not marketing copy.',
  },
  {
    step: '03',
    title: 'Document pricing honestly',
    desc:  "We note all tiers, credit limits, and hidden costs. If a \"free\" plan is barely functional, we say so.",
  },
  {
    step: '04',
    title: 'Update when tools change',
    desc:  'AI products iterate fast. We revisit reviews whenever major pricing, feature, or quality changes happen.',
  },
];

const VALUES = [
  {
    icon: '🎯',
    title: 'Independence first',
    desc: 'No tool gets a better rating because of higher affiliate commissions. Rankings are based entirely on tested merit.',
  },
  {
    icon: '💬',
    title: 'Honest about trade-offs',
    desc: "Every tool has weaknesses. We'd rather tell you where something falls short than oversell it and have you waste money.",
  },
  {
    icon: '🔄',
    title: 'Always current',
    desc: 'The AI landscape changes weekly. We prioritise accuracy over volume — reviews are updated when products change.',
  },
  {
    icon: '🔍',
    title: 'Transparent about affiliates',
    desc: 'Affiliate relationships are disclosed on every page. Commissions have never and will never influence editorial decisions.',
  },
];

export default function AboutPage() {
  const posts = getAllPosts();
  const reviewCount   = posts.length;
  const categoryCount = [...new Set(posts.map((p) => p.category))].length;

  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-sky-900 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sky-300 text-sm font-medium uppercase tracking-wide mb-4">
            About {SITE_NAME}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
            Independent Reviews.<br />No Hype. No Pay-to-Play.
          </h1>
          <p className="text-sky-100 text-lg leading-relaxed max-w-2xl mx-auto">
            We test AI software so professionals can make confident purchasing decisions.
            Every review is hands-on, every rating is earned, and every affiliate link is disclosed.
          </p>
        </div>
      </section>

      {/* ── Live stats (derived from actual content) ── */}
      <section className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: `${reviewCount}`,    label: 'In-depth reviews' },
            { value: `${categoryCount}`,  label: 'Tool categories' },
            { value: 'Weekly',            label: 'Content updates' },
            { value: '100%',              label: 'Independent editorial' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-sky-600 mb-1" style={{ fontFamily: 'Sora,sans-serif' }}>
                {s.value}
              </p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Founder ── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'Sora,sans-serif' }}>
          Who's behind this
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar — replace the initials div with an <Image> once you have a photo */}
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${FOUNDER.avatarGrad} flex items-center justify-center text-white text-2xl font-bold shrink-0`}
            style={{ fontFamily: 'Sora,sans-serif' }}
          >
            {FOUNDER.avatarText}
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-gray-900 mb-0.5" style={{ fontFamily: 'Sora,sans-serif' }}>
              {FOUNDER.name}
            </p>
            <p className="text-sky-600 text-sm font-medium mb-3">{FOUNDER.title}</p>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line mb-4">
              {FOUNDER.bio}
            </p>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Sora,sans-serif' }}>
            Why we built this
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            In 2024, the AI tools market exploded. Hundreds of new products launched every month,
            each claiming to be the best at everything. Most review sites were either outdated,
            shallow, or quietly ranking tools based on affiliate payouts rather than quality.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            We built {SITE_NAME} to be the resource we wished existed — one that actually tests
            tools under real working conditions, compares them fairly against alternatives, and
            updates coverage when products change.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our audience is professionals — freelancers, marketers, developers, and small business
            owners — making real spending decisions. We take that responsibility seriously.
          </p>
        </div>
      </section>

      {/* ── Review process ── */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center" style={{ fontFamily: 'Sora,sans-serif' }}>
          Our review process
        </h2>
        <p className="text-gray-500 text-center mb-12">Every review follows the same four-step process.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {PROCESS.map((p) => (
            <div key={p.step} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <span className="text-sky-600 font-bold text-sm mb-3 block">{p.step}</span>
              <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-12 text-center" style={{ fontFamily: 'Sora,sans-serif' }}>
            Our editorial values
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="text-2xl flex-shrink-0">{v.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Affiliate transparency ── */}
      <section className="bg-amber-50 border-y border-amber-200 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-3">About our affiliate relationships</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Some links on this site are affiliate links — when you click and purchase, we earn a
            commission at no extra cost to you. This is how we fund the site and keep all content free.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Affiliate relationships never influence our ratings, rankings, or editorial decisions.
            Tools are reviewed on merit alone. Read our full{' '}
            <a href="/affiliate-disclosure" className="text-sky-600 underline font-medium">
              affiliate disclosure policy
            </a>.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Sora,sans-serif' }}>
          Have a question or suggestion?
        </h2>
        <p className="text-gray-500 mb-6">
          We read every message. Reach out and we'll get back to you within 2 business days.
        </p>
        <a
          href="/contact"
          className="inline-block bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
        >
          Get in touch
        </a>
      </section>

    </div>
  );
}