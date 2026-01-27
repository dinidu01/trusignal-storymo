import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("save-meta-pages");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MetaPagePayload = {
  idea_id?: string;
  facebook_page?: {
    id?: string;
    name?: string;
    link?: string;
  };
  instagram_page?: {
    id?: string;
    username?: string;
    url?: string;
  };
  ad_creative?: {
    image_data_url?: string;
    filename?: string;
  };
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

  let payload: MetaPagePayload;
  try {
    payload = (await req.json()) as MetaPagePayload;
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

  const hasMetaUpdates = Boolean(payload.facebook_page || payload.instagram_page || payload.ad_creative);
  if (!hasMetaUpdates) {
    log.error("Missing meta updates", { status: 400 });
    return new Response(JSON.stringify({ error: "Missing facebook_page, instagram_page, or ad_creative" }), {
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

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  let creativeStoragePath: string | null = null;
  let creativeSignedUrl: string | null = null;

  if (payload.ad_creative?.image_data_url) {
    const dataUrl = payload.ad_creative.image_data_url.trim();
    const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
      log.error("Invalid ad creative data URL", { status: 400 });
      return new Response(JSON.stringify({ error: "Invalid ad creative data URL" }), {
        status: 400,
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

    const filename = payload.ad_creative.filename?.trim() || `${crypto.randomUUID()}.png`;
    creativeStoragePath = `${ideaId}/ad-creatives/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("idea-storage")
      .upload(creativeStoragePath, bytes, { contentType: mimeType, upsert: true });

    if (uploadError) {
      log.error("Failed to store ad creative", { status: 500, error: uploadError.message });
      return new Response(JSON.stringify({ error: "Failed to store ad creative" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("idea-storage")
      .createSignedUrl(creativeStoragePath, 3600);

    if (signedError) {
      log.error("Failed to sign ad creative URL", { status: 500 });
      return new Response(JSON.stringify({ error: "Failed to sign ad creative URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    creativeSignedUrl = signedData?.signedUrl ?? null;
  }

  const { data: existingRow, error: existingError } = await supabase
    .from("ideas")
    .select("metadata")
    .eq("id", ideaId)
    .single();

  if (existingError) {
    log.error("Unable to load idea metadata", { status: 404, error: existingError.message });
    return new Response(JSON.stringify({ error: "Unable to load idea metadata" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const existingMetadata = existingRow?.metadata ?? {};

  const nextMetadata = {
    ...existingMetadata,
    ...(payload.facebook_page ? { meta_facebook_page: payload.facebook_page } : {}),
    ...(payload.instagram_page ? { meta_instagram_page: payload.instagram_page } : {}),
    ...(creativeStoragePath ? { meta_ad_creative_path: creativeStoragePath } : {}),
  };

  const { data: updatedRow, error: updateError } = await supabase
    .from("ideas")
    .update({ metadata: nextMetadata })
    .eq("id", ideaId)
    .select("metadata")
    .single();

  if (updateError) {
    log.error("Failed to save meta pages", { status: 500 });
    return new Response(JSON.stringify({ error: "Failed to save meta pages" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      metadata: updatedRow?.metadata ?? nextMetadata,
      ad_creative: creativeStoragePath
        ? { storage_path: creativeStoragePath, signed_url: creativeSignedUrl }
        : null,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
