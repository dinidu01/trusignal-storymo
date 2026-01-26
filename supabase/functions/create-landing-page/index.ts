import { createLogger } from "../_shared/logger.ts";

const log = createLogger("create-landing-page");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateLandingPagePayload = {
  idea_id?: string;
  selected_domain?: string;
  template_id?: string;
  status?: "draft" | "published" | "unpublished";
  metadata?: Record<string, unknown>;
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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    log.error("Missing Authorization header", { status: 401 });
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: CreateLandingPagePayload;
  try {
    payload = (await req.json()) as CreateLandingPagePayload;
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl) {
    log.error("Missing SUPABASE_URL", { status: 500 });
    return new Response(JSON.stringify({ error: "Missing SUPABASE_URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const lookupUrl = new URL(`${supabaseUrl}/rest/v1/landing_pages`);
  lookupUrl.searchParams.set("select", "id");
  lookupUrl.searchParams.set("idea_id", `eq.${ideaId}`);

  const existingResponse = await fetch(lookupUrl.toString(), {
    headers: {
      Authorization: authHeader,
    },
  });

  let existingId: string | null = null;
  if (!existingResponse.ok) {
    log.error("Unable to load landing pages; creating new record", {
      status: existingResponse.status,
    });
  } else {
    const existing = await existingResponse.json();
    existingId = Array.isArray(existing) ? existing[0]?.id : null;
  }

  const basePayload = {
    selected_domain: payload.selected_domain ?? null,
    template_id: payload.template_id ?? null,
    status: payload.status ?? "draft",
    metadata: payload.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  const token = authHeader.replace("Bearer ", "");
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
  });
  const userData = await userResponse.json();
  const userId = userData?.id ? String(userData.id) : null;
  if (!userId) {
    log.error("Missing user id", { status: 401 });
    return new Response(JSON.stringify({ error: "Missing user id" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  log.info('upserting landing page for userid ',{ userId} );


  const writeResponse = await fetch(
    `${supabaseUrl}/rest/v1/landing_pages${existingId ? `?id=eq.${existingId}` : ""}`,
    {
      method: existingId ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify(
        existingId
          ? basePayload
          : {
              user_id: userId,
              idea_id: ideaId,
              selected_domain: basePayload.selected_domain,
              template_id: basePayload.template_id,
              status: basePayload.status,
              metadata: basePayload.metadata,
            }
      ),
    }
  );

  if (!writeResponse.ok) {
    log.error("Failed to upsert landing page", { status: writeResponse.status });
    return new Response(JSON.stringify({ error: "Failed to upsert landing page" }), {
      status: writeResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stored = await writeResponse.json();
  const landingPageId = Array.isArray(stored) ? stored[0]?.id : null;

  return new Response(JSON.stringify({ landing_page_id: landingPageId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
