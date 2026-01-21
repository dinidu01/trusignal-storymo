import { Lightbulb, Mail } from 'lucide-react';

type SetupEmailReceivingStepProps = {
  wantsEmailReceiving: boolean | null;
  setWantsEmailReceiving: (value: boolean) => void;
  receivingEmail: string;
  setReceivingEmail: (value: string) => void;
  setActiveStep: (step: 'landing' | 'domain' | 'ads' | 'email' | 'results') => void;
};

export function SetupEmailReceivingStep({
  wantsEmailReceiving,
  setWantsEmailReceiving,
  receivingEmail,
  setReceivingEmail,
  setActiveStep,
}: SetupEmailReceivingStepProps) {
  const canContinue =
    wantsEmailReceiving === false || (wantsEmailReceiving === true && Boolean(receivingEmail.trim()));

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-6 text-center">Setup Email Receiving</h1>

      {/* Rationale Panel */}
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-4 max-w-3xl mx-auto">
        <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-100 text-lg">
          Optional: so you can get email notifications when someone signs up on your landing page
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Email Notifications</h3>
              <p className="text-gray-400 text-sm">Get notified when someone signs up</p>
            </div>
          </div>

          <p className="text-gray-300 mb-4">Do you want to receive sign-ups by email?</p>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setWantsEmailReceiving(true)}
              className={`flex-1 px-6 py-4 rounded-lg border-2 font-semibold transition-all ${
                wantsEmailReceiving === true
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              Yes, notify me
            </button>
            <button
              onClick={() => setWantsEmailReceiving(false)}
              className={`flex-1 px-6 py-4 rounded-lg border-2 font-semibold transition-all ${
                wantsEmailReceiving === false
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              Skip for now
            </button>
          </div>

          {wantsEmailReceiving === true && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notification email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={receivingEmail}
                onChange={(e) => setReceivingEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <p className="text-gray-500 text-sm mt-2">
                We'll send sign-up notifications to this address.
              </p>
            </div>
          )}

          {wantsEmailReceiving === false && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
              <p className="text-indigo-300">✓ No problem — you can enable email notifications later.</p>
            </div>
          )}
        </div>

        {wantsEmailReceiving !== null && (
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
            <p className="text-indigo-200 text-lg mb-6">
              We'll start monitoring performance so you can see if your idea is getting real interest.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setActiveStep('ads')}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setActiveStep('results')}
                disabled={!canContinue}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
