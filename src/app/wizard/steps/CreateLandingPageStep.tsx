import { CheckCircle2, Eye, Lightbulb, Loader2, Rocket, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type CreateLandingPageStepProps = {
  landingSubStep: number;
  setLandingSubStep: (step: number) => void;
  ideaDescription: string;
  setIdeaDescription: (value: string) => void;
  targetAudience: string;
  setTargetAudience: (value: string) => void;
  problemSolved: string;
  setProblemSolved: (value: string) => void;
  selectedTemplate: string | null;
  setSelectedTemplate: (value: string) => void;
  domainChoice: 'custom' | 'trusignal' | null;
  setDomainChoice: (value: 'custom' | 'trusignal') => void;
  customDomain: string;
  setCustomDomain: (value: string) => void;
  setActiveStep: (step: 'landing' | 'domain' | 'ads' | 'email' | 'results') => void;
};

export function CreateLandingPageStep({
  landingSubStep,
  setLandingSubStep,
  ideaDescription,
  setIdeaDescription,
  targetAudience,
  setTargetAudience,
  problemSolved,
  setProblemSolved,
  selectedTemplate,
  setSelectedTemplate,
  domainChoice,
  setDomainChoice,
  customDomain,
  setCustomDomain,
  setActiveStep,
}: CreateLandingPageStepProps) {
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [customDomainMode, setCustomDomainMode] = useState<'have' | 'buy' | null>(null);
  const [selectedDomainToBuy, setSelectedDomainToBuy] = useState<string | null>(null);
  const [deployStepIndex, setDeployStepIndex] = useState(0);
  const [isResearchingIdea, setIsResearchingIdea] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  const ideaSlug =
    ideaDescription
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .slice(0, 18) || 'youridea';

  const domainPurchaseOptions = [
    { domain: `${ideaSlug}.com`, price: 11.99 },
    { domain: `${ideaSlug}.co`, price: 8.99 },
    { domain: `${ideaSlug}.io`, price: 29.99 },
    { domain: `${ideaSlug}.net`, price: 9.99 },
    { domain: `${ideaSlug}.org`, price: 10.99 },
    { domain: `${ideaSlug}app.com`, price: 12.99 },
    { domain: `get${ideaSlug}.com`, price: 14.99 },
    { domain: `try${ideaSlug}.com`, price: 13.99 },
    { domain: `${ideaSlug}hq.com`, price: 9.49 },
    { domain: `${ideaSlug}.xyz`, price: 1.99 },
  ];

  const cheapestPrice = Math.min(...domainPurchaseOptions.map((o) => o.price));

  const selectedDomain =
    domainChoice === 'trusignal'
      ? `app.trusignal.tech/${ideaSlug}`
      : domainChoice === 'custom'
        ? customDomainMode === 'have'
          ? customDomain.trim()
          : selectedDomainToBuy ?? ''
        : '';

  const canDeployPage =
    domainChoice === 'trusignal' ||
    (domainChoice === 'custom' &&
      ((customDomainMode === 'have' && customDomain.trim().length > 0) ||
        (customDomainMode === 'buy' && !!selectedDomainToBuy)));

  const deploySteps = [
    { title: 'Provisioning hosting', detail: 'Creating a secure place to host your page' },
    { title: 'Applying your template', detail: 'Building the page layout and sections' },
    { title: 'Connecting domain', detail: 'Pointing your domain to your landing page' },
    { title: 'Final checks', detail: 'Ensuring everything is live and ready' },
  ];

  const deploymentComplete = deployStepIndex >= deploySteps.length;

  useEffect(() => {
    if (landingSubStep !== 4) return;

    setDeployStepIndex(0);

    const timers = deploySteps.map((_, idx) =>
      window.setTimeout(() => setDeployStepIndex(idx + 1), 900 * (idx + 1)),
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [landingSubStep]);

  useEffect(() => {
    const stored = localStorage.getItem('trusignal.ideaInputs');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        ideaDescription?: string;
        targetAudience?: string;
        problemSolved?: string;
      };

      if (!ideaDescription && parsed.ideaDescription) {
        setIdeaDescription(parsed.ideaDescription);
      }

      if (!targetAudience && parsed.targetAudience) {
        setTargetAudience(parsed.targetAudience);
      }

      if (!problemSolved && parsed.problemSolved) {
        setProblemSolved(parsed.problemSolved);
      }
    } catch (_error) {
      // Ignore stored data errors.
    }
  }, [ideaDescription, targetAudience, problemSolved, setIdeaDescription, setProblemSolved, setTargetAudience]);

  useEffect(() => {
    const payload = {
      ideaDescription,
      targetAudience,
      problemSolved,
    };

    localStorage.setItem('trusignal.ideaInputs', JSON.stringify(payload));
  }, [ideaDescription, targetAudience, problemSolved]);

  const templateOptions = [
    { id: 'sample-a', name: 'Sample A', desc: 'Clean, modern layout' },
    { id: 'sample-b', name: 'Sample B', desc: 'Bold, high-conversion layout' },
    { id: 'sample-c', name: 'Sample C', desc: 'Professional, trust-building layout' },
  ];

  const handleBuildPage = async () => {
    if (!ideaDescription || !targetAudience || !problemSolved) return;

    setIsResearchingIdea(true);
    setResearchError(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-idea', {
        body: {
          idea: ideaDescription,
          audience: targetAudience,
          problem: problemSolved,
          segment_count: 3,
        },
      });

      if (error) {
        throw error;
      }

      localStorage.setItem('trusignal.analyzeIdea', JSON.stringify(data));
      setLandingSubStep(2);
    } catch (_error) {
      setResearchError('Unable to analyze your idea right now. Please try again.');
    } finally {
      setIsResearchingIdea(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-6 text-center">Create Landing Page</h1>

      {/* Rationale Panel */}
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-4">
        <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-100 text-lg">So you can track real clicks and measure genuine interest</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                landingSubStep === step
                  ? 'bg-indigo-600 text-white'
                  : landingSubStep > step
                    ? 'bg-indigo-600/30 text-indigo-400'
                    : 'bg-gray-800 text-gray-500'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div className={`w-16 h-1 ${landingSubStep > step ? 'bg-indigo-600/30' : 'bg-gray-800'}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Sub-step 1: Describe Idea */}
      {landingSubStep === 1 && (
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Tell us about your idea</h2>
          <p className="text-gray-400 mb-8">Help us understand what you want to validate.</p>
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">What's your idea? *</label>
                <textarea
                  placeholder="e.g., A meal prep service for busy professionals that delivers healthy, pre-portioned ingredients..."
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors h-32"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Who is it for? *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Working professionals ages 25-40 who value health but lack time..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-3 pr-36 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Placeholder for future AI-assisted audience discovery.
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md bg-gray-700/60 text-white text-sm font-medium hover:bg-gray-700 border border-gray-600 transition-colors"
                  >
                    Find Audience
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">What problem does it solve? *</label>
                <textarea
                  placeholder="e.g., Removes the guesswork and time spent on meal planning and grocery shopping..."
                  value={problemSolved}
                  onChange={(e) => setProblemSolved(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors h-24"
                />
              </div>
            </div>
          </div>

          {/* Promise Panel */}
          <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
            <p className="text-indigo-200 text-lg mb-6">
              We will create several landing page samples for you to choose from, tailored to your idea and target audience.
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleBuildPage}
                disabled={!ideaDescription || !targetAudience || !problemSolved || isResearchingIdea}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Build Page
              </button>
            </div>
            {isResearchingIdea && (
              <div className="mt-4 flex items-center justify-end gap-2 text-indigo-200 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Researching your idea...
              </div>
            )}
            {researchError && (
              <div className="mt-4 text-right text-sm text-red-300">{researchError}</div>
            )}
          </div>
        </div>
      )}

      {/* Sub-step 2: Choose Template */}
      {landingSubStep === 2 && (
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Choose your landing page style</h1>
          <p className="text-gray-400 mb-8">Select a template that matches your idea type.</p>
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
            <div className="grid md:grid-cols-3 gap-6">
              {templateOptions.map((template) => {
                const checked = selectedTemplate === template.id;
                return (
                  <div key={template.id} className="space-y-3">
                    <div
                      className={`relative rounded-xl border overflow-hidden ${
                        checked ? 'border-indigo-500' : 'border-gray-700'
                      }`}
                    >
                      {/* Sample rectangle “being built” */}
                      <div className="h-48 bg-gray-800">
                        <div className="h-full w-full animate-pulse bg-gradient-to-r from-gray-800 via-gray-700/50 to-gray-800" />
                        <div className="absolute inset-0 p-4">
                          <div className="h-4 w-2/3 rounded bg-gray-700/70 mb-3" />
                          <div className="h-3 w-1/2 rounded bg-gray-700/60 mb-4" />
                          <div className="space-y-2">
                            <div className="h-3 w-full rounded bg-gray-700/50" />
                            <div className="h-3 w-11/12 rounded bg-gray-700/40" />
                            <div className="h-3 w-10/12 rounded bg-gray-700/30" />
                          </div>
                        </div>
                      </div>

                      {/* Floating preview button */}
                      <button
                        type="button"
                        onClick={() => setPreviewTemplateId(template.id)}
                        className="absolute top-3 right-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/50 text-white text-sm font-medium hover:bg-black/60 border border-white/10 backdrop-blur transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>

                    {/* Radio selection under preview */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="landing-template"
                        checked={checked}
                        onChange={() => setSelectedTemplate(template.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-white font-semibold">{template.name}</div>
                        <div className="text-gray-400 text-sm">{template.desc}</div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Promise Panel */}
          <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
            <p className="text-indigo-200 text-lg mb-6">
              We will create several landing page samples for you to choose from, tailored to your idea and target audience.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setLandingSubStep(1)}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setLandingSubStep(3)}
                disabled={!selectedTemplate}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-step 3: Domain Setup (moved into Create Landing Page) */}
      {landingSubStep === 3 && (
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Lets get your page live.</h1>
          <p className="text-gray-400 mb-8">Choose the domain visitors will see when they land on your page.</p>

          {/* Domain Options */}
          <div className="space-y-6">
            {domainChoice === 'custom' ? (
              <>
                {/* Custom Domain Option (expanded to top) */}
                <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDomainChoice('custom');
                    }}
                    className={`w-full p-8 rounded-lg border-2 text-left transition-all ${
                      domainChoice === 'custom'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-gray-700 hover:border-gray-600'
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

                  <div className="mt-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDomainMode('have');
                          setSelectedDomainToBuy(null);
                        }}
                        className={`p-4 rounded-lg border text-left transition-colors ${
                          customDomainMode === 'have'
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-white font-semibold">Do you have a domain?</div>
                        <div className="text-gray-400 text-sm mt-1">Use a domain you already own</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCustomDomainMode('buy');
                          setCustomDomain('');
                        }}
                        className={`p-4 rounded-lg border text-left transition-colors ${
                          customDomainMode === 'buy'
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-white font-semibold">Buy a Domain</div>
                        <div className="text-gray-400 text-sm mt-1">Choose a cheap domain for this test</div>
                      </button>
                    </div>

                    {customDomainMode === 'have' && (
                      <div>
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

                    {customDomainMode === 'buy' && (
                      <div className="space-y-3">
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                          <div className="text-amber-100 font-semibold">This is a test — the domain extension doesn’t matter.</div>
                          <div className="text-amber-200/90 text-sm mt-1">Buy the cheapest domain from these options.</div>
                        </div>

                        <div className="space-y-2">
                          {domainPurchaseOptions.map((opt) => {
                            const selected = selectedDomainToBuy === opt.domain;
                            const isCheapest = opt.price === cheapestPrice;
                            return (
                              <label
                                key={opt.domain}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selected
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-gray-700 hover:border-gray-600'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="buy-domain"
                                  checked={selected}
                                  onChange={() => setSelectedDomainToBuy(opt.domain)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-white font-medium font-mono">{opt.domain}</div>
                                    <div className="text-white font-semibold">${opt.price.toFixed(2)}</div>
                                  </div>
                                  {isCheapest && <div className="text-emerald-400 text-xs mt-1">Cheapest</div>}
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        {selectedDomainToBuy && (
                          <div className="text-gray-400 text-sm">
                            Selected domain: <span className="text-white font-mono">{selectedDomainToBuy}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* OR Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-6 py-2 bg-black text-gray-400 text-xl font-bold">OR</span>
                  </div>
                </div>

                {/* TruSignal Domain Option */}
                <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDomainChoice('trusignal');
                      setCustomDomainMode(null);
                      setSelectedDomainToBuy(null);
                    }}
                    className={`w-full p-8 rounded-lg border-2 text-left transition-all ${
                      domainChoice === 'trusignal'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          domainChoice === 'trusignal' ? 'border-indigo-500' : 'border-gray-600'
                        }`}
                      >
                        {domainChoice === 'trusignal' && (
                          <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>
                        )}
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
              </>
            ) : (
              <>
                {/* TruSignal Domain Option */}
                <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDomainChoice('trusignal');
                      setCustomDomainMode(null);
                      setSelectedDomainToBuy(null);
                    }}
                    className={`w-full p-8 rounded-lg border-2 text-left transition-all ${
                      domainChoice === 'trusignal'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          domainChoice === 'trusignal' ? 'border-indigo-500' : 'border-gray-600'
                        }`}
                      >
                        {domainChoice === 'trusignal' && (
                          <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>
                        )}
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
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-6 py-2 bg-black text-gray-400 text-xl font-bold">OR</span>
                  </div>
                </div>

                {/* Custom Domain Option */}
                <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDomainChoice('custom');
                      setCustomDomainMode(null);
                      setSelectedDomainToBuy(null);
                    }}
                    className={`w-full p-8 rounded-lg border-2 text-left transition-all ${
                      domainChoice === 'custom'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          domainChoice === 'custom' ? 'border-indigo-500' : 'border-gray-600'
                        }`}
                      >
                        {domainChoice === 'custom' && (
                          <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-white">Use Custom Domain</h3>
                    </div>
                    <p className="text-gray-400 text-lg ml-10">Connect your own domain name for a branded experience</p>
                    <p className="text-gray-500 text-sm ml-10 mt-2">Requires DNS setup • More professional appearance</p>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Promise Panel */}
          <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
            <p className="text-indigo-200 text-lg mb-6">
              We’ll launch your landing page on this domain and get it ready to receive visitors.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setLandingSubStep(2)}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setLandingSubStep(4)}
                disabled={!canDeployPage}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deploy Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-step 4: Deploy */}
      {landingSubStep === 4 && (
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Deploying your page</h1>
          <p className="text-gray-400 mb-8">
            Publishing your landing page to{' '}
            <span className="text-white font-mono">{selectedDomain || '—'}</span>
          </p>

          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
            <div className="flex items-center gap-3 text-indigo-200 mb-6">
              <Rocket className="w-5 h-5 text-indigo-400" />
              <div className="text-lg font-semibold">Deployment in progress</div>
            </div>

            <div className="space-y-4">
              {deploySteps.map((step, idx) => {
                const done = deployStepIndex > idx;
                const active = deployStepIndex === idx;

                return (
                  <div
                    key={step.title}
                    className={`flex items-start gap-3 p-4 rounded-lg border ${
                      done
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : active
                          ? 'border-indigo-500/40 bg-indigo-500/5'
                          : 'border-gray-800 bg-black/20'
                    }`}
                  >
                    <div className="pt-0.5">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : active ? (
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{step.title}</div>
                      <div className="text-gray-400 text-sm mt-1">{step.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {deploymentComplete && (
              <div className="mt-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-6">
                <div className="text-white font-semibold text-lg">Your page is live.</div>
                <div className="text-indigo-200 mt-1">Next, we’ll drive traffic with Meta Ads.</div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setLandingSubStep(3)}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Back
            </button>

            <button
              onClick={() => {
                setActiveStep('ads');
                setLandingSubStep(1);
              }}
              disabled={!deploymentComplete}
              className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Meta Ads Setup
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplateId && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreviewTemplateId(null)}
        >
          <div
            className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <div className="text-white font-semibold">Preview</div>
                <div className="text-gray-400 text-sm">
                  {templateOptions.find((t) => t.id === previewTemplateId)?.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplateId(null)}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-300"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-xl border border-gray-700 overflow-hidden">
                <div className="h-80 bg-gray-800 relative">
                  <div className="h-full w-full animate-pulse bg-gradient-to-r from-gray-800 via-gray-700/50 to-gray-800" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(previewTemplateId);
                    setPreviewTemplateId(null);
                  }}
                  className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Select this sample
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTemplateId(null)}
                  className="px-5 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
