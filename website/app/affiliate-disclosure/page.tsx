import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description: 'Our affiliate disclosure policy as required by the FTC.',
};

export default function AffiliatePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Affiliate Disclosure</h1>
      <div className="prose">
        <p>AI Tools Hub participates in affiliate marketing programs. This means we may earn a commission when you click on certain links on our site and make a purchase — at no extra cost to you.</p>
        <h2>What this means for you</h2>
        <p>Affiliate links are clearly marked on our site. Our editorial decisions and ratings are never influenced by affiliate relationships. We only recommend tools we have genuinely tested and believe provide value.</p>
        <h2>Programs we participate in</h2>
        <ul>
          <li>ShareASale</li>
          <li>Impact.com</li>
          <li>PartnerStack</li>
          <li>Direct affiliate programs with individual software companies</li>
        </ul>
        <h2>FTC Compliance</h2>
        <p>In accordance with the FTC's guidelines on endorsements and testimonials, we disclose our material connections to products we review. This page satisfies our disclosure obligations.</p>
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  );
}
