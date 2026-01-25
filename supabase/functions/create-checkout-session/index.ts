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

  let payload: {
    checkoutType?: "ads" | "domain";
    pricePerDay?: number;
    durationDays?: number;
    oneTimeAmount?: number;
    productName?: string;
    productDescription?: string;
    metadata?: Record<string, string>;
    customerEmail?: string;
    returnStep?: "landing" | "ads" | "email" | "results";
    returnSubStep?: number;
    returnDomain?: string;
  };
  try {
    payload = await req.json();
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const oneTimeAmount = Number(payload.oneTimeAmount);
  const pricePerDay = Number(payload.pricePerDay);
  const durationDays = Number(payload.durationDays);

  const strategies = {
    ads: {
      shouldUse: () => Number.isFinite(pricePerDay) && Number.isFinite(durationDays),
      build: () => {
        const quantity = Math.max(1, Math.round(durationDays));
        const unitAmount = Math.round(pricePerDay * 100);
        const productName = payload.productName?.trim() || "Price per Day";
        const productDescription = payload.productDescription?.trim() || `Duration: ${quantity} days`;
        return {
          unitAmount,
          quantity,
          productName,
          productDescription,
          metadata: {
            price_per_day: String(pricePerDay),
            duration_days: String(durationDays),
            sub_total: String(pricePerDay * durationDays),
          },
        };
      },
    },
    domain: {
      shouldUse: () => Number.isFinite(oneTimeAmount),
      build: () => {
        const unitAmount = Math.round(oneTimeAmount * 100);
        const productName = payload.productName?.trim() || "Domain purchase";
        const productDescription = payload.productDescription?.trim() || "";
        return {
          unitAmount,
          quantity: 1,
          productName,
          productDescription,
          metadata: {},
        };
      },
    },
  } as const;

  const selectedStrategy =
    (payload.checkoutType && strategies[payload.checkoutType]) ||
    (strategies.domain.shouldUse() ? strategies.domain : null) ||
    (strategies.ads.shouldUse() ? strategies.ads : null);

  if (!selectedStrategy?.shouldUse()) {
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

  const { unitAmount, quantity, productName, productDescription, metadata } = selectedStrategy.build();
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

  const buildReturnUrl = (status: "success" | "cancel") => {
    const url = new URL(siteUrl);
    url.searchParams.set("checkout", status);
    if (payload.checkoutType) {
      url.searchParams.set("type", payload.checkoutType);
    }
    if (payload.returnStep) {
      url.searchParams.set("step", payload.returnStep);
    }
    if (Number.isFinite(payload.returnSubStep)) {
      url.searchParams.set("substep", String(payload.returnSubStep));
    }
    if (payload.returnDomain?.trim()) {
      url.searchParams.set("domain", payload.returnDomain.trim());
    }
    return url.toString();
  };

  const params = new URLSearchParams({
    "mode": "payment",
    "success_url": buildReturnUrl("success"),
    "cancel_url": buildReturnUrl("cancel"),
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": productName,
    "line_items[0][price_data][product_data][description]": productDescription,
    "line_items[0][price_data][unit_amount]": String(unitAmount),
    "line_items[0][quantity]": String(quantity),
  });

  for (const [key, value] of Object.entries(metadata)) {
    params.set(`metadata[${key}]`, value);
  }

  if (payload.metadata) {
    for (const [key, value] of Object.entries(payload.metadata)) {
      if (typeof value === "string" && value.trim().length > 0) {
        params.set(`metadata[${key}]`, value);
      }
    }
  }

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
