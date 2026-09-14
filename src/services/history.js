const HISTORY_STORAGE_KEY = "deepshield-history";

function getProbability(result) {
  return result.ai_probability ?? result.score ?? result.metadata_ai_probability ?? "N/A";
}

export function addHistoryEntry({ type, name, result }) {
  if (typeof window === "undefined") return;

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    name,
    label: result.label ?? result.prediction ?? "Unknown",
    aiProbability: getProbability(result),
    risk: result.risk ?? "Unknown",
    date: new Date().toISOString(),
  };

  const existingEntries = getHistoryEntries();
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([entry, ...existingEntries]));
}

export function getHistoryEntries() {
  if (typeof window === "undefined") return [];

  try {
    const storedEntries = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    return Array.isArray(storedEntries) ? storedEntries : [];
  } catch {
    return [];
  }
}

export function clearHistoryEntries() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }
}
