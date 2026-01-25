const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildSchema = (segmentCount: number) => {
  const segmentSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      segment_name: { type: "string" },
      audience: { type: "string" },
      problem: { type: "string" },
      facebook_page_bio: { type: "string" },
      instagram_page_bio: { type: "string" },
      meta_ad_headlines: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: { type: "string" },
      },
      meta_ad_descriptions: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: { type: "string" },
      },
      facebook_ad_campaign_texts: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: { type: "string" },
      },
    },
    required: [
      "segment_name",
      "audience",
      "problem",
      "facebook_page_bio",
      "instagram_page_bio",
      "meta_ad_headlines",
      "meta_ad_descriptions",
      "facebook_ad_campaign_texts",
    ],
  };

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      suggested_subdomain: { type: "string" },
      segments: {
        type: "array",
        minItems: segmentCount,
        maxItems: segmentCount,
        items: segmentSchema,
      },
    },
    required: ["suggested_subdomain", "segments"],
  };
};

const clampSegmentCount = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 3;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
};

// Request format (POST JSON):
// {
//   "idea": "string",
//   "audience": "string",
//   "problem": "string",
//   "segment_count": 3,
//   "idea_id": "uuid"
// }
// Response format (JSON):
// {
//   "suggested_subdomain": "string",
//   "segments": [
//     {
//       "segment_name": "string",
//       "audience": "string",
//       "problem": "string",
//       "facebook_page_bio": "string",
//       "instagram_page_bio": "string",
//       "meta_ad_headlines": ["string", "string", "string"],
//       "meta_ad_descriptions": ["string", "string", "string"],
//       "facebook_ad_campaign_texts": ["string", "string", "string"]
//     }
//   ]
// }
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

  let payload: {
    idea?: string;
    audience?: string;
    problem?: string;
    segment_count?: number;
    idea_id?: string;
  };

  try {
    payload = await req.json();
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const idea = payload.idea?.trim();
  const audience = payload.audience?.trim();
  const problem = payload.problem?.trim();
  const segmentCount = clampSegmentCount(payload.segment_count);

  if (!idea || !audience || !problem) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: idea, audience, problem",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
  const schema = buildSchema(segmentCount);

  const prompt = [
    `Idea: ${idea}`,
    `Target audience (base): ${audience}`,
    `Problem to solve (base): ${problem}`,
    `Generate ${segmentCount} audience segments.`,
    `Also suggest a short subdomain (2-16 chars, lowercase letters/numbers, no spaces) for ${idea}.`,
    `For each segment, return: segment_name, audience, problem, facebook_page_bio, instagram_page_bio,`,
    `meta_ad_headlines (3), meta_ad_descriptions (3), facebook_ad_campaign_texts (3).`,
    `facebook_ad_campaign_texts must follow the format: "[Target audience]! [a compelling pain point]"`,
    `Keep output strictly valid JSON, no extra keys, no markdown.`,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are a marketing copy assistant. Output only valid JSON that matches the provided schema.",
        },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "audience_copy",
          strict: true,
          schema,
        },
      },
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        error: data?.error?.message ?? "LLM request failed",
      }),
      {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let outputText = data?.output_text;
  if (!outputText && Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (item?.type === "message" && Array.isArray(item.content)) {
        const part = item.content.find((content: { type?: string }) =>
          content?.type === "output_text"
        );
        if (part?.text) {
          outputText = part.text;
          break;
        }
      }
    }
  }

  if (!outputText) {
    return new Response(
      JSON.stringify({ error: "Missing LLM output text" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const json = JSON.parse(outputText);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
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
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: "Unable to resolve user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userData = await userResponse.json();
    const userId = userData?.id ? String(userData.id) : null;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user id" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ideaId = payload.idea_id?.trim();
    let existingMetadata: Record<string, unknown> | null = null;

    if (ideaId) {
      const existingResponse = await fetch(`${supabaseUrl}/rest/v1/ideas?id=eq.${ideaId}&select=metadata`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
      });

      if (existingResponse.ok) {
        const existingRows = await existingResponse.json();
        existingMetadata =
          Array.isArray(existingRows) && existingRows[0]?.metadata
            ? existingRows[0].metadata
            : null;
      }
    }

    const mergedMetadata = {
      ...(existingMetadata ?? {}),
      segment_count: segmentCount,
      suggested_subdomain: json?.suggested_subdomain ?? null,
    };

    const writeResponse = await fetch(
      `${supabaseUrl}/rest/v1/ideas${ideaId ? `?id=eq.${ideaId}` : ""}`,
      {
        method: ideaId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(
          ideaId
            ? {
                idea_text: idea,
                target_audience: audience,
                problem_solved: problem,
                research_data: json,
                metadata: mergedMetadata,
                updated_at: new Date().toISOString(),
              }
            : {
                user_id: userId,
                idea_text: idea,
                target_audience: audience,
                problem_solved: problem,
                research_data: json,
                metadata: mergedMetadata,
              }
        ),
      }
    );

    if (!writeResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to store idea analysis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stored = await writeResponse.json();
    const storedIdeaId = Array.isArray(stored) ? stored[0]?.id : null;

    return new Response(JSON.stringify({ ...json, idea_id: storedIdeaId ?? ideaId ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "LLM output was not valid JSON" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
