import { Sparkles, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandProfileCard from "@/components/dashboard/BrandProfileCard";
import ApprovalCard from "@/components/dashboard/ApprovalCard";
import type { AppClient, AppPost } from "@/types";

interface Props {
  client: AppClient;
  pendingPosts: AppPost[];
  onCreateContent: (client: AppClient) => void;
  onEditClient?: () => void;
}

export default function ClientOverviewTab({ client, pendingPosts, onCreateContent, onEditClient: _onEditClient }: Props) {
  return (
    <div className="space-y-6">
      <BrandProfileCard client={client} />

      {pendingPosts.length > 0 ? (
        <div>
          <p className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Pending Approval
          </p>
          <ApprovalCard posts={pendingPosts} onAction={() => {}} />
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
  );
}
