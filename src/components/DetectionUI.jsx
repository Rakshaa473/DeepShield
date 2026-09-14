import { AlertCircle, CheckCircle2, FileUp, LoaderCircle, ShieldAlert, X } from "lucide-react";
import { useState } from "react";

export function DetectionHeader({ eyebrow, title, description }) {
  return (
    <header className="detection-header reveal">
      <div>
        <p className="page-kicker">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </div>
      <div className="analysis-badge"><span className="status-dot" /> Prototype engine</div>
    </header>
  );
}

export function UploadSurface({ inputId, accept, onChange, onClear, selectedName, supportingText, preview, children }) {
  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) onChange({ target: { files: [file] } });
  };

  return (
    <section className="upload-surface surface reveal reveal-delay">
      <label htmlFor={inputId} className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <input id={inputId} type="file" accept={accept} onChange={onChange} className="sr-only" />
        <span className="upload-icon"><FileUp size={24} /></span>
        <span className="upload-title">{selectedName || "Choose a file to inspect"}</span>
        <span className="upload-support">{supportingText}</span>
        <span className="upload-cta">Browse files <span>↗</span></span>
      </label>
      {selectedName && onClear && <button type="button" className="change-file" onClick={onClear}><X size={14} /> Remove file</button>}
      {children}
      {preview}
    </section>
  );
}

export function DetectButton({ loading, loadingText = "Running analysis...", onClick, children }) {
  return <button onClick={onClick} disabled={loading} className="detect-button">
    {loading ? <><LoaderCircle size={17} className="spin" /> {loadingText}</> : <><ShieldAlert size={17} /> {children}</>}
  </button>;
}

export function ErrorMessage({ children }) {
  return <div className="error-message" role="alert"><AlertCircle size={17} /> <span>{children}</span></div>;
}

export function ResultValue({ value }) {
  if (typeof value === "object" && value !== null) {
    return <pre className="result-json">{JSON.stringify(value, null, 2)}</pre>;
  }
  return <span>{String(value)}</span>;
}

export function DetectionResult({ result, onAnalyzeAnother }) {
  const [showTechnicalDetails] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const storedPreferences = JSON.parse(localStorage.getItem("deepshield-preferences") || "{}");
      return storedPreferences.showTechnicalDetails !== false;
    } catch {
      return true;
    }
  });

  if (!result) return null;
  const probability = result.ai_probability ?? result.score ?? result.metadata_ai_probability;
  const label = result.label ?? result.prediction ?? "Analysis complete";
  const risk = result.risk ?? "Unknown";
  const riskClass = String(risk).toLowerCase();

  return <section className="result-panel surface reveal reveal-delay-2">
    <div className="result-heading"><div><p className="eyebrow-rule">Analysis complete</p><h2>Detection result</h2></div><CheckCircle2 size={23} className="result-check" /></div>
    <div className="result-hero">
      <div><span className="result-label">Final signal</span><strong>{label}</strong></div>
      <div className="probability-ring" style={{ "--progress": `${Math.min(Number(probability) || 0, 100)}%` }}><span>{probability ?? "N/A"}<small>{probability !== undefined && probability !== "N/A" ? "% AI" : ""}</small></span></div>
    </div>
    <div className="result-metrics">
      <div><span>AI probability</span><strong>{probability ?? "N/A"}{probability !== undefined && probability !== "N/A" ? "%" : ""}</strong></div>
      <div><span>Risk level</span><strong className={`risk-${riskClass}`}>{risk}</strong></div>
      <div><span>Signal status</span><strong className="signal-live">Reviewed</strong></div>
    </div>
    {showTechnicalDetails && <details className="supporting-details"><summary>View supporting analysis</summary><div className="supporting-grid">{Object.entries(result).map(([key, value]) => <div key={key} className="supporting-item"><span>{key.replaceAll("_", " ")}</span><ResultValue value={value} /></div>)}</div></details>}
    <div className="result-actions"><button type="button" onClick={onAnalyzeAnother}>Analyze another</button><a href="/history">View history</a></div>
  </section>;
}
