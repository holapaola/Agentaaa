import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, X, ExternalLink } from "lucide-react";

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

interface Props {
  clientName: string;
  socialAccounts: SocialAccount[];
  onConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  onEditManual: (platform: string, currentHandle: string) => void;
}

export default function SocialAccountsView({ clientName, socialAccounts, onConnect, onDisconnect, onEditManual }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect social media accounts for <strong>{clientName}</strong>. Tokens are stored securely for future API integrations.
      </p>
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
                      onClick={() => onEditManual(p.id, acc.account_handle ?? "")}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-xs text-red-400 h-7 px-2"
                      onClick={() => onDisconnect(p.id)}><X className="w-3 h-3" /></Button>
                  </div>
                : <Button size="sm" variant="outline" className="text-xs gap-1.5 font-display"
                    onClick={() => onConnect(p.id)}>
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
  );
}
