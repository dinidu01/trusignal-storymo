import { createLogger } from "../_shared/logger.ts";

const log = createLogger("create-meta-campaign");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LocationScope = "local" | "global";

type Gender = "women" | "men";

type LocalPlace = {
  label?: string;
  lat: number;
  lon: number;
  radius?: number;
  distance_unit?: "mile" | "kilometer";
};

type LaunchPayload = {
  ideaId: string;
  pageId: string;
  instagramActorId?: string;
  destinationUrl: string;
  adImageUrl: string;
  adHeadline: string;
  adPrimaryText: string;
  adCta?: string;
  budgetPerDayUsd: number;
  durationDays: number;
  ageMin: number;
  ageMax: number;
  genders?: Gender[];
  locationScope: LocationScope;
  countryCodes?: string[];
  countryNames?: string[];
  localPlace?: LocalPlace;
  objective?: "TRAFFIC";
  campaignStatus?: "ACTIVE" | "PAUSED";
  adsetStatus?: "ACTIVE" | "PAUSED";
  adStatus?: "ACTIVE" | "PAUSED";
};

type MetaError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

const countryNameToIso2: Record<string, string> = {
  "United States": "US",
  USA: "US",
  "United Kingdom": "GB",
  UK: "GB",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  France: "FR",
  India: "IN",
  "Sri Lanka": "LK",
  Brazil: "BR",
  Mexico: "MX",
  Spain: "ES",
  Italy: "IT",
  Netherlands: "NL",
  Sweden: "SE",
  Norway: "NO",
  Denmark: "DK",
  Finland: "FI",
  Ireland: "IE",
  "New Zealand": "NZ",
  Singapore: "SG",
  "United Arab Emirates": "AE",
  "South Africa": "ZA",
  Japan: "JP",
  "South Korea": "KR",
};

const mapCtaLabelToMetaType = (label: string | undefined) => {
  const normalized = (label ?? "").trim().toLowerCase();
  if (!normalized) return "LEARN_MORE";

  const mapping: Record<string, string> = {
    "learn more": "LEARN_MORE",
    "sign up": "SIGN_UP",
    "get started": "GET_STARTED",
    "book now": "BOOK_NOW",
    "contact us": "CONTACT_US",
    download: "DOWNLOAD",
    "shop now": "SHOP_NOW",
  };

  return mapping[normalized] ?? "LEARN_MORE";
};

const normalizeAdAccountId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
};

const getMetaApiBaseUrl = () => {
  const version = Deno.env.get("META_API_VERSION")?.trim() || "v19.0";
  return `https://graph.facebook.com/${version}`;
};

const postMetaForm = async <T>(
  path: string,
  params: Record<string, string>,
  accessToken: string
): Promise<T> => {
  const url = new URL(`${getMetaApiBaseUrl()}${path}`);
  const body = new URLSearchParams({ ...params, access_token: accessToken });

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as T & MetaError;

  if (!response.ok) {
    const message = data?.error?.message || "Meta API request failed";
    throw new Error(message);
  }

  return data;
};

const fetchImageBytes = async (imageUrl: string) => {
  const trimmed = imageUrl.trim();
  if (!trimmed) throw new Error("Missing adImageUrl");

  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) {
      throw new Error("Invalid data URL for adImageUrl");
    }

    const mimeType = match[1] || "application/octet-stream";
    const base64 = match[2];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return { bytes, mimeType };
  }

  const response = await fetch(trimmed);
  if (!response.ok) {
    throw new Error("Unable to fetch ad image URL");
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  return { bytes: new Uint8Array(arrayBuffer), mimeType: contentType };
};

const uploadAdImage = async (adAccountId: string, adImageUrl: string, accessToken: string) => {
  const { bytes, mimeType } = await fetchImageBytes(adImageUrl);

  const form = new FormData();
  form.append("bytes", new Blob([bytes], { type: mimeType }), "ad-image");
  form.append("access_token", accessToken);

  const response = await fetch(`${getMetaApiBaseUrl()}/${adAccountId}/adimages`, {
    method: "POST",
    body: form,
  });

  const data = (await response.json()) as
    | { images?: Record<string, { hash?: string }> }
    | MetaError;

  if (!response.ok) {
    const message = (data as MetaError)?.error?.message || "Meta image upload failed";
    throw new Error(message);
  }

  const images = (data as { images?: Record<string, { hash?: string }> }).images;
  const first = images ? Object.values(images)[0] : undefined;
  const hash = first?.hash;

  if (!hash) {
    throw new Error("Meta image upload succeeded but no hash was returned");
  }

  return hash;
};

const buildCountryCodes = (payload: LaunchPayload) => {
  if (payload.countryCodes && payload.countryCodes.length > 0) {
    return payload.countryCodes.map((code) => code.trim().toUpperCase()).filter(Boolean);
  }

  const names = payload.countryNames ?? [];
  const codes = names
    .map((name) => countryNameToIso2[name.trim()])
    .filter(Boolean)
    .map((code) => code.trim().toUpperCase());

  if (codes.length === 0) {
    throw new Error(
      "Missing country targeting. Provide countryCodes (ISO2 like US, GB) or countryNames from the supported list."
    );
  }

  return codes;
};

const buildTargeting = (payload: LaunchPayload) => {
  const targeting: Record<string, unknown> = {
    age_min: payload.ageMin,
    age_max: payload.ageMax,
  };

  const genders = payload.genders ?? ["women", "men"];
  if (genders.length === 1) {
    targeting.genders = genders[0] === "women" ? [2] : [1];
  }

  if (payload.locationScope === "global") {
    targeting.geo_locations = {
      countries: buildCountryCodes(payload),
    };
  } else {
    if (!payload.localPlace) {
      throw new Error("Missing localPlace for local targeting");
    }

    const radius = payload.localPlace.radius ?? 10;
    const distanceUnit = payload.localPlace.distance_unit ?? "mile";

    targeting.geo_locations = {
      custom_locations: [
        {
          latitude: payload.localPlace.lat,
          longitude: payload.localPlace.lon,
          radius,
          distance_unit: distanceUnit,
        },
      ],
      location_types: ["home", "recent"],
    };
  }

  return targeting;
};

/**
 * POST /create-meta-campaign
 * Request headers:
 * - authorization: required (supabase JWT)
 *
 * Request body (JSON):
 * {
 *   "ideaId": "uuid",
 *   "pageId": "12345",
 *   "instagramActorId": "12345",
 *   "destinationUrl": "https://example.com",
 *   "adImageUrl": "https://example.com/image.jpg" | "data:image/png;base64,...",
 *   "adHeadline": "Headline",
 *   "adPrimaryText": "Primary text",
 *   "adCta": "Learn more",
 *   "budgetPerDayUsd": 10,
 *   "durationDays": 7,
 *   "ageMin": 18,
 *   "ageMax": 65,
 *   "genders": ["women", "men"],
 *   "locationScope": "global" | "local",
 *   "countryCodes": ["US", "GB"],
 *   "countryNames": ["United States"],
 *   "localPlace": {
 *     "label": "Austin, TX",
 *     "lat": 30.2672,
 *     "lon": -97.7431,
 *     "radius": 10,
 *     "distance_unit": "mile"
 *   },
 *   "objective": "TRAFFIC",
 *   "campaignStatus": "ACTIVE" | "PAUSED",
 *   "adsetStatus": "ACTIVE" | "PAUSED",
 *   "adStatus": "ACTIVE" | "PAUSED"
 * }
 *
 * Response 200 (JSON):
 * {
 *   "image_hash": "abc123",
 *   "campaign_id": "123",
 *   "adset_id": "456",
 *   "creative_id": "789",
 *   "ad_id": "101112"
 * }
 *
 * Response errors (JSON):
 * - 400: { "error": "Invalid JSON payload" | "Missing ideaId" | "Missing pageId" | "Missing destinationUrl" | "Missing adImageUrl" }
 * - 401: { "error": "Missing Authorization header" }
 * - 405: { "error": "Method not allowed" }
 * - 500: { "error": "Missing META_SYSTEM_USER_TOKEN" | "Missing META_AD_ACCOUNT_ID" | "Meta API request failed" | "Unknown error" | "..." }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    log.error("Method not allowed", { status: 405 });
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    log.error("Missing Authorization header", { status: 401 });
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: LaunchPayload;
  try {
    payload = (await req.json()) as LaunchPayload;
  } catch (_error) {
    log.error("Invalid JSON payload", { status: 400 });
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const systemUserToken = Deno.env.get("META_SYSTEM_USER_TOKEN")?.trim();
  if (!systemUserToken) {
    log.error("Missing META_SYSTEM_USER_TOKEN", { status: 500 });
    return new Response(JSON.stringify({ error: "Missing META_SYSTEM_USER_TOKEN" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adAccountId = normalizeAdAccountId(Deno.env.get("META_AD_ACCOUNT_ID") ?? "");
  if (!adAccountId) {
    log.error("Missing META_AD_ACCOUNT_ID", { status: 500 });
    return new Response(JSON.stringify({ error: "Missing META_AD_ACCOUNT_ID" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload.pageId?.trim()) {
    log.error("Missing pageId", { status: 400 });
    return new Response(JSON.stringify({ error: "Missing pageId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload.ideaId?.trim()) {
    log.error("Missing ideaId", { status: 400 });
    return new Response(JSON.stringify({ error: "Missing ideaId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload.destinationUrl?.trim()) {
    log.error("Missing destinationUrl", { status: 400 });
    return new Response(JSON.stringify({ error: "Missing destinationUrl" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload.adImageUrl?.trim()) {
    log.error("Missing adImageUrl", { status: 400 });
    return new Response(JSON.stringify({ error: "Missing adImageUrl" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const objective = payload.objective ?? "TRAFFIC";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      log.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY", { status: 500 });
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!userResponse.ok) {
      log.error("Unable to resolve user", { status: 401 });
      return new Response(JSON.stringify({ error: "Unable to resolve user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userData = await userResponse.json();
    const userId = userData?.id ? String(userData.id) : null;
    if (!userId) {
      log.error("Missing user id", { status: 401 });
      return new Response(JSON.stringify({ error: "Missing user id" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const draftResponse = await fetch(`${supabaseUrl}/rest/v1/ad_campaigns`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: userId,
        idea_id: payload.ideaId.trim(),
        status: "draft",
        meta_payload: payload,
      }),
    });

    if (!draftResponse.ok) {
      log.error("Failed to store ad campaign draft", { status: 500 });
      return new Response(JSON.stringify({ error: "Failed to store ad campaign draft" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageHash = await uploadAdImage(adAccountId, payload.adImageUrl, systemUserToken);

    const now = new Date();
    const startsAt = new Date(now.getTime() + 10 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + Math.max(1, Math.round(payload.durationDays)) * 24 * 60 * 60 * 1000);

    const campaignName = `TruSignal Validation ${now.toISOString()}`;
    const adsetName = `Validation Ad Set ${now.toISOString()}`;
    const creativeName = `Validation Creative ${now.toISOString()}`;
    const adName = `Validation Ad ${now.toISOString()}`;

    const campaign = await postMetaForm<{ id: string }>(
      `/${adAccountId}/campaigns`,
      {
        name: campaignName,
        objective,
        status: payload.campaignStatus ?? "ACTIVE",
      },
      systemUserToken
    );

    const dailyBudget = Math.round(Number(payload.budgetPerDayUsd) * 100);
    if (!Number.isFinite(dailyBudget) || dailyBudget <= 0) {
      throw new Error("Invalid budgetPerDayUsd");
    }

    const targeting = buildTargeting(payload);

    const adset = await postMetaForm<{ id: string }>(
      `/${adAccountId}/adsets`,
      {
        name: adsetName,
        campaign_id: campaign.id,
        billing_event: "IMPRESSIONS",
        optimization_goal: "LINK_CLICKS",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        daily_budget: String(dailyBudget),
        start_time: startsAt.toISOString(),
        end_time: endsAt.toISOString(),
        targeting: JSON.stringify(targeting),
        status: payload.adsetStatus ?? "ACTIVE",
      },
      systemUserToken
    );

    const ctaType = mapCtaLabelToMetaType(payload.adCta);

    const creativeSpec: Record<string, unknown> = {
      page_id: payload.pageId.trim(),
      link_data: {
        link: payload.destinationUrl.trim(),
        image_hash: imageHash,
        message: payload.adPrimaryText,
        name: payload.adHeadline,
        call_to_action: {
          type: ctaType,
          value: {
            link: payload.destinationUrl.trim(),
          },
        },
      },
    };

    if (payload.instagramActorId?.trim()) {
      creativeSpec.instagram_actor_id = payload.instagramActorId.trim();
    }

    const creative = await postMetaForm<{ id: string }>(
      `/${adAccountId}/adcreatives`,
      {
        name: creativeName,
        object_story_spec: JSON.stringify(creativeSpec),
      },
      systemUserToken
    );

    const ad = await postMetaForm<{ id: string }>(
      `/${adAccountId}/ads`,
      {
        name: adName,
        adset_id: adset.id,
        creative: JSON.stringify({ creative_id: creative.id }),
        status: payload.adStatus ?? "ACTIVE",
      },
      systemUserToken
    );

    return new Response(
      JSON.stringify({
        image_hash: imageHash,
        campaign_id: campaign.id,
        adset_id: adset.id,
        creative_id: creative.id,
        ad_id: ad.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    log.error("Campaign launch failed", {
      status: 500,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
