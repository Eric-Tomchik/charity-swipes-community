import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  Building,
  Camera,
  Check,
  FileText,
  Globe,
  Hash,
  Mail,
  Minus,
  Moon,
  Move,
  Pencil,
  Phone,
  Plus,
  Save,
  Settings2,
  Sun,
  TicketCheck,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "sonner";

/* ===== Image Cropper Component ===== */
interface CropperProps {
  imageSrc: string;
  onCropDone: (blob: Blob) => void;
  onCancel: () => void;
}

function ImageCropper({ imageSrc, onCropDone, onCancel }: CropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Crop state
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const CANVAS_SIZE = 300;
  const OUTPUT_SIZE = 400; // Output image size in pixels

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Fit image to canvas initially
      const fitScale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
      setScale(fitScale * 1.1); // Slightly zoomed to fill
      setOffsetX(0);
      setOffsetY(0);
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Clear
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image centered with scale and offset
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = (CANVAS_SIZE - drawW) / 2 + offsetX;
    const drawY = (CANVAS_SIZE - drawH) / 2 + offsetY;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Draw circular crop overlay
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Draw circle border
    ctx.strokeStyle = "#ec4899";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
  }, [scale, offsetX, offsetY]);

  useEffect(() => {
    if (imgLoaded) draw();
  }, [imgLoaded, draw]);

  // Mouse/touch handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handlePointerUp = () => setDragging(false);

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY > 0 ? -0.05 : 0.05);
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    // Render to output canvas at final size
    const outCanvas = document.createElement("canvas");
    outCanvas.width = OUTPUT_SIZE;
    outCanvas.height = OUTPUT_SIZE;
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return;

    // Scale up from preview
    const ratio = OUTPUT_SIZE / CANVAS_SIZE;
    const drawW = img.width * scale * ratio;
    const drawH = img.height * scale * ratio;
    const drawX = (OUTPUT_SIZE - drawW) / 2 + offsetX * ratio;
    const drawY = (OUTPUT_SIZE - drawH) / 2 + offsetY * ratio;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Clip to circle
    const clipCanvas = document.createElement("canvas");
    clipCanvas.width = OUTPUT_SIZE;
    clipCanvas.height = OUTPUT_SIZE;
    const clipCtx = clipCanvas.getContext("2d");
    if (!clipCtx) return;

    clipCtx.beginPath();
    clipCtx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    clipCtx.closePath();
    clipCtx.clip();
    clipCtx.drawImage(outCanvas, 0, 0);

    clipCanvas.toBlob(
      (blob) => {
        if (blob) onCropDone(blob);
      },
      "image/png",
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Crop Profile Photo</h3>
          <button
            type="button"
            onClick={onCancel}
            className="size-8 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Drag to reposition · Scroll or use buttons to zoom
        </p>

        {/* Canvas area */}
        <div
          ref={containerRef}
          className="relative mx-auto bg-black/20 rounded-xl overflow-hidden"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="cursor-move touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Loading image...
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleZoom(-0.1)}
          >
            <Minus className="size-4" />
          </Button>
          <div className="text-sm text-muted-foreground w-16 text-center">
            {Math.round(scale * 100)}%
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleZoom(0.1)}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
          <Move className="size-3" /> Drag image to reposition
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleCrop}>
            <Check className="size-4" /> Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ===== Main Settings Page ===== */
export function SettingsPage() {
  const user = useQuery(api.auth.currentUser);
  const profile = useQuery(api.userProfiles.get);
  const updateProfile = useMutation(api.userProfiles.updateProfile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const setProfileImage = useMutation(api.storage.setProfileImage);
  const { theme, toggleTheme } = useTheme();

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper state
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Notification states
  const [browserNotify, setBrowserNotify] = useState(false);
  const [emailNotify, setEmailNotify] = useState(true);
  const [ticketNotify, setTicketNotify] = useState(true);
  const [channelNotify, setChannelNotify] = useState(true);
  const [appNotify, setAppNotify] = useState(true);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBusinessName(profile.businessName || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
      setWebsite(profile.website || "");
      setProfileImageUrl(profile.profileImageUrl || "");
      setEmailNotify(profile.notifyEmail ?? true);
      setTicketNotify(profile.notifyTickets ?? true);
      setChannelNotify(profile.notifyAnnouncements ?? true);
      setAppNotify(profile.notifyMessages ?? true);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name || undefined,
        businessName: businessName || undefined,
        phone: phone || undefined,
        bio: bio || undefined,
        website: website || undefined,
      });
      toast.success("Profile updated!");
      setEditing(false);
    } catch (e: any) {
      toast.error("Failed to update profile: " + (e.message || "Unknown error"));
    }
    setSaving(false);
  };

  // Open file picker → cropper
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    // Read as data URL for the cropper preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  // Upload cropped image to Convex storage
  const handleCropDone = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload the blob
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { storageId } = await response.json();

      // Save storage ID to profile and get resolved URL back
      const resolvedUrl = await setProfileImage({ storageId });
      if (resolvedUrl) setProfileImageUrl(resolvedUrl);
      toast.success("Profile photo updated!");
    } catch (e: any) {
      toast.error("Failed to upload photo: " + (e.message || "Unknown error"));
    }
    setUploading(false);
  };

  const handleToggle = async (
    key: "notifyEmail" | "notifyTickets" | "notifyAnnouncements" | "notifyMessages",
    value: boolean,
  ) => {
    try {
      await updateProfile({ [key]: value });
    } catch {
      toast.error("Failed to save preference");
    }
  };

  const displayName = profile?.name || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const roleLabel = profile?.role === "sales_rep" ? "Sales Rep" : profile?.role === "admin" ? "Admin" : profile?.role === "customer" ? "Customer" : "Prospect";
  const roleColor = profile?.role === "admin" ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" : profile?.role === "sales_rep" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" : profile?.role === "customer" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-purple-500/10 text-purple-700 dark:text-purple-400";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Cropper modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onCropDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500 relative" />

        {/* Avatar + info */}
        <div className="px-6 pb-6 -mt-8">
          <div className="relative inline-block">
            <Avatar className="size-20 border-4 border-card shadow-lg">
              {profileImageUrl ? (
                <AvatarImage src={profileImageUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-pink-500 text-white text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 size-7 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="size-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="mt-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{displayName}</span>
                <Badge className={roleColor}>{roleLabel}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{displayEmail}</div>
              {profile?.businessName && (
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building className="size-3" /> {profile.businessName}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(!editing)}
            >
              <Pencil className="size-3.5" /> {editing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG, GIF, or WebP · Max 10 MB · Image will be cropped to a circle
          </p>
        </div>
      </div>

      {/* Profile Edit Form */}
      {editing && (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <User className="size-5" /> Edit Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <User className="size-3.5 text-muted-foreground" /> Display Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Building className="size-3.5 text-muted-foreground" /> Business Name
              </label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" /> Phone Number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground" /> Website
              </label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbusiness.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community a bit about yourself or your business..."
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save className="size-4" /> {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      )}

      {/* Profile Summary (when not editing) */}
      {!editing && profile && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <User className="size-5" /> Profile Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name</span>
              <p className="font-medium">{displayName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email</span>
              <p className="font-medium">{displayEmail}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Business</span>
              <p className="font-medium">{profile.businessName || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Phone</span>
              <p className="font-medium">{profile.phone || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Website</span>
              <p className="font-medium">{profile.website || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Member Since</span>
              <p className="font-medium">{new Date(profile.joinedAt).toLocaleDateString()}</p>
            </div>
            {profile.bio && (
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Bio</span>
                <p className="font-medium">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Bell className="size-5" /> Notifications
        </h2>

        <div className="space-y-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Delivery Methods
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                <Globe className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">Browser notifications</div>
                <div className="text-xs text-muted-foreground">
                  Native pop-up alerts on your device
                </div>
              </div>
            </div>
            <Switch
              checked={browserNotify}
              onCheckedChange={(v) => setBrowserNotify(v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">Email notifications</div>
                <div className="text-xs text-muted-foreground">
                  Receive email alerts for important activity
                </div>
              </div>
            </div>
            <Switch
              checked={emailNotify}
              onCheckedChange={(v) => {
                setEmailNotify(v);
                handleToggle("notifyEmail", v);
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Notify Me About
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                <TicketCheck className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">Support ticket replies</div>
                <div className="text-xs text-muted-foreground">
                  When staff responds to your tickets
                </div>
              </div>
            </div>
            <Switch
              checked={ticketNotify}
              onCheckedChange={(v) => {
                setTicketNotify(v);
                handleToggle("notifyTickets", v);
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                <Hash className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">Channel activity</div>
                <div className="text-xs text-muted-foreground">
                  New posts in channels you follow
                </div>
              </div>
            </div>
            <Switch
              checked={channelNotify}
              onCheckedChange={(v) => {
                setChannelNotify(v);
                handleToggle("notifyAnnouncements", v);
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">Application updates</div>
                <div className="text-xs text-muted-foreground">
                  When your application is reviewed
                </div>
              </div>
            </div>
            <Switch
              checked={appNotify}
              onCheckedChange={(v) => {
                setAppNotify(v);
                handleToggle("notifyMessages", v);
              }}
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Settings2 className="size-5" /> Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
              {theme === "dark" ? (
                <Moon className="size-4 text-muted-foreground" />
              ) : (
                <Sun className="size-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium">Dark mode</div>
              <div className="text-xs text-muted-foreground">
                Toggle between light and dark theme
              </div>
            </div>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={() => toggleTheme?.()}
          />
        </div>
      </div>
    </div>
  );
}
