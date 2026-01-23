const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  let payload: { pricePerDay?: number; durationDays?: number; customerEmail?: string };
  try {
    payload = await req.json();
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const pricePerDay = Number(payload.pricePerDay);
  const durationDays = Number(payload.durationDays);

  if (!Number.isFinite(pricePerDay) || !Number.isFinite(durationDays)) {
    return new Response(JSON.stringify({ error: "Missing pricing details" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const siteUrl = Deno.env.get("SITE_URL");
  if (!stripeKey || !siteUrl) {
    return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY or SITE_URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const unitAmount = Math.round(pricePerDay * 100);
  const quantity = Math.max(1, Math.round(durationDays));
  let customerEmail = payload.customerEmail?.trim();

  if (!customerEmail) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (supabaseUrl && supabaseAnonKey && token) {
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData?.email) {
          customerEmail = String(userData.email);
        }
      }
    }
  }

  const params = new URLSearchParams({
    "mode": "payment",
    "success_url": `${siteUrl}/?payment=success`,
    "cancel_url": `${siteUrl}/?payment=cancelled`,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": "Price per Day",
    "line_items[0][price_data][product_data][description]": `Duration: ${quantity} days`,
    "line_items[0][price_data][unit_amount]": String(unitAmount),
    "line_items[0][quantity]": String(quantity),
    "metadata[price_per_day]": String(pricePerDay),
    "metadata[duration_days]": String(durationDays),
    "metadata[sub_total]": String(pricePerDay * durationDays),
  });

  if (customerEmail) {
    params.set("customer_email", customerEmail);
  }

  const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const sessionData = await sessionResponse.json();
  if (!sessionResponse.ok) {
    return new Response(
      JSON.stringify({ error: sessionData?.error?.message ?? "Stripe session failed" }),
      {
        status: sessionResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify({ url: sessionData.url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
