import { createLogger } from "../_shared/logger.ts";

const log = createLogger("create-idea");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateIdeaPayload = {
  idea_text?: string;
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

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    log.error("Missing Authorization header", { status: 401 });
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: CreateIdeaPayload;
  try {
    payload = (await req.json()) as CreateIdeaPayload;
  } catch (_error) {
    log.error("Invalid JSON payload", { status: 400 });
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ideaText = payload.idea_text?.trim();
  if (!ideaText) {
    log.error("Missing idea_text", { status: 400 });
    return new Response(JSON.stringify({ error: "Missing idea_text" }), {
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


  const response = await fetch(`${supabaseUrl}/rest/v1/ideas`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({
      user_id: userId,
      idea_text: ideaText,
      metadata: payload.metadata ?? {},
    }),
  });

  if (!response.ok) {
    log.error("Failed to create idea", { status: response.status });
    return new Response(JSON.stringify({ error: "Failed to create idea" }), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const created = await response.json();
  const ideaId = Array.isArray(created) ? created[0]?.id : null;

  return new Response(JSON.stringify({ idea_id: ideaId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
