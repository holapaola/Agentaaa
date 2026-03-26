import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AGE_RANGES, BRAND_VOICES, CONTENT_TYPES, GOALS, PLATFORM_OPTIONS, POSTING_FREQS } from "@/lib/clientProfileOptions";

export interface ClientEditForm {
  company_name: string;
  website_url: string;
  business_description: string;
  industry: string;
  brand_voice: string;
  platforms: string[];
  campaign_goal: string;
  target_audience_type: "B2B" | "B2C" | "";
  target_age_range: string;
  target_description: string;
  content_types: string[];
  posting_frequency: string;
  // Brand identity (auto-extracted from website by Agent 1)
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_accent_color: string;
  brand_visual_style: string;
  brand_personality_tags: string[];
  brand_notes: string;
}

const VISUAL_STYLES = [
  "Bold & Colorful", "Minimalist", "Funky & Eclectic", "Dark & Premium",
  "Clean & Modern", "Vintage & Retro", "Playful & Fun", "Natural & Earthy",
];

const PERSONALITY_OPTIONS = [
  "Playful", "Edgy", "Warm", "Luxurious", "Rebellious", "Creative",
  "Professional", "Fun", "Trendy", "Authentic", "Bold", "Chill", "Vibrant", "Elegant", "Raw",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editForm: ClientEditForm;
  setEditForm: React.Dispatch<React.SetStateAction<ClientEditForm>>;
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
}

export default function ClientDetailsEditor({ isOpen, onClose, editForm, setEditForm, onSave, isSaving, canSave }: Props) {
  const togglePlatform = (platform: string) =>
    setEditForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((item) => item !== platform)
        : [...prev.platforms, platform],
    }));

  const toggleContentType = (contentType: string) =>
    setEditForm((prev) => ({
      ...prev,
      content_types: prev.content_types.includes(contentType)
        ? prev.content_types.filter((item) => item !== contentType)
        : [...prev.content_types, contentType],
    }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>Update the full client profile used for content strategy, approvals, and social planning.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company name</label>
              <Input value={editForm.company_name} onChange={(e) => setEditForm((prev) => ({ ...prev, company_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input value={editForm.website_url} onChange={(e) => setEditForm((prev) => ({ ...prev, website_url: e.target.value }))} placeholder="https://example.com" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Business description</label>
            <Textarea value={editForm.business_description} onChange={(e) => setEditForm((prev) => ({ ...prev, business_description: e.target.value }))} rows={3} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Industry / niche</label>
            <Input value={editForm.industry} onChange={(e) => setEditForm((prev) => ({ ...prev, industry: e.target.value }))} placeholder="Example: Mosaic Artist / Workshop, Arts Education" />
            <p className="text-xs text-muted-foreground">Use a comma-separated list if you want more than one niche.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((platform) => (
                <button key={platform.id} type="button" onClick={() => togglePlatform(platform.id)}
                  className={`px-3 py-2 rounded-lg border text-sm ${editForm.platforms.includes(platform.id) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground"}`}>
                  {platform.emoji} {platform.id}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign goal</label>
              <select value={editForm.campaign_goal} onChange={(e) => setEditForm((prev) => ({ ...prev, campaign_goal: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">Select a goal</option>
                {GOALS.map((goal) => <option key={goal.id} value={goal.id}>{goal.id}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand voice</label>
              <select value={editForm.brand_voice} onChange={(e) => setEditForm((prev) => ({ ...prev, brand_voice: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">Select a voice</option>
                {BRAND_VOICES.map((voice) => <option key={voice.label} value={voice.label}>{voice.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Audience type</label>
              <select value={editForm.target_audience_type} onChange={(e) => setEditForm((prev) => ({ ...prev, target_audience_type: e.target.value as "B2B" | "B2C" | "" }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">Select audience</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target age range</label>
              <select value={editForm.target_age_range} onChange={(e) => setEditForm((prev) => ({ ...prev, target_age_range: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">Select age range</option>
                {AGE_RANGES.map((range) => <option key={range.id} value={range.id}>{range.id}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ideal customer</label>
            <Textarea value={editForm.target_description} onChange={(e) => setEditForm((prev) => ({ ...prev, target_description: e.target.value }))} rows={3} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content types</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((contentType) => (
                <button key={contentType.id} type="button" onClick={() => toggleContentType(contentType.id)}
                  className={`px-3 py-2 rounded-lg border text-sm ${editForm.content_types.includes(contentType.id) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground"}`}>
                  {contentType.emoji} {contentType.id}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Posting frequency</label>
            <select value={editForm.posting_frequency} onChange={(e) => setEditForm((prev) => ({ ...prev, posting_frequency: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">Select frequency</option>
              {POSTING_FREQS.map((frequency) => <option key={frequency.id} value={frequency.id}>{frequency.id}</option>)}
            </select>
          </div>

          {/* Brand Identity — auto-extracted by Agent 1 from website */}
          <div className="space-y-4 pt-2 border-t border-border/40">
            <div>
              <p className="text-sm font-medium">Brand Identity</p>
              <p className="text-xs text-muted-foreground mt-0.5">Auto-extracted from your website. Edit to refine.</p>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand Colors</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'brand_primary_color' as const, label: 'Primary' },
                  { key: 'brand_secondary_color' as const, label: 'Secondary' },
                  { key: 'brand_accent_color' as const, label: 'Accent' },
                ]).map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={editForm[key] || '#000000'}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-8 h-8 rounded cursor-pointer border border-border shrink-0" />
                      <input type="text" value={editForm[key]}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder="#000000"
                        className="flex-1 min-w-0 text-xs bg-secondary/50 border border-border rounded px-2 py-1.5 font-mono" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Style */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visual Style</label>
              <div className="flex flex-wrap gap-2">
                {VISUAL_STYLES.map((style) => (
                  <button key={style} type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, brand_visual_style: style }))}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${editForm.brand_visual_style === style ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground"}`}>
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Personality Tags */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand Personality</label>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_OPTIONS.map((tag) => (
                  <button key={tag} type="button"
                    onClick={() => setEditForm((prev) => ({
                      ...prev,
                      brand_personality_tags: prev.brand_personality_tags.includes(tag)
                        ? prev.brand_personality_tags.filter((t) => t !== tag)
                        : [...prev.brand_personality_tags, tag],
                    }))}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${editForm.brand_personality_tags.includes(tag) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground"}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Notes */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand Notes</label>
              <Textarea value={editForm.brand_notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, brand_notes: e.target.value }))}
                placeholder="Describe your brand's visual identity, logo, design inspirations..."
                rows={2} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={!canSave || isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
