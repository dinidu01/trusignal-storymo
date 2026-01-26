import { createLogger } from "../_shared/logger.ts";

const log = createLogger("upload-ad-image");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UploadPayload = {
  idea_id?: string;
  image_data_url?: string;
  video_data_url?: string;
  filename?: string;
};

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

  let payload: UploadPayload;
  try {
    payload = (await req.json()) as UploadPayload;
  } catch (_error) {
    log.error("Invalid JSON payload", { status: 400 });
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ideaId = payload.idea_id?.trim();
  if (!ideaId) {
    log.error("Missing idea_id", { status: 400 });
    return new Response(JSON.stringify({ error: "Missing idea_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dataUrl = payload.image_data_url?.trim() ?? payload.video_data_url?.trim();
  if (!dataUrl) {
    log.error("Missing image_data_url", { status: 400 });
    return new Response(JSON.stringify({ error: "Missing image_data_url or video_data_url" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    log.error("Invalid media data URL", { status: 400 });
    return new Response(JSON.stringify({ error: "Invalid image or video data URL" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    log.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY", { status: 500 });
    return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const mimeType = match[1] || "image/png";
  const base64 = match[2];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const extensionMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  const provided = payload.filename?.trim() || "";
  const hasExtension = provided.includes(".");
  const fallbackExt = extensionMap[mimeType] ?? "bin";
  const filename = provided
    ? (hasExtension ? provided : `${provided}.${fallbackExt}`)
    : `${crypto.randomUUID()}.${fallbackExt}`;
  const storagePath = `${ideaId}/ad-campaign/${filename}`;

  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/idea-storage/${storagePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        apikey: supabaseAnonKey,
        "Content-Type": mimeType,
      },
      body: bytes,
    }
  );

  if (!uploadResponse.ok) {
    log.error("Failed to upload ad image", { status: 500 });
    return new Response(JSON.stringify({ error: "Failed to upload ad image" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
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

  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/ad_campaigns`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      idea_id: ideaId,
      status: "queued",
      creative_storage_path: storagePath,
    }),
  });

  if (!insertResponse.ok) {
    log.error("Failed to create ad campaign", { status: 500 });
    return new Response(JSON.stringify({ error: "Failed to create ad campaign" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const inserted = await insertResponse.json();
  const adCampaignId = Array.isArray(inserted) ? inserted[0]?.id : null;

  const signResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/sign/idea-storage/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader,
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    }
  );

  if (!signResponse.ok) {
    log.error("Failed to sign ad image URL", { status: 500 });
    return new Response(JSON.stringify({ error: "Failed to sign ad image URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signData = await signResponse.json();
  const signedUrl = signData?.signedUrl ? `${supabaseUrl}${signData.signedUrl}` : null;

  return new Response(
    JSON.stringify({ signed_url: signedUrl, storage_path: storagePath, ad_campaign_id: adCampaignId }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
