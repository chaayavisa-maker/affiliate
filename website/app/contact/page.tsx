import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the AI Tools Hub team for partnerships, corrections, or general enquiries.',
};

const TOPICS = [
  {
    icon: '🤝',
    title: 'Partnerships & sponsorships',
    desc: 'Interested in a sponsored review, newsletter mention, or long-term partnership? We offer transparent, clearly labelled sponsorship placements.',
    email: 'partners@ai-tools-hub.com',
    cta: 'Email partnerships',
    bg: 'bg-sky-50 border-sky-100',
  },
  {
    icon: '🔧',
    title: 'Tool submission',
    desc: 'Want your AI tool considered for a review? Send us a brief description, pricing details, and what makes it different. We evaluate all submissions on merit.',
    email: 'reviews@ai-tools-hub.com',
    cta: 'Submit your tool',
    bg: 'bg-purple-50 border-purple-100',
  },
  {
    icon: '✏️',
    title: 'Corrections & updates',
    desc: 'Spotted outdated pricing or incorrect information in one of our reviews? We appreciate the heads-up and update articles quickly.',
    email: 'hello@ai-tools-hub.com',
    cta: 'Report an issue',
    bg: 'bg-amber-50 border-amber-100',
  },
  {
    icon: '💬',
    title: 'General enquiries',
    desc: 'Anything else — questions about our methodology, media requests, or just want to say hello.',
    email: 'hello@ai-tools-hub.com',
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
    a: 'Short quotes with attribution and a link back are fine. Full republication requires written permission — email us.',
  },
];

export default function ContactPage() {
  return (
    <div className="bg-white">

      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-gray-300 text-lg">
            We read every message and reply within 2 business days.
            Choose the right topic below for the fastest response.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {TOPICS.map((t) => (
            <div key={t.title} className={`border rounded-2xl p-6 ${t.bg}`}>
              <div className="text-2xl mb-3">{t.icon}</div>
              <h2 className="font-bold text-gray-900 mb-2">{t.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{t.desc}</p>
              <a
                href={`mailto:${t.email}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-sky-300 hover:text-sky-600 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                {t.cta} →
              </a>
              <p className="text-gray-400 text-xs mt-2">{t.email}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Response time banner */}
      <section className="bg-sky-50 border-y border-sky-100 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="text-4xl">⏱️</div>
          <div>
            <h2 className="font-bold text-gray-900 mb-1">Our response commitment</h2>
            <p className="text-gray-600 text-sm">
              We reply to every message within 2 business days. Partnership and tool submission
              enquiries may take up to 5 business days as we review them carefully.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Common questions</h2>
        <div className="space-y-6">
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-gray-200 pb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{f.q}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
