import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import {
  Bell,
  FileSearch,
  Heart,
  Home,
  LogOut,
  Mail,
  Moon,
  Settings,
  Shield,
  Sun,
  TicketCheck,
  Database,
  QrCode,
  Radar,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

const mainNavItems = [
  { href: "/community", label: "Home", icon: Home },
  { href: "/tickets", label: "Support Tickets", icon: TicketCheck },
  { href: "/charity", label: "Charity Impact", icon: Heart },
  { href: "/statements", label: "Statement Analyzer", icon: FileSearch },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/messages", label: "Messages", icon: Mail },
];

function NavLink({
  href,
  label,
  icon: Icon,
  emoji,
  isActive,
  badge,
}: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  emoji?: string;
  isActive: boolean;
  badge?: number;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link to={href} onClick={() => setOpenMobile(false)}>
          {emoji ? (
            <span className="text-base leading-none">{emoji}</span>
          ) : Icon ? (
            <Icon className="size-4" />
          ) : null}
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
      {badge ? (
        <SidebarMenuBadge>
          <Badge
            variant="destructive"
            className="size-5 p-0 justify-center text-[10px] font-bold rounded-full"
          >
            {badge}
          </Badge>
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}

function SidebarNav() {
  const location = useLocation();
  const profile = useQuery(api.userProfiles.get);
  const channels = useQuery(api.channels.list);
  const publicChannels = channels?.filter((c) => c.category === "public") ?? [];
  const memberChannels = channels?.filter((c) => c.category === "member") ?? [];

  const isAdmin = profile?.role === "admin";
  const isRep = profile?.role === "sales_rep";

  // Real unread counts from channelReads tracking
  const unreadCounts = useQuery(api.channelReads.getUnreadCounts) ?? {};
  const unreadNotifications = useQuery(api.notifications.unreadCount) ?? 0;
  const dmUnreadCount = useQuery(api.directMessages.totalUnreadCount) ?? 0;

  return (
    <SidebarContent className="overflow-y-auto">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={location.pathname === item.href}
                badge={
                  item.label === "Notifications" ? unreadNotifications || undefined :
                  item.label === "Messages" ? dmUnreadCount || undefined :
                  undefined
                }
              />
            ))}
            {isAdmin && (
              <NavLink
                href="/admin"
                label="Admin Panel"
                icon={Shield}
                isActive={location.pathname.startsWith("/admin")}
              />
            )}
            {(isRep || isAdmin) && (
              <NavLink
                href="/rep-dashboard"
                label="Rep Dashboard"
                icon={QrCode}
                isActive={location.pathname === "/rep-dashboard"}
              />
            )}
            {(isRep || isAdmin) && (
              <NavLink
                href="/leads"
                label="Lead Database"
                icon={Database}
                isActive={location.pathname === "/leads"}
              />
            )}
            {(isRep || isAdmin) && (
              <NavLink
                href="/lead-finder"
                label="Lead Finder"
                icon={Radar}
                isActive={location.pathname === "/lead-finder"}
              />
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {publicChannels.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50">
            Public Channels
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {publicChannels.map((ch) => (
                <NavLink
                  key={ch._id}
                  href={`/channel/${ch.slug}`}
                  label={ch.name}
                  emoji={ch.icon}
                  isActive={location.pathname === `/channel/${ch.slug}`}
                  badge={unreadCounts[ch.slug] || undefined}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {memberChannels.length > 0 &&
        profile?.role !== "prospect" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50">
              Member Channels
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {memberChannels.map((ch) => (
                  <NavLink
                    key={ch._id}
                    href={`/channel/${ch.slug}`}
                    label={ch.name}
                    emoji={ch.icon}
                    isActive={location.pathname === `/channel/${ch.slug}`}
                    badge={unreadCounts[ch.slug] || undefined}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
    </SidebarContent>
  );
}

function SidebarUserMenu() {
  const user = useQuery(api.auth.currentUser);
  const profile = useQuery(api.userProfiles.get);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  const roleColors: Record<string, string> = {
    admin: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-300",
    customer: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
    prospect: "bg-purple-500/20 text-purple-600 dark:text-purple-300",
    sales_rep: "bg-blue-500/20 text-blue-600 dark:text-blue-300",
  };

  return (
    <SidebarFooter className="border-t border-sidebar-border">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg">
                <Avatar className="size-8">
                  {profile?.profileImageUrl && (
                    <AvatarImage src={profile.profileImageUrl} alt={profile.name || "User"} />
                  )}
                  <AvatarFallback className="bg-brand text-brand-foreground text-sm font-medium">
                    {profile?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {profile?.name || user?.name || "User"}
                    </span>
                    {profile?.role && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${roleColors[profile.role] ?? "bg-gray-500/20 text-gray-300"}`}
                      >
                        {profile.role === "sales_rep" ? "rep" : profile.role}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-sidebar-foreground/50 truncate">
                    {profile?.email || user?.email}
                  </span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-[--radix-dropdown-menu-trigger-width]"
            >
              <DropdownMenuItem asChild>
                <Link to="/settings" onClick={() => setOpenMobile(false)}>
                  <Settings className="size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/legal" onClick={() => setOpenMobile(false)}>
                  <Shield className="size-4" />
                  Legal & Compliance
                </Link>
              </DropdownMenuItem>
              {toggleTheme && (
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate("/login", { replace: true });
                  // Force full reload to clear all stale state
                  window.location.reload();
                }}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

function SidebarHeaderContent() {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarHeader className="border-b border-sidebar-border">
      <Link
        to="/community"
        onClick={() => setOpenMobile(false)}
        className="flex items-center gap-2.5 px-2 py-1"
      >
        <div className="size-9 rounded-lg flex items-center justify-center">
          <img src="/cs-logo.png" alt="CS" className="size-9 object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-sidebar-foreground">
            Charity Swipes
          </span>
          <span className="text-[11px] text-sidebar-foreground/50">
            Community
          </span>
        </div>
      </Link>
    </SidebarHeader>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeaderContent />
      <SidebarNav />
      <SidebarUserMenu />
    </Sidebar>
  );
}
