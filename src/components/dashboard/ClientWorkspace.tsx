import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, PlusCircle, Wifi, WifiOff, Loader2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrandProfileCard from "./BrandProfileCard";
import ApprovalCard from "./ApprovalCard";
import ContentCalendar from "./ContentCalendar";
import CredentialsManager from "@/components/CredentialsManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface Client {
  id: string;
  company_name: string;
  industry: string;
  brand_voice: string;
  platforms?: string[];
  ai_summary?: string | null;
  posts?: any[];
  [key: string]: any;
}

interface Props {
  client: Client;
  onBack: () => void;
  onRefresh: () => void;
  onCreateContent: (client: Client) => void;
}

type View = "overview" | "calendar" | "social";

const PLATFORMS = [
  { id: "Instagram", emoji: "📸", color: "text-pink-400" },
  { id: "LinkedIn",  emoji: "💼", color: "text-blue-400" },
  { id: "Twitter",   emoji: "🐦", color: "text-sky-400" },
  { id: "TikTok",    emoji: "🎵", color: "text-purple-400" },
  { id: "Facebook",  emoji: "📘", color: "text-indigo-400" },
];

interface SocialAccount {
  id: string;
  platform: string;
  account_handle: string | null;
  access_token: string | null;
}

export default function ClientWorkspace({ client, onBack, onRefresh, onCreateContent }: Props) {
  const [view, setView] = useState<View>("overview");
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [connectModal, setConnectModal] = useState<string | null>(null); // platform name (manual entry only)
  const [handle, setHandle] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const pendingPosts = (client.posts ?? []).filter((p: any) => p.status === "Pending_Approval");

  const refreshAccounts = () =>
    supabase.from("client_social_accounts").select("id, platform, account_handle, access_token")
      .eq("client_id", client.id).then(({ data }) => setSocialAccounts(data ?? []));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    refreshAccounts();

    // Detect OAuth callback results in URL
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
  }, [client.id]);

  async function connectAccount() {
    if (!connectModal || !handle.trim()) return;
    setSaving(true);
    const existing = socialAccounts.find((a) => a.platform === connectModal);
    if (existing) {
      await supabase.from("client_social_accounts").update({ account_handle: handle, access_token: token || null }).eq("id", existing.id);
    } else {
      await supabase.from("client_social_accounts").insert({ client_id: client.id, platform: connectModal, account_handle: handle, access_token: token || null });
    }
    await refreshAccounts();
    toast.success(`${connectModal} account saved!`);
    setConnectModal(null); setHandle(""); setToken("");
    setSaving(false);
  }

  function initiateOAuth(platform: string) {
    if (!userId) { toast.error("Not logged in"); return; }
    const url = buildOAuthUrl(platform, client.id, userId);
    if (url) {
      window.location.href = url;
    } else {
      // App ID not configured — fall back to manual entry
      toast.info(`Add VITE_${platform === "Instagram" ? "META" : "LINKEDIN"}_APP_ID to .env to enable real OAuth. Using manual entry for now.`);
      setConnectModal(platform);
      setHandle(""); setToken("");
    }
  }

  async function disconnectAccount(platform: string) {
    const acc = socialAccounts.find((a) => a.platform === platform);
    if (!acc) return;
    await supabase.from("client_social_accounts").delete().eq("id", acc.id);
    setSocialAccounts((prev) => prev.filter((a) => a.platform !== platform));
    toast.success(`${platform} disconnected.`);
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
        {pendingPosts.length > 0 && (
          <span className="ml-auto text-xs bg-yellow-500 text-black font-bold rounded-full px-2 py-0.5">
            {pendingPosts.length} pending
          </span>
        )}
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
        {/* Create content button always visible */}
        <Button size="sm" onClick={() => onCreateContent(client)}
          className="ml-auto font-display gap-1.5 mb-1">
          <PlusCircle className="w-4 h-4" /> Create Content
        </Button>
      </div>

      {/* Views */}
      {view === "overview" && (
        <div className="space-y-6">
          <BrandProfileCard client={client} />

          {/* Credentials Manager */}
          <div className="rounded-xl border border-border bg-card p-5">
            <CredentialsManager clientId={client.id} onUpdate={onRefresh} />
          </div>

          {pendingPosts.length > 0 ? (
            <div>
              <p className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Pending Approval
              </p>
              <ApprovalCard posts={pendingPosts} onAction={onRefresh} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground font-body">No posts waiting for approval.</p>
              <Button variant="outline" size="sm" onClick={() => onCreateContent(client)} className="font-display gap-2">
                <PlusCircle className="w-4 h-4" /> Create a Post
              </Button>
            </div>
          )}
        </div>
      )}

      {view === "calendar" && (
        <ContentCalendar clientId={client.id} />
      )}

      {view === "social" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Connect social media accounts for <strong>{client.company_name}</strong>. Tokens are stored securely for future API integrations.</p>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {PLATFORMS.map((p) => {
              const acc = socialAccounts.find((a) => a.platform === p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                  <span className={`text-lg ${p.color}`}>{p.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.id}</p>
                    {acc?.account_handle && <p className="text-xs text-muted-foreground">@{acc.account_handle}</p>}
                  </div>
                  {acc
                    ? <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-green-400"><Wifi className="w-3 h-3" /> Connected</span>
                        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground h-7 px-2"
                          onClick={() => { setConnectModal(p.id); setHandle(acc.account_handle ?? ""); setToken(""); }}>Edit</Button>
                        <Button size="sm" variant="ghost" className="text-xs text-red-400 h-7 px-2"
                          onClick={() => disconnectAccount(p.id)}><X className="w-3 h-3" /></Button>
                      </div>
                    : <Button size="sm" variant="outline" className="text-xs gap-1.5 font-display"
                        onClick={() => {
                          if (p.id === "Instagram" || p.id === "LinkedIn") {
                            initiateOAuth(p.id);
                          } else {
                            setConnectModal(p.id); setHandle(""); setToken("");
                          }
                        }}>
                        {(p.id === "Instagram" || p.id === "LinkedIn")
                          ? <><ExternalLink className="w-3 h-3" /> Connect via OAuth</>
                          : <><WifiOff className="w-3 h-3" /> Connect</>
                        }
                      </Button>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connect modal */}
      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4 mx-4">
            <h3 className="text-base font-semibold font-display">Connect {connectModal}</h3>
            <p className="text-xs text-muted-foreground">Enter the account details. The access token will be stored for future API use.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Account Handle (username)</label>
                <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="e.g. mybrand" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Access Token <span className="text-muted-foreground">(optional for now)</span></label>
                <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token when available" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setConnectModal(null); setHandle(""); setToken(""); }}>Cancel</Button>
              <Button size="sm" disabled={!handle.trim() || saving} onClick={connectAccount} className="gap-1.5">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
