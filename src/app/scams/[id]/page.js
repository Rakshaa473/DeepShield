"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, AudioLines, CalendarDays, FileCheck2, FileText, Image as ImageIcon, ShieldAlert, Video } from "lucide-react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { scamReports } from "@/services/scamData";

const detectorActions = [
  ["Analyze Image", "/upload/image", ImageIcon],
  ["Analyze Document", "/upload/document", FileCheck2],
  ["Analyze Audio", "/upload/audio", AudioLines],
  ["Analyze Video", "/upload/video", Video],
  ["Analyze Text", "/upload/text", FileText],
];

export default function ScamDetail() {
  const { id } = useParams();
  const scam = scamReports.find((item) => item.id === id);

  if (!scam) return <AppShell><div className="page-frame"><p className="page-kicker">404 / intelligence</p><h1 className="page-title">Scam report not found</h1><Link className="scam-back-link" href="/scams"><ArrowLeft size={15} /> Back to Scam Dashboard</Link></div></AppShell>;

  return <AppShell><div className="page-frame scam-detail-page"><Link className="scam-back-link" href="/scams"><ArrowLeft size={15} /> Back to Scam Dashboard</Link><header className="scam-detail-header reveal"><div><p className="page-kicker">{scam.sourceType === "demo" ? "Demo intelligence data" : scam.sourceType}</p><h1 className="page-title">{scam.title}</h1><p className="page-subtitle">{scam.description}</p></div><span className={`scam-risk risk-${scam.risk.toLowerCase()}`}><ShieldAlert size={15} /> {scam.risk} risk</span></header><div className="scam-detail-grid"><section className="scam-detail-main surface"><div className="scam-detail-meta"><span><b>Category</b>{scam.category}</span><span><b>Platforms</b>{scam.platforms.join(" · ")}</span><span><b>Status</b>{scam.status}</span><span><b>First observed</b>{scam.firstObserved}</span><span><b>Last updated</b>{scam.lastUpdated}</span></div><div className="scam-detail-copy"><h2>Overview</h2><p>{scam.description}</p><h2>How it works</h2><p>{scam.howItWorks}</p><h2>Common warning signs</h2><ul>{scam.warningSigns.map((warning) => <li key={warning}>{warning}</li>)}</ul><h2>What to do</h2><p>{scam.recommendedAction}</p></div><div className="detail-actions"><p className="page-kicker">Analyze suspicious content</p><div>{detectorActions.map(([label, href, Icon]) => <Link href={href} key={href}><Icon size={15} />{label}</Link>)}</div></div></section><aside className="scam-detail-side"><div className="safety-callout"><p className="page-kicker">Before you act</p><h2>Pause. Verify. Then respond.</h2><ul><li>Never share OTPs or passwords.</li><li>Verify payment requests independently.</li><li>Do not trust urgency without a second channel.</li></ul></div><div className="source-note"><CalendarDays size={16} /><span><strong>Source label</strong>Demo training data. This report is not live or verified official intelligence.</span></div></aside></div></div></AppShell>;
}
