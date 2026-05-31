"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Aliment, RepasLog, Profile } from "@/lib/supabase";
import { calculBMR, calculCaloriesBrulees } from "@/lib/calculs";
import { Trash2, ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";

type Tab = "log" | "bibliotheque";

export default function BoufffePage() {
  const [tab, setTab] = useState<Tab>("log");
  const today = new Date().toISOString().slice(0, 10);

  const [aliments, setAliments] = useState<Aliment[]>([]);
  const [repasLogs, setRepasLogs] = useState<RepasLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pasLog, setPasLog] = useState<{ nb_pas: number; type_journee: "bureau" | "active" } | null>(null);

  // Formulaire log
  const [selectedAliment, setSelectedAliment] = useState<string>("");
  const [nomLibre, setNomLibre] = useState("");
  const [calories, setCalories] = useState("");
  const [proteines, setProteines] = useState("");
  const [saving, setSaving] = useState(false);

  // Formulaire bibliothèque
  const [bibNom, setBibNom] = useState("");
  const [bibCal, setBibCal] = useState("");
  const [bibProt, setBibProt] = useState("");
  const [bibSaving, setBibSaving] = useState(false);

  async function loadData() {
    const [alimentsRes, repasRes, profileRes, pasRes] = await Promise.all([
      supabase.from("aliments").select("*").order("nom"),
      supabase.from("repas_log").select("*").eq("date", today).order("created_at"),
      supabase.from("profile").select("*").eq("id", 1).single(),
      supabase.from("pas_log").select("*").eq("date", today).single(),
    ]);
    if (alimentsRes.data) setAliments(alimentsRes.data);
    if (repasRes.data) setRepasLogs(repasRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    if (pasRes.data) setPasLog(pasRes.data);
  }

  useEffect(() => { loadData(); }, [today]);

  function handleAlimentSelect(id: string) {
    setSelectedAliment(id);
    if (id) {
      const a = aliments.find((a) => a.id === id);
      if (a) {
        setCalories(String(a.calories_par_portion));
        setProteines(String(a.proteines_par_portion));
        setNomLibre("");
      }
    } else {
      setCalories("");
      setProteines("");
    }
  }

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!calories || !proteines) return;
    setSaving(true);
    await supabase.from("repas_log").insert({
      date: today,
      aliment_id: selectedAliment || null,
      nom_libre: selectedAliment ? null : nomLibre,
      calories: Number(calories),
      proteines: Number(proteines),
    });
    setSaving(false);
    setSelectedAliment("");
    setNomLibre("");
    setCalories("");
    setProteines("");
    loadData();
  }

  async function handleDeleteRepas(id: string) {
    await supabase.from("repas_log").delete().eq("id", id);
    loadData();
  }

  async function handleBibSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bibNom || !bibCal || !bibProt) return;
    setBibSaving(true);
    await supabase.from("aliments").insert({
      nom: bibNom,
      calories_par_portion: Number(bibCal),
      proteines_par_portion: Number(bibProt),
    });
    setBibSaving(false);
    setBibNom("");
    setBibCal("");
    setBibProt("");
    loadData();
  }

  async function handleDeleteAliment(id: string) {
    await supabase.from("aliments").delete().eq("id", id);
    loadData();
  }

  const totalCal = repasLogs.reduce((s, r) => s + r.calories, 0);
  const totalProt = repasLogs.reduce((s, r) => s + r.proteines, 0);

  let caloriesBrulees = 0;
  if (profile?.age && profile?.taille_cm && profile?.poids_objectif_kg && profile?.sexe) {
    const bmr = calculBMR(
      profile.poids_objectif_kg,
      profile.taille_cm,
      profile.age,
      profile.sexe
    );
    caloriesBrulees = calculCaloriesBrulees(
      bmr,
      pasLog?.type_journee || "bureau",
      pasLog?.nb_pas || 0,
      profile.poids_objectif_kg
    );
  }

  const calNettes = totalCal - caloriesBrulees;

  return (
    <div className="px-4 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-[#12121A] border border-[#1E1E2E]">
          <ChevronLeft size={18} className="text-[#7A7A9A]" />
        </Link>
        <h1 className="text-lg font-bold">Alimentation</h1>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-[#12121A] border border-[#1E1E2E] rounded-xl p-1">
        {(["log", "bibliotheque"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-[#00D4AA] text-[#0A0A0F]"
                : "text-[#7A7A9A] hover:text-[#F0F0F5]"
            }`}
          >
            {t === "log" ? "Log du jour" : "Bibliothèque"}
          </button>
        ))}
      </div>

      {tab === "log" && (
        <>
          {/* Formulaire log */}
          <form onSubmit={handleLogSubmit} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F0F0F5]">Ajouter un aliment</h2>

            <div className="space-y-2">
              <label className="text-xs text-[#7A7A9A]">Aliment (bibliothèque)</label>
              <select
                value={selectedAliment}
                onChange={(e) => handleAlimentSelect(e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA]"
              >
                <option value="">— Saisie libre —</option>
                {aliments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom} ({a.calories_par_portion} kcal / {a.proteines_par_portion}g prot)
                  </option>
                ))}
              </select>
            </div>

            {!selectedAliment && (
              <div className="space-y-2">
                <label className="text-xs text-[#7A7A9A]">Nom libre</label>
                <input
                  type="text"
                  value={nomLibre}
                  onChange={(e) => setNomLibre(e.target.value)}
                  placeholder="Ex: Poulet rôti"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs text-[#7A7A9A]">Calories (kcal)</label>
                <input
                  type="number"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="250"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#7A7A9A]">Protéines (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={proteines}
                  onChange={(e) => setProteines(e.target.value)}
                  placeholder="30"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || (!selectedAliment && !nomLibre) || !calories || !proteines}
              className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              <Plus size={16} className="inline mr-1" />
              {saving ? "Ajout..." : "Ajouter"}
            </button>
          </form>

          {/* Liste du jour */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-1">
            <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">Repas du jour</h2>
            {repasLogs.length === 0 ? (
              <p className="text-sm text-[#7A7A9A]">Rien enregistré aujourd&apos;hui</p>
            ) : (
              <>
                {repasLogs.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2.5 border-b border-[#1E1E2E] last:border-0"
                  >
                    <div>
                      <p className="text-sm text-[#F0F0F5] font-medium">
                        {r.nom_libre || aliments.find((a) => a.id === r.aliment_id)?.nom || "—"}
                      </p>
                      <p className="text-xs text-[#7A7A9A]">{r.proteines}g prot</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#FF6B35]">{Math.round(r.calories)} kcal</span>
                      <button
                        onClick={() => handleDeleteRepas(r.id)}
                        className="p-1.5 rounded-lg hover:bg-[#FF3B5C]/10 text-[#7A7A9A] hover:text-[#FF3B5C] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="pt-3 mt-1 border-t border-[#1E1E2E] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7A7A9A]">Total consommé</span>
                    <span className="font-semibold text-[#F0F0F5]">{Math.round(totalCal)} kcal · {Math.round(totalProt)}g prot</span>
                  </div>
                  {caloriesBrulees > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7A7A9A]">Brûlées (estimation)</span>
                        <span className="font-semibold text-[#F0F0F5]">{Math.round(caloriesBrulees)} kcal</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7A7A9A]">Bilan net</span>
                        <span className={`font-semibold ${calNettes > 0 ? "text-[#FF6B35]" : "text-[#00D4AA]"}`}>
                          {calNettes > 0 ? "+" : ""}{Math.round(calNettes)} kcal
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {tab === "bibliotheque" && (
        <>
          {/* Formulaire ajout aliment */}
          <form onSubmit={handleBibSubmit} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F0F0F5]">Ajouter à la bibliothèque</h2>
            <div className="space-y-2">
              <label className="text-xs text-[#7A7A9A]">Nom</label>
              <input
                type="text"
                value={bibNom}
                onChange={(e) => setBibNom(e.target.value)}
                placeholder="Ex: Blanc de poulet 100g"
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs text-[#7A7A9A]">Calories / portion</label>
                <input
                  type="number"
                  min="0"
                  value={bibCal}
                  onChange={(e) => setBibCal(e.target.value)}
                  placeholder="165"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#7A7A9A]">Protéines / portion (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={bibProt}
                  onChange={(e) => setBibProt(e.target.value)}
                  placeholder="31"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={bibSaving || !bibNom || !bibCal || !bibProt}
              className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {bibSaving ? "Ajout..." : "Ajouter à la bibliothèque"}
            </button>
          </form>

          {/* Liste bibliothèque */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-1">
            <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">
              Ma bibliothèque ({aliments.length})
            </h2>
            {aliments.length === 0 ? (
              <p className="text-sm text-[#7A7A9A]">Aucun aliment enregistré</p>
            ) : (
              aliments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2.5 border-b border-[#1E1E2E] last:border-0"
                >
                  <div>
                    <p className="text-sm text-[#F0F0F5] font-medium">{a.nom}</p>
                    <p className="text-xs text-[#7A7A9A]">
                      {a.calories_par_portion} kcal · {a.proteines_par_portion}g prot
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAliment(a.id)}
                    className="p-1.5 rounded-lg hover:bg-[#FF3B5C]/10 text-[#7A7A9A] hover:text-[#FF3B5C] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
