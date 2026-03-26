import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { NO_PLANS_MODE } from "@/lib/appMode";

export type SubscriptionStatus = "inactive" | "trialing" | "active" | "canceled";
export type SubscriptionPlan   = "starter" | "agency" | "enterprise" | null;

interface SubscriptionState {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  isActive: boolean; // true if trialing or active
  loading: boolean;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    status: "inactive",
    plan: null,
    isActive: false,
    loading: true,
  });

  useEffect(() => {
    if (NO_PLANS_MODE) {
      setState({ status: "active", plan: null, isActive: true, loading: false });
      return;
    }

    if (!user) {
      setState({ status: "inactive", plan: null, isActive: false, loading: false });
      return;
    }

    supabase
      .from("profiles")
      .select("subscription_status, subscription_plan")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const status = (data?.subscription_status ?? "inactive") as SubscriptionStatus;
        const plan   = (data?.subscription_plan ?? null) as SubscriptionPlan;
        setState({
          status,
          plan,
          isActive: status === "trialing" || status === "active",
          loading: false,
        });
      });
  }, [user]);

  return state;
}
