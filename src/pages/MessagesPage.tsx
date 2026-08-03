import { useMutation, useQuery } from "convex/react";
import { Mail, Send, Plus, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  return `${days}d ago`;
}

export function MessagesPage() {
  const conversations = useQuery(api.directMessages.listConversations);
  const adminsAndReps = useQuery(api.directMessages.getAdminsAndReps);
  const profile = useQuery(api.userProfiles.get);
  const [activeConvoId, setActiveConvoId] = useState<Id<"conversations"> | null>(null);
  const messages = useQuery(
    api.directMessages.getMessages,
    activeConvoId ? { conversationId: activeConvoId } : "skip",
  );
  const sendMessage = useMutation(api.directMessages.sendMessage);
  const startConversation = useMutation(api.directMessages.startConversation);
  const markAsRead = useMutation(api.directMessages.markAsRead);
  const [newMsg, setNewMsg] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [initialMsg, setInitialMsg] = useState("");

  const activeConvo = conversations?.find((c) => c._id === activeConvoId);

  useEffect(() => {
    if (activeConvoId) {
      markAsRead({ conversationId: activeConvoId });
    }
  }, [activeConvoId, messages?.length]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvoId) return;
    try {
      await sendMessage({ conversationId: activeConvoId, content: newMsg.trim() });
      setNewMsg("");
    } catch {
      toast.error("Failed to send");
    }
  };

  const handleStartNew = async () => {
    if (!selectedRecipient || !initialMsg.trim()) return;
    try {
      const convoId = await startConversation({
        recipientId: selectedRecipient,
        message: initialMsg.trim(),
      });
      setShowNew(false);
      setSelectedRecipient(null);
      setInitialMsg("");
      setActiveConvoId(convoId);
      toast.success("Message sent!");
    } catch {
      toast.error("Failed to start conversation");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    customer: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    sales_rep: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  };

  // Message view
  if (activeConvoId && activeConvo) {
    const otherUser = activeConvo.otherParticipants?.[0];
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="border-b p-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveConvoId(null)}>
            <ArrowLeft className="size-4" />
          </Button>
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {otherUser?.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">{otherUser?.name ?? "Unknown"}</div>
            {otherUser?.role && (
              <Badge className={`text-[10px] ${roleColors[otherUser.role] ?? ""}`}>
                {otherUser.role === "sales_rep" ? "Sales Rep" : otherUser.role}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages?.map((msg) => {
            const isMe = msg.senderId === profile?.userId;
            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                  isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {timeAgo(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t p-4 flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="resize-none"
          />
          <Button onClick={handleSend} disabled={!newMsg.trim()} className="self-end">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="size-6 text-primary" /> Messages
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Private conversations with admins and support staff
          </p>
        </div>

        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Send to:</label>
                <div className="space-y-2">
                  {adminsAndReps?.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => setSelectedRecipient(user.userId)}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        selectedRecipient === user.userId
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <Badge className={`text-[10px] ${roleColors[user.role] ?? ""}`}>
                          {user.role === "sales_rep" ? "Sales Rep" : user.role}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Write your message..."
                value={initialMsg}
                onChange={(e) => setInitialMsg(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleStartNew}
                disabled={!selectedRecipient || !initialMsg.trim()}
                className="w-full"
              >
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {conversations?.map((convo) => {
          const other = convo.otherParticipants?.[0];
          return (
            <button
              key={convo._id}
              type="button"
              onClick={() => setActiveConvoId(convo._id)}
              className="w-full text-left flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-sm hover:border-primary/30 transition-all"
            >
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {other?.name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{other?.name ?? "Unknown"}</span>
                    {other?.role && (
                      <Badge className={`text-[10px] ${roleColors[other.role] ?? ""}`}>
                        {other.role === "sales_rep" ? "Rep" : other.role}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(convo.lastMessageAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {convo.lastMessagePreview}
                </p>
              </div>
              {convo.unreadCount > 0 && (
                <Badge variant="destructive" className="size-6 p-0 justify-center rounded-full text-xs">
                  {convo.unreadCount}
                </Badge>
              )}
            </button>
          );
        })}

        {conversations?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Mail className="size-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Start a private conversation with an admin or support staff</p>
          </div>
        )}
      </div>
    </div>
  );
}
