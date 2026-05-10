import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for AI Tools Hub — how we collect, use, and protect your data.',
};

const SECTIONS = [
  {
    title: 'Information we collect',
    content: [
      {
        subtitle: 'Information you provide',
        text: 'When you subscribe to our newsletter, we collect your email address. We do not require you to create an account or provide any other personal information to use the site.',
      },
      {
        subtitle: 'Information collected automatically',
        text: 'When you visit our site, we automatically collect certain information through Google Analytics, including pages visited, time spent on pages, referring website, browser type, and general geographic location (country/city level). We do not collect precise location data.',
      },
      {
        subtitle: 'Cookies',
        text: 'We use cookies for Google Analytics (traffic analysis) and Google AdSense (advertising). You can disable cookies in your browser settings or use a browser extension to block tracking.',
      },
    ],
  },
  {
    title: 'How we use your information',
    content: [
      {
        subtitle: 'Newsletter',
        text: 'Your email address is used solely to send our weekly newsletter. We never sell, rent, or share your email with third parties for their marketing purposes.',
      },
      {
        subtitle: 'Analytics',
        text: 'We use aggregate analytics data to understand which content is most useful to our readers and to improve the site. We cannot identify individual users from this data.',
      },
      {
        subtitle: 'Advertising',
        text: 'We use Google AdSense to display advertisements. Google may use cookies to serve ads based on your prior visits to our site or other sites. You can opt out via Google\'s ad settings.',
      },
    ],
  },
  {
    title: 'Third-party links and affiliate programs',
    content: [
      {
        subtitle: 'Affiliate links',
        text: 'Our site contains affiliate links to products and services. When you click these links and make a purchase, we may earn a commission. We are not responsible for the privacy practices of linked sites.',
      },
      {
        subtitle: 'Third-party sites',
        text: 'This privacy policy applies only to AI Tools Hub. If you follow a link to another website, that site\'s own privacy policy applies. We encourage you to review privacy policies before providing personal information to any site.',
      },
    ],
  },
  {
    title: 'Data retention and security',
    content: [
      {
        subtitle: 'Retention',
        text: 'Newsletter email addresses are retained until you unsubscribe. Analytics data is retained according to Google Analytics\' default 26-month retention period.',
      },
      {
        subtitle: 'Security',
        text: 'We use HTTPS encryption on all pages. Newsletter email addresses are stored by our email provider (which uses industry-standard security practices). We do not store payment information — all transactions go through third-party providers.',
      },
    ],
  },
  {
    title: 'Your rights',
    content: [
      {
        subtitle: 'Access and correction',
        text: 'You may request a copy of any personal data we hold about you, or ask us to correct inaccurate data, by emailing hello@ai-tools-hub.com.',
      },
      {
        subtitle: 'Deletion',
        text: 'You may request deletion of your personal data at any time. For newsletter subscribers, you can also simply click the unsubscribe link in any email we send.',
      },
      {
        subtitle: 'GDPR and CCPA',
        text: 'If you are located in the European Union or California, you have additional rights under GDPR and CCPA respectively. Contact us at hello@ai-tools-hub.com to exercise these rights.',
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-white">

      {/* Header */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-gray-400">
            Last updated: January 1, 2025 &nbsp;·&nbsp; Effective: January 1, 2025
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6">
          <p className="text-gray-700 leading-relaxed">
            <strong>Plain English summary:</strong> We collect your email if you subscribe to our
            newsletter, and we use Google Analytics and AdSense which set cookies. We never sell
            your data. You can unsubscribe or request data deletion at any time by emailing{' '}
            <a href="mailto:hello@ai-tools-hub.com" className="text-sky-600 underline">
              hello@ai-tools-hub.com
            </a>.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        {SECTIONS.map((section, i) => (
          <div key={section.title} className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="bg-sky-100 text-sky-700 text-sm font-bold px-3 py-1 rounded-full">
                {String(i + 1).padStart(2, '0')}
              </span>
              {section.title}
            </h2>
            <div className="space-y-5">
              {section.content.map((item) => (
                <div key={item.subtitle} className="border-l-2 border-gray-200 pl-5">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.subtitle}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Contact */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-2">Questions about this policy?</h2>
          <p className="text-gray-600 text-sm mb-3">
            Contact us at{' '}
            <a href="mailto:hello@ai-tools-hub.com" className="text-sky-600 underline">
              hello@ai-tools-hub.com
            </a>{' '}
            and we will respond within 5 business days.
          </p>
          <p className="text-gray-400 text-xs">
            AI Tools Hub reserves the right to update this policy. Material changes will be
            announced via our newsletter and reflected in the "Last updated" date above.
          </p>
        </div>
      </section>

    </div>
  );
}
