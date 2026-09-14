"use client";

import { useEffect, useState } from "react";
import { detectAudio } from "@/services/detectAI";
import { addHistoryEntry } from "@/services/history";
import AppShell from "@/components/AppShell";
import { DetectButton, DetectionHeader, DetectionResult, ErrorMessage, UploadSurface } from "@/components/DetectionUI";

const acceptedTypes = ".wav,.mp3,.m4a,.ogg,.flac";

function formatValue(value) {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export default function AudioDetection() {
  const [audio, setAudio] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleAudio = (event) => {
    const selectedAudio = event.target.files?.[0];

    if (!selectedAudio) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setAudio(selectedAudio);
    setPreviewUrl(URL.createObjectURL(selectedAudio));
    setError("");
    setResult(null);
  };

  const handleDetect = async () => {
    if (!audio) {
      setError("Please select an audio file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await detectAudio(audio);
      setResult(response);
      addHistoryEntry({ type: "Audio", name: audio.name, result: response });
    } catch (detectionError) {
      setError(detectionError.message || "Audio detection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page-frame">
        <DetectionHeader eyebrow="Audio forensics / 03" title="Audio Detection" description="Inspect spectral patterns and signal characteristics in voice and sound." />
        <UploadSurface inputId="audio-upload" accept={acceptedTypes} onChange={handleAudio} onClear={() => { setAudio(null); setPreviewUrl(""); setResult(null); }} selectedName={audio?.name} supportingText="WAV, MP3, M4A, OGG, and FLAC files supported">
          {audio && <div className="file-meta"><span>Selected file<strong>{audio.name}</strong></span><span>Format<strong>{audio.type || "Audio"}</strong></span><span>Size<strong>{(audio.size / 1024).toFixed(1)} KB</strong></span></div>}
          {previewUrl && <audio controls src={previewUrl} className="preview-media" />}
          <DetectButton loading={loading} loadingText="Analyzing audio..." onClick={handleDetect}>Run audio analysis</DetectButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </UploadSurface>
        {result && <DetectionResult result={result} onAnalyzeAnother={() => { setResult(null); setAudio(null); setPreviewUrl(""); }} />}
      </div>
    </AppShell>
  );
}