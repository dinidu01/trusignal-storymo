import { CheckCircle2, Eye, ExternalLink, Lightbulb, Loader2, Rocket, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  setLandingCompleted: (value: boolean) => void;
  domainCheckoutStatus: 'success' | 'cancel' | null;
  purchasedDomain: string | null;
  onDismissDomainCheckoutNotice: () => void;
  ideaId: string | null;
  setIdeaId: (value: string | null) => void;
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
  setLandingCompleted,
  domainCheckoutStatus,
  purchasedDomain,
  onDismissDomainCheckoutNotice,
  ideaId,
  setIdeaId,
}: CreateLandingPageStepProps) {
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [customDomainMode, setCustomDomainMode] = useState<'have' | 'buy' | null>(null);
  const [selectedDomainToBuy, setSelectedDomainToBuy] = useState<string | null>(null);
  const [deployStepIndex, setDeployStepIndex] = useState(0);
  const [isResearchingIdea, setIsResearchingIdea] = useState(false);
  const [ideaResearchComplete, setIdeaResearchComplete] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [isBuyingDomain, setIsBuyingDomain] = useState(false);
  const [buyDomainError, setBuyDomainError] = useState<string | null>(null);
  const hasHydratedInputsRef = useRef(false);
  const [suggestedSubdomain, setSuggestedSubdomain] = useState<string | null>(null);
  const lastIdeaIdRef = useRef<string | null>(null);

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

  const trusignalSubdomain = suggestedSubdomain ?? ideaSlug;

  const selectedDomain =
    domainChoice === 'trusignal'
      ? `${trusignalSubdomain}.trusignal.space`
      : domainChoice === 'custom'
        ? customDomainMode === 'have'
          ? customDomain.trim()
          : selectedDomainToBuy ?? ''
        : '';

  const selectedDomainHref = selectedDomain
    ? selectedDomain.startsWith('http')
      ? selectedDomain
      : `https://${selectedDomain}`
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
    if (!previewTemplateId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewTemplateId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewTemplateId]);

  useEffect(() => {
    if (landingSubStep !== 4) return;

    setDeployStepIndex(0);

    const timers = deploySteps.map((_, idx) =>
      window.setTimeout(() => setDeployStepIndex(idx + 1), 900 * (idx + 1)),
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [landingSubStep]);

  useEffect(() => {
    if (!purchasedDomain) return;
    setDomainChoice('custom');
    setCustomDomainMode('buy');
    setSelectedDomainToBuy(purchasedDomain);
  }, [purchasedDomain, setDomainChoice]);

  useEffect(() => {
    if (ideaId !== lastIdeaIdRef.current) {
      hasHydratedInputsRef.current = false;
      lastIdeaIdRef.current = ideaId ?? null;
    }
  }, [ideaId]);

  useEffect(() => {
    if (hasHydratedInputsRef.current) return;
    const key = ideaId ? `trusignal.ideaInputs.${ideaId}` : 'trusignal.ideaInputs';
    const stored = localStorage.getItem(key);
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

      hasHydratedInputsRef.current = true;
    } catch (_error) {
      // Ignore stored data errors.
    }
  }, [ideaDescription, targetAudience, problemSolved, setIdeaDescription, setProblemSolved, setTargetAudience]);

  useEffect(() => {
    if (suggestedSubdomain) return;
    const stored = localStorage.getItem('trusignal.suggestedSubdomain');
    if (stored) {
      setSuggestedSubdomain(stored);
    }
  }, [suggestedSubdomain]);

  useEffect(() => {
    const storedAnalysis = localStorage.getItem('trusignal.analyzeIdea');
    const inputsKey = ideaId ? `trusignal.analyzeIdeaInputs.${ideaId}` : 'trusignal.analyzeIdeaInputs';
    const storedInputs = localStorage.getItem(inputsKey);
    if (!storedAnalysis || !storedInputs) {
      if (ideaResearchComplete) {
        setIdeaResearchComplete(false);
      }
      return;
    }

    try {
      const parsedInputs = JSON.parse(storedInputs) as {
        ideaDescription?: string;
        targetAudience?: string;
        problemSolved?: string;
      };

      const matches =
        parsedInputs.ideaDescription === ideaDescription &&
        parsedInputs.targetAudience === targetAudience &&
        parsedInputs.problemSolved === problemSolved;

      setIdeaResearchComplete(matches);
    } catch (_error) {
      // Ignore stored data errors.
    }
  }, [ideaDescription, ideaId, ideaResearchComplete, problemSolved, targetAudience]);

  useEffect(() => {
    const payload = {
      ideaDescription,
      targetAudience,
      problemSolved,
    };

    const key = ideaId ? `trusignal.ideaInputs.${ideaId}` : 'trusignal.ideaInputs';
    localStorage.setItem(key, JSON.stringify(payload));
  }, [ideaDescription, ideaId, targetAudience, problemSolved]);

  const templateOptions = [
    { id: 'sample-a', name: 'Sample A', desc: 'Clean, modern layout' },
    { id: 'sample-b', name: 'Sample B', desc: 'Bold, high-conversion layout' },
    { id: 'sample-c', name: 'Sample C', desc: 'Professional, trust-building layout' },
  ];

  const templatePreviewUrls: Record<string, string> = {
    'sample-a': 'https://bakey.trusignal.space/?v=v1',
    'sample-b': 'https://bakey.trusignal.space/?v=v2',
    'sample-c': 'https://bakey.trusignal.space/?v=v3',
  };

  const selectedDomainPurchaseOption = selectedDomainToBuy
    ? domainPurchaseOptions.find((opt) => opt.domain === selectedDomainToBuy) ?? null
    : null;

  const hasPurchasedDomain = Boolean(purchasedDomain);
  const domainCheckoutMessage =
    domainCheckoutStatus === 'success'
      ? 'Domain checkout complete. Your domain is ready to connect.'
      : domainCheckoutStatus === 'cancel'
        ? 'Domain checkout was cancelled.'
        : null;

  const handleBuyDomainCheckout = async () => {
    if (!selectedDomainPurchaseOption) return;

    setIsBuyingDomain(true);
    setBuyDomainError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          checkoutType: 'domain',
          oneTimeAmount: selectedDomainPurchaseOption.price,
          productName: 'Domain purchase',
          productDescription: selectedDomainPurchaseOption.domain,
          returnStep: 'landing',
          returnSubStep: landingSubStep,
          returnDomain: selectedDomainPurchaseOption.domain,
          metadata: {
            purchase_type: 'domain',
            domain: selectedDomainPurchaseOption.domain,
          },
        },
      });

      if (error || !data?.url) {
        throw error ?? new Error('Missing checkout URL.');
      }

      window.location.href = data.url;
    } catch (_error) {
      setBuyDomainError('Unable to start checkout. Please try again.');
      setIsBuyingDomain(false);
    }
  };

  const handleBuildPage = async () => {
    if (!ideaDescription || !targetAudience || !problemSolved) return;

    setIdeaResearchComplete(false);
    setIsResearchingIdea(true);
    setResearchError(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-idea', {
        body: {
          idea: ideaDescription,
          audience: targetAudience,
          problem: problemSolved,
          segment_count: 3,
          idea_id: ideaId ?? undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.suggested_subdomain) {
        const subdomain = String(data.suggested_subdomain);
        localStorage.setItem('trusignal.suggestedSubdomain', subdomain);
        setSuggestedSubdomain(subdomain);
      }

      if (data?.idea_id) {
        localStorage.setItem('trusignal.ideaId', String(data.idea_id));
        setIdeaId(String(data.idea_id));
      }

      const inputsKey = ideaId ? `trusignal.analyzeIdeaInputs.${ideaId}` : 'trusignal.analyzeIdeaInputs';
      localStorage.setItem(
        inputsKey,
        JSON.stringify({
          ideaDescription,
          targetAudience,
          problemSolved,
        })
      );
      localStorage.setItem('trusignal.analyzeIdea', JSON.stringify(data));
      setIdeaResearchComplete(true);
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
                  onChange={(e) => {
                    setIdeaResearchComplete(false);
                    setIdeaDescription(e.target.value);
                  }}
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
                    onChange={(e) => {
                      setIdeaResearchComplete(false);
                      setTargetAudience(e.target.value);
                    }}
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
                  onChange={(e) => {
                    setIdeaResearchComplete(false);
                    setProblemSolved(e.target.value);
                  }}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors h-24"
                />
              </div>
            </div>
          </div>

          {/* Promise Panel */}
          <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-5">What happens next</h3>

            {isResearchingIdea && (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-200" />
                <div className="mt-5 text-3xl font-bold text-white">Researching your idea...</div>
              </div>
            )}

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="pt-0.5">
                  {ideaResearchComplete ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : isResearchingIdea ? (
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-200 flex items-center justify-center font-semibold">1</div>
                  )}
                </div>
                <div>
                  <div className="text-white font-semibold">Research your idea</div>
                  <div className="text-indigo-200 text-sm mt-1">
                    We will gather your idea, target audience, and research it against similar businesses to collect market insights.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="pt-0.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-200 flex items-center justify-center font-semibold">2</div>
                </div>
                <div>
                  <div className="text-white font-semibold">
                    Create your landing page{' '}
                    <span className="text-amber-200 font-semibold">in 30 seconds</span>
                  </div>
                  <div className="text-indigo-200 text-sm mt-1">Next, we’ll generate a landing web page style for you to choose from.</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  if (ideaResearchComplete) {
                    setLandingSubStep(2);
                    return;
                  }

                  handleBuildPage();
                }}
                disabled={!ideaDescription || !targetAudience || !problemSolved || isResearchingIdea}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ideaResearchComplete ? 'Build Page' : 'Research Idea'}
              </button>
            </div>

            {researchError && <div className="mt-4 text-right text-sm text-red-300">{researchError}</div>}
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
                      {/* Template preview */}
                      <div className="h-48 bg-gray-800 relative">
                        <iframe
                          title={`${template.name} preview`}
                          src={templatePreviewUrls[template.id]}
                          className="absolute inset-0 h-full w-full border-0 pointer-events-none"
                          loading="lazy"
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        />
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
            <h3 className="text-xl font-semibold text-white mb-5">What happens next</h3>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="pt-0.5">
                  {selectedTemplate ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-200 flex items-center justify-center font-semibold">1</div>
                  )}
                </div>
                <div>
                  <div className="text-white font-semibold">Select your landing page style</div>
                  <div className="text-indigo-200 text-sm mt-1">Select your landing page style from the above styles. (you can enhance later)</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="pt-0.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-200 flex items-center justify-center font-semibold">2</div>
                </div>
                <div>
                  <div className="text-white font-semibold">
                    <span>Get your page live in </span>
                    <span className="text-amber-200">1 second</span>
                  </div>
                  <div className="text-indigo-200 text-sm mt-1">Next, you’ll choose a domain and publish your landing page.</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
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
                Get your page live
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
          {domainCheckoutMessage && (
            <div
              className={`mb-6 rounded-xl border p-4 ${
                domainCheckoutStatus === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>{domainCheckoutMessage}</div>
                <button
                  type="button"
                  onClick={onDismissDomainCheckoutNotice}
                  className="p-1 rounded-md hover:bg-white/10 text-current"
                  aria-label="Dismiss message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {hasPurchasedDomain ? (
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="text-white text-lg font-semibold mb-2">Purchased domain</div>
              <div className="text-indigo-300 font-mono text-xl">{purchasedDomain}</div>
              <div className="text-gray-400 text-sm mt-2">We’ll connect this domain during deployment.</div>
            </div>
          ) : (
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
                      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        Use Custom Domain
                        <span className="inline-flex items-center rounded-full bg-teal-400/15 text-teal-300 border border-teal-400/30 px-3 py-1 text-xs font-semibold">
                          5 minutes Setup
                        </span>
                      </h3>
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
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-white font-semibold">Do you have a domain?</div>
                          <span className="inline-flex items-center rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 px-2.5 py-0.5 text-xs font-semibold">
                            Advanced
                          </span>
                        </div>
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
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-white font-semibold">Buy a Domain</div>
                          <span className="inline-flex items-center rounded-full bg-amber-400/15 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 text-xs font-semibold">
                            Recommended
                          </span>
                        </div>
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

                        <button
                          type="button"
                          onClick={() => void handleBuyDomainCheckout()}
                          disabled={!selectedDomainPurchaseOption || isBuyingDomain}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isBuyingDomain ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Zap className="w-5 h-5" />
                          )}
                          1 Click Buy
                          {selectedDomainPurchaseOption ? ` $${selectedDomainPurchaseOption.price.toFixed(2)}` : ''}
                        </button>

                        {buyDomainError && <div className="text-right text-sm text-red-300">{buyDomainError}</div>}
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
                      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        Use TruSignal Domain
                        <span className="inline-flex items-center rounded-full bg-teal-400/15 text-teal-300 border border-teal-400/30 px-3 py-1 text-xs font-semibold">
                          Simple &amp; Instant
                        </span>
                      </h3>
                    </div>
                    <p className="text-gray-400 text-lg ml-10">
                      Your landing page will be hosted at{' '}
                      <span className="text-indigo-400 font-mono">{trusignalSubdomain}.trusignal.space</span>
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
                      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        Use TruSignal Domain
                        <span className="inline-flex items-center rounded-full bg-teal-400/15 text-teal-300 border border-teal-400/30 px-3 py-1 text-xs font-semibold">
                          Simple &amp; Instant
                        </span>
                      </h3>
                    </div>
                    <p className="text-gray-400 text-lg ml-10">
                      Your landing page will be hosted at{' '}
                      <span className="text-indigo-400 font-mono">{trusignalSubdomain}.trusignal.space</span>
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
                      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        Use Custom Domain
                        <span className="inline-flex items-center rounded-full bg-teal-400/15 text-teal-300 border border-teal-400/30 px-3 py-1 text-xs font-semibold">
                          5 minutes Setup
                        </span>
                      </h3>
                    </div>
                    <p className="text-gray-400 text-lg ml-10">Connect your own domain name for a branded experience</p>
                    <p className="text-gray-500 text-sm ml-10 mt-2">Requires DNS setup • More professional appearance</p>
                  </button>
                </div>
                </>
              )}
            </div>
          )}

          {/* Promise Panel */}
          <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-5">What happens next</h3>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="pt-0.5">
                  {domainChoice ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-200 flex items-center justify-center font-semibold">1</div>
                  )}
                </div>
                <div>
                  <div className="text-white font-semibold">Select a website domain method</div>
                  <div className="text-indigo-200 text-sm mt-1">Choose how you want your landing page domain to look.</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="pt-0.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-200 flex items-center justify-center font-semibold">2</div>
                </div>
                <div>
                  <div className="text-white font-semibold">
                    <span>Your page will be live in </span>
                    <span className="text-amber-200">{domainChoice === 'custom' ? '30 seconds' : '1 second'}</span>
                  </div>
                  <div className="text-indigo-200 text-sm mt-1">
                    (TruSignal domain: <span className="text-amber-200">1 second</span>, Custom domain:{' '}
                    <span className="text-amber-200">30 seconds</span>)
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
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
                Make Site Live
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

                {selectedDomain && (
                  <a
                    href={selectedDomainHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-3 text-indigo-200 hover:text-white transition-colors"
                  >
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                    </span>
                    <span className="font-mono text-sm">{selectedDomain}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <div className="text-indigo-200 mt-3">Next, we’ll drive traffic with Meta Ads.</div>
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
                setLandingCompleted(true);
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewTemplateId(null)}>
          <div className="w-full h-full bg-gray-900 border border-gray-700 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <div className="text-white font-semibold">Preview</div>
                <div className="text-gray-400 text-sm">{templateOptions.find((t) => t.id === previewTemplateId)?.name}</div>
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

            <div className="flex-1 p-6 flex flex-col">
              <div className="flex-1 rounded-xl border border-gray-700 overflow-hidden bg-gray-800">
                <iframe
                  title={`${templateOptions.find((t) => t.id === previewTemplateId)?.name ?? 'Template'} preview`}
                  src={templatePreviewUrls[previewTemplateId]}
                  className="h-full w-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
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
