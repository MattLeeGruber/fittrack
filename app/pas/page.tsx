"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PasLog, Profile } from "@/lib/supabase";
import { todayLocal } from "@/lib/date";
import { calculBMR, calculCaloriesBrulees } from "@/lib/calculs";
import { Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function PasPage() {
  const [logs, setLogs] = useState<PasLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [date, setDate] = useState(todayLocal());
  const [nbPas, setNbPas] = useState("");
  const [typeJournee, setTypeJournee] = useState<"bureau" | "active">("bureau");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    const [logsRes, profileRes] = await Promise.all([
      supabase.from("pas_log").select("*").order("date", { ascending: false }).limit(14),
      supabase.from("profile").select("*").eq("id", 1).single(),
    ]);
    if (logsRes.data) setLogs(logsRes.data);
    if (profileRes.data) setProfile(profileRes.data);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nbPas || isNaN(Number(nbPas))) return;
    setSaving(true);
    const { error } = await supabase.from("pas_log").upsert(
      { date, nb_pas: Number(nbPas), type_journee: typeJournee },
      { onConflict: "date" }
    );
    setSaving(false);
    if (error) { setError(error.message); return; }
    setNbPas("");
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("pas_log").delete().eq("id", id);
    loadData();
  }

  // Calcul estimation calories pour le formulaire actuel
  let estimationCalories: number | null = null;
  if (profile?.age && profile?.taille_cm && profile?.sexe && nbPas) {
    // On utilise poids objectif comme approximation si pas de poids actuel
    const poids = profile.poids_objectif_kg || 75;
    const bmr = calculBMR(poids, profile.taille_cm, profile.age, profile.sexe);
    estimationCalories = calculCaloriesBrulees(bmr, typeJournee, Number(nbPas), poids);
  }

  const objectifPas = profile?.objectif_pas_quotidien || 8000;

  return (
    <div className="px-4 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-[#12121A] border border-[#1E1E2E]">
          <ChevronLeft size={18} className="text-[#7A7A9A]" />
        </Link>
        <h1 className="text-lg font-bold">Suivi des pas</h1>
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
          <label className="text-xs text-[#7A7A9A]">Nombre de pas</label>
          <input
            type="number"
            min="0"
            max="100000"
            value={nbPas}
            onChange={(e) => setNbPas(e.target.value)}
            placeholder="Ex: 8500"
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#7A7A9A]">Type de journée</label>
          <div className="grid grid-cols-2 gap-2">
            {(["bureau", "active"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeJournee(t)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeJournee === t
                    ? "bg-[#00D4AA] text-[#0A0A0F]"
                    : "bg-[#0A0A0F] border border-[#1E1E2E] text-[#7A7A9A]"
                }`}
              >
                {t === "bureau" ? "🖥️ Bureau" : "🏃 Active"}
              </button>
            ))}
          </div>
        </div>

        {/* Estimation calories */}
        {estimationCalories !== null && (
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3">
            <p className="text-xs text-[#7A7A9A]">Estimation calories brûlées aujourd&apos;hui</p>
            <p className="text-xl font-bold text-[#FF6B35]">{estimationCalories} kcal</p>
            {!profile?.age && (
              <p className="text-xs text-[#7A7A9A] mt-1">
                Complétez votre profil pour un calcul plus précis
              </p>
            )}
          </div>
        )}

        {error && <p className="text-xs text-[#FF3B5C]">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      {/* Historique */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-1">
        <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">14 derniers jours</h2>
        {logs.length === 0 && (
          <p className="text-sm text-[#7A7A9A]">Aucun log enregistré</p>
        )}
        {logs.map((log) => {
          const atteint = log.nb_pas >= objectifPas;
          return (
            <div
              key={log.id}
              className="flex items-center justify-between py-2.5 border-b border-[#1E1E2E] last:border-0"
            >
              <div>
                <p className="text-sm text-[#F0F0F5] font-medium">
                  {format(parseISO(log.date), "EEE d MMM", { locale: fr })}
                </p>
                <p className="text-xs text-[#7A7A9A]">
                  {log.type_journee === "bureau" ? "Bureau" : "Active"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className={`text-sm font-semibold ${atteint ? "text-[#00D4AA]" : "text-[#FF6B35]"}`}>
                    {log.nb_pas.toLocaleString("fr-FR")}
                  </span>
                  <p className="text-xs text-[#7A7A9A]">/ {objectifPas.toLocaleString("fr-FR")}</p>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-1.5 rounded-lg hover:bg-[#FF3B5C]/10 text-[#7A7A9A] hover:text-[#FF3B5C] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
