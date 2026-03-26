import { supabase } from "@/integrations/supabase/client";
import { countCooldownClients, countVisibleAgencyClients } from "./clientService";
import { getProfileForUser } from "./profileService";
import { NO_PLANS_MODE } from "@/lib/appMode";

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  monthly_price: number | null;
  trial_days: number | null;
  max_clients: number;
  social_slots_per_platform: number;
  max_scheduled_posts?: number;
}

export interface ClientSlotUsage {
  plan: SubscriptionPlan;
  maxClients: number;
  activeClients: number;
  cooldownClients: number;
  occupiedSlots: number;
}

const PLAN_ID_COMPATIBILITY: Record<string, string[]> = {
  starter: ["starter", "free_trial", "basic"],
  agency: ["agency", "pro"],
  enterprise: ["enterprise"],
  free_trial: ["free_trial", "starter"],
  basic: ["basic", "starter"],
  pro: ["pro", "agency"],
};

export async function getClientSlotUsage(userId: string): Promise<ClientSlotUsage | null> {
  const plan = await getPlanLimits(userId);
  if (!plan) return null;

  if (plan.max_clients === -1) {
    return {
      plan,
      maxClients: plan.max_clients,
      activeClients: 0,
      cooldownClients: 0,
      occupiedSlots: 0,
    };
  }

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (agencyError) {
    throw agencyError;
  }

  if (!agency?.id) {
    throw new Error("No agency found");
  }

  const now = new Date().toISOString();

  const [activeClients, cooldownClients] = await Promise.all([
    countVisibleAgencyClients(agency.id),
    countCooldownClients(agency.id, now),
  ]);

  return {
    plan,
    maxClients: plan.max_clients,
    activeClients,
    cooldownClients,
    occupiedSlots: activeClients + cooldownClients,
  };
}

export async function getBillingCycleEnd(userId: string): Promise<string> {
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (subscription?.current_period_end) {
    return subscription.current_period_end;
  }

  const profile = await getProfileForUser<{ trial_ends_at: string | null }>(userId, "trial_ends_at");
  if (profile?.trial_ends_at) return profile.trial_ends_at;

  throw new Error("We couldn't determine your billing cycle end. Please try again after your subscription refreshes.");
}

export async function getPlanLimits(userId: string): Promise<SubscriptionPlan | null> {
  try {
    if (NO_PLANS_MODE) {
      return {
        id: "unlocked",
        name: "Unlocked",
        display_name: "All features unlocked",
        monthly_price: null,
        trial_days: null,
        max_clients: -1,
        social_slots_per_platform: -1,
        max_scheduled_posts: -1,
      };
    }

    const profile = await getProfileForUser<{ subscription_plan: string | null }>(userId, "subscription_plan");
    let planKey = profile?.subscription_plan ?? null;

    if (!planKey) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", userId)
        .maybeSingle();

      if (subscriptionError) throw subscriptionError;
      planKey = subscription?.plan ?? null;
    }

    if (!planKey) return null;

    const planIds = PLAN_ID_COMPATIBILITY[planKey] ?? [planKey];

    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .in("id", planIds);

    if (error) throw error;

    const plan = plans?.sort((a, b) => planIds.indexOf(a.id) - planIds.indexOf(b.id))[0];

    return (plan as SubscriptionPlan | undefined) ?? null;
  } catch (error) {
    console.error("Error fetching plan limits:", error);
    return null;
  }
}

export async function canAddClient(userId: string): Promise<{ allowed: boolean; reason?: string; cooldownSlots?: number; maxClients?: number }> {
  try {
    if (NO_PLANS_MODE) {
      return { allowed: true };
    }

    const usage = await getClientSlotUsage(userId);
    if (!usage) return { allowed: true };

    return {
      allowed: true,
      cooldownSlots: usage.cooldownClients,
      maxClients: usage.maxClients,
    };
  } catch (error) {
    console.warn("Temporarily bypassing client limit check:", error);
    return { allowed: true };
  }
}

export async function canAddSocialAccount(
  clientId: string,
  platform: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    if (NO_PLANS_MODE) {
      return { allowed: true };
    }

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
    if (NO_PLANS_MODE) {
      return false;
    }

    const profile = await getProfileForUser<{ subscription_status: string | null; trial_ends_at: string | null }>(
      userId,
      "subscription_status, trial_ends_at",
    );

    if (profile?.subscription_status !== "trialing") return false;
    if (!profile?.trial_ends_at) return false;

    return new Date(profile.trial_ends_at) < new Date();
  } catch (error) {
    console.error("Error checking trial expiration:", error);
    return false;
  }
}

export async function canSchedulePost(
  clientId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  try {
    if (NO_PLANS_MODE) {
      return { allowed: true };
    }

    const plan = await getPlanLimits(userId);
    if (!plan) return { allowed: false, reason: "No subscription plan found" };

    if (plan.max_scheduled_posts === -1) return { allowed: true }; // Unlimited

    const { count } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["Scheduled", "Pending_Approval"]); // Count scheduled + pending

    const used = count ?? 0;
    const remaining = plan.max_scheduled_posts - used;

    if (used >= plan.max_scheduled_posts) {
      return {
        allowed: false,
        reason: `Your ${plan.name} plan allows ${plan.max_scheduled_posts} scheduled posts. You've reached the limit. Upgrade to schedule more.`,
        remaining: 0,
      };
    }

    return { allowed: true, remaining };
  } catch (error) {
    console.error("Error checking scheduled posts limit:", error);
    return { allowed: false, reason: "Error checking limits" };
  }
}
