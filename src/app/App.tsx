import { useState, useEffect } from 'react';
import { Check, ArrowRight, TrendingUp, Clock, DollarSign, Target, X, LayoutDashboard, Megaphone, BarChart3, Plus, Lightbulb, Upload, Sparkles, Mail } from 'lucide-react';
import { CreateLandingPageStep } from './wizard/steps/CreateLandingPageStep';
import { SetupMetaAdsStep } from './wizard/steps/SetupMetaAdsStep';
import { SetupEmailReceivingStep } from './wizard/steps/SetupEmailReceivingStep';
import { AnalyzeResultsStep } from './wizard/steps/AnalyzeResultsStep';

export default function App() {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeStep, setActiveStep] = useState<'landing' | 'domain' | 'ads' | 'email' | 'results'>('landing');
  const [showNewIdeaInput, setShowNewIdeaInput] = useState(false);
  const [ideaInput, setIdeaInput] = useState('');
  const [domainChoice, setDomainChoice] = useState<'custom' | 'trusignal' | null>(null);
  const [customDomain, setCustomDomain] = useState('');
  const [hasFacebookPage, setHasFacebookPage] = useState<boolean | null>(null);
  const [hasInstagramPage, setHasInstagramPage] = useState<boolean | null>(null);
  const [facebookPageUrl, setFacebookPageUrl] = useState('');
  const [instagramPageUrl, setInstagramPageUrl] = useState('');
  const [wantsEmailReceiving, setWantsEmailReceiving] = useState<boolean | null>(null);
  const [receivingEmail, setReceivingEmail] = useState('');

  // Wizard sub-steps
  const [landingSubStep, setLandingSubStep] = useState(1);
  const [adsSubStep, setAdsSubStep] = useState(1);
  
  // Landing page form data
  const [ideaDescription, setIdeaDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [problemSolved, setProblemSolved] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Ad creation data
  const [adImageMethod, setAdImageMethod] = useState<'upload' | 'ai' | null>(null);
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adHeadline, setAdHeadline] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adCta, setAdCta] = useState('');

  // Ad setup & launch data
  const [adAgeMin, setAdAgeMin] = useState(18);
  const [adAgeMax, setAdAgeMax] = useState(65);
  const [adCountries, setAdCountries] = useState<string[]>([]);
  const [adBudgetPerDay, setAdBudgetPerDay] = useState<10 | 25 | 50 | null>(null);
  const [adDurationDays, setAdDurationDays] = useState<3 | 7 | 10 | null>(null);

  const phrases = [
    "Validate a Bakery in my town...",
    "Validate a new makeup kit...",
    "Validate a dating app...",
    "Validate a customer data platform..."
  ];

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseDuration = 2000;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (typedText.length < currentPhrase.length) {
          setTypedText(currentPhrase.slice(0, typedText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        // Deleting
        if (typedText.length > 0) {
          setTypedText(currentPhrase.slice(0, typedText.length - 1));
        } else {
          // Move to next phrase
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, phraseIndex]);

  const toggleQuestion = (index: number) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const steps = [
    { id: 'landing' as const, icon: LayoutDashboard, label: 'Create Landing Page' },
    { id: 'ads' as const, icon: Megaphone, label: 'Setup Meta Ads' },
    { id: 'email' as const, icon: Mail, label: 'Setup Email Receiving', optional: true },
    { id: 'results' as const, icon: BarChart3, label: 'Analyze Results' },
  ];

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex">
        {/* Sidebar */}
        <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-6 border-b border-gray-800">
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              TruSignal
            </div>
          </div>

          <div className="flex-1 p-4">
            <button
              onClick={() => setShowNewIdeaInput(true)}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 mb-6"
            >
              <Plus className="w-5 h-5" />
              New Idea
            </button>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 transition-colors ${
                    activeStep === step.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                  <div>
                    <div className="text-xs text-gray-500">Step {index + 1}{step.optional ? ' (Optional)' : ''}</div>
                    <div className="font-medium">{step.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => setIsLoggedIn(false)}
              className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Landing Page Step */}
            {activeStep === 'landing' && (
              <CreateLandingPageStep
                landingSubStep={landingSubStep}
                setLandingSubStep={setLandingSubStep}
                ideaDescription={ideaDescription}
                setIdeaDescription={setIdeaDescription}
                targetAudience={targetAudience}
                setTargetAudience={setTargetAudience}
                problemSolved={problemSolved}
                setProblemSolved={setProblemSolved}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                domainChoice={domainChoice}
                setDomainChoice={setDomainChoice}
                customDomain={customDomain}
                setCustomDomain={setCustomDomain}
                setActiveStep={setActiveStep}
              />
            )}


            {/* Meta Ads Setup Step */}
            {activeStep === 'ads' && (
              <SetupMetaAdsStep
                adsSubStep={adsSubStep}
                setAdsSubStep={setAdsSubStep}
                hasFacebookPage={hasFacebookPage}
                setHasFacebookPage={setHasFacebookPage}
                hasInstagramPage={hasInstagramPage}
                setHasInstagramPage={setHasInstagramPage}
                facebookPageUrl={facebookPageUrl}
                setFacebookPageUrl={setFacebookPageUrl}
                instagramPageUrl={instagramPageUrl}
                setInstagramPageUrl={setInstagramPageUrl}
                adImageMethod={adImageMethod}
                setAdImageMethod={setAdImageMethod}
                adImageUrl={adImageUrl}
                setAdImageUrl={setAdImageUrl}
                adHeadline={adHeadline}
                setAdHeadline={setAdHeadline}
                adDescription={adDescription}
                setAdDescription={setAdDescription}
                adCta={adCta}
                setAdCta={setAdCta}
                adAgeMin={adAgeMin}
                setAdAgeMin={setAdAgeMin}
                adAgeMax={adAgeMax}
                setAdAgeMax={setAdAgeMax}
                adCountries={adCountries}
                setAdCountries={setAdCountries}
                adBudgetPerDay={adBudgetPerDay}
                setAdBudgetPerDay={setAdBudgetPerDay}
                adDurationDays={adDurationDays}
                setAdDurationDays={setAdDurationDays}
                setActiveStep={setActiveStep}
              />
            )}

            {/* Setup Email Receiving Step (Optional) */}
            {activeStep === 'email' && (
              <SetupEmailReceivingStep
                wantsEmailReceiving={wantsEmailReceiving}
                setWantsEmailReceiving={setWantsEmailReceiving}
                receivingEmail={receivingEmail}
                setReceivingEmail={setReceivingEmail}
                setActiveStep={setActiveStep}
              />
            )}

            {/* Analyze Results Step */}
            {activeStep === 'results' && <AnalyzeResultsStep />}
          </div>
        </div>

        {/* New Idea Modal */}
        {showNewIdeaInput && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowNewIdeaInput(false)}>
            <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-2xl border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Start a New Validation Test
                </h2>
                <button
                  onClick={() => setShowNewIdeaInput(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="What do you want to validate?"
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  className="w-full px-6 py-4 pr-16 text-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => {
                    setShowNewIdeaInput(false);
                    setActiveStep('landing');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {['Sell Online', 'Service Business', 'Killer App', 'SaaS Product'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setIdeaInput(suggestion)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-indigo-900 hover:text-indigo-300 transition-colors text-sm font-medium border border-gray-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            TruSignal
          </div>
          <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium" onClick={() => setShowAuthModal(true)}>
            Validate Idea
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 text-white leading-tight">
            Validate your idea before you build it.
          </h1>
          <p className="text-2xl text-gray-400 mb-10 leading-relaxed">
            TruSignal launches a real landing page and real ads for your idea — then shows you if anyone actually cares.
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-full max-w-3xl">
              <input
                type="text"
                placeholder="What do you want to make?"
                className="w-full px-8 py-6 pr-24 text-lg bg-gray-900 border-2 border-gray-700 text-white placeholder-gray-500 rounded-2xl focus:border-indigo-500 focus:outline-none transition-colors"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25" onClick={() => setShowAuthModal(true)}>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {['Sell Online', 'Service Business', 'Killer App', 'SaaS Product'].map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-4 py-2 bg-gray-900 text-gray-300 rounded-lg hover:bg-indigo-900 hover:text-indigo-300 transition-colors text-sm font-medium border border-gray-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Takes minutes. Costs less than building the wrong thing.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof / Cost of Guessing */}
      <section className="bg-gradient-to-br from-gray-900 to-indigo-950/30 py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            The hidden cost of guessing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-900/50 rounded-xl p-8 shadow-sm border border-gray-800">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
                6–12 weeks
              </div>
              <p className="text-gray-400 text-lg">
                Average time founders spend building before learning nobody wants it
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-8 shadow-sm border border-gray-800">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
                $5,000+
              </div>
              <p className="text-gray-400 text-lg">
                Typical early spend on design, dev, and tools before validation
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-8 shadow-sm border border-gray-800">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
                1 failed launch
              </div>
              <p className="text-gray-400 text-lg">
                Is often enough to kill momentum
              </p>
            </div>
          </div>
          <p className="text-center text-xl text-gray-300">
            TruSignal replaces guessing with a small, controlled experiment.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">
          How TruSignal Works
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold mb-6">
              1
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">
              Describe your idea
            </h3>
            <p className="text-lg text-gray-400 leading-relaxed">
              Tell us what you want to test and who it's for.
            </p>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold mb-6">
              2
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">
              We launch the test
            </h3>
            <p className="text-lg text-gray-400 leading-relaxed">
              We create a landing page, run real ads, and send real traffic.
            </p>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold mb-6">
              3
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">
              You get the signal
            </h3>
            <p className="text-lg text-gray-400 leading-relaxed">
              See clicks, signups, and a clear verdict: strong, weak, or no demand.
            </p>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="bg-gradient-to-br from-gray-900 via-indigo-950/50 to-purple-950/50 py-20 border-y border-gray-800">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            What you get in every test
          </h2>
          <div className="max-w-2xl mx-auto space-y-5">
            {[
              'A live landing page',
              'A waitlist inbox',
              'Real ads on Facebook & Instagram',
              'Clicks, impressions, and audience data',
              'A clear signal — not opinions'
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                <div className="w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-xl text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why TruSignal */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">
          Why founders use TruSignal
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            { icon: Clock, text: 'Validate ideas in days, not months' },
            { icon: Target, text: 'Avoid wasting time building the wrong thing' },
            { icon: DollarSign, text: 'Spend $25 instead of thousands' },
            { icon: TrendingUp, text: 'Kill weak ideas early' },
            { icon: Check, text: 'Double down on ideas with real demand' }
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-4 p-6 rounded-xl border border-gray-800 hover:border-indigo-500 hover:bg-gray-900/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-lg text-gray-300 pt-2">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gradient-to-br from-gray-900 to-indigo-950/30 py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Simple, upfront pricing
          </h2>
          <div className="max-w-md mx-auto">
            <div className="bg-gray-900 rounded-2xl p-10 shadow-xl border-2 border-indigo-500">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-3">Starter</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-bold text-white">$49</span>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                {[
                  '72-hour live validation test',
                  '$25 ad spend included',
                  'Landing page + waitlist',
                  'Results dashboard'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <button className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold shadow-lg shadow-indigo-600/25" onClick={() => setShowAuthModal(true)}>
                Validate Idea
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              question: 'Is this a full product launch?',
              answer: "No. It's a controlled experiment to test demand."
            },
            {
              question: 'Do I need my own ad account?',
              answer: 'No. We run the test for you.'
            },
            {
              question: 'What happens after the test?',
              answer: 'You decide: build, pivot, or move on.'
            }
          ].map((faq, index) => (
            <div key={index} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
              >
                <span className="text-xl font-semibold text-white">{faq.question}</span>
                <span className={`text-2xl text-indigo-400 transition-transform ${activeQuestion === index ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  activeQuestion === index ? 'max-h-32' : 'max-h-0'
                }`}
              >
                <div className="px-8 pb-6 pt-2">
                  <p className="text-lg text-gray-400">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-gray-900 via-indigo-950/40 to-purple-950/40 py-20 border-t border-gray-800">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6 text-white leading-tight">
            Don't build on assumptions.
          </h2>
          <p className="text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Validate demand with real traffic before you invest weeks or money.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button className="px-10 py-5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xl font-bold shadow-2xl shadow-indigo-600/20 flex items-center gap-2" onClick={() => setShowAuthModal(true)}>
              Validate Idea
              <ArrowRight className="w-6 h-6" />
            </button>
            <p className="text-gray-400">
              Most tests go live in under 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-6 text-gray-400">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
            <span className="text-gray-700">·</span>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
            <span className="text-gray-700">·</span>
            <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-400">or</span>
              </div>
            </div>

            <button className="w-full px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <p className="mt-6 text-center text-sm text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
