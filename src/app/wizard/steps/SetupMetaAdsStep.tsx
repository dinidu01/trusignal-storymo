import { useMemo, useRef, useState } from 'react';
import { Check, Lightbulb, Upload, Sparkles } from 'lucide-react';

type SetupMetaAdsStepProps = {
  adsSubStep: number;
  setAdsSubStep: (step: number) => void;
  hasFacebookPage: boolean | null;
  setHasFacebookPage: (value: boolean) => void;
  hasInstagramPage: boolean | null;
  setHasInstagramPage: (value: boolean) => void;
  facebookPageUrl: string;
  setFacebookPageUrl: (value: string) => void;
  instagramPageUrl: string;
  setInstagramPageUrl: (value: string) => void;
  adImageMethod: 'upload' | 'ai' | null;
  setAdImageMethod: (value: 'upload' | 'ai') => void;
  adImageUrl: string;
  setAdImageUrl: (value: string) => void;
  adHeadline: string;
  setAdHeadline: (value: string) => void;
  adDescription: string;
  setAdDescription: (value: string) => void;
  adCta: string;
  setAdCta: (value: string) => void;
  adAgeMin: number;
  setAdAgeMin: (value: number) => void;
  adAgeMax: number;
  setAdAgeMax: (value: number) => void;
  adCountries: string[];
  setAdCountries: (value: string[]) => void;
  adBudgetPerDay: 10 | 25 | 50 | null;
  setAdBudgetPerDay: (value: 10 | 25 | 50) => void;
  adDurationDays: 3 | 7 | 10 | null;
  setAdDurationDays: (value: 3 | 7 | 10) => void;
  setActiveStep: (step: 'landing' | 'domain' | 'ads' | 'email' | 'results') => void;
};

declare global {
  interface Window {
    FB?: {
      init: (config: Record<string, unknown>) => void;
      login: (
        callback: (response: { status?: string; authResponse?: { accessToken?: string } }) => void,
        options?: { scope?: string }
      ) => void;
      api: (
        path: string,
        method: 'GET' | 'POST',
        params: Record<string, unknown>,
        callback: (response: any) => void
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type FacebookPage = {
  id: string;
  name: string;
  link?: string;
  pictureUrl?: string;
};

type InstagramBusinessAccount = {
  id: string;
  username: string;
  profilePictureUrl?: string;
  connectedFacebookPageId: string;
};

export function SetupMetaAdsStep({
  adsSubStep,
  setAdsSubStep,
  hasFacebookPage,
  setHasFacebookPage,
  hasInstagramPage,
  setHasInstagramPage,
  facebookPageUrl,
  setFacebookPageUrl,
  instagramPageUrl,
  setInstagramPageUrl,
  adImageMethod,
  setAdImageMethod,
  adImageUrl,
  setAdImageUrl,
  adHeadline,
  setAdHeadline,
  adDescription,
  setAdDescription,
  adCta,
  setAdCta,
  adAgeMin,
  setAdAgeMin,
  adAgeMax,
  setAdAgeMax,
  adCountries,
  setAdCountries,
  adBudgetPerDay,
  setAdBudgetPerDay,
  adDurationDays,
  setAdDurationDays,
  setActiveStep,
}: SetupMetaAdsStepProps) {
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;

  const [metaConnectStatus, setMetaConnectStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [metaAuthStatus, setMetaAuthStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [metaErrorMessage, setMetaErrorMessage] = useState<string | null>(null);

  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [instagramBusinessAccounts, setInstagramBusinessAccounts] = useState<InstagramBusinessAccount[]>([]);
  const [facebookPageQuery, setFacebookPageQuery] = useState('');
  const [instagramAccountQuery, setInstagramAccountQuery] = useState('');

  const sdkLoadPromiseRef = useRef<Promise<void> | null>(null);
  const shouldFetchInstagramAccountsRef = useRef(false);

  const ensureFacebookSdkLoaded = async () => {
    if (!facebookAppId) {
      setMetaConnectStatus('error');
      setMetaErrorMessage('Facebook App ID is not configured.');
      return false;
    }

    if (window.FB) {
      setMetaConnectStatus('ready');
      return true;
    }

    if (sdkLoadPromiseRef.current) {
      await sdkLoadPromiseRef.current;
      return Boolean(window.FB);
    }

    setMetaConnectStatus('loading');
    setMetaErrorMessage(null);

    sdkLoadPromiseRef.current = new Promise<void>((resolve, reject) => {
      window.fbAsyncInit = () => {
        try {
          window.FB?.init({
            appId: facebookAppId,
            cookie: true,
            xfbml: false,
            version: 'v19.0',
          });
          setMetaConnectStatus('ready');
          resolve();
        } catch (error) {
          setMetaConnectStatus('error');
          setMetaErrorMessage('Failed to initialize Facebook SDK.');
          reject(error);
        }
      };

      const existingScript = document.getElementById('facebook-jssdk');

      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          setMetaConnectStatus('error');
          setMetaErrorMessage('Failed to load Facebook SDK.');
          reject(new Error('facebook sdk load failed'));
        };

        document.body.appendChild(script);
      }
    });

    await sdkLoadPromiseRef.current;
    return Boolean(window.FB);
  };

  const connectMetaAccount = async () => {
    const sdkReady = await ensureFacebookSdkLoaded();
    if (!sdkReady || !window.FB) return;

    setMetaAuthStatus('connecting');
    setMetaErrorMessage(null);

    window.FB.login(
      (response) => {
        if (response?.authResponse?.accessToken) {
          setMetaAuthStatus('connected');
          fetchManagedFacebookPages();
          return;
        }

        setMetaAuthStatus('error');
        setMetaErrorMessage('Login was cancelled or did not return an access token.');
      },
      {
        scope: 'public_profile,email,pages_show_list,pages_read_engagement,instagram_basic',
      }
    );
  };

  const fetchManagedFacebookPages = () => {
    if (!window.FB) return;

    window.FB.api(
      '/me/accounts',
      'GET',
      {
        fields: 'id,name,link,picture{url}',
      },
      (response) => {
        const pages = Array.isArray(response?.data)
          ? (response.data as any[]).map((page) => ({
              id: String(page.id),
              name: String(page.name),
              link: typeof page.link === 'string' ? page.link : undefined,
              pictureUrl: page?.picture?.data?.url ? String(page.picture.data.url) : undefined,
            }))
          : [];

        setFacebookPages(pages);

        if (hasInstagramPage || shouldFetchInstagramAccountsRef.current) {
          shouldFetchInstagramAccountsRef.current = false;
          fetchInstagramBusinessAccounts(pages);
        }
      }
    );
  };

  const fetchInstagramBusinessAccounts = (pages: FacebookPage[]) => {
    if (!window.FB) return;

    const requests = pages.map(
      (page) =>
        new Promise<InstagramBusinessAccount | null>((resolve) => {
          window.FB?.api(
            `/${page.id}`,
            'GET',
            {
              fields: 'instagram_business_account{username,id,profile_picture_url}',
            },
            (response) => {
              const ig = response?.instagram_business_account;
              if (!ig?.id || !ig?.username) {
                resolve(null);
                return;
              }

              resolve({
                id: String(ig.id),
                username: String(ig.username),
                profilePictureUrl: ig.profile_picture_url ? String(ig.profile_picture_url) : undefined,
                connectedFacebookPageId: page.id,
              });
            }
          );
        })
    );

    Promise.all(requests).then((accounts) => {
      setInstagramBusinessAccounts(accounts.filter(Boolean) as InstagramBusinessAccount[]);
    });
  };

  const filteredFacebookPages = useMemo(() => {
    const normalizedQuery = facebookPageQuery.trim().toLowerCase();
    if (!normalizedQuery) return facebookPages;
    return facebookPages.filter((page) => page.name.toLowerCase().includes(normalizedQuery));
  }, [facebookPages, facebookPageQuery]);

  const filteredInstagramAccounts = useMemo(() => {
    const normalizedQuery = instagramAccountQuery.trim().toLowerCase();
    if (!normalizedQuery) return instagramBusinessAccounts;
    return instagramBusinessAccounts.filter((account) => account.username.toLowerCase().includes(normalizedQuery));
  }, [instagramBusinessAccounts, instagramAccountQuery]);

  const availableCountries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'India',
    'Sri Lanka',
  ];

  const toggleCountry = (country: string) => {
    if (adCountries.includes(country)) {
      setAdCountries(adCountries.filter((c) => c !== country));
      return;
    }

    setAdCountries([...adCountries, country]);
  };

  const canLaunch =
    adBudgetPerDay !== null && adDurationDays !== null && adCountries.length > 0 && adAgeMin >= 13 && adAgeMax >= adAgeMin;

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-6 text-center">Setup Meta Ads</h1>

      {/* Rationale Panel */}
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-4 max-w-3xl mx-auto">
        <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-100 text-lg">So we can run real ads and drive targeted traffic to test demand</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                adsSubStep === step
                  ? 'bg-indigo-600 text-white'
                  : adsSubStep > step
                    ? 'bg-indigo-600/30 text-indigo-400'
                    : 'bg-gray-800 text-gray-500'
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div className={`w-16 h-1 ${adsSubStep > step ? 'bg-indigo-600/30' : 'bg-gray-800'}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Sub-step 1: Connect Pages */}
      {adsSubStep === 1 && (
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Connect your social pages</h2>
          <p className="text-gray-400 mb-8 text-center">Link your Facebook and Instagram pages to run ads.</p>

          <div className="max-w-3xl mx-auto space-y-8">
            {/* Facebook Page Section */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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
                  onClick={() => {
                    setHasFacebookPage(true);
                    void connectMetaAccount();
                  }}
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
                <div className="space-y-4">
                  {!facebookAppId ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                      <p className="text-amber-100 text-sm">
                        Add a Facebook App ID (VITE_FACEBOOK_APP_ID) to enable page search via Facebook Login (permissions: pages_show_list, pages_read_engagement). For now, paste your page URL below.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <div className="text-white font-semibold">Find your Facebook Page</div>
                          <div className="text-gray-400 text-sm">Connect to list pages you manage.</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void connectMetaAccount()}
                          disabled={metaAuthStatus === 'connecting' || metaConnectStatus === 'loading'}
                          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50"
                        >
                          {metaAuthStatus === 'connecting'
                            ? 'Connecting...'
                            : metaAuthStatus === 'connected'
                              ? 'Re-connect'
                              : 'Connect Facebook'}
                        </button>
                      </div>

                      {metaErrorMessage && <p className="text-red-400 text-sm mt-3">{metaErrorMessage}</p>}

                      {metaAuthStatus === 'connected' && (
                        <div className="mt-5 space-y-4">
                          <input
                            type="text"
                            placeholder="Search pages you manage"
                            value={facebookPageQuery}
                            onChange={(e) => setFacebookPageQuery(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                          />

                          <div className="grid sm:grid-cols-2 gap-3">
                            {filteredFacebookPages.map((page) => {
                              const isSelected = Boolean(page.link && page.link === facebookPageUrl);

                              return (
                                <button
                                  key={page.id}
                                  type="button"
                                  onClick={() => setFacebookPageUrl(page.link ?? '')}
                                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors text-left ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-500/10'
                                      : 'border-gray-700 hover:border-gray-600 bg-gray-900/40'
                                  }`}
                                >
                                  {page.pictureUrl ? (
                                    <img
                                      src={page.pictureUrl}
                                      alt={page.name}
                                      className="w-10 h-10 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-white font-semibold truncate">{page.name}</div>
                                    <div className="text-gray-400 text-sm truncate">{page.link ?? 'No page URL available'}</div>
                                  </div>
                                </button>
                              );
                            })}

                            {filteredFacebookPages.length === 0 && (
                              <div className="sm:col-span-2 text-gray-400 text-sm bg-gray-900/40 border border-gray-700 rounded-lg p-4">
                                No pages found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Facebook Page URL</label>
                    <input
                      type="text"
                      placeholder="https://facebook.com/yourpage"
                      value={facebookPageUrl}
                      onChange={(e) => setFacebookPageUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {hasFacebookPage === false && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
                  <p className="text-indigo-300">✓ We'll help you create a Facebook page optimized for your validation test.</p>
                </div>
              )}
            </div>

            {/* Instagram Page Section */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
                  onClick={() => {
                    setHasInstagramPage(true);
                    shouldFetchInstagramAccountsRef.current = true;

                    if (metaAuthStatus === 'connected' && facebookPages.length > 0) {
                      fetchInstagramBusinessAccounts(facebookPages);
                      return;
                    }

                    void connectMetaAccount();
                  }}
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
                <div className="space-y-4">
                  {!facebookAppId ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                      <p className="text-amber-100 text-sm">
                        Add a Facebook App ID (VITE_FACEBOOK_APP_ID) to enable Instagram account search via Facebook Login (permissions: instagram_basic, pages_show_list). For now, paste your Instagram URL below.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <div className="text-white font-semibold">Find your Instagram Business Account</div>
                          <div className="text-gray-400 text-sm">We’ll show Instagram accounts connected to your Facebook Pages.</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (metaAuthStatus === 'connected' && facebookPages.length > 0) {
                              fetchInstagramBusinessAccounts(facebookPages);
                            } else {
                              void connectMetaAccount();
                            }
                          }}
                          disabled={metaAuthStatus === 'connecting' || metaConnectStatus === 'loading'}
                          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50"
                        >
                          {metaAuthStatus === 'connecting'
                            ? 'Connecting...'
                            : metaAuthStatus === 'connected'
                              ? 'Refresh accounts'
                              : 'Connect Instagram'}
                        </button>
                      </div>

                      {metaErrorMessage && <p className="text-red-400 text-sm mt-3">{metaErrorMessage}</p>}

                      {metaAuthStatus === 'connected' && (
                        <div className="mt-5 space-y-4">
                          <input
                            type="text"
                            placeholder="Search Instagram accounts"
                            value={instagramAccountQuery}
                            onChange={(e) => setInstagramAccountQuery(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                          />

                          <div className="grid sm:grid-cols-2 gap-3">
                            {filteredInstagramAccounts.map((account) => {
                              const url = `https://instagram.com/${account.username}`;
                              const isSelected = url === instagramPageUrl;

                              return (
                                <button
                                  key={account.id}
                                  type="button"
                                  onClick={() => setInstagramPageUrl(url)}
                                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors text-left ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-500/10'
                                      : 'border-gray-700 hover:border-gray-600 bg-gray-900/40'
                                  }`}
                                >
                                  {account.profilePictureUrl ? (
                                    <img
                                      src={account.profilePictureUrl}
                                      alt={account.username}
                                      className="w-10 h-10 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-white font-semibold truncate">@{account.username}</div>
                                    <div className="text-gray-400 text-sm truncate">Connected via Facebook Page</div>
                                  </div>
                                </button>
                              );
                            })}

                            {filteredInstagramAccounts.length === 0 && (
                              <div className="sm:col-span-2 text-gray-400 text-sm bg-gray-900/40 border border-gray-700 rounded-lg p-4">
                                No connected Instagram business accounts found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Instagram Page URL</label>
                    <input
                      type="text"
                      placeholder="https://instagram.com/yourpage"
                      value={instagramPageUrl}
                      onChange={(e) => setInstagramPageUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {hasInstagramPage === false && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
                  <p className="text-indigo-300">✓ We'll help you create an Instagram account optimized for your validation test.</p>
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
        </div>
      )}

      {/* Sub-step 2: Create Ad */}
      {adsSubStep === 2 && (
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Create your ad</h2>
          <p className="text-gray-400 mb-8 text-center">Design the ad that will attract your target audience.</p>

          <div className="max-w-3xl mx-auto">
            {/* Image Selection */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Ad Image</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setAdImageMethod('upload')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    adImageMethod === 'upload' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Upload
                    className={`w-8 h-8 mx-auto mb-3 ${
                      adImageMethod === 'upload' ? 'text-indigo-400' : 'text-gray-400'
                    }`}
                  />
                  <h4 className="text-lg font-semibold text-white mb-1">Upload Image</h4>
                  <p className="text-gray-400 text-sm">Use your own image</p>
                </button>
                <button
                  onClick={() => {
                    setAdImageMethod('ai');
                    setAdImageUrl('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80');
                  }}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    adImageMethod === 'ai' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Sparkles
                    className={`w-8 h-8 mx-auto mb-3 ${adImageMethod === 'ai' ? 'text-indigo-400' : 'text-gray-400'}`}
                  />
                  <h4 className="text-lg font-semibold text-white mb-1">AI Create</h4>
                  <p className="text-gray-400 text-sm">Generate with AI</p>
                </button>
              </div>

              {adImageMethod === 'upload' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
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
                  <p className="text-indigo-300 mb-3">✓ AI will generate an image based on your idea description</p>
                  {adImageUrl && <img src={adImageUrl} alt="AI Generated Preview" className="w-full rounded-lg" />}
                </div>
              )}
            </div>

            {/* Ad Copy */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Ad Creative</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Headline *</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Call to Action *</label>
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
                        <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-semibold">{adCta}</button>
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
                        <button className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold">{adCta}</button>
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
                        <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-semibold">{adCta}</button>
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
                    onClick={() => setAdsSubStep(3)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
                  >
                    Setup Ad & Launch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-step 3: Setup Ad & Launch */}
      {adsSubStep === 3 && (
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Setup Ad & Launch</h2>
          <p className="text-gray-400 mb-8 text-center">
            Set your audience targeting and budget to launch a small validation test.
          </p>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* Audience */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">Audience</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Age range</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={13}
                      max={120}
                      value={adAgeMin}
                      onChange={(e) => setAdAgeMin(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                    <span className="text-gray-500 font-semibold">to</span>
                    <input
                      type="number"
                      min={13}
                      max={120}
                      value={adAgeMax}
                      onChange={(e) => setAdAgeMax(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-gray-500 text-sm mt-2">Meta requires ages 13+.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Countries</label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableCountries.map((country) => {
                      const selected = adCountries.includes(country);

                      return (
                        <button
                          key={country}
                          onClick={() => toggleCountry(country)}
                          className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all flex items-center justify-between gap-3 ${
                            selected
                              ? 'border-indigo-500 bg-indigo-500/10 text-white'
                              : 'border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <span className="text-left text-sm">{country}</span>
                          {selected && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-gray-500 text-sm mt-2">Select one or more target countries.</p>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">Budget & Duration</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Budget per day</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([10, 25, 50] as const).map((budget) => (
                      <button
                        key={budget}
                        onClick={() => setAdBudgetPerDay(budget)}
                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                          adBudgetPerDay === budget
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        ${budget}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-500 text-sm mt-2">Choose a small daily budget to validate quickly.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Duration</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([3, 7, 10] as const).map((days) => (
                      <button
                        key={days}
                        onClick={() => setAdDurationDays(days)}
                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                          adDurationDays === days
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-500 text-sm mt-2">Shorter tests are faster; longer tests are more reliable.</p>
                </div>
              </div>
            </div>

            {/* Promise Panel */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
              <p className="text-indigo-200 text-lg mb-6">
                We'll launch your ads with this targeting and budget, then start collecting performance data.
              </p>
              <div className="flex justify-between">
                <button
                  onClick={() => setAdsSubStep(2)}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('email')}
                  disabled={!canLaunch}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Launch Validation Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
