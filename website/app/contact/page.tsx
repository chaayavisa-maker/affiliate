import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Get in touch with the ${SITE_NAME} team for partnerships, corrections, or general enquiries.`,
};

// ─── Replace with your real email addresses ───────────────────────────────────
// Use a real domain once you've set one up (e.g. hello@aitoolsreviewed.com).
// Gmail/ProtonMail addresses are fine while you're starting out — just make
// sure they're checked regularly so PartnerStack reviewers get a reply.
const EMAIL_GENERAL    = 'hello@ai-tools-hub.com';       // ← update this
const EMAIL_PARTNERS   = 'partners@ai-tools-hub.com';    // ← update this
const EMAIL_REVIEWS    = 'reviews@ai-tools-hub.com';     // ← update this
// ─────────────────────────────────────────────────────────────────────────────

const TOPICS = [
  {
    icon: '🤝',
    title: 'Partnerships & sponsorships',
    desc: 'Interested in a sponsored review, newsletter mention, or long-term partnership? We offer transparent, clearly labelled sponsorship placements.',
    email: EMAIL_PARTNERS,
    cta: 'Email partnerships',
    bg: 'bg-sky-50 border-sky-100',
  },
  {
    icon: '🔧',
    title: 'Tool submission',
    desc: 'Want your AI tool considered for a review? Send a brief description, pricing details, and what makes it different. We evaluate all submissions on merit.',
    email: EMAIL_REVIEWS,
    cta: 'Submit your tool',
    bg: 'bg-purple-50 border-purple-100',
  },
  {
    icon: '✏️',
    title: 'Corrections & updates',
    desc: 'Spotted outdated pricing or incorrect information? We appreciate the heads-up and update articles quickly.',
    email: EMAIL_GENERAL,
    cta: 'Report an issue',
    bg: 'bg-amber-50 border-amber-100',
  },
  {
    icon: '💬',
    title: 'General enquiries',
    desc: 'Questions about our methodology, media requests, or anything else — we read everything.',
    email: EMAIL_GENERAL,
    cta: 'Send a message',
    bg: 'bg-gray-50 border-gray-200',
  },
];

const FAQS = [
  {
    q: 'Do you accept payment for reviews?',
    a: 'No. Editorial reviews are never paid for. We do offer clearly labelled sponsored content placements — see our partnerships email above.',
  },
  {
    q: 'How long does a review take?',
    a: 'We test tools for a minimum of one week before publishing. Complex tools may take longer. We do not publish rushed reviews.',
  },
  {
    q: 'Can I republish or quote your reviews?',
    a: 'Short quotes with attribution and a backlink are fine. Full republication requires written permission — email us.',
  },
  {
    q: 'How quickly do you reply?',
    a: 'General and correction emails are answered within 2 business days. Partnership and tool submission enquiries may take up to 5 business days.',
  },
];

export default function ContactPage() {
  return (
    <div className="bg-white">

      {/* ── Header ── */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Sora,sans-serif' }}>
            Contact Us
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            We read every message and reply within 2 business days.
          </p>
          {/* Direct email — visible to PartnerStack reviewers scanning the page */}
          <a
            href={`mailto:${EMAIL_GENERAL}`}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {EMAIL_GENERAL}
          </a>
        </div>
      </section>

      {/* ── Contact cards ── */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {TOPICS.map((t) => (
            <div key={t.title} className={`border rounded-2xl p-6 ${t.bg}`}>
              <div className="text-2xl mb-3">{t.icon}</div>
              <h2 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>
                {t.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{t.desc}</p>
              <a
                href={`mailto:${t.email}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-sky-300 hover:text-sky-600 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                {t.cta} →
              </a>
              <p className="text-gray-400 text-xs mt-2 font-mono">{t.email}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Response time ── */}
      <section className="bg-sky-50 border-y border-sky-100 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="text-4xl shrink-0">⏱️</div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 mb-1">Our response commitment</h2>
            <p className="text-gray-600 text-sm">
              General and correction emails: <strong>within 2 business days</strong>.
              Partnership and tool submission enquiries: <strong>within 5 business days</strong>.
            </p>
          </div>
          {/* Direct email repeated for clarity */}
          <a
            href={`mailto:${EMAIL_GENERAL}`}
            className="shrink-0 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Email us →
          </a>
        </div>
      </section>

      {/* ── About the site ── */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-3" style={{ fontFamily: 'Sora,sans-serif' }}>
            About {SITE_NAME}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            {SITE_NAME} is an independent publication covering AI software tools. We publish
            hands-on reviews, benchmarks, and comparisons to help professionals make confident
            purchasing decisions.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            We are not affiliated with, sponsored by, or employed by any of the AI companies
            we review. Editorial ratings are based entirely on tested performance.{' '}
            <a href="/about" className="text-sky-600 underline">Learn more about us →</a>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'Sora,sans-serif' }}>
          Common questions
        </h2>
        <div className="space-y-0 divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
          {FAQS.map((f) => (
            <div key={f.q} className="px-6 py-5 bg-white">
              <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{f.q}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
