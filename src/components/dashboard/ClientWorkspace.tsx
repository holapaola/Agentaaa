import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Sparkles, PlusCircle, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContentCalendar from "./ContentCalendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppClient, AppPost } from "@/types";
import { getBillingCycleEnd } from "@/services/subscriptionService";
import { removeAgencyClient } from "@/services/clientService";
import { NO_PLANS_MODE } from "@/lib/appMode";
import { PLATFORM_OPTIONS } from "@/lib/clientProfileOptions";
import ClientDeleteAlert from "@/components/workspace/ClientDeleteAlert";
import SocialConnectModal from "@/components/workspace/SocialConnectModal";
import ClientDetailsEditor, { type ClientEditForm } from "@/components/workspace/ClientDetailsEditor";
import SocialAccountsView from "@/components/workspace/SocialAccountsView";
import ClientOverviewTab from "@/components/workspace/ClientOverviewTab";

const SUPABASE_URL = "https://cfgqppdkligczhktouny.supabase.co";
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/social-oauth-callback`;

function buildOAuthUrl(platform: string, clientId: string, userId: string): string | null {
  const state = btoa(`${platform}|${clientId}|${userId}`);
  const metaAppId  = import.meta.env.VITE_META_APP_ID;
  const liClientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;

  if (platform === "Instagram" && metaAppId) {
    const scope = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";
    return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`;
  }
  if (platform === "LinkedIn" && liClientId) {
    const scope = "openid profile w_member_social";
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${liClientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  }
  return null;
}

interface SocialAccount {
  id: string;
  platform: string;
  account_handle: string | null;
  access_token: string | null;
}

function buildInitialForm(client: AppClient): ClientEditForm {
  return {
    company_name: client.company_name,
    website_url: client.website_url ?? "",
    business_description: client.business_description ?? "",
    industry: client.industry ?? "",
    brand_voice: client.brand_voice ?? "",
    platforms: client.platforms ?? [],
    campaign_goal: client.campaign_goal ?? "",
    target_audience_type: (client.target_audience_type as "B2B" | "B2C" | "") ?? "",
    target_age_range: client.target_age_range ?? "",
    target_description: client.target_description ?? "",
    content_types: client.content_types ?? [],
    posting_frequency: client.posting_frequency ?? "",
    brand_primary_color: (client as Record<string, unknown>).brand_primary_color as string ?? "",
    brand_secondary_color: (client as Record<string, unknown>).brand_secondary_color as string ?? "",
    brand_accent_color: (client as Record<string, unknown>).brand_accent_color as string ?? "",
    brand_visual_style: (client as Record<string, unknown>).brand_visual_style as string ?? "",
    brand_personality_tags: (client as Record<string, unknown>).brand_personality_tags as string[] ?? [],
    brand_notes: (client as Record<string, unknown>).brand_notes as string ?? "",
  };
}

interface Props {
  client: AppClient;
  onBack: () => void;
  onRefresh: () => void;
  onCreateContent: (client: AppClient) => void;
}

type View = "overview" | "calendar" | "social";

export default function ClientWorkspace({ client, onBack, onRefresh, onCreateContent }: Props) {
  const [view, setView] = useState<View>("overview");
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [connectModal, setConnectModal] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ClientEditForm>(() => buildInitialForm(client));
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slotLockUntil, setSlotLockUntil] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Suppress unused warning — kept for future use
  void useMemo(() => PLATFORM_OPTIONS, []);

  const canSaveClient =
    editForm.company_name.trim().length > 0 &&
    editForm.industry.trim().length > 0 &&
    editForm.platforms.length > 0 &&
    editForm.brand_voice.trim().length > 0 &&
    editForm.campaign_goal.trim().length > 0 &&
    editForm.target_audience_type.length > 0 &&
    editForm.target_age_range.trim().length > 0 &&
    editForm.content_types.length > 0 &&
    editForm.posting_frequency.trim().length > 0;

  const pendingPosts = (client.posts ?? []).filter((p: AppPost) => p.status === "Pending_Approval");

  const refreshAccounts = useCallback(() =>
    supabase.from("client_social_accounts").select("id, platform, account_handle, access_token")
      .eq("client_id", client.id).then(({ data }) => setSocialAccounts(data ?? [])), [client.id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    refreshAccounts();
    setEditForm(buildInitialForm(client));

    const params = new URLSearchParams(window.location.search);
    const success = params.get("oauth_success");
    const err     = params.get("oauth_error");
    const cbClient = params.get("client");
    if (success && cbClient === client.id) {
      toast.success(`${decodeURIComponent(success)} connected successfully! 🎉`);
      refreshAccounts();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (err) {
      toast.error(`OAuth error: ${decodeURIComponent(err)}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [client, refreshAccounts]);

  async function connectAccount() {
    if (!connectModal || !handle.trim()) return;
    setSaving(true);
    try {
      const existing = socialAccounts.find((a) => a.platform === connectModal);
      if (existing) {
        const { error } = await supabase.from("client_social_accounts").update({ account_handle: handle, access_token: token || null }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("client_social_accounts").insert({ client_id: client.id, platform: connectModal, account_handle: handle, access_token: token || null });
        if (error) throw error;
      }
      await refreshAccounts();
      toast.success(`${connectModal} account saved!`);
      setConnectModal(null);
      setHandle("");
      setToken("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't save this social account.");
    } finally {
      setSaving(false);
    }
  }

  function initiateOAuth(platform: string) {
    if (!userId) { toast.error("Not logged in"); return; }
    const url = buildOAuthUrl(platform, client.id, userId);
    if (url) {
      window.location.href = url;
    } else {
      toast.info(`Add VITE_${platform === "Instagram" ? "META" : "LINKEDIN"}_APP_ID to .env to enable real OAuth. Using manual entry for now.`);
      setConnectModal(platform);
      setHandle(""); setToken("");
    }
  }

  function handleConnect(platform: string) {
    if (platform === "Instagram" || platform === "LinkedIn") {
      initiateOAuth(platform);
    } else {
      setConnectModal(platform); setHandle(""); setToken("");
    }
  }

  function handleEditManual(platform: string, currentHandle: string) {
    setConnectModal(platform);
    setHandle(currentHandle);
    setToken("");
  }

  async function disconnectAccount(platform: string) {
    const acc = socialAccounts.find((a) => a.platform === platform);
    if (!acc) return;
    const { error } = await supabase.from("client_social_accounts").delete().eq("id", acc.id);
    if (error) { toast.error(error.message); return; }
    setSocialAccounts((prev) => prev.filter((a) => a.platform !== platform));
    toast.success(`${platform} disconnected.`);
  }

  async function saveClientDetails() {
    if (!canSaveClient) { toast.error("Please complete all required client details before saving."); return; }
    setIsSavingClient(true);
    try {
      const { error } = await supabase.from("clients").update({
        company_name: editForm.company_name.trim(),
        website_url: editForm.website_url.trim() || null,
        business_description: editForm.business_description.trim() || null,
        industry: editForm.industry.trim(),
        brand_voice: editForm.brand_voice,
        platforms: editForm.platforms,
        campaign_goal: editForm.campaign_goal,
        target_audience_type: editForm.target_audience_type || null,
        target_age_range: editForm.target_age_range || null,
        target_description: editForm.target_description.trim() || null,
        content_types: editForm.content_types,
        posting_frequency: editForm.posting_frequency || null,
        brand_primary_color: editForm.brand_primary_color || null,
        brand_secondary_color: editForm.brand_secondary_color || null,
        brand_accent_color: editForm.brand_accent_color || null,
        brand_visual_style: editForm.brand_visual_style || null,
        brand_personality_tags: editForm.brand_personality_tags.length > 0 ? editForm.brand_personality_tags : null,
        brand_notes: editForm.brand_notes.trim() || null,
      }).eq("id", client.id);
      if (error) throw error;
      toast.success("Client details updated.");
      setEditOpen(false);
      onRefresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't update this client.");
    } finally {
      setIsSavingClient(false);
    }
  }

  async function openDeleteFlow() {
    if (NO_PLANS_MODE) { setSlotLockUntil(null); setDeleteOpen(true); return; }
    if (!userId) { toast.error("Please sign in again before deleting a client."); return; }
    try {
      const billingCycleEnd = await getBillingCycleEnd(userId);
      setSlotLockUntil(billingCycleEnd);
      setDeleteOpen(true);
    } catch (error: unknown) {
      console.warn("Falling back to immediate client deletion:", error);
      setSlotLockUntil(null);
      setDeleteOpen(true);
    }
  }

  async function deleteClient() {
    const deleteLockLabel = slotLockUntil
      ? new Date(slotLockUntil).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
      : "your next billing cycle";
    setIsDeleting(true);
    try {
      const result = await removeAgencyClient(client.id, { slotLockedUntil: slotLockUntil });
      toast.success(
        result.slotLocked
          ? `Client removed. This slot stays occupied until ${deleteLockLabel} per platform policy.`
          : "Client removed.",
      );
      setDeleteOpen(false);
      onRefresh();
      onBack();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't remove this client.");
    } finally {
      setIsDeleting(false);
    }
  }

  const navItems: { id: View; label: string; emoji: string }[] = [
    { id: "overview", label: "Overview",        emoji: "🏠" },
    { id: "calendar", label: "Content Calendar", emoji: "📅" },
    { id: "social",   label: "Social Accounts",  emoji: "🔗" },
  ];

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl leading-tight">{client.company_name}</h2>
          <p className="text-xs text-muted-foreground font-body">{client.industry}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {pendingPosts.length > 0 && (
            <span className="text-xs bg-yellow-500 text-black font-bold rounded-full px-2 py-0.5">
              {pendingPosts.length} pending
            </span>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-red-400 border-red-500/30 hover:text-red-300" onClick={openDeleteFlow}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex items-center gap-1 border-b border-border pb-0">
        {navItems.map((n) => (
          <button key={n.id} onClick={() => setView(n.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              view === n.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {n.emoji} {n.label}
          </button>
        ))}
        <Button size="sm" onClick={() => onCreateContent(client)} className="ml-auto font-display gap-1.5 mb-1">
          <PlusCircle className="w-4 h-4" /> Create Content
        </Button>
      </div>

      {/* Views */}
      {view === "overview" && (
        <ClientOverviewTab
          client={client}
          pendingPosts={pendingPosts}
          onCreateContent={onCreateContent}
          onEditClient={() => setEditOpen(true)}
        />
      )}

      {view === "calendar" && <ContentCalendar clientId={client.id} />}

      {view === "social" && (
        <SocialAccountsView
          clientName={client.company_name}
          socialAccounts={socialAccounts}
          onConnect={handleConnect}
          onDisconnect={disconnectAccount}
          onEditManual={handleEditManual}
        />
      )}

      {/* Modals */}
      <SocialConnectModal
        platform={connectModal}
        isOpen={connectModal !== null}
        onClose={() => { setConnectModal(null); setHandle(""); setToken(""); }}
        handle={handle}
        setHandle={setHandle}
        token={token}
        setToken={setToken}
        onSave={connectAccount}
        isSaving={saving}
      />

      <ClientDetailsEditor
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={saveClientDetails}
        isSaving={isSavingClient}
        canSave={canSaveClient}
      />

      <ClientDeleteAlert
        isOpen={deleteOpen}
        onClose={setDeleteOpen}
        onConfirm={deleteClient}
        clientName={client.company_name}
        slotLockUntil={slotLockUntil}
        isDeleting={isDeleting}
      />
    </div>
  );
}
