import { useState, useEffect } from 'react';
import { Check, ArrowRight, TrendingUp, Clock, DollarSign, Target, X, LayoutDashboard, Megaphone, BarChart3, Plus, Lightbulb, Upload, Sparkles, Mail, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { MyDataPage } from '../pages/MyDataPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { CreateLandingPageStep } from './wizard/steps/CreateLandingPageStep';
import { SetupMetaAdsStep } from './wizard/steps/SetupMetaAdsStep';
import { SetupEmailReceivingStep } from './wizard/steps/SetupEmailReceivingStep';
import { AnalyzeResultsStep } from './wizard/steps/AnalyzeResultsStep';
import { AuthModal } from './components/AuthModal';
import { supabase } from '../lib/supabaseClient';

export default function App() {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [heroIdeaText, setHeroIdeaText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<{ email?: string; name?: string } | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeStep, setActiveStep] = useState<'landing' | 'domain' | 'ads' | 'email' | 'results'>('landing');
  const [landingCompleted, setLandingCompleted] = useState(false);
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

  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [currentSearch, setCurrentSearch] = useState(() => window.location.search);
  const [checkoutNotice, setCheckoutNotice] = useState<{
    status: 'success' | 'cancel';
    type: 'ads' | 'domain';
    domain?: string;
  } | null>(null);
  const [purchasedDomain, setPurchasedDomain] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setCurrentSearch(window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path === currentPath) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setCurrentSearch(window.location.search);
    window.scrollTo(0, 0);
  };

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
  const [adLocationScope, setAdLocationScope] = useState<'local' | 'global'>('global');
  const [adLocalPlace, setAdLocalPlace] = useState<{ label: string; lat: number; lon: number } | null>(null);
  const [adGenders, setAdGenders] = useState<Array<'women' | 'men'>>(['women', 'men']);
  const [adBudgetPerDay, setAdBudgetPerDay] = useState<10 | 25 | 50 | null>(25);
  const [adDurationDays, setAdDurationDays] = useState<3 | 7 | 10 | null>(7);

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

  useEffect(() => {
    if (currentPath !== '/') return;
    const params = new URLSearchParams(currentSearch);
    const stepParam = params.get('step');
    const substepParam = params.get('substep');
    const checkoutParam = params.get('checkout');
    const typeParam = params.get('type');
    const domainParam = params.get('domain');

    if (stepParam === 'landing' || stepParam === 'ads' || stepParam === 'email' || stepParam === 'results') {
      setActiveStep(stepParam);
    }

    if (stepParam === 'landing' && substepParam) {
      const parsed = Number(substepParam);
      if (Number.isFinite(parsed)) {
        setLandingSubStep(Math.min(4, Math.max(1, Math.round(parsed))));
      }
    }

    if (stepParam === 'ads' && substepParam) {
      const parsed = Number(substepParam);
      if (Number.isFinite(parsed)) {
        setAdsSubStep(Math.min(4, Math.max(1, Math.round(parsed))));
      }
    }

    if ((checkoutParam === 'success' || checkoutParam === 'cancel') && (typeParam === 'ads' || typeParam === 'domain')) {
      setCheckoutNotice({
        status: checkoutParam,
        type: typeParam,
        domain: domainParam ?? undefined,
      });
    }

    if (typeParam === 'domain' && domainParam && checkoutParam === 'success') {
      setPurchasedDomain(domainParam);
    }

    if (checkoutParam) {
      params.delete('checkout');
      params.delete('type');
      params.delete('domain');
      const newSearch = params.toString();
      const nextUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState({}, '', nextUrl);
        setCurrentSearch(window.location.search);
      }
    }
  }, [currentSearch, currentPath]);

  useEffect(() => {
    if (!checkoutNotice) return;
    const timeout = window.setTimeout(() => {
      setCheckoutNotice(null);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [checkoutNotice]);

  useEffect(() => {
    if (currentPath !== '/') return;
    const params = new URLSearchParams(currentSearch);
    params.set('step', activeStep);
    if (activeStep === 'landing') {
      params.set('substep', String(landingSubStep));
    } else if (activeStep === 'ads') {
      params.set('substep', String(adsSubStep));
    } else {
      params.delete('substep');
    }

    const newSearch = params.toString();
    const nextUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState({}, '', nextUrl);
      setCurrentSearch(window.location.search);
    }
  }, [activeStep, landingSubStep, adsSubStep, currentSearch, currentPath]);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      setIsLoggedIn(!!session);
      if (session?.user) {
        setUserProfile({
          email: session.user.email ?? undefined,
          name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? undefined,
        });
      }
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        setUserProfile({
          email: session.user.email ?? undefined,
          name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? undefined,
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const toggleQuestion = (index: number) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setIsLoggedIn(false);
  };

  const steps = [
    { id: 'landing' as const, icon: LayoutDashboard, label: 'Create Landing Page' },
    { id: 'ads' as const, icon: Megaphone, label: 'Setup Meta Ads' },
    { id: 'email' as const, icon: Mail, label: 'Setup Email Receiving', optional: true },
    { id: 'results' as const, icon: BarChart3, label: 'Get your TruSignal' },
  ];

  if (currentPath === '/mydata') {
    return <MyDataPage navigate={navigate} />;
  }

  if (currentPath === '/privacy') {
    return <PrivacyPage navigate={navigate} />;
  }

  if (isLoggedIn) {
    return (
        <div className="min-h-screen bg-black flex">
        {/* Sidebar */}
        <div
          className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-200 ${
            isSidebarCollapsed ? 'w-20' : 'w-72'
          }`}
        >
          <div className="p-6 border-b border-gray-800">
            <div
              className={`flex items-center ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {isSidebarCollapsed ? 'TS' : 'TruSignal'}
              </div>
              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="mt-4 w-full flex items-center justify-center p-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 p-4">
            <button
              onClick={() => setShowNewIdeaInput(true)}
              className={`w-full rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 mb-6 ${
                isSidebarCollapsed ? 'px-2 py-3' : 'px-4 py-3'
              }`}
              aria-label="New idea"
              title="New Idea"
            >
              <Plus className="w-5 h-5" />
              {!isSidebarCollapsed && 'New Idea'}
            </button>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full rounded-lg flex items-center gap-3 transition-colors ${
                    activeStep === step.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  } ${isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3 text-left'}`}
                  aria-label={`Step ${index + 1}: ${step.label}`}
                  title={`Step ${index + 1}: ${step.label}`}
                >
                  <div className="relative">
                    <step.icon className="w-5 h-5" />
                    {step.id === 'landing' && landingCompleted && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border border-emerald-300/30">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div>
                      <div className="text-xs text-gray-500">
                        Step {index + 1}
                        {step.optional ? ' (Optional)' : ''}
                      </div>
                      <div className="font-medium">{step.label}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-800">
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {userProfile?.name ?? 'Signed in'}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {userProfile?.email ?? 'No email'}
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowAccountModal(true)}
                className="p-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
                aria-label="Account settings"
                title="Account settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
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
                setLandingCompleted={setLandingCompleted}
                domainCheckoutStatus={checkoutNotice?.type === 'domain' ? checkoutNotice.status : null}
                purchasedDomain={purchasedDomain}
                onDismissDomainCheckoutNotice={() => setCheckoutNotice(null)}
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
                userEmail={userProfile?.email}
                ideaDescription={ideaDescription}
                targetAudience={targetAudience}
                problemSolved={problemSolved}
                domainChoice={domainChoice}
                customDomain={customDomain}
                purchasedDomain={purchasedDomain}
                adAgeMin={adAgeMin}
                setAdAgeMin={setAdAgeMin}
                adAgeMax={adAgeMax}
                setAdAgeMax={setAdAgeMax}
                adCountries={adCountries}
                setAdCountries={setAdCountries}
                adLocationScope={adLocationScope}
                setAdLocationScope={setAdLocationScope}
                adLocalPlace={adLocalPlace}
                setAdLocalPlace={setAdLocalPlace}
                adGenders={adGenders}
                setAdGenders={setAdGenders}
                adBudgetPerDay={adBudgetPerDay}
                setAdBudgetPerDay={setAdBudgetPerDay}
                adDurationDays={adDurationDays}
                setAdDurationDays={setAdDurationDays}
                setActiveStep={setActiveStep}
                adsCheckoutStatus={checkoutNotice?.type === 'ads' ? checkoutNotice.status : null}
                onDismissAdsCheckoutNotice={() => setCheckoutNotice(null)}
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

        {showAccountModal && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAccountModal(false)}
          >
            <div
              className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-800 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Account</h2>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-6">
                <div className="text-sm font-semibold text-white">
                  {userProfile?.name ?? 'Signed in'}
                </div>
                <div className="text-xs text-gray-400">{userProfile?.email ?? 'No email'}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors font-semibold"
              >
                Sign Out
              </button>
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
                placeholder={typedText.length > 0 ? typedText : 'What do you want to make?'}
                className="w-full px-8 py-6 pr-24 text-lg bg-gray-900 border-2 border-gray-700 text-white placeholder-gray-500 rounded-2xl focus:border-indigo-500 focus:outline-none transition-colors"
                value={heroIdeaText}
                onChange={(e) => setHeroIdeaText(e.target.value)}
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
                  <span className="text-6xl font-bold text-white">$49/month</span>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                {[
                  'Unlimited business idea validations',
                  'Complete business in a box',
                  'Custom Landing page, Website domain, + waitlist',
                  'Validation dashboard'
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
            <button type="button" onClick={() => navigate('/privacy')} className="hover:text-indigo-400 transition-colors">Privacy</button>
            <span className="text-gray-700">·</span>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
            <span className="text-gray-700">·</span>
            <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
