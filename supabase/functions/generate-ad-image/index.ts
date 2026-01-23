const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildPrompt = (idea: string, audience: string, problem: string) => {
  return [
    "Create a high-quality marketing ad image.",
    `Idea: ${idea}`,
    `Target audience: ${audience}`,
    `Problem to solve: ${problem}`,
    "Style: modern, trustworthy, vibrant lighting, clear focal point, no text.",
    "Output: a single image suited for social media ads.",
  ].join("\n");
};

const parseImageStream = async (body: ReadableStream<Uint8Array>) => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let imageBase64 = "";
  let done = false;

  while (!done) {
    const result = await reader.read();
    if (result.done) break;

    buffer += decoder.decode(result.value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        if (payload === "[DONE]") {
          done = true;
          break;
        }

        try {
          const parsed = JSON.parse(payload);
          if (Array.isArray(parsed?.data)) {
            for (const item of parsed.data) {
              if (item?.b64_json) {
                imageBase64 = String(item.b64_json);
              }
            }
          } else if (parsed?.b64_json) {
            imageBase64 = String(parsed.b64_json);
          }
        } catch (_error) {
          // Ignore non-JSON events.
        }
      }
      if (done) break;
    }
  }

  return imageBase64;
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

  let payload: { idea?: string; audience?: string; problem?: string };
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

  const prompt = buildPrompt(idea, audience, problem);

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1-mini",
      prompt,
      size: "1536x1024",
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return new Response(JSON.stringify({ error: errorBody || "Image request failed" }), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!response.body) {
    return new Response(JSON.stringify({ error: "Missing image stream" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const imageBase64 = await parseImageStream(response.body);
  if (!imageBase64) {
    return new Response(JSON.stringify({ error: "No image data received" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      image_data_url: `data:image/png;base64,${imageBase64}`,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
