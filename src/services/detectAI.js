const API_URL = "https://deepshield-zfj8.onrender.com";

export async function detectImage(image) {
  const formData = new FormData();
  formData.append("file", image);

  const response = await fetch(`${API_URL}/detect-image`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Image detection failed.");
  }

  return data;
}

export async function detectDocument(document) {
  const formData = new FormData();
  formData.append("file", document);

  const response = await fetch(`${API_URL}/detect-document`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Document detection failed.");
  }

  return data;
}

export async function detectAudio(audio) {
  const formData = new FormData();
  formData.append("file", audio);

  const response = await fetch(`${API_URL}/detect-audio`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Audio detection failed.");
  }

  return data;
}

export async function detectVideo(video) {
  const formData = new FormData();
  formData.append("file", video);

  const response = await fetch(`${API_URL}/detect-video`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Video detection failed.");
  }

  return data;
}

export async function detectText(text) {
  const response = await fetch(`${API_URL}/detect-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Text detection failed.");
  }

  return data;
}