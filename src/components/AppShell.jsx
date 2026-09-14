"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  AudioLines,
  FileCheck2,
  FileText,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Shield,
  ShieldAlert,
  UserRound,
  Video,
  X,
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { endDemoSession, getDemoSession, isDemoUser } from "@/services/auth";

const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const intelligenceNavigation = [
  { href: "/scams", label: "Scam Dashboard", icon: ShieldAlert },
];

const detectionNavigation = [
  { href: "/upload/image", label: "Image Detection", icon: ImageIcon },
  { href: "/upload/document", label: "Document Detection", icon: FileCheck2 },
  { href: "/upload/audio", label: "Audio Detection", icon: AudioLines },
  { href: "/upload/video", label: "Video Detection", icon: Video },
  { href: "/upload/text", label: "Text Detection", icon: FileText },
];

const workspaceNavigation = [
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function NavigationLink({ item, pathname, onNavigate }) {
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
    >
      <Icon size={18} strokeWidth={1.8} />
      <span>{item.label}</span>
    </Link>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setSession(firebaseUser || getDemoSession());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [router, session]);

  const handleLogout = async () => {
    if (!isDemoUser(session)) await signOut(auth);
    endDemoSession();
    router.push("/login");
  };

  const closeMobile = () => setMobileOpen(false);

  if (session === undefined || session === null) {
    return <div className="session-loading"><span className="status-dot" /> Checking workspace session...</div>;
  }

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && <button className="mobile-backdrop" onClick={closeMobile} aria-label="Close navigation" />}

      <aside className={`app-sidebar ${mobileOpen ? "app-sidebar-open" : ""}`}>
        <div className="sidebar-brand-row">
          <Link href="/dashboard" className="sidebar-brand" onClick={closeMobile}>
            <span className="brand-mark"><Shield size={19} /></span>
            <span>
              <strong>DeepShield</strong>
              <small>AUTHENTICITY LAB</small>
            </span>
          </Link>
          <button className="sidebar-close" onClick={closeMobile} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-status">
          <span className="status-dot" />
          <span>Analysis workspace online</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="sidebar-label">Main</p>
          {primaryNavigation.map((item) => (
            <NavigationLink key={item.href} item={item} pathname={pathname} onNavigate={closeMobile} />
          ))}
          <p className="sidebar-label sidebar-label-spaced">Scam intelligence</p>
          {intelligenceNavigation.map((item) => (
            <NavigationLink key={item.href} item={item} pathname={pathname} onNavigate={closeMobile} />
          ))}
          <p className="sidebar-label sidebar-label-spaced">Detection tools</p>
          {detectionNavigation.map((item) => (
            <NavigationLink key={item.href} item={item} pathname={pathname} onNavigate={closeMobile} />
          ))}
          <p className="sidebar-label sidebar-label-spaced">Activity</p>
          <NavigationLink item={workspaceNavigation[0]} pathname={pathname} onNavigate={closeMobile} />
          <p className="sidebar-label sidebar-label-spaced">Account</p>
          <NavigationLink item={workspaceNavigation[1]} pathname={pathname} onNavigate={closeMobile} />
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-note">
            <span className="footer-spark">✦</span>
            <span><strong>{isDemoUser(session) ? "Demo mode" : "Workspace ready"}</strong><small>{isDemoUser(session) ? "Temporary local session" : "Signals improve with every review"}</small></span>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}
