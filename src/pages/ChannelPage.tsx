import { useMutation, useQuery } from "convex/react";
import { Pin, PinOff, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function ChannelPage() {
  const { slug } = useParams<{ slug: string }>();
  const channel = useQuery(api.channels.getBySlug, slug ? { slug } : "skip");
  const posts = useQuery(
    api.posts.listByChannel,
    channel?._id ? { channelId: channel._id } : "skip",
  );
  const profile = useQuery(api.userProfiles.get);
  const createPost = useMutation(api.posts.create);
  const togglePin = useMutation(api.posts.togglePin);
  const markRead = useMutation(api.channelReads.markRead);
  const [content, setContent] = useState("");

  // Mark channel as read when opened and when new posts arrive
  useEffect(() => {
    if (slug) {
      markRead({ channelSlug: slug });
    }
  }, [slug, posts?.length]);

  if (!channel) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading channel...
      </div>
    );
  }

  const canPost = profile?.role !== "prospect";
  const isAdmin = profile?.role === "admin";

  const handlePost = async () => {
    if (!content.trim() || !channel._id) return;
    try {
      await createPost({ channelId: channel._id, content: content.trim() });
      setContent("");
      toast.success("Post published!");
    } catch {
      toast.error("Failed to post");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handlePost();
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    customer: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    sales_rep: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  };

  const avatarColors: Record<string, string> = {
    admin: "bg-pink-500 text-white",
    customer: "bg-blue-500 text-white",
    sales_rep: "bg-indigo-500 text-white",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{channel.icon}</span>
          <h1 className="text-2xl font-bold">{channel.name}</h1>
          <Badge variant={channel.isPublic ? "default" : "secondary"}>
            {channel.isPublic ? "Public" : "Members"}
          </Badge>
        </div>
        <p className="text-muted-foreground">{channel.description}</p>
      </div>

      {/* Composer */}
      {canPost && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <Textarea
            placeholder="Share something with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Press ⌘+Enter to post
            </span>
            <Button onClick={handlePost} disabled={!content.trim()} size="sm">
              <Send className="size-4" />
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts?.map((post) => (
          <div
            key={post._id}
            className={`rounded-xl border bg-card p-5 ${post.isPinned ? "border-primary/30 bg-primary/5" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback
                    className={`text-sm font-medium ${avatarColors[post.authorRole] ?? "bg-gray-500 text-white"}`}
                  >
                    {post.authorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {post.authorName}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${roleColors[post.authorRole] ?? ""}`}
                    >
                      {post.authorRole === "sales_rep" ? "rep" : post.authorRole}
                    </span>
                    {post.isPinned && (
                      <Pin className="size-3 text-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(post.createdAt)}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePin({ postId: post._id })}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {post.isPinned ? (
                    <PinOff className="size-4" />
                  ) : (
                    <Pin className="size-4" />
                  )}
                  {post.isPinned ? "Unpin" : "Pin"}
                </Button>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        ))}

        {posts?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm">Be the first to start a conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}
