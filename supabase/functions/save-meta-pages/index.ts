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
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: MetaPagePayload;
  try {
    payload = (await req.json()) as MetaPagePayload;
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ideaId = payload.idea_id?.trim();
  if (!ideaId) {
    return new Response(JSON.stringify({ error: "Missing idea_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hasMetaUpdates = Boolean(payload.facebook_page || payload.instagram_page || payload.ad_creative);
  if (!hasMetaUpdates) {
    return new Response(JSON.stringify({ error: "Missing facebook_page, instagram_page, or ad_creative" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  let creativeStoragePath: string | null = null;
  let creativeSignedUrl: string | null = null;

  if (payload.ad_creative?.image_data_url) {
    const dataUrl = payload.ad_creative.image_data_url.trim();
    const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
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

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/idea-storage/${creativeStoragePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
          "Content-Type": mimeType,
        },
        body: bytes,
      }
    );

    if (!uploadResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to store ad creative" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/idea-storage/${creativeStoragePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 3600 }),
      }
    );

    if (!signResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to sign ad creative URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signData = await signResponse.json();
    creativeSignedUrl = signData?.signedUrl
      ? `${supabaseUrl}${signData.signedUrl}`
      : null;
  }

  const existingResponse = await fetch(`${supabaseUrl}/rest/v1/ideas?id=eq.${ideaId}&select=metadata`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    },
  });

  if (!existingResponse.ok) {
    return new Response(JSON.stringify({ error: "Unable to load idea metadata" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const existingRows = await existingResponse.json();
  const existingMetadata = Array.isArray(existingRows) && existingRows[0]?.metadata ? existingRows[0].metadata : {};

  const nextMetadata = {
    ...existingMetadata,
    ...(payload.facebook_page ? { meta_facebook_page: payload.facebook_page } : {}),
    ...(payload.instagram_page ? { meta_instagram_page: payload.instagram_page } : {}),
    ...(creativeStoragePath ? { meta_ad_creative_path: creativeStoragePath } : {}),
  };

  const updateResponse = await fetch(`${supabaseUrl}/rest/v1/ideas?id=eq.${ideaId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ metadata: nextMetadata }),
  });

  if (!updateResponse.ok) {
    return new Response(JSON.stringify({ error: "Failed to save meta pages" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const updatedRows = await updateResponse.json();
  return new Response(
    JSON.stringify({
      metadata: updatedRows[0]?.metadata ?? nextMetadata,
      ad_creative: creativeStoragePath
        ? { storage_path: creativeStoragePath, signed_url: creativeSignedUrl }
        : null,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
