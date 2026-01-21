import { Lightbulb } from 'lucide-react';

type SetupDomainStepProps = {
  domainChoice: 'custom' | 'trusignal' | null;
  setDomainChoice: (value: 'custom' | 'trusignal') => void;
  customDomain: string;
  setCustomDomain: (value: string) => void;
  setActiveStep: (step: 'landing' | 'domain' | 'ads' | 'email' | 'results') => void;
};

export function SetupDomainStep({
  domainChoice,
  setDomainChoice,
  customDomain,
  setCustomDomain,
  setActiveStep,
}: SetupDomainStepProps) {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-6 text-center">Setup Domain</h1>

      {/* Rationale Panel */}
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-4 max-w-3xl mx-auto">
        <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-100 text-lg">So visitors see a real, trusted URL when they land on your page</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* TruSignal Domain Option */}
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
          <button
            onClick={() => setDomainChoice('trusignal')}
            className={`w-full p-8 rounded-lg border-2 text-left transition-all ${
              domainChoice === 'trusignal' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-4 mb-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  domainChoice === 'trusignal' ? 'border-indigo-500' : 'border-gray-600'
                }`}
              >
                {domainChoice === 'trusignal' && <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>}
              </div>
              <h3 className="text-2xl font-bold text-white">Use TruSignal Domain</h3>
            </div>
            <p className="text-gray-400 text-lg ml-10">
              Your landing page will be hosted at{' '}
              <span className="text-indigo-400 font-mono">app.trusignal.tech/your-idea</span>
            </p>
            <p className="text-gray-500 text-sm ml-10 mt-2">Quick setup • No DNS configuration needed</p>
          </button>
        </div>

        {/* OR Divider */}
        <div className="relative py-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-800"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-6 py-2 bg-black text-gray-400 text-2xl font-bold">OR</span>
          </div>
        </div>

        {/* Custom Domain Option */}
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
          <button
            onClick={() => setDomainChoice('custom')}
            className={`w-full p-8 rounded-lg border-2 text-left transition-all ${
              domainChoice === 'custom' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-4 mb-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  domainChoice === 'custom' ? 'border-indigo-500' : 'border-gray-600'
                }`}
              >
                {domainChoice === 'custom' && <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>}
              </div>
              <h3 className="text-2xl font-bold text-white">Use Custom Domain</h3>
            </div>
            <p className="text-gray-400 text-lg ml-10">Connect your own domain name for a branded experience</p>
            <p className="text-gray-500 text-sm ml-10 mt-2">Requires DNS setup • More professional appearance</p>
          </button>

          {domainChoice === 'custom' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Enter your domain</label>
              <input
                type="text"
                placeholder="yourdomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <p className="text-gray-500 text-sm mt-2">We'll provide DNS instructions after you continue.</p>
            </div>
          )}
        </div>

        {domainChoice && (
          <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
            <p className="text-indigo-200 text-lg mb-6">
              We will launch your landing page on this domain and ensure it's live and ready to receive visitors.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setActiveStep('ads')}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
              >
                Continue to Meta Ads Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
