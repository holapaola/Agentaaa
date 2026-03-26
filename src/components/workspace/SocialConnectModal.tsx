import { Loader2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  platform: string | null;
  isOpen: boolean;
  onClose: () => void;
  handle: string;
  setHandle: (v: string) => void;
  token: string;
  setToken: (v: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function SocialConnectModal({ platform, isOpen, onClose, handle, setHandle, token, setToken, onSave, isSaving }: Props) {
  if (!isOpen || !platform) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4 mx-4">
        <h3 className="text-base font-semibold font-display">Connect {platform}</h3>
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
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!handle.trim() || isSaving} onClick={onSave} className="gap-1.5">
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
