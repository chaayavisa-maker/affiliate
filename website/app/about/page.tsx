import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'AI Tools Hub publishes independent, hands-on reviews of AI software. Learn about our review process, team, and editorial standards.',
};

const STATS = [
  { value: '200+', label: 'Tools reviewed' },
  { value: '50+', label: 'Categories covered' },
  { value: 'Weekly', label: 'Content updates' },
  { value: '100%', label: 'Independent editorial' },
];

const PROCESS = [
  {
    step: '01',
    title: 'We sign up and test',
    desc: 'Every tool we review is tested with a real paid or free account — no reviewing from screenshots or press releases.',
  },
  {
    step: '02',
    title: 'We benchmark against alternatives',
    desc: 'We run the same tasks across competing tools so our comparisons reflect real performance differences, not marketing claims.',
  },
  {
    step: '03',
    title: 'We check pricing honestly',
    desc: 'We document all pricing tiers, hidden costs, and limits. If a "free" plan is barely usable, we say so.',
  },
  {
    step: '04',
    title: 'We update when things change',
    desc: 'AI tools update constantly. We revisit reviews when major changes happen — pricing, features, or quality shifts.',
  },
];

const VALUES = [
  {
    icon: '🎯',
    title: 'Independence first',
    desc: "No tool gets a better rating because they advertise with us or offer us higher commissions. Our rankings are based entirely on merit.",
  },
  {
    icon: '💬',
    title: 'Honest about limitations',
    desc: "Every tool has weaknesses. We'd rather tell you where a tool falls short than oversell it and have you waste money.",
  },
  {
    icon: '🔄',
    title: 'Always current',
    desc: 'The AI landscape changes weekly. We prioritize keeping reviews accurate over publishing volume.',
  },
  {
    icon: '🔍',
    title: 'Transparent about affiliates',
    desc: 'We clearly disclose affiliate relationships on every page. Commissions never influence editorial decisions.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-900 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sky-300 text-sm font-medium uppercase tracking-wide mb-4">About AI Tools Hub</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Independent Reviews.<br />No Hype. No Pay-to-Play.
          </h1>
          <p className="text-sky-100 text-lg leading-relaxed max-w-2xl mx-auto">
            We test AI software so professionals can make confident purchasing decisions.
            Every review is hands-on, every rating is earned, and every affiliate link is disclosed.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-sky-600 mb-1">{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Why we built this</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          In 2024, the AI tools market exploded. Hundreds of new products launched every month,
          each claiming to be the best at everything. Most review sites were either outdated,
          shallow, or quietly ranking tools based on affiliate payouts rather than quality.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          We built AI Tools Hub to be the resource we wished existed — one that actually tests
          tools under real working conditions, compares them fairly against alternatives, and
          updates coverage when products change.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Our audience is professionals — freelancers, marketers, developers, and small business
          owners — who are making real spending decisions. We take that responsibility seriously.
        </p>
      </section>

      {/* Review process */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Our review process</h2>
          <p className="text-gray-500 text-center mb-12">Every review follows the same four-step process.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {PROCESS.map((p) => (
              <div key={p.step} className="bg-white rounded-2xl border border-gray-200 p-6">
                <span className="text-sky-600 font-bold text-sm mb-3 block">{p.step}</span>
                <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-12 text-center">Our editorial values</h2>
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
      </section>

      {/* Affiliate transparency */}
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

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Have a question or suggestion?</h2>
        <p className="text-gray-500 mb-6">We read every message. Reach out and we will get back to you within 2 business days.</p>
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
