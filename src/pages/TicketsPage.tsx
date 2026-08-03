import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  Send,
} from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  open: { icon: <AlertCircle className="size-3.5" />, color: "bg-blue-500/10 text-blue-600", label: "Open" },
  in_progress: { icon: <Clock className="size-3.5" />, color: "bg-yellow-500/10 text-yellow-600", label: "In Progress" },
  resolved: { icon: <CheckCircle2 className="size-3.5" />, color: "bg-emerald-500/10 text-emerald-600", label: "Resolved" },
  closed: { icon: <CheckCircle2 className="size-3.5" />, color: "bg-gray-500/10 text-gray-600 dark:text-gray-400", label: "Closed" },
};

const categoryColors: Record<string, string> = {
  billing: "bg-purple-500/10 text-purple-600",
  technical: "bg-orange-500/10 text-orange-600",
  compliance: "bg-cyan-500/10 text-cyan-600",
  general: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  normal: "bg-blue-500/10 text-blue-600",
  urgent: "bg-red-500/10 text-red-600",
};

export function TicketsPage() {
  const profile = useQuery(api.userProfiles.get);
  const isAdmin = profile?.role === "admin";
  const tickets = useQuery(isAdmin ? api.tickets.list : api.tickets.listMine);
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"tickets"> | null>(null);
  const ticketDetail = useQuery(
    api.tickets.getWithMessages,
    selectedTicketId ? { ticketId: selectedTicketId } : "skip",
  );
  const [newMessage, setNewMessage] = useState("");
  const addMessage = useMutation(api.tickets.addMessage);
  const updateStatus = useMutation(api.tickets.updateStatus);
  const createTicket = useMutation(api.tickets.create);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "general" as "billing" | "technical" | "compliance" | "general",
    priority: "normal" as "low" | "normal" | "urgent",
    message: "",
  });

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    try {
      await createTicket(form);
      setShowCreate(false);
      setForm({ subject: "", category: "general", priority: "normal", message: "" });
      toast.success("Ticket created!");
    } catch {
      toast.error("Failed to create ticket");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicketId) return;
    try {
      await addMessage({ ticketId: selectedTicketId, content: newMessage.trim() });
      setNewMessage("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  if (selectedTicketId && ticketDetail) {
    const { ticket, messages } = ticketDetail;
    const sc = statusConfig[ticket.status];
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setSelectedTicketId(null)} className="mb-2">
          ← Back to Tickets
        </Button>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={sc.color}>
              {sc.icon}
              {sc.label}
            </Badge>
            <Badge className={categoryColors[ticket.category]}>{ticket.category}</Badge>
            <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
            <span className="text-xs text-muted-foreground">by {ticket.userName} · {timeAgo(ticket.createdAt)}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            {(["open", "in_progress", "resolved", "closed"] as const).map((s) => (
              <Button
                key={s}
                variant={ticket.status === s ? "default" : "outline"}
                size="sm"
                onClick={() => updateStatus({ ticketId: ticket._id, status: s })}
              >
                {statusConfig[s].label}
              </Button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg._id} className={`rounded-xl border p-4 ${msg.isStaff ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="size-7">
                  <AvatarFallback className={`text-xs ${msg.isStaff ? "bg-pink-500 text-white" : "bg-blue-500 text-white"}`}>
                    {msg.authorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{msg.authorName}</span>
                {msg.isStaff && <Badge variant="secondary" className="text-[10px]">Staff</Badge>}
                <span className="text-xs text-muted-foreground">{timeAgo(msg.createdAt)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Type a reply..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="self-end">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="size-6 text-primary" />
            Support Tickets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? "Manage all community support tickets" : "Get help from the Charity Swipes team"}
          </p>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of the issue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe your issue in detail..." rows={4} />
              </div>
              <Button onClick={handleCreate} disabled={!form.subject.trim() || !form.message.trim()} className="w-full">
                Create Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {tickets?.map((ticket) => {
          const sc = statusConfig[ticket.status];
          return (
            <button
              key={ticket._id}
              type="button"
              className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm hover:border-primary/30 transition-all"
              onClick={() => setSelectedTicketId(ticket._id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="font-semibold truncate">{ticket.subject}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={sc.color}>
                      {sc.icon}
                      {sc.label}
                    </Badge>
                    <Badge className={categoryColors[ticket.category]}>{ticket.category}</Badge>
                    <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgo(ticket.createdAt)}
                </span>
              </div>
            </button>
          );
        })}

        {tickets?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="size-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tickets yet</p>
            <p className="text-sm">Create a ticket to get help from our team</p>
          </div>
        )}
      </div>
    </div>
  );
}
