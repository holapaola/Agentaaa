import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Loader2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateClientSummary } from "@/services/agentService";
import { toast } from "sonner";

interface Client {
  id: string;
  company_name: string;
  industry: string;
  brand_voice: string;
  platforms?: string[];
  ai_summary?: string | null;
  [key: string]: any;
}

interface Props {
  client: Client;
  onSummaryGenerated?: (summary: string) => void;
}

export default function BrandProfileCard({ client, onSummaryGenerated }: Props) {
  const [summary, setSummary] = useState<string>(client.ai_summary || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client.ai_summary) generate();
    else setSummary(client.ai_summary);
  }, [client.id]);

  async function generate() {
    setLoading(true);
    try {
      const text = await generateClientSummary(client);
      setSummary(text);
      await supabase.from("clients").update({ ai_summary: text }).eq("id", client.id);
      onSummaryGenerated?.(text);
    } catch {
      toast.error("Couldn't generate brand summary.");
    } finally {
      setLoading(false);
    }
  }

  const platforms: string[] = client.platforms || [];

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm text-foreground">{client.company_name}</p>
            <p className="text-xs text-muted-foreground font-body">
              {client.industry}
              {platforms.length > 0 && (
                <> · {platforms.join(", ")}</>
              )}
              {client.brand_voice && (
                <> · <span className="text-primary/80">{client.brand_voice} voice</span></>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          title="Refresh analysis"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* AI Summary */}
      <div className="text-sm font-body text-muted-foreground leading-relaxed">
        {loading && !summary ? (
          <div className="flex items-center gap-2 text-primary/70">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing your brand…</span>
          </div>
        ) : (
          <p>{summary || "No summary yet — click refresh to generate."}</p>
        )}
      </div>
    </div>
  );
}
