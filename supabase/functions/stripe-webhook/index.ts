import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;

  switch (event.type) {
    case "checkout.session.completed": {
      const s = session as Stripe.Checkout.Session;
      await supabase.from("subscriptions").upsert({
        user_id: s.metadata?.userId,
        stripe_customer_id: s.customer as string,
        stripe_subscription_id: s.subscription as string,
        plan: s.metadata?.plan,
        status: "trialing",
      });
      break;
    }
    case "customer.subscription.updated": {
      const sub = session as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: sub.status })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = session as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
