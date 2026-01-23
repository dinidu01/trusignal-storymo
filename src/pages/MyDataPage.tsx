import { useState } from 'react';
import type { ReactNode } from 'react';

type MyDataPageProps = {
  navigate: (path: string) => void;
};

export function MyDataPage({ navigate }: MyDataPageProps): ReactNode {
  const [deletionRequestEmail, setDeletionRequestEmail] = useState('');
  const [deletionRequestSubmitted, setDeletionRequestSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
          >
            TruSignal
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-black/30 text-white rounded-lg hover:bg-black/40 transition-colors font-medium border border-purple-500/20"
          >
            Back
          </button>
        </div>
      </nav>

      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-white">Request account deletion</h1>
        <p className="text-gray-300 mt-3 max-w-3xl">
          If you would like to delete your TruSignal account and associated personal data, you can submit a request using the
          form below. We may contact you at this email address to verify your identity and confirm the deletion.
        </p>

        <div className="mt-12 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">How deletion works</h2>
            <div className="space-y-4">
              {[
                {
                  title: 'Submit your request',
                  description: 'Send us the email address you used with TruSignal so we can locate your account.',
                },
                {
                  title: 'We verify and confirm',
                  description:
                    'Our team reviews your request and may follow up by email to confirm ownership and any required details.',
                },
                {
                  title: 'We process deletion',
                  description:
                    'Once confirmed, we will delete or anonymize personal data in accordance with our Privacy Policy and notify you when this is complete.',
                },
              ].map((step, index) => (
                <div key={step.title} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">{step.title}</div>
                    <p className="text-gray-300 mt-2">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="text-white font-semibold text-lg">Email address</div>
            <p className="text-gray-300 text-sm mt-2">
              We will only use this email to process your deletion request and to communicate with you about its status.
            </p>

            {deletionRequestSubmitted ? (
              <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                <div className="text-emerald-200 font-semibold">Request received</div>
                <p className="text-emerald-100 mt-2">
                  If an account exists for <span className="font-semibold">{deletionRequestEmail}</span>, we’ll follow up to
                  confirm the request.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeletionRequestEmail('');
                    setDeletionRequestSubmitted(false);
                  }}
                  className="mt-4 px-4 py-2 bg-black/30 text-white rounded-lg hover:bg-black/40 transition-colors border border-white/10"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form
                className="mt-6 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!deletionRequestEmail.trim()) return;
                  setDeletionRequestSubmitted(true);
                }}
              >
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={deletionRequestEmail}
                  onChange={(e) => setDeletionRequestEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-black/30 border border-white/10 text-white placeholder-gray-400 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-amber-400 to-yellow-300 text-gray-900 rounded-xl hover:from-amber-300 hover:to-yellow-200 transition-colors text-lg font-bold"
                >
                  Submit deletion request
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 text-gray-400 text-sm">
          Prefer email? You can also contact us and request deletion from the email address associated with your account.
        </div>
      </section>

      <footer className="bg-black/40 border-t border-purple-500/20">
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
