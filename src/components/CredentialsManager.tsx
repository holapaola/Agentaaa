import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Credential {
  id: string;
  platform: string;
  key_name: string;
  credential_type: string;
  created_at: string;
}

interface Props {
  clientId: string;
  onUpdate?: () => void;
}

const PLATFORMS = ["OpenAI", "Stripe", "Custom API", "Webhook"];
const CREDENTIAL_TYPES = ["api_key", "webhook_secret", "webhook_url", "bearer_token"];

export default function CredentialsManager({ clientId, onUpdate }: Props) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    platform: "",
    key_name: "",
    credential_type: "api_key",
    value: "",
  });

  useEffect(() => {
    fetchCredentials();
  }, [clientId]);

  async function fetchCredentials() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-credentials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            client_id: clientId,
            action: "list",
          }),
        }
      );

      const result = await response.json();
      if (result.success) setCredentials(result.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!formData.platform || !formData.key_name || !formData.value) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-credentials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            client_id: clientId,
            action: "add",
            platform: formData.platform,
            key_name: formData.key_name,
            credential_type: formData.credential_type,
            value: formData.value,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("✅ Credential saved securely");
        setFormData({ platform: "", key_name: "", credential_type: "api_key", value: "" });
        setIsAddingNew(false);
        fetchCredentials();
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to save credential");
      }
    } catch (err) {
      toast.error("Error saving credential");
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this credential? This action cannot be undone.")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-credentials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            client_id: clientId,
            action: "delete",
            credential_id: id,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Credential deleted");
        fetchCredentials();
        onUpdate?.();
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting credential");
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Platform Credentials</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            🔒 Encrypted
          </span>
        </div>
        {!isAddingNew && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddingNew(true)}
            className="font-display gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        )}
      </div>

      {/* Add New Form */}
      {isAddingNew && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
              >
                <option value="">Select...</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Type
              </label>
              <select
                value={formData.credential_type}
                onChange={(e) =>
                  setFormData({ ...formData, credential_type: e.target.value })
                }
                className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
              >
                {CREDENTIAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Name (e.g., "Production Key")
            </label>
            <Input
              placeholder="Human-readable name"
              value={formData.key_name}
              onChange={(e) =>
                setFormData({ ...formData, key_name: e.target.value })
              }
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Value (kept encrypted)
            </label>
            <Input
              type="password"
              placeholder="API key or secret..."
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              className="text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              className="font-display gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setFormData({
                  platform: "",
                  key_name: "",
                  credential_type: "api_key",
                  value: "",
                });
              }}
              className="font-display gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Credentials List */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No credentials yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {cred.platform} · {cred.key_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cred.credential_type} • Added{" "}
                  {new Date(cred.created_at).toLocaleDateString()}
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(cred.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
