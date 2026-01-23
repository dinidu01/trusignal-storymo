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
      segments: {
        type: "array",
        minItems: segmentCount,
        maxItems: segmentCount,
        items: segmentSchema,
      },
    },
    required: ["segments"],
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
//   "segment_count": 3
// }
// Response format (JSON):
// {
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
    return new Response(JSON.stringify(json), {
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
