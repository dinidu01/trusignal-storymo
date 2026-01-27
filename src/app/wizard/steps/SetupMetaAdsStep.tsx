import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Lightbulb, LocateFixed, LogOut, Upload, Sparkles, Users, Wallet, X } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

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
  userEmail?: string;
  ideaDescription: string;
  targetAudience: string;
  problemSolved: string;
  domainChoice: 'custom' | 'trusignal' | null;
  customDomain: string;
  purchasedDomain: string | null;
  adAgeMin: number;
  setAdAgeMin: (value: number) => void;
  adAgeMax: number;
  setAdAgeMax: (value: number) => void;
  adCountries: string[];
  setAdCountries: (value: string[]) => void;
  adLocationScope: 'local' | 'global';
  setAdLocationScope: (value: 'local' | 'global') => void;
  adLocalPlace: { label: string; lat: number; lon: number } | null;
  setAdLocalPlace: (value: { label: string; lat: number; lon: number } | null) => void;
  adGenders: Array<'women' | 'men'>;
  setAdGenders: (value: Array<'women' | 'men'>) => void;
  adBudgetPerDay: 10 | 25 | 50 | null;
  setAdBudgetPerDay: (value: 10 | 25 | 50) => void;
  adDurationDays: 3 | 7 | 10 | null;
  setAdDurationDays: (value: 3 | 7 | 10) => void;
  setActiveStep: (step: 'landing' | 'domain' | 'ads' | 'email' | 'results') => void;
  adsCheckoutStatus: 'success' | 'cancel' | null;
  onDismissAdsCheckoutNotice: () => void;
  ideaId: string | null;
  activeIdea: {
    id: string;
    idea_text: string;
    target_audience?: string | null;
    problem_solved?: string | null;
    research_data?: unknown | null;
    metadata?: Record<string, unknown> | null;
  } | null;
};

declare global {
  interface Window {
    FB?: {
      init: (config: Record<string, unknown>) => void;
      login: (
        callback: (response: { status?: string; authResponse?: { accessToken?: string } }) => void,
        options?: { scope?: string }
      ) => void;
      logout: (callback: (response: { status?: string }) => void) => void;
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
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
};

type InstagramBusinessAccount = {
  id: string;
  username: string;
  profilePictureUrl?: string;
  connectedFacebookPageId: string;
};

type FacebookUserProfile = {
  name: string;
  pictureUrl?: string;
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
  userEmail,
  ideaDescription,
  targetAudience,
  problemSolved,
  domainChoice,
  customDomain,
  purchasedDomain,
  adAgeMin,
  setAdAgeMin,
  adAgeMax,
  setAdAgeMax,
  adCountries,
  setAdCountries,
  adLocationScope,
  setAdLocationScope,
  adLocalPlace,
  setAdLocalPlace,
  adGenders,
  setAdGenders,
  adBudgetPerDay,
  setAdBudgetPerDay,
  adDurationDays,
  setAdDurationDays,
  setActiveStep,
  adsCheckoutStatus,
  onDismissAdsCheckoutNotice,
  ideaId,
  activeIdea,
}: SetupMetaAdsStepProps) {
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;

  const [metaConnectStatus, setMetaConnectStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [metaAuthStatus, setMetaAuthStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [metaErrorMessage, setMetaErrorMessage] = useState<string | null>(null);

  const [facebookUserProfile, setFacebookUserProfile] = useState<FacebookUserProfile | null>(null);
  const [showMetaAccountMenu, setShowMetaAccountMenu] = useState(false);

  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [instagramBusinessAccounts, setInstagramBusinessAccounts] = useState<InstagramBusinessAccount[]>([]);
  const [facebookPageQuery, setFacebookPageQuery] = useState('');
  const [instagramAccountQuery, setInstagramAccountQuery] = useState('');
  const [isInstagramSkipped, setIsInstagramSkipped] = useState(false);
  const [headlineOptions, setHeadlineOptions] = useState<string[]>([]);
  const [descriptionOptions, setDescriptionOptions] = useState<string[]>([]);
  const [headlineMode, setHeadlineMode] = useState<'preset' | 'custom'>('preset');
  const [descriptionMode, setDescriptionMode] = useState<'preset' | 'custom'>('preset');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadImageError, setUploadImageError] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<'image' | 'video' | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [moreCountryQuery, setMoreCountryQuery] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState<Array<{ label: string; lat: number; lon: number }>>([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [isLocatingPlace, setIsLocatingPlace] = useState(false);
  const [showLaunchReview, setShowLaunchReview] = useState(false);
  const [isLaunchingPayment, setIsLaunchingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [metaAccessToken, setMetaAccessToken] = useState<string | null>(null);
  const [suggestedSubdomain, setSuggestedSubdomain] = useState<string | null>(null);
  const [persistedFacebookPage, setPersistedFacebookPage] = useState<{
    id?: string;
    name?: string;
    link?: string;
  } | null>(null);
  const [persistedInstagramPage, setPersistedInstagramPage] = useState<{
    id?: string;
    username?: string;
    url?: string;
  } | null>(null);

  const sdkLoadPromiseRef = useRef<Promise<void> | null>(null);
  const shouldFetchInstagramAccountsRef = useRef(false);
  const hasTriggeredLaunchRef = useRef(false);
  const lastSavedMetaRef = useRef<string | null>(null);

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

  const connectMetaAccount = async (scopeOverride?: string) => {
    const sdkReady = await ensureFacebookSdkLoaded();
    if (!sdkReady || !window.FB) return;

    setMetaAuthStatus('connecting');
    setMetaErrorMessage(null);
    setShowMetaAccountMenu(false);

    window.FB.login(
      (response) => {
        if (response?.authResponse?.accessToken) {
          const accessToken = response.authResponse.accessToken;
          setMetaAccessToken(accessToken);
          sessionStorage.setItem('trusignal.metaAccessToken', accessToken);
          setMetaAuthStatus('connected');
          fetchFacebookUserProfile(accessToken);
          fetchManagedFacebookPages(accessToken);
          return;
        }

        setMetaAuthStatus('error');
        setMetaErrorMessage('Login was cancelled or did not return an access token.');
      },
      {
        scope: scopeOverride ?? 'public_profile,pages_show_list,instagram_basic',
      }
    );
  };

  const connectInstagramAccount = async () => {
    await connectMetaAccount('public_profile,pages_show_list,instagram_basic');
  };

  const fetchFacebookUserProfile = (accessToken?: string) => {
    if (!window.FB) return;

    window.FB.api(
      '/me',
      'GET',
      {
        fields: 'name,picture{url}',
        access_token: accessToken,
      },
      (response) => {
        if (!response?.name) {
          return;
        }

        setFacebookUserProfile({
          name: String(response.name),
          pictureUrl: response?.picture?.data?.url ? String(response.picture.data.url) : undefined,
        });
      }
    );
  };

  const signOutMetaAccount = () => {
    if (!window.FB) return;

    window.FB.logout(() => {
      setMetaAuthStatus('idle');
      setFacebookUserProfile(null);
      setFacebookPages([]);
      setInstagramBusinessAccounts([]);
      setFacebookPageQuery('');
      setInstagramAccountQuery('');
      setShowMetaAccountMenu(false);
      setMetaErrorMessage(null);
      setMetaAccessToken(null);
      sessionStorage.removeItem('trusignal.metaAccessToken');
    });
  };

  const fetchManagedFacebookPages = (accessToken?: string) => {
    if (!window.FB) return;

    window.FB.api(
      '/me/accounts',
      'GET',
      {
        fields: 'id,name,link,picture{url}',
        access_token: accessToken,
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
          fetchInstagramBusinessAccounts(pages, accessToken);
        }
      }
    );
  };

  const fetchInstagramBusinessAccounts = (pages: FacebookPage[], accessToken?: string) => {
    if (!window.FB) return;

    const requests = pages.map(
      (page) =>
        new Promise<InstagramBusinessAccount | null>((resolve) => {
          window.FB?.api(
            `/${page.id}`,
            'GET',
            {
              fields: 'instagram_business_account{username,id,profile_picture_url}',
              access_token: accessToken,
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

  useEffect(() => {
    if (metaAccessToken) return;
    const storedToken = sessionStorage.getItem('trusignal.metaAccessToken');
    if (storedToken) {
      setMetaAccessToken(storedToken);
    }
  }, [metaAccessToken]);

  useEffect(() => {
    if (!metaAccessToken) return;

    const hydrateMetaSession = async () => {
      const sdkReady = await ensureFacebookSdkLoaded();
      if (!sdkReady || !window.FB) return;
      setMetaAuthStatus('connected');
      fetchFacebookUserProfile(metaAccessToken);
      fetchManagedFacebookPages(metaAccessToken);
    };

    void hydrateMetaSession();
  }, [metaAccessToken]);

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

  const selectedFacebookPage = useMemo(() => {
    const matched = facebookPages.find((page) => page.link && page.link === facebookPageUrl);
    if (matched) return matched;
    if (persistedFacebookPage?.id) {
      return {
        id: persistedFacebookPage.id,
        name: persistedFacebookPage.name ?? 'Selected Page',
        link: persistedFacebookPage.link,
      };
    }
    return undefined;
  }, [facebookPages, facebookPageUrl, persistedFacebookPage]);

  const selectedInstagramAccount = useMemo(() => {
    const normalizedUrl = instagramPageUrl.trim().replace(/\/+$/, '');
    if (!normalizedUrl) {
      if (persistedInstagramPage?.id) {
        return {
          id: persistedInstagramPage.id,
          username: persistedInstagramPage.username ?? 'selected',
          profilePictureUrl: undefined,
          connectedFacebookPageId: persistedFacebookPage?.id ?? '',
        };
      }
      return undefined;
    }
    return (
      instagramBusinessAccounts.find(
        (account) => `https://instagram.com/${account.username}` === normalizedUrl
      ) ??
      (persistedInstagramPage?.id
        ? {
            id: persistedInstagramPage.id,
            username: persistedInstagramPage.username ?? 'selected',
            profilePictureUrl: undefined,
            connectedFacebookPageId: persistedFacebookPage?.id ?? '',
          }
        : undefined)
    );
  }, [instagramBusinessAccounts, instagramPageUrl, persistedFacebookPage, persistedInstagramPage]);

  const ideaSlug =
    ideaDescription
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .slice(0, 18) || 'youridea';

  const landingDomain =
    domainChoice === 'trusignal'
      ? `${suggestedSubdomain ?? ideaSlug}.trusignal.space`
      : domainChoice === 'custom'
        ? (purchasedDomain ?? customDomain).trim()
        : '';

  const destinationUrl = landingDomain
    ? landingDomain.startsWith('http')
      ? landingDomain
      : `https://${landingDomain}`
    : '';

  useEffect(() => {
    if (!ideaId) return;

    const loadIdeaMeta = async () => {
      const { data, error } = await supabase.from('ideas').select('metadata').eq('id', ideaId).single();
      if (error || !data?.metadata) return;

      const metaFacebook = data.metadata?.meta_facebook_page;
      const metaInstagram = data.metadata?.meta_instagram_page;
      const metaCreativePath = data.metadata?.meta_ad_creative_path;

      if (metaFacebook?.link && !facebookPageUrl) {
        setFacebookPageUrl(String(metaFacebook.link));
      }

      if (metaInstagram?.url && !instagramPageUrl) {
        setInstagramPageUrl(String(metaInstagram.url));
      }

      if (metaFacebook) {
        setPersistedFacebookPage({
          id: metaFacebook.id ? String(metaFacebook.id) : undefined,
          name: metaFacebook.name ? String(metaFacebook.name) : undefined,
          link: metaFacebook.link ? String(metaFacebook.link) : undefined,
        });
      }

      if (metaInstagram) {
        setPersistedInstagramPage({
          id: metaInstagram.id ? String(metaInstagram.id) : undefined,
          username: metaInstagram.username ? String(metaInstagram.username) : undefined,
          url: metaInstagram.url ? String(metaInstagram.url) : undefined,
        });
      }

      if (metaCreativePath && !adImageUrl) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from('idea-storage')
          .createSignedUrl(String(metaCreativePath), 3600);
        if (!signedError && signedData?.signedUrl) {
          setAdImageMethod('ai');
          setAdImageUrl(signedData.signedUrl);
        }
      }
    };

    void loadIdeaMeta();
  }, [adImageUrl, facebookPageUrl, ideaId, instagramPageUrl, setFacebookPageUrl, setInstagramPageUrl, setAdImageMethod, setAdImageUrl]);

  useEffect(() => {
    const suggested = activeIdea?.metadata?.suggested_subdomain;
    if (typeof suggested === 'string' && suggested.trim()) {
      setSuggestedSubdomain(suggested.trim());
    } else {
      setSuggestedSubdomain(null);
    }
  }, [activeIdea]);

  useEffect(() => {
    if (!ideaId) return;

    const facebookPayload = selectedFacebookPage
      ? {
          id: selectedFacebookPage.id,
          name: selectedFacebookPage.name,
          link: selectedFacebookPage.link ?? facebookPageUrl,
        }
      : facebookPageUrl
        ? { link: facebookPageUrl }
        : undefined;

    const instagramPayload = selectedInstagramAccount
      ? {
          id: selectedInstagramAccount.id,
          username: selectedInstagramAccount.username,
          url: `https://instagram.com/${selectedInstagramAccount.username}`,
        }
      : instagramPageUrl
        ? { url: instagramPageUrl }
        : undefined;

    if (!facebookPayload && !instagramPayload) return;

    const payload = {
      idea_id: ideaId,
      facebook_page: facebookPayload,
      instagram_page: instagramPayload,
    };

    const payloadKey = JSON.stringify(payload);
    if (payloadKey === lastSavedMetaRef.current) return;
    lastSavedMetaRef.current = payloadKey;

    const persistMeta = async () => {
      await supabase.functions.invoke('save-meta-pages', {
        body: payload,
      });
    };

    void persistMeta();
  }, [
    facebookPageUrl,
    ideaId,
    instagramPageUrl,
    selectedFacebookPage,
    selectedInstagramAccount,
    persistedFacebookPage,
    persistedInstagramPage,
  ]);

  const persistMetaSelection = async (nextFacebook?: { id?: string; name?: string; link?: string }, nextInstagram?: { id?: string; username?: string; url?: string }) => {
    if (!ideaId) return;

    const payload = {
      idea_id: ideaId,
      facebook_page: nextFacebook ?? undefined,
      instagram_page: nextInstagram ?? undefined,
    };

    if (!payload.facebook_page && !payload.instagram_page) return;

    const payloadKey = JSON.stringify(payload);
    if (payloadKey === lastSavedMetaRef.current) return;
    lastSavedMetaRef.current = payloadKey;

    await supabase.functions.invoke('save-meta-pages', {
      body: payload,
    });
  };

  const availableCountries = [
    { name: 'United States', flag: '🇺🇸' },
    { name: 'Canada', flag: '🇨🇦' },
    { name: 'United Kingdom', flag: '🇬🇧' },
    { name: 'Australia', flag: '🇦🇺' },
    { name: 'Germany', flag: '🇩🇪' },
    { name: 'France', flag: '🇫🇷' },
    { name: 'India', flag: '🇮🇳' },
    { name: 'Sri Lanka', flag: '🇱🇰' },
  ];

  const additionalCountries = [
    'Brazil',
    'Mexico',
    'Spain',
    'Italy',
    'Netherlands',
    'Sweden',
    'Norway',
    'Denmark',
    'Finland',
    'Ireland',
    'New Zealand',
    'Singapore',
    'United Arab Emirates',
    'South Africa',
    'Japan',
    'South Korea',
  ];

  const handleAddCountry = () => {
    const normalized = moreCountryQuery.trim();
    if (!normalized) return;
    if (adCountries.includes(normalized)) {
      setMoreCountryQuery('');
      return;
    }
    setAdCountries([...adCountries, normalized]);
    setMoreCountryQuery('');
  };

  const toggleCountry = (country: string) => {
    if (adCountries.includes(country)) {
      setAdCountries(adCountries.filter((c) => c !== country));
      return;
    }

    setAdCountries([...adCountries, country]);
  };

  const toggleGender = (gender: 'women' | 'men') => {
    if (adGenders.includes(gender)) {
      const next = adGenders.filter((value) => value !== gender);
      setAdGenders(next.length > 0 ? next : ['women', 'men']);
      return;
    }

    setAdGenders([...adGenders, gender]);
  };

  const currentCountryName = useMemo(() => {
    try {
      const region = navigator.language.split('-')[1];
      if (!region) return null;
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(region.toUpperCase()) ?? null;
    } catch {
      return null;
    }
  }, []);

  const countriesForSelection = useMemo(() => {
    if (!currentCountryName) return availableCountries;
    const matching = availableCountries.find((country) => country.name === currentCountryName);
    if (!matching) return availableCountries;
    return [matching, ...availableCountries.filter((country) => country.name !== matching.name)];
  }, [currentCountryName]);

  const handleSelectPlace = (place: { label: string; lat: number; lon: number }) => {
    setAdLocalPlace(place);
    setPlaceQuery(place.label);
    setPlaceSuggestions([]);
  };

  const handleLocateMe = async () => {
    if (!navigator.geolocation) return;

    setIsLocatingPlace(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const url = new URL('https://nominatim.openstreetmap.org/reverse');
          url.searchParams.set('format', 'json');
          url.searchParams.set('lat', String(lat));
          url.searchParams.set('lon', String(lon));

          const response = await fetch(url.toString());
          const data = await response.json();

          const label = typeof data?.display_name === 'string' && data.display_name.trim() ? data.display_name : 'Current location';
          handleSelectPlace({ label, lat, lon });
        } finally {
          setIsLocatingPlace(false);
        }
      },
      () => {
        setIsLocatingPlace(false);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (adLocationScope !== 'local') return;

    const query = placeQuery.trim();
    if (query.length < 3) {
      setPlaceSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setIsPlacesLoading(true);
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'json');
        url.searchParams.set('q', query);
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '5');

        const response = await fetch(url.toString(), { signal: controller.signal });
        const results = await response.json();

        const nextSuggestions = Array.isArray(results)
          ? results
              .map((item) => {
                const label = typeof item?.display_name === 'string' ? String(item.display_name) : '';
                const lat = Number(item?.lat);
                const lon = Number(item?.lon);
                if (!label || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
                return { label, lat, lon };
              })
              .filter(Boolean)
          : [];

        setPlaceSuggestions(nextSuggestions as Array<{ label: string; lat: number; lon: number }>);
      } catch (error) {
        if (!controller.signal.aborted) {
          setPlaceSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsPlacesLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [placeQuery, adLocationScope]);

  const hasLocationTargeting = adLocationScope === 'global' ? adCountries.length > 0 : Boolean(adLocalPlace);

  const canLaunch =
    adBudgetPerDay !== null && adDurationDays !== null && hasLocationTargeting && adAgeMin >= 13 && adAgeMax >= adAgeMin;

  const totalBudget =
    adBudgetPerDay !== null && adDurationDays !== null ? adBudgetPerDay * adDurationDays : null;

  const adsCheckoutMessage =
    adsCheckoutStatus === 'success'
      ? launchError
        ? `Payment confirmed, but we couldn't launch the ad campaign: ${launchError}`
        : isLaunchingCampaign
          ? 'Payment confirmed. Launching your ad campaign now...'
          : 'Payment confirmed. Your ad campaign is queued for launch.'
      : adsCheckoutStatus === 'cancel'
        ? 'Checkout was cancelled. Your ad campaign has not been launched.'
        : null;

  const handleLaunchPayment = async () => {
    if (adBudgetPerDay === null || adDurationDays === null) return;

    setIsLaunchingPayment(true);
    setPaymentError(null);

    try {
      let email = userEmail;
      if (!email) {
        const { data: userData } = await supabase.auth.getUser();
        email = userData?.user?.email ?? undefined;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          checkoutType: 'ads',
          pricePerDay: adBudgetPerDay,
          durationDays: adDurationDays,
          customerEmail: email,
          returnStep: 'ads',
          returnSubStep: adsSubStep,
        },
      });

      if (error || !data?.url) {
        throw error ?? new Error('Missing checkout URL.');
      }

      window.location.href = data.url;
    } catch (_error) {
      setPaymentError('Unable to start checkout. Please try again.');
      setIsLaunchingPayment(false);
    }
  };

  const launchCampaign = async () => {
    setIsLaunchingCampaign(true);
    setLaunchError(null);
    hasTriggeredLaunchRef.current = true;

    try {
      if (!ideaId) {
        throw new Error('Missing idea id.');
      }

      const launchFacebookPageId = selectedFacebookPage?.id ?? persistedFacebookPage?.id;
      if (!launchFacebookPageId) {
        throw new Error('Select a Facebook page to launch the ad campaign.');
      }

      if (!destinationUrl) {
        throw new Error('Missing landing page destination URL.');
      }

      if (!adImageUrl?.trim()) {
        throw new Error('Missing ad image URL.');
      }

      if (!adHeadline?.trim()) {
        throw new Error('Missing ad headline.');
      }

      if (!adDescription?.trim()) {
        throw new Error('Missing ad description.');
      }

      if (adBudgetPerDay === null || adDurationDays === null) {
        throw new Error('Missing ad budget or duration.');
      }

      if (adLocationScope === 'global' && adCountries.length === 0) {
        throw new Error('Select at least one country for targeting.');
      }

      if (adLocationScope === 'local' && !adLocalPlace) {
        throw new Error('Select a local place for targeting.');
      }

      const { error } = await supabase.functions.invoke('create-meta-campaign', {
        body: {
          ideaId,
          pageId: launchFacebookPageId,
          instagramActorId: selectedInstagramAccount?.id ?? persistedInstagramPage?.id,
          destinationUrl,
          adImageUrl: adImageUrl.trim(),
          adHeadline: adHeadline.trim(),
          adPrimaryText: adDescription.trim(),
          adCta,
          budgetPerDayUsd: adBudgetPerDay,
          durationDays: adDurationDays,
          ageMin: adAgeMin,
          ageMax: adAgeMax,
          genders: adGenders,
          locationScope: adLocationScope,
          countryNames: adLocationScope === 'global' ? adCountries : undefined,
          localPlace:
            adLocationScope === 'local' && adLocalPlace
              ? {
                  label: adLocalPlace.label,
                  lat: adLocalPlace.lat,
                  lon: adLocalPlace.lon,
                }
              : undefined,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : 'Unable to launch the ad campaign.');
    } finally {
      setIsLaunchingCampaign(false);
    }
  };

  useEffect(() => {
    if (adsCheckoutStatus !== 'success') return;
    if (hasTriggeredLaunchRef.current) return;
    void launchCampaign();
  }, [adsCheckoutStatus]);

  useEffect(() => {
    if (!activeIdea?.research_data) return;

    let parsed = activeIdea.research_data as {
      segments?: Array<{
        meta_ad_headlines?: string[];
        meta_ad_descriptions?: string[];
      }>;
    };

    if (typeof activeIdea.research_data === 'string') {
      try {
        parsed = JSON.parse(activeIdea.research_data) as {
          segments?: Array<{
            meta_ad_headlines?: string[];
            meta_ad_descriptions?: string[];
          }>;
        };
      } catch {
        return;
      }
    }

    const firstSegment = parsed.segments?.[0];
    const headlines = Array.isArray(firstSegment?.meta_ad_headlines)
      ? firstSegment.meta_ad_headlines.filter(Boolean).slice(0, 3)
      : [];
    const descriptions = Array.isArray(firstSegment?.meta_ad_descriptions)
      ? firstSegment.meta_ad_descriptions.filter(Boolean).slice(0, 3)
      : [];

    if (headlines.length > 0) {
      setHeadlineOptions(headlines);
      if (!adHeadline) {
        setAdHeadline(headlines[0]);
        setHeadlineMode('preset');
      }
    }

    if (descriptions.length > 0) {
      setDescriptionOptions(descriptions);
      if (!adDescription) {
        setAdDescription(descriptions[0]);
        setDescriptionMode('preset');
      }
    }
  }, [activeIdea, adHeadline, adDescription, setAdDescription, setAdHeadline]);

  useEffect(() => {
    const storedImage = localStorage.getItem('trusignal.adImage');
    if (storedImage && !adImageUrl) {
      setAdImageMethod('ai');
      setAdImageUrl(storedImage);
    }
  }, [adImageUrl, setAdImageMethod, setAdImageUrl]);

  useEffect(() => {
    if (!adImageUrl) return;
    localStorage.setItem('trusignal.adImage', adImageUrl);
  }, [adImageUrl]);

  useEffect(() => {
    if (!ideaId || adImageUrl) return;

    const hydrateCreative = async () => {
      const { data, error } = await supabase.storage
        .from('idea-storage')
        .list(`${ideaId}/ad-campaign`, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

      let entries = data;
      let folder = 'ad-campaign';
      if (error || !entries || entries.length === 0) {
        const fallback = await supabase.storage
          .from('idea-storage')
          .list(`${ideaId}/ad-creatives`, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
        entries = fallback.data ?? [];
        folder = 'ad-creatives';
      }

      if (!entries || entries.length === 0) {
        return;
      }

      const latest = entries[0];
      const path = `${ideaId}/${folder}/${latest.name}`;
      const { data: signedData, error: signedError } = await supabase.storage
        .from('idea-storage')
        .createSignedUrl(path, 60 * 60 * 24 * 7);

      if (!signedError && signedData?.signedUrl) {
        setAdImageMethod('ai');
        setAdImageUrl(signedData.signedUrl);
      }
    };

    void hydrateCreative();
  }, [adImageUrl, ideaId, setAdImageMethod, setAdImageUrl]);

  const handleGenerateImage = async () => {
    if (!ideaDescription || !targetAudience || !problemSolved) {
      setImageError('Provide idea, audience, and problem details first.');
      return;
    }

    if (!ideaId) {
      setImageError('Missing idea id. Please select an idea first.');
      return;
    }

    setAdImageMethod('ai');
    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-image', {
        body: {
          idea: ideaDescription,
          audience: targetAudience,
          problem: problemSolved,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.image_data_url) {
        const { data: metaData, error: metaError } = await supabase.functions.invoke('save-meta-pages', {
          body: {
            idea_id: ideaId,
            ad_creative: { image_data_url: data.image_data_url },
          },
        });

        if (metaError) {
          throw metaError;
        }

        const signedUrl = metaData?.ad_creative?.signed_url;
        if (signedUrl) {
          setAdImageUrl(signedUrl);
        } else {
          setAdImageUrl(data.image_data_url);
        }
      } else {
        throw new Error('Missing image data.');
      }
    } catch (_error) {
      setImageError('Unable to generate an image right now. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleUploadImage = async (file: File | null) => {
    if (!file) return;
    if (!ideaId) {
      setUploadImageError('Missing idea id. Please select an idea first.');
      return;
    }

    setLastUploadedFile(file);
    setUploadImageError(null);
    setIsUploadingImage(true);
    setAdImageMethod('upload');
    setUploadedMediaType(file.type.startsWith('video/') ? 'video' : 'image');

    const toDataUrl = (input: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(input);
      });

    try {
      const imageDataUrl = await toDataUrl(file);
      const safeName = file.name.trim() || `${crypto.randomUUID()}.png`;

      const { data, error } = await supabase.functions.invoke('upload-ad-image', {
        body: {
          idea_id: ideaId,
          image_data_url: imageDataUrl,
          filename: safeName,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.signed_url) {
        setAdImageUrl(data.signed_url);
      } else {
        setUploadImageError('Image uploaded, but unable to load preview.');
      }
    } catch (_error) {
      setUploadImageError('Unable to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

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
        {[1, 2, 3, 4].map((step) => (
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

      {/* Sub-step 1: Connect Facebook */}
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
                        {metaAuthStatus !== 'connected' && (
                          <button
                            type="button"
                            onClick={() => void connectMetaAccount()}
                            disabled={metaAuthStatus === 'connecting' || metaConnectStatus === 'loading'}
                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50"
                          >
                            {metaAuthStatus === 'connecting' ? 'Connecting...' : 'Connect Facebook'}
                          </button>
                        )}
                      </div>

                      {metaErrorMessage && <p className="text-red-400 text-sm mt-3">{metaErrorMessage}</p>}

                      {metaAuthStatus === 'connected' && (
                        <div className="mt-5 space-y-4">
                          <div className="flex items-center justify-end">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowMetaAccountMenu((prev) => !prev)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:border-gray-600 transition-colors"
                              >
                                {facebookUserProfile?.pictureUrl ? (
                                  <img
                                    src={facebookUserProfile.pictureUrl}
                                    alt={facebookUserProfile.name}
                                    className="w-8 h-8 rounded-full object-cover border border-gray-700"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700" />
                                )}
                                <div className="text-left">
                                  <div className="text-[11px] text-gray-400">Signed in as</div>
                                  <div className="text-white font-semibold">
                                    {facebookUserProfile?.name ?? 'Facebook user'}
                                  </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-300" />
                              </button>
                              {showMetaAccountMenu && (
                                <div className="absolute right-0 mt-2 w-44 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-10">
                                  <button
                                    type="button"
                                    onClick={signOutMetaAccount}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 flex items-center gap-2"
                                  >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

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
                                <label
                                  key={page.id}
                                  className={`flex items-center gap-3 p-4 rounded-lg border transition-colors text-left cursor-pointer ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-500/10'
                                      : 'border-gray-700 hover:border-gray-600 bg-gray-900/40'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="facebook-page"
                                    checked={isSelected}
                                    onChange={() => {
                                      const nextLink = page.link ?? '';
                                      setFacebookPageUrl(nextLink);
                                      void persistMetaSelection(
                                        {
                                          id: page.id,
                                          name: page.name,
                                          link: page.link ?? nextLink,
                                        },
                                        selectedInstagramAccount
                                          ? {
                                              id: selectedInstagramAccount.id,
                                              username: selectedInstagramAccount.username,
                                              url: `https://instagram.com/${selectedInstagramAccount.username}`,
                                            }
                                          : instagramPageUrl
                                            ? { url: instagramPageUrl }
                                            : undefined
                                      );
                                    }}
                                    className="h-4 w-4 text-indigo-500"
                                  />
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
                                    {page.location && (
                                      <div className="text-gray-500 text-xs truncate">
                                        {[page.location.city, page.location.state, page.location.country]
                                          .filter(Boolean)
                                          .join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </label>
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

                </div>
              )}

              {hasFacebookPage === false && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
                  <p className="text-indigo-300">✓ We'll help you create a Facebook page optimized for your validation test.</p>
                </div>
              )}
            </div>

            {(hasFacebookPage !== null) && (
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
                <p className="text-indigo-200 text-lg mb-6">
                  Next, connect your Instagram account for stronger signal quality.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setAdsSubStep(2)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-step 2: Instagram */}
      {adsSubStep === 2 && (
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Connect Instagram</h2>
          <p className="text-gray-400 mb-8 text-center">
            Instagram is recommended to get a clearer signal from your test.
          </p>

          <div className="max-w-3xl mx-auto space-y-8">
            <div
              className={`bg-gray-900 rounded-xl p-8 border border-gray-800 transition-all ${
                isInstagramSkipped ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
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
                <button
                  type="button"
                  onClick={() => setIsInstagramSkipped((prev) => !prev)}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {isInstagramSkipped ? 'Undo skip' : 'Skip for now'}
                </button>
              </div>

              <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 mb-6">
                <p className="text-gray-200 text-sm">
                  Run ads on both Facebook and Instagram to get 45% more clarity in early demand signals.
                </p>
              </div>

              {isInstagramSkipped ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Instagram setup skipped for now.</p>
                </div>
              ) : (
                <>
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

                        void connectInstagramAccount();
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
                                      onClick={() => {
                                        setInstagramPageUrl(url);
                                        void persistMetaSelection(
                                          selectedFacebookPage
                                            ? {
                                                id: selectedFacebookPage.id,
                                                name: selectedFacebookPage.name,
                                                link: selectedFacebookPage.link ?? facebookPageUrl,
                                              }
                                            : facebookPageUrl
                                              ? { link: facebookPageUrl }
                                              : undefined,
                                          { url }
                                        );
                                      }}
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
                    </div>
                  )}

                  {hasInstagramPage === false && (
                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-5">
                      <p className="text-indigo-300">✓ We'll help you create an Instagram account optimized for your validation test.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-white mb-3">What happens next</h3>
              <p className="text-indigo-200 text-lg mb-6">
                Now let's create your ad creative that will be shown to your target audience.
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
                  Create Ad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-step 3: Create Ad */}
      {adsSubStep === 3 && (
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Create your ad</h2>
          <p className="text-gray-400 mb-8 text-center">Design the ad that will attract your target audience.</p>

          <div className="max-w-3xl mx-auto">
            {/* Image Selection */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Ad Image</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => {
                    setAdImageMethod('upload');
                    uploadInputRef.current?.click();
                  }}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    adImageMethod === 'upload' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Upload
                    className={`w-8 h-8 mx-auto mb-3 ${
                      adImageMethod === 'upload' ? 'text-indigo-400' : 'text-gray-400'
                    }`}
                  />
                  <h4 className="text-lg font-semibold text-white mb-1">Upload Image/Video</h4>
                  <p className="text-gray-400 text-sm">Use your own creative</p>
                </button>
                <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    adImageMethod === 'ai' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Sparkles
                    className={`w-8 h-8 mx-auto mb-3 ${
                      adImageMethod === 'ai' ? 'text-indigo-400' : 'text-gray-400'
                    }`}
                  />
                  <h4 className="text-lg font-semibold text-white mb-1">AI Create</h4>
                  <p className="text-gray-400 text-sm">
                    {isGeneratingImage ? 'Generating...' : 'Generate with AI'}
                  </p>
                </button>
              </div>
              {imageError && <p className="text-red-400 text-sm mb-4">{imageError}</p>}

              {adImageMethod === 'upload' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Upload image or video</label>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => void handleUploadImage(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  {isUploadingImage && <p className="text-indigo-200 text-sm mt-2">Uploading...</p>}
                  {uploadImageError && (
                    <div className="mt-2 flex items-center justify-between gap-3 text-red-400 text-sm">
                      <span>{uploadImageError}</span>
                      <button
                        type="button"
                        onClick={() => void handleUploadImage(lastUploadedFile)}
                        disabled={!lastUploadedFile || isUploadingImage}
                        className="px-3 py-1.5 rounded-md bg-gray-800 text-white text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {adImageUrl && uploadedMediaType === 'video' ? (
                    <video src={adImageUrl} controls className="w-32 h-32 rounded-lg mt-4 object-cover" />
                  ) : adImageUrl ? (
                    <img src={adImageUrl} alt="Uploaded preview" className="w-32 h-32 rounded-lg mt-4 object-cover" />
                  ) : null}
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
                  {headlineOptions.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Headline options</div>
                      <div className="flex flex-wrap gap-2">
                        {headlineOptions.map((headline, index) => {
                          const isSelected = headlineMode === 'preset' && adHeadline === headline;
                          return (
                            <button
                              key={`${headline}-${index}`}
                              type="button"
                              onClick={() => {
                                setHeadlineMode('preset');
                                setAdHeadline(headline);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200'
                                  : 'border-gray-700 text-gray-300 hover:border-gray-600'
                              }`}
                            >
                              {headline}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setHeadlineMode('custom')}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            headlineMode === 'custom'
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200'
                              : 'border-gray-700 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                  )}
                  <label className="block text-sm font-medium text-gray-300 mb-2">Headline *</label>
                  <input
                    type="text"
                    placeholder="e.g., Transform Your Mornings"
                    value={adHeadline}
                    onChange={(e) => setAdHeadline(e.target.value)}
                    maxLength={40}
                    readOnly={headlineMode === 'preset' && headlineOptions.length > 0}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  <p className="text-gray-500 text-sm mt-1">{adHeadline.length}/40 characters</p>
                </div>
                <div>
                  {descriptionOptions.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Description options</div>
                      <div className="flex flex-wrap gap-2">
                        {descriptionOptions.map((description, index) => {
                          const isSelected = descriptionMode === 'preset' && adDescription === description;
                          return (
                            <button
                              key={`${description}-${index}`}
                              type="button"
                              onClick={() => {
                                setDescriptionMode('preset');
                                setAdDescription(description);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200'
                                  : 'border-gray-700 text-gray-300 hover:border-gray-600'
                              }`}
                            >
                              {description}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setDescriptionMode('custom')}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            descriptionMode === 'custom'
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200'
                              : 'border-gray-700 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                  )}
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    placeholder="e.g., Healthy meal prep delivered to your door. Save time, eat better."
                    value={adDescription}
                    onChange={(e) => setAdDescription(e.target.value)}
                    maxLength={125}
                    readOnly={descriptionMode === 'preset' && descriptionOptions.length > 0}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors h-24"
                  />
                  <p className="text-gray-500 text-sm mt-1">{adDescription.length}/125 characters</p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedOpen((prev) => !prev)}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Advanced
                    <ChevronDown className={`w-4 h-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isAdvancedOpen && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Call to Action *</label>
                      <select
                        value={adCta || 'Learn More'}
                        onChange={(e) => setAdCta(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                      >
                        {[
                          'Learn More',
                          'Sign Up',
                          'Get Started',
                          'Book Now',
                          'Contact Us',
                          'Download',
                          'Shop Now',
                        ].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ad Format Previews */}
            {adImageUrl && (
              <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 mb-6">
                <h3 className="text-xl font-semibold text-white mb-6">Ad Format Previews</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* 1:1 Square */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 text-center">1:1 Square (Feed)</h4>
                    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                      <div className="aspect-square">
                        {uploadedMediaType === 'video' ? (
                          <video src={adImageUrl} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={adImageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-4">
                        <h5 className="text-white font-semibold mb-1 text-sm">{adHeadline || 'Your headline'}</h5>
                        <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                          {adDescription || 'Your ad description will appear here.'}
                        </p>
                        <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-semibold">
                          {adCta || 'Learn More'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 9:16 Vertical (Story) */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 text-center">9:16 Story</h4>
                    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 max-w-[200px] mx-auto">
                      <div style={{ aspectRatio: '9/16' }}>
                        {uploadedMediaType === 'video' ? (
                          <video src={adImageUrl} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={adImageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <h5 className="text-white font-semibold mb-1 text-xs">{adHeadline || 'Your headline'}</h5>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {adDescription || 'Your ad description will appear here.'}
                        </p>
                        <button className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold">
                          {adCta || 'Learn More'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 16:9 Horizontal */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 text-center">16:9 Horizontal</h4>
                    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                      <div style={{ aspectRatio: '16/9' }}>
                        {uploadedMediaType === 'video' ? (
                          <video src={adImageUrl} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={adImageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <h5 className="text-white font-semibold mb-1 text-sm">{adHeadline || 'Your headline'}</h5>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {adDescription || 'Your ad description will appear here.'}
                        </p>
                        <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-semibold">
                          {adCta || 'Learn More'}
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
                    onClick={() => setAdsSubStep(2)}
                    className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setAdsSubStep(4)}
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

      {/* Sub-step 4: Review Ad & Launch */}
      {adsSubStep === 4 && (
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Review Ad & Launch</h2>
          <p className="text-gray-400 mb-8 text-center">
            Set your audience targeting and budget to launch a small validation test.
          </p>

          {adsCheckoutMessage && (
            <div
              className={`mb-6 mx-auto max-w-3xl rounded-xl border p-4 ${
                adsCheckoutStatus === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>{adsCheckoutMessage}</div>
                <div className="flex items-center gap-2">
                  {launchError && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isLaunchingCampaign) return;
                        hasTriggeredLaunchRef.current = false;
                        void launchCampaign();
                      }}
                      className="px-3 py-1 text-xs font-semibold rounded-md border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/10 transition-colors"
                    >
                      Retry Launch
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onDismissAdsCheckoutNotice}
                    className="p-1 rounded-md hover:bg-white/10 text-current"
                    aria-label="Dismiss message"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-6">
            {/* Audience */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/15 text-indigo-300 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">Audience</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location targeting</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAdLocationScope('local')}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                        adLocationScope === 'local'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      Local
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdLocationScope('global')}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                        adLocationScope === 'global'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      Global
                    </button>
                  </div>

                  {adLocationScope === 'local' ? (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Place</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for a city, area, or address"
                          value={placeQuery}
                          onChange={(e) => setPlaceQuery(e.target.value)}
                          className="w-full px-4 py-3 pr-14 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleLocateMe}
                          disabled={isLocatingPlace}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-indigo-500 transition-colors disabled:opacity-50"
                          aria-label="Locate me"
                        >
                          <LocateFixed className="w-4 h-4" />
                        </button>
                      </div>

                      {placeSuggestions.length > 0 && (
                        <div className="mt-2 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                          {placeSuggestions.map((place) => (
                            <button
                              key={`${place.lat}-${place.lon}`}
                              type="button"
                              onClick={() => handleSelectPlace(place)}
                              className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                            >
                              {place.label}
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-gray-500 text-sm mt-2">
                        {isLocatingPlace
                          ? 'Locating your current position...'
                          : isPlacesLoading
                            ? 'Searching...'
                            : adLocalPlace
                              ? `Selected: ${adLocalPlace.label}`
                              : 'Use the search box or click the locate icon.'}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Countries</label>
                      <div className="grid grid-cols-2 gap-3">
                        {countriesForSelection.map((country) => {
                          const selected = adCountries.includes(country.name);

                          return (
                            <button
                              key={country.name}
                              onClick={() => toggleCountry(country.name)}
                              className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all flex items-center justify-between gap-3 ${
                                selected
                                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
                              }`}
                            >
                              <span className="text-left text-sm">
                                <span className="mr-2">{country.flag}</span>
                                {country.name}
                              </span>
                              {selected && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-gray-500 text-sm mt-2">Select one or more target countries.</p>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">More Countries</label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <input
                            type="text"
                            list="more-countries"
                            placeholder="Start typing to add a country"
                            value={moreCountryQuery}
                            onChange={(e) => setMoreCountryQuery(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={handleAddCountry}
                            className="px-5 py-3 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-indigo-500 transition-colors font-semibold"
                          >
                            Add
                          </button>
                        </div>
                        <datalist id="more-countries">
                          {additionalCountries.map((country) => (
                            <option key={country} value={country} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => toggleGender('women')}
                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                          adGenders.includes('women')
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        Women
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleGender('men')}
                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                          adGenders.includes('men')
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        Men
                      </button>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">Default is both.</p>
                  </div>

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
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/15 text-indigo-300 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">Budget & Duration</h3>
              </div>

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
                  onClick={() => setShowLaunchReview(true)}
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

      {showLaunchReview && (
        <div
          className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setShowLaunchReview(false)}
        >
          <div
            className="bg-gray-900 rounded-2xl p-6 sm:p-8 w-full max-w-3xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Review Ad & Launch</h3>
              <button
                onClick={() => setShowLaunchReview(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <h4 className="text-sm font-medium text-gray-400 mb-4">Ad Preview (1:1 Square)</h4>
                <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                  <div className="aspect-square">
                    {adImageUrl ? (
                      <img src={adImageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-800" />
                    )}
                  </div>
                  <div className="p-4">
                    <h5 className="text-white font-semibold mb-1 text-sm">{adHeadline || 'Headline'}</h5>
                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{adDescription || 'Description'}</p>
                    <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-semibold">
                      {adCta || 'Learn More'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Targeting</div>
                  <div className="text-white text-sm">Ages {adAgeMin}–{adAgeMax}</div>
                  <div className="text-gray-400 text-sm mt-1">
                    Gender:{' '}
                    {adGenders.length === 2
                      ? 'Women, Men'
                      : adGenders.includes('women')
                        ? 'Women'
                        : 'Men'}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    {adLocationScope === 'local'
                      ? `Place: ${adLocalPlace ? adLocalPlace.label : 'None'}`
                      : `Countries: ${adCountries.length > 0 ? adCountries.join(', ') : 'None'}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Budget</div>
                  <div className="text-white text-sm">
                    ${adBudgetPerDay ?? 0} per day for {adDurationDays ?? 0} days
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="text-sm text-gray-400 mb-1">Total</div>
                  <div className="text-2xl font-semibold text-white">
                    {totalBudget !== null ? `$${totalBudget}` : '--'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowLaunchReview(false)}
                className="w-full sm:w-auto px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleLaunchPayment}
                disabled={isLaunchingPayment}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50"
              >
                {isLaunchingPayment ? 'Redirecting...' : 'Confirm & Launch'}
              </button>
            </div>
            {paymentError && (
              <p className="mt-4 text-sm text-red-300 text-right">{paymentError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
