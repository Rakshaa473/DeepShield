"use client";

import { useState } from "react";
import { detectDocument } from "@/services/detectAI";
import { addHistoryEntry } from "@/services/history";
import AppShell from "@/components/AppShell";
import { DetectButton, DetectionHeader, DetectionResult, ErrorMessage, UploadSurface } from "@/components/DetectionUI";

const acceptedTypes = ".pdf,.docx,.doc,.txt";

function formatValue(value) {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export default function DocumentDetection() {
  const [document, setDocument] = useState(null);
  const [textPreview, setTextPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleDocument = async (event) => {
    const selectedDocument = event.target.files?.[0];

    if (!selectedDocument) return;

    setDocument(selectedDocument);
    setTextPreview("");
    setError("");
    setResult(null);

    if (selectedDocument.type === "text/plain") {
      setTextPreview((await selectedDocument.text()).slice(0, 1000));
    }
  };

  const handleDetect = async () => {
    if (!document) {
      setError("Please select a document first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await detectDocument(document);
      setResult(response);
      addHistoryEntry({ type: "Document", name: document.name, result: response });
    } catch (detectionError) {
      setError(detectionError.message || "Document detection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page-frame">
        <DetectionHeader eyebrow="Document forensics / 02" title="Document Detection" description="Read provenance clues and text signals across common document formats." />
        <UploadSurface inputId="document-upload" accept={acceptedTypes} onChange={handleDocument} onClear={() => { setDocument(null); setTextPreview(""); setResult(null); }} selectedName={document?.name} supportingText="PDF, DOCX, DOC, and TXT files supported">
          {document && <div className="file-meta"><span>Selected file<strong>{document.name}</strong></span><span>Format<strong>{document.type || "Document"}</strong></span><span>Size<strong>{(document.size / 1024).toFixed(1)} KB</strong></span></div>}
          {textPreview && <div className="preview-text"><span>Text preview</span><pre>{textPreview}</pre></div>}
          <DetectButton loading={loading} loadingText="Reading document..." onClick={handleDetect}>Run document analysis</DetectButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </UploadSurface>
        {result && <DetectionResult result={result} onAnalyzeAnother={() => { setResult(null); setDocument(null); setTextPreview(""); }} />}
      </div>
    </AppShell>
  );
}