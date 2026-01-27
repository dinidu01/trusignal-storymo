import type { ReactNode } from 'react';

type PrivacyPageProps = {
  navigate: (path: string) => void;
};

export function PrivacyPage({ navigate }: PrivacyPageProps): ReactNode {
  return (
    <div className="min-h-screen bg-black">
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
          >
            StoryMo Inc.
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium border border-gray-800"
          >
            Back
          </button>
        </div>
      </nav>

      <section className="max-w-[900px] mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: January 22, 2026</p>

        <div className="space-y-10 text-gray-300 text-lg leading-relaxed">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">1. What this policy covers</h2>
            <p>
              This Privacy Policy explains how StoryMo Inc. collects, uses, and shares information when you visit our website or use
              our services.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">2. Information you provide</h2>
            <p>We may collect information you choose to provide, such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact details (for example, your email address)</li>
              <li>Details about the idea you want to validate</li>
              <li>Information you submit through forms or onboarding steps</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">3. Information collected automatically</h2>
            <p>
              When you use the site, we may automatically collect basic usage information such as the pages you view, the
              device/browser you use, and approximate location derived from your IP address.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">4. Cookies and similar technologies</h2>
            <p>
              We may use cookies and similar technologies to keep the site working, remember preferences, and understand how the
              site is used.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">5. Advertising and third-party platforms</h2>
            <p>
              If you choose to run ads as part of a validation test, we may interact with third-party platforms (such as Meta
              products like Facebook and Instagram) to set up and measure advertising performance.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">6. How we use information</h2>
            <p>We use information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve the service</li>
              <li>Operate validation tests (landing pages, waitlists, and reporting)</li>
              <li>Communicate with you about your account or results</li>
              <li>Maintain security and prevent abuse</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">7. Sharing</h2>
            <p>
              We may share information with service providers who help us run the product (for example, hosting, analytics, or
              advertising platforms). We do not sell personal information.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">8. Data retention</h2>
            <p>
              We keep information for as long as needed to provide the service and comply with legal obligations. You can request
              deletion by contacting us.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">9. Changes</h2>
            <p>
              We may update this policy from time to time. If we make material changes, we will update the “Last updated” date
              above.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-gray-800">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-6 text-gray-400">
            <button type="button" onClick={() => navigate('/privacy')} className="hover:text-indigo-400 transition-colors">
              Privacy
            </button>
            <span className="text-gray-700">·</span>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
            <span className="text-gray-700">·</span>
            <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
