import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function SchedulePostModal({ isOpen, scheduledAt, setScheduledAt, onSave, onClose }: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4 mx-4">
        <h3 className="text-base font-semibold font-display text-foreground">Schedule this post</h3>
        <p className="text-xs text-muted-foreground font-body">
          Pick a date &amp; time to schedule, or skip to save as <strong>Pending Approval</strong>. Any uploaded image or video will stay attached.
        </p>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" className="font-display text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" size="sm" className="font-display text-xs" onClick={onSave}>
            Skip — Save as Pending
          </Button>
          <Button size="sm" className="font-display text-xs" disabled={!scheduledAt} onClick={onSave}>
            Schedule ✓
          </Button>
        </div>
      </div>
    </div>
  );
}
