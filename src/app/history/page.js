"use client";

import { useEffect, useState } from "react";
import {
  clearHistoryEntries,
  getHistoryEntries,
} from "@/services/history";
import AppShell from "@/components/AppShell";
import { AudioLines, FileCheck2, FileText, Image as ImageIcon, Video } from "lucide-react";

const filters = ["All", "Image", "Document", "Audio", "Video", "Text"];
const typeIcons = { Image: ImageIcon, Document: FileCheck2, Audio: AudioLines, Video, Text: FileText };

function formatProbability(value) {
  return typeof value === "number" ? `${value}%` : value;
}

export default function History() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const loadHistory = window.setTimeout(() => {
      setEntries(getHistoryEntries());
    }, 0);

    return () => window.clearTimeout(loadHistory);
  }, []);

  const visibleEntries = entries
    .filter((entry) => filter === "All" || entry.type === filter)
    .filter((entry) => `${entry.name} ${entry.label} ${entry.type}`.toLowerCase().includes(query.toLowerCase()))
    .sort((first, second) => sort === "newest"
      ? new Date(second.date) - new Date(first.date)
      : new Date(first.date) - new Date(second.date));

  const handleClearHistory = () => {
    if (!entries.length || !window.confirm("Clear all detection history?")) return;

    clearHistoryEntries();
    setEntries([]);
  };

  return (
    <AppShell>
      <div className="page-frame">
        <div className="history-header reveal">
          <div><p className="page-kicker">Workspace / archive</p><h1 className="page-title">Detection history</h1><p className="page-subtitle">A quiet record of the signals you have reviewed across the DeepShield suite.</p></div>
        <button
          onClick={handleClearHistory}
          disabled={!entries.length}
          className="rounded-lg bg-red-500 px-4 py-2 font-semibold hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >Clear History</button>
        </div>

      <div className="history-filters reveal reveal-delay">
        {filters.map((option) => (
          <button
            key={option}
            onClick={() => setFilter(option)}
            className={`rounded-lg px-4 py-2 font-semibold transition ${
              filter === option
                ? "bg-cyan-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="history-tools reveal reveal-delay">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files, labels, or types..." aria-label="Search history" />
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort history">
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="history-table surface reveal reveal-delay-2">
        {visibleEntries.length ? (
          <table>
            <thead>
              <tr>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">File / Input</th>
                <th className="px-5 py-4">Result</th>
                <th className="px-5 py-4">AI Probability</th>
                <th className="px-5 py-4">Risk</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry) => (
                <tr key={entry.id}>
                  <td><span className="history-type">{(() => { const Icon = typeIcons[entry.type] || FileText; return <Icon size={15} />; })()}{entry.type}</span></td>
                  <td className="history-name" title={entry.name}>{entry.name}</td>
                  <td><strong>{entry.label}</strong></td>
                  <td><span className="probability-pill">{formatProbability(entry.aiProbability)}</span></td>
                  <td><span className={`history-risk risk-${String(entry.risk).toLowerCase()}`}>{entry.risk}</span></td>
                  <td className="history-date">
                    {new Date(entry.date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="history-empty">
            {entries.length ? "No entries match this filter." : "No detection history yet."}
          </p>
        )}
      </div>
      </div>
    </AppShell>
  );
}
