"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, sendPasswordResetEmail, signOut } from "firebase/auth";
import {
  Check,
  Database,
  Fingerprint,
  KeyRound,
  Laptop,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { auth } from "@/lib/firebase";
import { DEMO_USER, endDemoSession, getDemoSession, isDemoUser } from "@/services/auth";
import { clearHistoryEntries, getHistoryEntries } from "@/services/history";
import { useRouter } from "next/navigation";

const detectionTypes = ["Image", "Document", "Audio", "Video", "Text"];
const preferenceDefaults = { showTechnicalDetails: true, resultExplanation: true };

function readPreferences() {
  if (typeof window === "undefined") return preferenceDefaults;
  try {
    return { ...preferenceDefaults, ...JSON.parse(localStorage.getItem("deepshield-preferences") || "{}") };
  } catch {
    return preferenceDefaults;
  }
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const resolvedTheme = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : theme;
  document.documentElement.dataset.theme = resolvedTheme;
}

function SettingToggle({ checked, onChange, label, description }) {
  return <label className="settings-toggle"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-track"><span /></span></label>;
}

function SectionHeader({ eyebrow, title, icon: Icon }) {
  return <div className="settings-section-header"><span className="settings-section-icon"><Icon size={17} /></span><div><p className="page-kicker">{eyebrow}</p><h2>{title}</h2></div></div>;
}

export default function Profile() {
  const [sessionUser, setSessionUser] = useState(undefined);
  const [entries, setEntries] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [preferences, setPreferences] = useState(preferenceDefaults);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEntries(getHistoryEntries());
      setSessionUser(getDemoSession());
      setPreferences(readPreferences());
      const storedTheme = localStorage.getItem("deepshield-theme") || "dark";
      setTheme(storedTheme);
      applyTheme(storedTheme);
    }, 0);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setSessionUser(firebaseUser);
    });
    return () => { window.clearTimeout(timer); unsubscribe(); };
  }, []);

  const profileUser = sessionUser || DEMO_USER;
  const demo = isDemoUser(profileUser);
  const firebaseUser = !demo ? profileUser : null;
  const totalAnalyses = entries.length;
  const countFor = (type) => entries.filter((entry) => entry.type === type).length;
  const memberSince = firebaseUser?.metadata?.creationTime || (demo ? "Temporary session" : "Current account");
  const displayName = firebaseUser?.displayName || (demo ? DEMO_USER.displayName : firebaseUser?.email || "DeepShield user");
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const activityMax = Math.max(...detectionTypes.map(countFor), 1);

  const updatePreference = (key, value) => {
    const nextPreferences = { ...preferences, [key]: value };
    setPreferences(nextPreferences);
    localStorage.setItem("deepshield-preferences", JSON.stringify(nextPreferences));
  };

  const updateTheme = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem("deepshield-theme", nextTheme);
    applyTheme(nextTheme);
  };

  const handleResetPassword = async () => {
    if (!firebaseUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, firebaseUser.email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (error) {
      setMessage(error.message || "Unable to send a password reset email.");
    }
  };

  const handleClearHistory = () => {
    if (!entries.length || !window.confirm("Clear all locally stored detection history?")) return;
    clearHistoryEntries();
    setEntries([]);
    setMessage("Detection history cleared from this browser.");
  };

  const handleLogout = async () => {
    if (!demo) await signOut(auth);
    endDemoSession();
    router.push("/login");
  };

  if (sessionUser === undefined) {
    return <AppShell><div className="session-loading"><span className="status-dot" /> Loading account center...</div></AppShell>;
  }

  return <AppShell><div className="page-frame account-page">
    <header className="account-header reveal"><div><p className="page-kicker">Workspace / account center</p><h1 className="page-title">Account & Settings</h1><p className="page-subtitle">Manage your identity, activity, preferences, security, and local data.</p></div><span className={`account-mode-badge ${demo ? "account-mode-demo" : ""}`}><span className="status-dot" />{demo ? "DEMO MODE" : "FIREBASE ACCOUNT"}</span></header>

    <section className="account-identity surface reveal reveal-delay"><div className="account-avatar">{initials || <UserRound size={28} />}</div><div className="account-identity-copy"><div className="account-name-row"><h2>{displayName}</h2><span className="account-type-badge">{demo ? "DEMO ACCOUNT" : "FIREBASE USER"}</span></div><p>{profileUser.email}</p><small>{demo ? "You are exploring DeepShield in Demo Mode." : "Your authenticated DeepShield workspace."}</small></div><div className="account-member"><span>MEMBER SINCE</span><strong>{memberSince}</strong></div></section>

    {message && <div className="settings-message" role="status"><Check size={16} />{message}</div>}

    <section className="settings-section reveal reveal-delay-2"><SectionHeader eyebrow="Identity" title="Account Information" icon={UserRound} /><div className="settings-grid settings-grid-four"><div><span>Full name</span><strong>{displayName}</strong></div><div><span>Email</span><strong>{profileUser.email}</strong></div><div><span>Account type</span><strong>{demo ? "Demo Account" : "Firebase User"}</strong></div><div><span>Authentication</span><strong>{demo ? "Local demo session" : "Firebase Authentication"}</strong></div></div></section>

    <section className="settings-section reveal reveal-delay-2"><SectionHeader eyebrow="Activity / local history" title="Your Activity" icon={Database} /><div className="activity-overview"><div className="activity-total"><span>Total analyses</span><strong>{totalAnalyses}</strong><small>{totalAnalyses ? "successful detections recorded" : "No analyses yet"}</small></div><div className="activity-bars">{detectionTypes.map((type) => <div className="activity-bar-row" key={type}><span>{type}</span><div><i style={{ width: `${(countFor(type) / activityMax) * 100}%` }} /></div><strong>{countFor(type)}</strong></div>)}</div></div></section>

    <section className="settings-section reveal reveal-delay-2"><SectionHeader eyebrow="Personalize" title="Detection Preferences" icon={Fingerprint} /><div className="settings-panel"><SettingToggle label="Show technical details" description="Keep expandable backend fields visible in result panels." checked={preferences.showTechnicalDetails} onChange={(value) => updatePreference("showTechnicalDetails", value)} /><SettingToggle label="Explain results in plain language" description="Show the result summary before technical details." checked={preferences.resultExplanation} onChange={(value) => updatePreference("resultExplanation", value)} /></div></section>

    <section className="settings-section reveal reveal-delay-2"><SectionHeader eyebrow="Interface" title="Appearance" icon={theme === "light" ? Sun : Moon} /><div className="theme-options">{[["dark", "Dark mode", Moon], ["light", "Light mode", Sun], ["system", "System", Laptop]].map(([value, label, Icon]) => <button type="button" key={value} className={`theme-option ${theme === value ? "theme-option-active" : ""}`} onClick={() => updateTheme(value)}><Icon size={18} /><span>{label}</span>{theme === value && <Check size={15} />}</button>)}</div><p className="settings-note">Theme preference is saved in this browser. DeepShield is designed around its dark forensic workspace.</p></section>

    <div className="settings-columns"><section className="settings-section reveal reveal-delay-2"><SectionHeader eyebrow="Protection" title="Security" icon={KeyRound} /><div className="security-status"><ShieldCheck size={18} /><span><strong>{demo ? "Demo Account" : "Authentication active"}</strong><small>{demo ? "Password management is unavailable in Demo Mode." : `Authenticated with Firebase as ${firebaseUser?.email}.`}</small></span></div>{firebaseUser && <button type="button" className="settings-action-button" onClick={handleResetPassword}>Send password reset email</button>}</section><section className="settings-section reveal reveal-delay-2"><SectionHeader eyebrow="Data clarity" title="Privacy & Data" icon={ShieldCheck} /><p className="settings-copy">Your uploaded content is analyzed by DeepShield through the existing backend services to generate detection results. Detection history is stored locally in this browser for this prototype. No additional retention, encryption, or deletion guarantees are represented here.</p></section></div>

    <section className="settings-section data-management reveal reveal-delay-2"><SectionHeader eyebrow="Local storage" title="Data Management" icon={Trash2} /><div className="data-action-row"><div><strong>Clear Detection History</strong><p>This removes locally stored detection history from this browser. It does not affect your Firebase account.</p></div><button type="button" className="danger-action" disabled={!entries.length} onClick={handleClearHistory}>Clear history</button></div></section>

    <section className="account-actions reveal reveal-delay-2"><div><p className="page-kicker">Session</p><h2>Account Actions</h2><p>End your current Firebase or Demo Mode session.</p></div><button type="button" className="settings-action-button account-logout-button" onClick={handleLogout}>Log out</button></section>
  </div></AppShell>;
}
