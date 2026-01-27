import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { error: uploadError } = await supabase.storage
    .from("idea-storage")
    .upload(storagePath, bytes, { contentType: mimeType, upsert: true });

  if (uploadError) {
    log.error("Failed to upload ad media", { status: 500, error: uploadError.message });
    return new Response(JSON.stringify({ error: "Failed to upload ad media" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    log.error("Unable to resolve user", { status: 401, error: userError.message });
    return new Response(JSON.stringify({ error: "Unable to resolve user" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = userData?.user?.id ?? null;
  if (!userId) {
    log.error("Missing user id", { status: 401 });
    return new Response(JSON.stringify({ error: "Missing user id" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: campaignData, error: campaignError } = await supabase
    .from("ad_campaigns")
    .insert({
      user_id: userId,
      idea_id: ideaId,
      status: "queued",
      creative_storage_path: storagePath,
    })
    .select("id")
    .single();

  if (campaignError) {
    log.error("Failed to create ad campaign", { status: 500, error: campaignError.message });
    return new Response(JSON.stringify({ error: "Failed to create ad campaign" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adCampaignId = campaignData?.id ?? null;

  const { data: signedData, error: signedError } = await supabase.storage
    .from("idea-storage")
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

  if (signedError) {
    log.error("Failed to sign ad media URL", { status: 500, error: signedError.message });
    return new Response(JSON.stringify({ error: "Failed to sign ad image URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signedUrl = signedData?.signedUrl ?? null;

  return new Response(
    JSON.stringify({ signed_url: signedUrl, storage_path: storagePath, ad_campaign_id: adCampaignId }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
