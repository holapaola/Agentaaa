import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  monthly_price: number | null;
  trial_days: number | null;
  max_clients: number;
  social_slots_per_platform: number;
}

export async function getPlanLimits(userId: string): Promise<SubscriptionPlan | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("id", userId)
      .single();

    if (!profile?.subscription_plan) return null;

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", profile.subscription_plan)
      .single();

    return plan as SubscriptionPlan;
  } catch (error) {
    console.error("Error fetching plan limits:", error);
    return null;
  }
}

export async function canAddClient(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const plan = await getPlanLimits(userId);
    if (!plan) return { allowed: false, reason: "No subscription plan found" };

    if (plan.max_clients === -1) return { allowed: true }; // Unlimited

    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", userId)
      .single();

    if (!profile?.agency_id) return { allowed: false, reason: "No agency found" };

    const { count } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", profile.agency_id);

    if ((count ?? 0) >= plan.max_clients) {
      return {
        allowed: false,
        reason: `Your ${plan.name} plan allows ${plan.max_clients} clients. Upgrade to add more.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking client limit:", error);
    return { allowed: false, reason: "Error checking limits" };
  }
}

export async function canAddSocialAccount(
  clientId: string,
  platform: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const plan = await getPlanLimits(userId);
    if (!plan) return { allowed: false, reason: "No subscription plan found" };

    if (plan.social_slots_per_platform === -1) return { allowed: true }; // Unlimited

    const { count } = await supabase
      .from("client_social_accounts")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("platform", platform);

    if ((count ?? 0) >= plan.social_slots_per_platform) {
      return {
        allowed: false,
        reason: `Your ${plan.name} plan allows ${plan.social_slots_per_platform} ${platform} account(s) per client. Upgrade for unlimited.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking social account limit:", error);
    return { allowed: false, reason: "Error checking limits" };
  }
}

export async function isTrialExpired(userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at")
      .eq("id", userId)
      .single();

    if (profile?.subscription_status !== "trialing") return false;
    if (!profile?.trial_ends_at) return false;

    return new Date(profile.trial_ends_at) < new Date();
  } catch (error) {
    console.error("Error checking trial expiration:", error);
    return false;
  }
}

export const PLANS = {
  FREE_TRIAL: "free_trial",
  BASIC: "basic",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};
