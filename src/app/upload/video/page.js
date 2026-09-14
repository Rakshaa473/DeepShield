"use client";

import { useEffect, useState } from "react";
import { detectVideo } from "@/services/detectAI";
import { addHistoryEntry } from "@/services/history";
import AppShell from "@/components/AppShell";
import { DetectButton, DetectionHeader, DetectionResult, ErrorMessage, UploadSurface } from "@/components/DetectionUI";

const acceptedTypes = ".mp4,.avi,.mov,.mkv,.webm";

function formatValue(value) {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export default function VideoDetection() {
  const [video, setVideo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleVideo = (event) => {
    const selectedVideo = event.target.files?.[0];

    if (!selectedVideo) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setVideo(selectedVideo);
    setPreviewUrl(URL.createObjectURL(selectedVideo));
    setError("");
    setResult(null);
  };

  const handleDetect = async () => {
    if (!video) {
      setError("Please select a video file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await detectVideo(video);
      setResult(response);
      addHistoryEntry({ type: "Video", name: video.name, result: response });
    } catch (detectionError) {
      setError(detectionError.message || "Video detection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page-frame">
        <DetectionHeader eyebrow="Motion forensics / 04" title="Video Detection" description="Sample frames intelligently to surface manipulation signals without weighing down your laptop." />
        <UploadSurface inputId="video-upload" accept={acceptedTypes} onChange={handleVideo} onClear={() => { setVideo(null); setPreviewUrl(""); setResult(null); }} selectedName={video?.name} supportingText="MP4, AVI, MOV, MKV, and WEBM files supported">
          {video && <div className="file-meta"><span>Selected file<strong>{video.name}</strong></span><span>Format<strong>{video.type || "Video"}</strong></span><span>Size<strong>{(video.size / 1024 / 1024).toFixed(2)} MB</strong></span></div>}
          {previewUrl && <video controls src={previewUrl} className="preview-media" />}
          <DetectButton loading={loading} loadingText="Scanning video frames..." onClick={handleDetect}>Run video analysis</DetectButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </UploadSurface>
        {result && <DetectionResult result={result} onAnalyzeAnother={() => { setResult(null); setVideo(null); setPreviewUrl(""); }} />}
      </div>
    </AppShell>
  );
}