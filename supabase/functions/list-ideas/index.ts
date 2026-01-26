import { createLogger } from "../_shared/logger.ts";

const log = createLogger("list-ideas");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    log.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY", { status: 500 });
    return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(`${supabaseUrl}/rest/v1/ideas`);
  url.searchParams.set(
    "select",
    "id,idea_text,target_audience,problem_solved,research_data,metadata,created_at"
  );
  url.searchParams.set("order", "created_at.desc");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: authHeader,
      apikey: supabaseAnonKey,
    },
  });

  if (!response.ok) {
    log.error("Failed to load ideas", { status: response.status });
    return new Response(JSON.stringify({ error: "Failed to load ideas" }), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ideas = await response.json();
  return new Response(JSON.stringify({ ideas }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
