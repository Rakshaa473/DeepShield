"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, AudioLines, FileCheck2, FileText, Image as ImageIcon, ScanLine, ShieldCheck, Video } from "lucide-react";
import AppShell from "@/components/AppShell";
import { getHistoryEntries } from "@/services/history";

const detectorActions = [
  ["Image", "Inspect pixels, metadata, and visual artifacts.", "/upload/image", ImageIcon],
  ["Document", "Read text signals and provenance clues.", "/upload/document", FileCheck2],
  ["Audio", "Scan spectral patterns in voice and sound.", "/upload/audio", AudioLines],
  ["Video", "Sample frames for manipulation signals.", "/upload/video", Video],
  ["Text", "Review writing patterns and phrasing.", "/upload/text", FileText],
];

export default function Dashboard() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setHistory(getHistoryEntries()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <AppShell><div className="page-frame">
    <section className="dashboard-hero reveal"><div><p className="page-kicker">Personal analysis workspace</p><h1 className="page-title">Verify before<br /><em>you trust.</em></h1><p className="page-subtitle">Choose a detection tool to inspect suspicious media, documents, audio, video, or text with DeepShield.</p></div><div className="hero-orbit" aria-hidden="true"><div className="orbit-ring orbit-ring-one" /><div className="orbit-ring orbit-ring-two" /><ShieldCheck size={34} /><span>READY<br /><b>TO SCAN</b></span></div></section>
    <section className="dashboard-summary reveal reveal-delay"><div className="summary-icon"><ScanLine size={20} /></div><div><span className="summary-label">Workspace status</span><strong>Forensics engine ready</strong></div><div className="summary-divider" /><div><span className="summary-label">Analyses logged</span><strong>{history.length}</strong></div><Link href="/history" className="summary-link">View history <ArrowRight size={15} /></Link></section>
    <div className="section-heading reveal reveal-delay-2"><div><p className="eyebrow-rule">Choose an instrument</p><h2>Start a detection</h2></div><span>05 tools available</span></div>
    <section className="detection-grid">{detectorActions.map(([title, description, href, Icon], index) => <Link key={href} href={href} className={`detection-card detection-card-${["mint", "gold", "blue", "rose", "violet"][index]} reveal`}><div className="card-topline"><span className="card-icon"><Icon size={20} /></span><span className="card-type">{title.toUpperCase()}</span><ArrowRight size={17} className="card-arrow" /></div><div><h3>{title} detection</h3><p>{description}</p></div><span className="card-action">Open tool <span>→</span></span></Link>)}</section>
  </div></AppShell>;
}
