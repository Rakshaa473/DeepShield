import Link from "next/link";
import { ArrowRight, AudioLines, FileCheck2, FileText, Image as ImageIcon, ScanLine, ShieldCheck, Video } from "lucide-react";

const media = [
  ["Image", "Pixels, metadata, and visual artifacts", "/upload/image", ImageIcon, "JPG · PNG · WEBP"],
  ["Document", "Text signals and provenance clues", "/upload/document", FileCheck2, "PDF · DOCX · TXT"],
  ["Audio", "Spectral patterns in voice and sound", "/upload/audio", AudioLines, "WAV · MP3 · FLAC"],
  ["Video", "Sampled frames and motion signals", "/upload/video", Video, "MP4 · MOV · WEBM"],
  ["Text", "Language patterns and phrasing clues", "/upload/text", FileText, "Paste any text"],
];

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link href="/" className="sidebar-brand"><span className="brand-mark"><ShieldCheck size={19} /></span><span><strong>DeepShield</strong><small>AUTHENTICITY LAB</small></span></Link>
        <div className="landing-nav-links"><Link href="/login">Sign in</Link><Link href="/signup" className="landing-nav-cta">Enter the lab <ArrowRight size={15} /></Link></div>
      </nav>
      <section className="landing-hero">
        <div className="landing-copy reveal"><p className="page-kicker">AI-powered digital authenticity</p><h1>Truth leaves<br /><em>a signal.</em></h1><p>DeepShield is a practical media forensics workspace for the files, voices, images, and words shaping our digital world.</p><div className="landing-actions"><Link href="/signup" className="landing-primary">Start an analysis <ArrowRight size={17} /></Link><Link href="/login" className="landing-secondary">Sign in to workspace</Link></div></div>
        <div className="landing-signal reveal reveal-delay" aria-hidden="true"><div className="signal-core"><ScanLine size={43} /><span>AUTHENTICITY<br /><b>SIGNAL</b></span></div><div className="signal-orbit signal-orbit-a" /><div className="signal-orbit signal-orbit-b" /><div className="signal-caption"><span>01</span><p>Observe<br />without assumption.</p></div></div>
      </section>
      <section className="landing-section landing-how"><div className="landing-section-heading"><p className="page-kicker">A clear path to context</p><h2>How DeepShield works</h2></div><div className="how-grid">{[["01", "Upload", "Bring the content you want to understand."], ["02", "Analyze", "Let the right forensic instrument inspect it."], ["03", "Verify", "Review the signals behind the result."], ["04", "Understand", "Make a more informed decision." ]].map(([number, title, text]) => <div className="how-step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
      <section className="landing-section"><div className="landing-section-heading"><p className="page-kicker">One workspace, five instruments</p><h2>Inspect every kind of signal.</h2></div><div className="media-grid">{media.map(([title, text, href, Icon, formats]) => <Link href={href} className="landing-media-card" key={title}><span className="landing-media-icon"><Icon size={21} /></span><h3>{title}</h3><p>{text}</p><small>{formats}</small><ArrowRight size={16} /></Link>)}</div></section>
      <section className="landing-section landing-why"><div className="why-copy"><p className="page-kicker">Why DeepShield</p><h2>Evidence that stays understandable.</h2><p>Digital authenticity is complicated enough. DeepShield keeps the workflow calm, the language clear, and the supporting signals close at hand.</p></div><div className="why-list">{[["Multi-media by design", "One consistent workflow for images, documents, audio, video, and text."], ["Results with context", "Probability and risk sit beside the evidence that produced them."], ["Privacy-conscious prototype", "Your history stays in this browser while this project is in prototype mode."]].map(([title, text]) => <div key={title}><ShieldCheck size={18} /><span><strong>{title}</strong><p>{text}</p></span></div>)}</div></section>
      <footer className="landing-footer"><span>DEEPSHIELD / 2026</span><span>Images · Documents · Audio · Video · Text</span></footer>
    </main>
  );
}