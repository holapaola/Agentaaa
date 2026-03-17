import { supabase } from "@/integrations/supabase/client";

export type Plan = "starter" | "agency" | "enterprise";

export async function redirectToCheckout(plan: Plan): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "/mock-checkout";
    return;
  }

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      plan,
      userId: session.user.id,
      email: session.user.email,
    },
  });

  if (error || !data?.url) {
    throw new Error(error?.message ?? "Failed to create checkout session");
  }

  window.location.href = data.url;
}

export async function getSubscription() {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}
