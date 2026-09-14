"use client";

import { useState } from "react";
import Image from "next/image";
import { detectImage } from "@/services/detectAI";
import { addHistoryEntry } from "@/services/history";
import AppShell from "@/components/AppShell";
import { DetectButton, DetectionHeader, DetectionResult, ErrorMessage, UploadSurface } from "@/components/DetectionUI";

export default function ImageDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Handle image upload
  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
    setResult(null); // Clear previous result
  };

  // Handle AI Detection
  const handleDetect = async () => {
    if (!image) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await detectImage(image);
      setResult(response);
      addHistoryEntry({ type: "Image", name: image.name, result: response });
    } catch {
      setError("Unable to analyze this image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page-frame">
        <DetectionHeader eyebrow="Visual forensics / 01" title="Image Detection" description="Inspect an image for generated pixels, editing artifacts, and provenance signals." />
        <UploadSurface inputId="image-upload" accept="image/*" onChange={handleImage} onClear={() => { setImage(null); setPreview(""); setResult(null); }} selectedName={image?.name} supportingText="PNG, JPG, WEBP, GIF and other common image formats">
          {image && <div className="file-meta"><span>Selected file<strong>{image.name}</strong></span><span>Format<strong>{image.type || "Image"}</strong></span><span>Size<strong>{(image.size / 1024).toFixed(1)} KB</strong></span></div>}
          {preview && <Image src={preview} alt="Selected image preview" width={1200} height={800} unoptimized className="preview-media" />}
          <DetectButton loading={loading} loadingText="Analyzing image..." onClick={handleDetect}>Run image analysis</DetectButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </UploadSurface>
        {result && <DetectionResult result={result} onAnalyzeAnother={() => { setResult(null); setImage(null); setPreview(""); }} />}
      </div>
    </AppShell>
  );
}