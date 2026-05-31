"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PoidsLog } from "@/lib/supabase";
import { todayLocal } from "@/lib/date";
import WeightChart from "@/components/WeightChart";
import { Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function PoidsPage() {
  const [logs, setLogs] = useState<PoidsLog[]>([]);
  const [date, setDate] = useState(todayLocal());
  const [poids, setPoids] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    const { data, error } = await supabase
      .from("poids_log")
      .select("*")
      .order("date", { ascending: false })
      .limit(30);
    if (!error && data) setLogs(data);
  }

  useEffect(() => { loadLogs(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!poids || isNaN(Number(poids))) return;
    setSaving(true);
    const { error } = await supabase.from("poids_log").upsert(
      { date, poids_kg: Number(poids) },
      { onConflict: "date" }
    );
    setSaving(false);
    if (error) { setError(error.message); return; }
    setPoids("");
    loadLogs();
  }

  async function handleDelete(id: string) {
    await supabase.from("poids_log").delete().eq("id", id);
    loadLogs();
  }

  const logsAsc = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="px-4 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-[#12121A] border border-[#1E1E2E]">
          <ChevronLeft size={18} className="text-[#7A7A9A]" />
        </Link>
        <h1 className="text-lg font-bold">Suivi du poids</h1>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#F0F0F5]">Enregistrer</h2>
        <div className="space-y-2">
          <label className="text-xs text-[#7A7A9A]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#7A7A9A]">Poids (kg)</label>
          <input
            type="number"
            step="0.1"
            min="30"
            max="300"
            value={poids}
            onChange={(e) => setPoids(e.target.value)}
            placeholder="Ex: 75.5"
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
          />
        </div>
        {error && <p className="text-xs text-[#FF3B5C]">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 transition-opacity"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      {/* Graphique */}
      {logsAsc.length > 0 && (
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">30 derniers jours</h2>
          <WeightChart data={logsAsc} />
        </div>
      )}

      {/* Historique */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-1">
        <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">Historique</h2>
        {logs.length === 0 && (
          <p className="text-sm text-[#7A7A9A]">Aucun log enregistré</p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between py-2.5 border-b border-[#1E1E2E] last:border-0"
          >
            <div>
              <p className="text-sm text-[#F0F0F5] font-medium">
                {format(parseISO(log.date), "EEEE d MMMM", { locale: fr })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#00D4AA]">{log.poids_kg} kg</span>
              <button
                onClick={() => handleDelete(log.id)}
                className="p-1.5 rounded-lg hover:bg-[#FF3B5C]/10 text-[#7A7A9A] hover:text-[#FF3B5C] transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
