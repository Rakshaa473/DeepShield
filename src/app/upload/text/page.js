"use client";

import { useState } from "react";
import { detectText } from "@/services/detectAI";
import { addHistoryEntry } from "@/services/history";
import AppShell from "@/components/AppShell";
import { DetectButton, DetectionHeader, DetectionResult, ErrorMessage } from "@/components/DetectionUI";

function formatValue(value) {
  return typeof value === "object" && value !== null
    ? JSON.stringify(value, null, 2)
    : String(value);
}

export default function TextDetection() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleDetect = async () => {
    if (!text.trim()) {
      setError("Please enter text first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await detectText(text);
      setResult(response);
      addHistoryEntry({ type: "Text", name: "Text input", result: response });
    } catch (detectionError) {
      setError(detectionError.message || "Text detection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page-frame">
        <DetectionHeader eyebrow="Language forensics / 05" title="Text Detection" description="Review writing patterns and phrasing signals with a lightweight prototype analysis." />
        <section className="text-workspace surface reveal reveal-delay">
          <div className="text-toolbar"><span>Input canvas</span><span>Prototype analysis · context matters</span></div>
          <textarea value={text} onChange={(event) => { setText(event.target.value); setError(""); setResult(null); }} placeholder="Paste or type text to analyze..." aria-label="Text to analyze" />
          <div className="text-counts"><span><strong>{text.length}</strong> characters</span><span><strong>{wordCount}</strong> words</span></div>
          <DetectButton loading={loading} loadingText="Analyzing text..." onClick={handleDetect}>Run text analysis</DetectButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </section>
        {result && <DetectionResult result={result} onAnalyzeAnother={() => { setResult(null); setText(""); }} />}
      </div>
    </AppShell>
  );
}
