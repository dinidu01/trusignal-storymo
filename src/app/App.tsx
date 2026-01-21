import { useState, useEffect } from 'react';
import { Check, ArrowRight, TrendingUp, Clock, DollarSign, Target, X, LayoutDashboard, Globe, Megaphone, BarChart3, Plus, Lightbulb, Upload, Sparkles } from 'lucide-react';

export default function App() {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeStep, setActiveStep] = useState<'landing' | 'domain' | 'ads' | 'results'>('landing');
  const [showNewIdeaInput, setShowNewIdeaInput] = useState(false);
  const [ideaInput, setIdeaInput] = useState('');
  const [domainChoice, setDomainChoice] = useState<'custom' | 'trusignal' | null>(null);
  const [customDomain, setCustomDomain] = useState('');
  const [hasFacebookPage, setHasFacebookPage] = useState<boolean | null>(null);
  const [hasInstagramPage, setHasInstagramPage] = useState<boolean | null>(null);
  const [facebookPageUrl, setFacebookPageUrl] = useState('');
  const [instagramPageUrl, setInstagramPageUrl] = useState('');

  // Wizard sub-steps
  const [landingSubStep, setLandingSubStep] = useState(1);
  const [domainSubStep, setDomainSubStep] = useState(1);
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
    { id: 'domain' as const, icon: Globe, label: 'Setup Domain' },
    { id: 'ads' as const, icon: Megaphone, label: 'Setup Meta Ads' },
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
                    <div className="text-xs text-gray-500">Step {index + 1}</div>
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
              <div>
                <h1 className="text-4xl font-bold text-white mb-6 text-center">Create Landing Page</h1>
                
                {/* Rationale Panel */}
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-4">
                  <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-100 text-lg">
                    So you can track real clicks and measure genuine interest
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        landingSubStep === step
                          ? 'bg-indigo-600 text-white'
                          : landingSubStep > step
                          ? 'bg-indigo-600/30 text-indigo-400'
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        {step}
                      </div>
                      {step < 3 && (
                        <div className={`w-16 h-1 ${
                          landingSubStep > step ? 'bg-indigo-600/30' : 'bg-gray-800'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Sub-step 1: Describe Idea */}
                {landingSubStep === 1 && (
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Tell us about your idea</h2>
                    <p className="text-gray-400 mb-8">
                      Help us understand what you want to validate.
                    </p>
                    <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            What's your idea? *
                          </label>
                          <textarea
                            placeholder="e.g., A meal prep service for busy professionals that delivers healthy, pre-portioned ingredients..."
                            value={ideaDescription}
                            onChange={(e) => setIdeaDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors h-32"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Who is it for? *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Working professionals ages 25-40 who value health but lack time..."
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            What problem does it solve? *
                          </label>
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
                          onClick={() => setLandingSubStep(2)}
                          disabled={!ideaDescription || !targetAudience || !problemSolved}
                          className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-step 2: Choose Template */}
                {landingSubStep === 2 && (
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-4">Choose your landing page style</h1>
                    <p className="text-gray-400 mb-8">
                      Select a template that matches your idea type.
                    </p>
                    <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {[
                          { id: 'modern', name: 'Modern SaaS', desc: 'Clean, minimal design for tech products' },
                          { id: 'bold', name: 'Bold & Vibrant', desc: 'Eye-catching colors for consumer products' },
                          { id: 'professional', name: 'Professional', desc: 'Trust-building layout for B2B services' },
                          { id: 'ecommerce', name: 'E-commerce', desc: 'Product-focused design for online stores' }
                        ].map((template) => (
                          <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`p-6 rounded-lg border-2 text-left transition-all ${
                              selectedTemplate === template.id
                                ? 'border-indigo-500 bg-indigo-500/10'
                                : 'border-gray-700 hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedTemplate === template.id ? 'border-indigo-500' : 'border-gray-600'
                              }`}>
                                {selectedTemplate === template.id && (
                                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                            </div>
                            <p className="text-gray-400 text-sm ml-8">{template.desc}</p>
                          </button>
                        ))}
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

                {/* Sub-step 3: Preview & Launch */}
                {landingSubStep === 3 && (
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-4">Review your landing page</h1>
                    <p className="text-gray-400 mb-8">
                      We'll create your page based on this information.
                    </p>
                    <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                      <div className="space-y-6 mb-8">
                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-2">Your Idea</h3>
                          <p className="text-white">{ideaDescription}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-2">Target Audience</h3>
                          <p className="text-white">{targetAudience}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-2">Problem Solved</h3>
                          <p className="text-white">{problemSolved}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-2">Template</h3>
                          <p className="text-white capitalize">{selectedTemplate}</p>
                        </div>
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
                          onClick={() => setLandingSubStep(2)}
                          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => {
                            setActiveStep('domain');
                            setLandingSubStep(1);
                          }}
                          className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
                        >
                          Create Landing Page
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Domain Setup Step */}
            {activeStep === 'domain' && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-6 text-center">Setup Domain</h1>
                
                {/* Rationale Panel */}
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-4 max-w-3xl mx-auto">
                  <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-100 text-lg">
                    So visitors see a real, trusted URL when they land on your page
                  </p>
                </div>

                <div className="max-w-3xl mx-auto">
                  {/* TruSignal Domain Option */}
                  <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                    <button
                      onClick={() => setDomainChoice('trusignal')}
                      className={`w-full p-8 rounded-lg border-2 text-left transition-all ${
                        domainChoice === 'trusignal'
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          domainChoice === 'trusignal' ? 'border-indigo-500' : 'border-gray-600'
                        }`}>
                          {domainChoice === 'trusignal' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-white">Use TruSignal Domain</h3>
                      </div>
                      <p className="text-gray-400 text-lg ml-10">
                        Your landing page will be hosted at <span className="text-indigo-400 font-mono">app.trusignal.tech/your-idea</span>
                      </p>
                      <p className="text-gray-500 text-sm ml-10 mt-2">
                        Quick setup • No DNS configuration needed
                      </p>
                    </button>
                  </div>

                  {/* OR Divider */}
                  <div className="relative py-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-gray-800"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-6 py-2 bg-black text-gray-400 text-2xl font-bold">
                        OR
                      </span>
                    </div>
                  </div>

                  {/* Custom Domain Option */}
                  <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                    <button
                      onClick={() => setDomainChoice('custom')}
                      className={`w-full p-8 rounded-lg border-2 text-left transition-all ${
                        domainChoice === 'custom'
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          domainChoice === 'custom' ? 'border-indigo-500' : 'border-gray-600'
                        }`}>
                          {domainChoice === 'custom' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-white">Use Custom Domain</h3>
                      </div>
                      <p className="text-gray-400 text-lg ml-10">
                        Connect your own domain name for a branded experience
                      </p>
                      <p className="text-gray-500 text-sm ml-10 mt-2">
                        Requires DNS setup • More professional appearance
                      </p>
                    </button>

                    {domainChoice === 'custom' && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Enter your domain
                        </label>
                        <input
                          type="text"
                          placeholder="yourdomain.com"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                        <p className="text-gray-500 text-sm mt-2">
                          We'll provide DNS instructions after you continue.
                        </p>
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
            )}

            {/* Meta Ads Setup Step */}
            {activeStep === 'ads' && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-6 text-center">Setup Meta Ads</h1>
                
                {/* Rationale Panel */}
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-4 max-w-3xl mx-auto">
                  <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-100 text-lg">
                    So we can run real ads and drive targeted traffic to test demand
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  {[1, 2].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        adsSubStep === step
                          ? 'bg-indigo-600 text-white'
                          : adsSubStep > step
                          ? 'bg-indigo-600/30 text-indigo-400'
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        {step}
                      </div>
                      {step < 2 && (
                        <div className={`w-16 h-1 ${
                          adsSubStep > step ? 'bg-indigo-600/30' : 'bg-gray-800'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Sub-step 1: Connect Pages */}
                {adsSubStep === 1 && (
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4 text-center">Connect your social pages</h2>
                    <p className="text-gray-400 mb-8 text-center">
                      Link your Facebook and Instagram pages to run ads.
                    </p>

                    <div className="max-w-3xl mx-auto space-y-8">
                  {/* Facebook Page Section */}
                  <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Facebook Page</h3>
                        <p className="text-gray-400 text-sm">Connect your Facebook business page</p>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4">Do you have a Facebook page?</p>
                    <div className="flex gap-4 mb-6">
                      <button
                        onClick={() => setHasFacebookPage(true)}
                        className={`flex-1 px-6 py-4 rounded-lg border-2 font-semibold transition-all ${
                          hasFacebookPage === true
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        Yes, I have one
                      </button>
                      <button
                        onClick={() => setHasFacebookPage(false)}
                        className={`flex-1 px-6 py-4 rounded-lg border-2 font-semibold transition-all ${
                          hasFacebookPage === false
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        No, create one for me
                      </button>
                    </div>

                    {hasFacebookPage === true && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Facebook Page URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://facebook.com/yourpage"
                          value={facebookPageUrl}
                          onChange={(e) => setFacebookPageUrl(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                      </div>
                    )}

                    {hasFacebookPage === false && (
                      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
                        <p className="text-indigo-300">
                          ✓ We'll help you create a Facebook page optimized for your validation test.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Instagram Page Section */}
                  <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Instagram Page</h3>
                        <p className="text-gray-400 text-sm">Connect your Instagram business account</p>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4">Do you have an Instagram page?</p>
                    <div className="flex gap-4 mb-6">
                      <button
                        onClick={() => setHasInstagramPage(true)}
                        className={`flex-1 px-6 py-4 rounded-lg border-2 font-semibold transition-all ${
                          hasInstagramPage === true
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        Yes, I have one
                      </button>
                      <button
                        onClick={() => setHasInstagramPage(false)}
                        className={`flex-1 px-6 py-4 rounded-lg border-2 font-semibold transition-all ${
                          hasInstagramPage === false
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        No, create one for me
                      </button>
                    </div>

                    {hasInstagramPage === true && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Instagram Page URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://instagram.com/yourpage"
                          value={instagramPageUrl}
                          onChange={(e) => setInstagramPageUrl(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                      </div>
                    )}

                    {hasInstagramPage === false && (
                      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
                        <p className="text-indigo-300">
                          ✓ We'll help you create an Instagram account optimized for your validation test.
                        </p>
                      </div>
                    )}
                  </div>

                  {(hasFacebookPage !== null || hasInstagramPage !== null) && (
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
                      <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
                      <p className="text-indigo-200 text-lg mb-6">
                        Now let's create your ad creative that will be shown to your target audience.
                      </p>
                      <div className="flex justify-center">
                        <button
                          onClick={() => setAdsSubStep(2)}
                          className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
                        >
                          Create Ad
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-step 2: Create Ad */}
              {adsSubStep === 2 && (
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4 text-center">Create your ad</h2>
                  <p className="text-gray-400 mb-8 text-center">
                    Design the ad that will attract your target audience.
                  </p>

                  <div className="max-w-3xl mx-auto">
                    {/* Image Selection */}
                    <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 mb-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Ad Image</h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                          onClick={() => setAdImageMethod('upload')}
                          className={`p-6 rounded-lg border-2 transition-all ${
                            adImageMethod === 'upload'
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <Upload className={`w-8 h-8 mx-auto mb-3 ${adImageMethod === 'upload' ? 'text-indigo-400' : 'text-gray-400'}`} />
                          <h4 className="text-lg font-semibold text-white mb-1">Upload Image</h4>
                          <p className="text-gray-400 text-sm">Use your own image</p>
                        </button>
                        <button
                          onClick={() => {
                            setAdImageMethod('ai');
                            setAdImageUrl('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80');
                          }}
                          className={`p-6 rounded-lg border-2 transition-all ${
                            adImageMethod === 'ai'
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <Sparkles className={`w-8 h-8 mx-auto mb-3 ${adImageMethod === 'ai' ? 'text-indigo-400' : 'text-gray-400'}`} />
                          <h4 className="text-lg font-semibold text-white mb-1">AI Create</h4>
                          <p className="text-gray-400 text-sm">Generate with AI</p>
                        </button>
                      </div>

                      {adImageMethod === 'upload' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Image URL
                          </label>
                          <input
                            type="text"
                            placeholder="https://example.com/image.jpg"
                            value={adImageUrl}
                            onChange={(e) => setAdImageUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                          />
                        </div>
                      )}

                      {adImageMethod === 'ai' && (
                        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
                          <p className="text-indigo-300 mb-3">
                            ✓ AI will generate an image based on your idea description
                          </p>
                          {adImageUrl && (
                            <img src={adImageUrl} alt="AI Generated Preview" className="w-full rounded-lg" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ad Copy */}
                    <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 mb-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Ad Creative</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Headline *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Transform Your Mornings"
                            value={adHeadline}
                            onChange={(e) => setAdHeadline(e.target.value)}
                            maxLength={40}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                          />
                          <p className="text-gray-500 text-sm mt-1">{adHeadline.length}/40 characters</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description *
                          </label>
                          <textarea
                            placeholder="e.g., Healthy meal prep delivered to your door. Save time, eat better."
                            value={adDescription}
                            onChange={(e) => setAdDescription(e.target.value)}
                            maxLength={125}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors h-24"
                          />
                          <p className="text-gray-500 text-sm mt-1">{adDescription.length}/125 characters</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Call to Action *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Learn More"
                            value={adCta}
                            onChange={(e) => setAdCta(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ad Format Previews */}
                    {adImageUrl && adHeadline && adDescription && adCta && (
                      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 mb-6">
                        <h3 className="text-xl font-semibold text-white mb-6">Ad Format Previews</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                          {/* 1:1 Square */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-3 text-center">1:1 Square (Feed)</h4>
                            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                              <div className="aspect-square">
                                <img src={adImageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="p-4">
                                <h5 className="text-white font-semibold mb-1 text-sm">{adHeadline}</h5>
                                <p className="text-gray-400 text-xs mb-3 line-clamp-2">{adDescription}</p>
                                <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-semibold">
                                  {adCta}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 9:16 Vertical (Story) */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-3 text-center">9:16 Story</h4>
                            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 max-w-[200px] mx-auto">
                              <div style={{ aspectRatio: '9/16' }}>
                                <img src={adImageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="p-3">
                                <h5 className="text-white font-semibold mb-1 text-xs">{adHeadline}</h5>
                                <p className="text-gray-400 text-xs mb-2 line-clamp-2">{adDescription}</p>
                                <button className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold">
                                  {adCta}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 16:9 Horizontal */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-3 text-center">16:9 Horizontal</h4>
                            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                              <div style={{ aspectRatio: '16/9' }}>
                                <img src={adImageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="p-3">
                                <h5 className="text-white font-semibold mb-1 text-sm">{adHeadline}</h5>
                                <p className="text-gray-400 text-xs mb-2 line-clamp-2">{adDescription}</p>
                                <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-semibold">
                                  {adCta}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Promise Panel */}
                    {adImageUrl && adHeadline && adDescription && adCta && (
                      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
                        <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
                        <p className="text-indigo-200 text-lg mb-6">
                          We will launch a minimal amount of ads to gauge your target audience's interest and gather real market data.
                        </p>
                        <div className="flex justify-between">
                          <button
                            onClick={() => setAdsSubStep(1)}
                            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => setActiveStep('results')}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
                          >
                            Launch Validation Test
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            )}

            {/* Analyze Results Step */}
            {activeStep === 'results' && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-6 text-center">Analyze Results</h1>
                
                {/* Rationale Panel */}
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-4">
                  <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-100 text-lg">
                    So you can gauge interest in real-time and make data-driven decisions about your idea's market fit
                  </p>
                </div>

                <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Test in Progress</h3>
                    <p className="text-gray-400 mb-6">
                      We're launching your landing page and ads. Check back in 24-48 hours for initial results.
                    </p>
                    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="bg-gray-800 rounded-lg p-6">
                        <div className="text-3xl font-bold text-white mb-1">0</div>
                        <div className="text-sm text-gray-400">Page Visits</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-6">
                        <div className="text-3xl font-bold text-white mb-1">0</div>
                        <div className="text-sm text-gray-400">Sign-ups</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-6">
                        <div className="text-3xl font-bold text-white mb-1">0%</div>
                        <div className="text-sm text-gray-400">Conversion Rate</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promise Panel with Actions */}
                <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
                  <h3 className="text-xl font-semibold text-white mb-3">What you can do</h3>
                  <p className="text-indigo-200 text-lg mb-6">
                    Monitor real-time results to gauge market interest, then decide whether to stop the experiment or continue to iterate and optimize.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button className="px-8 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-lg">
                      Stop Experiment
                    </button>
                    <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg">
                      Continue to Iterate
                    </button>
                  </div>
                </div>
              </div>
            )}
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