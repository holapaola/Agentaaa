import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, PlusCircle, Building2, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePipeline } from "@/hooks/usePipeline";
import { useAuth } from "@/hooks/useAuth";
import { canAddClient } from "@/services/subscriptionService";
import ClientWorkspace from "./ClientWorkspace";
import { toast } from "sonner";
import type { AppClient } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  onCreateContent: (client: AppClient) => void;
}

export default function ClientsHub({ onCreateContent }: Props) {
  const { clients, loading, error, refetch } = usePipeline();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [canAdd, setCanAdd] = useState(true);
  const [addReason, setAddReason] = useState("");
  const [cooldownSlots, setCooldownSlots] = useState(0);

  const blockedTooltipMessage =
    addReason ||
    (cooldownSlots > 0
      ? `Limit reached. ${cooldownSlots} slot${cooldownSlots === 1 ? " is" : "s are"} currently in a billing-cycle cooldown period. Upgrade to Premium for unlimited slots.`
      : "Add Client is currently unavailable.");

  useEffect(() => {
    if (user) {
      canAddClient(user.id).then((result) => {
        setCanAdd(result.allowed);
        setAddReason(result.reason || "");
        setCooldownSlots(result.cooldownSlots || 0);
      });
    }
  }, [user, clients.length]);

  const activeClient = clients.find((c) => c.id === selected);

  if (activeClient) {
    return (
      <ClientWorkspace
        client={activeClient}
        onBack={() => setSelected(null)}
        onRefresh={refetch}
        onCreateContent={onCreateContent}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl">Clients</h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            Each client has their own workspace, calendar, and approval queue.
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={canAdd ? -1 : 0}>
                <Button
                  onClick={() => canAdd ? window.location.href = "/onboard" : toast.error(blockedTooltipMessage)}
                  disabled={!canAdd}
                  className="font-display gap-2"
                  size="sm"
                >
                  {!canAdd && <Lock className="w-4 h-4" />}
                  <PlusCircle className="w-4 h-4" /> Add Client
                </Button>
              </span>
            </TooltipTrigger>
            {!canAdd && (
              <TooltipContent className="max-w-xs">
                {blockedTooltipMessage}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {!canAdd && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {blockedTooltipMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          We couldn't load your clients right now. {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!loading && clients.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="font-display font-semibold text-foreground">No clients yet</p>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Add your first client to get started.
            </p>
          </div>
          <Button onClick={() => window.location.href = "/onboard"} className="font-display gap-2">
            <PlusCircle className="w-4 h-4" /> Add Client
          </Button>
        </div>
      )}

      {!loading && clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const pending = (client.posts ?? []).filter((p) => p.status === "Pending_Approval").length;
            const platforms = client.platforms || [];

            return (
              <button
                key={client.id}
                onClick={() => setSelected(client.id)}
                className="text-left rounded-xl border border-border bg-card p-5 space-y-3 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  {pending > 0 && (
                    <span className="text-xs bg-yellow-500 text-black font-bold rounded-full px-2 py-0.5 shrink-0">
                      {pending} pending
                    </span>
                  )}
                </div>

                {/* Name + industry */}
                <div>
                  <p className="font-display font-semibold text-sm text-foreground">{client.company_name}</p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">{client.industry}</p>
                </div>

                {/* Platforms */}
                {platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {platforms.slice(0, 3).map((p) => (
                      <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-body">
                        {p}
                      </span>
                    ))}
                    {platforms.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-body">
                        +{platforms.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* AI summary preview */}
                {client.ai_summary && (
                  <p className="text-xs text-muted-foreground font-body line-clamp-2 leading-relaxed">
                    <Sparkles className="inline w-3 h-3 text-primary mr-1" />
                    {client.ai_summary}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
