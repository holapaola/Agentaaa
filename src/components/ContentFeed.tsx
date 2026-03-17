import { useState } from "react";
import { Check, Clock, Instagram, Twitter, Facebook, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Post {
  id: string;
  platform: "instagram" | "twitter" | "facebook";
  content: string;
  scheduledFor: string;
  status: "draft" | "approved" | "published";
  image?: string;
}

const initialPosts: Post[] = [
  {
    id: "1",
    platform: "instagram",
    content: "Elevate your brand with our latest campaign strategy. Results that speak louder than words. 🚀 #AgencyLife #GrowthMarketing",
    scheduledFor: "Mar 13, 2026 · 10:00 AM",
    status: "draft",
  },
  {
    id: "2",
    platform: "twitter",
    content: "We just helped a client achieve 340% ROI on their Q1 campaign. Here's the framework we used → (thread)",
    scheduledFor: "Mar 13, 2026 · 2:00 PM",
    status: "draft",
  },
  {
    id: "3",
    platform: "facebook",
    content: "Behind every great brand is a team that obsesses over the details. Meet our strategy squad and learn how we approach creative problem solving.",
    scheduledFor: "Mar 14, 2026 · 9:00 AM",
    status: "draft",
  },
  {
    id: "4",
    platform: "instagram",
    content: "Case study drop 📊 How we scaled @clientbrand from 2K to 50K followers in 90 days with zero paid ads.",
    scheduledFor: "Mar 14, 2026 · 12:00 PM",
    status: "approved",
  },
  {
    id: "5",
    platform: "twitter",
    content: "Hot take: Your brand doesn't need more content. It needs better content. Quality > Quantity, always.",
    scheduledFor: "Mar 15, 2026 · 11:00 AM",
    status: "draft",
  },
];

const platformIcons = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
};

const platformColors = {
  instagram: "bg-pink-100 text-pink-700",
  twitter: "bg-sky-100 text-sky-700",
  facebook: "bg-blue-100 text-blue-700",
};

export default function ContentFeed() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const handleApprove = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
    );
    toast.success("Post approved and queued for publishing");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Content Feed</h2>
        <span className="text-sm text-muted-foreground">
          {posts.filter((p) => p.status === "draft").length} drafts pending
        </span>
      </div>

      <div className="space-y-3">
        {posts.map((post, i) => {
          const Icon = platformIcons[post.platform];
          return (
            <div
              key={post.id}
              className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm "
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-md p-1.5 ${platformColors[post.platform]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {post.scheduledFor}
                    </span>
                    {post.status === "approved" && (
                      <Badge variant="secondary" className="bg-accent/15 text-accent border-0 text-xs">
                        <Check className="mr-1 h-3 w-3" /> Approved
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {post.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(post.id)}
                      className="h-8 text-xs"
                    >
                      Approve
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
