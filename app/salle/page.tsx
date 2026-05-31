"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Exercice, Seance, SerieLog } from "@/lib/supabase";
import { todayLocal } from "@/lib/date";
import { Trash2, ChevronLeft, Plus, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type Tab = "seances" | "bibliotheque";

type SeanceWithSeries = Seance & { series: SerieLog[] };

export default function SallePage() {
  const [tab, setTab] = useState<Tab>("seances");
  const today = todayLocal();

  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [seances, setSeances] = useState<SeanceWithSeries[]>([]);
  const [expandedSeance, setExpandedSeance] = useState<string | null>(null);
  const [creatingSeance, setCreatingSeance] = useState(false);

  // Formulaire ajout série
  const [activeSeanceId, setActiveSeanceId] = useState<string | null>(null);
  const [selectedExercice, setSelectedExercice] = useState("");
  const [nomLibreExo, setNomLibreExo] = useState("");
  const [reps, setReps] = useState("");
  const [poids, setPoids] = useState("");
  const [addingSerie, setAddingSerie] = useState(false);

  // Formulaire bibliothèque
  const [newExoNom, setNewExoNom] = useState("");
  const [savingExo, setSavingExo] = useState(false);

  async function loadData() {
    const [exoRes, seancesRes] = await Promise.all([
      supabase.from("exercices").select("*").order("nom"),
      supabase.from("seances").select("*").order("date", { ascending: false }).limit(20),
    ]);
    if (exoRes.data) setExercices(exoRes.data);

    if (seancesRes.data) {
      const seancesWithSeries = await Promise.all(
        seancesRes.data.map(async (s) => {
          const { data: series } = await supabase
            .from("series_log")
            .select("*")
            .eq("seance_id", s.id)
            .order("created_at");
          return { ...s, series: series || [] };
        })
      );
      setSeances(seancesWithSeries);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function creerSeance() {
    setCreatingSeance(true);
    const { data, error } = await supabase
      .from("seances")
      .insert({ date: today, nom: `Séance du ${format(new Date(), "d MMMM", { locale: fr })}` })
      .select()
      .single();
    setCreatingSeance(false);
    if (!error && data) {
      setActiveSeanceId(data.id);
      setExpandedSeance(data.id);
      loadData();
    }
  }

  async function handleAddSerie(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSeanceId) return;
    setAddingSerie(true);

    const nomExo = selectedExercice
      ? exercices.find((ex) => ex.id === selectedExercice)?.nom
      : nomLibreExo;

    // Calculer le numéro de série pour cet exercice dans cette séance
    const seance = seances.find((s) => s.id === activeSeanceId);
    const seriesExo = seance?.series.filter(
      (s) => s.nom_exercice === nomExo || s.exercice_id === selectedExercice
    );
    const serieNumero = (seriesExo?.length || 0) + 1;

    await supabase.from("series_log").insert({
      seance_id: activeSeanceId,
      exercice_id: selectedExercice || null,
      nom_exercice: nomExo,
      serie_numero: serieNumero,
      reps: reps ? Number(reps) : null,
      poids_kg: poids ? Number(poids) : null,
    });

    setAddingSerie(false);
    setReps("");
    setPoids("");
    loadData();
  }

  async function handleDeleteSerie(id: string) {
    await supabase.from("series_log").delete().eq("id", id);
    loadData();
  }

  async function handleDeleteSeance(id: string) {
    await supabase.from("seances").delete().eq("id", id);
    if (activeSeanceId === id) setActiveSeanceId(null);
    loadData();
  }

  async function handleAddExo(e: React.FormEvent) {
    e.preventDefault();
    if (!newExoNom) return;
    setSavingExo(true);
    await supabase.from("exercices").insert({ nom: newExoNom });
    setSavingExo(false);
    setNewExoNom("");
    loadData();
  }

  async function handleDeleteExo(id: string) {
    await supabase.from("exercices").delete().eq("id", id);
    loadData();
  }

  // Grouper les séries par exercice pour l'affichage
  function groupSeriesByExo(series: SerieLog[]) {
    const groups: Record<string, SerieLog[]> = {};
    series.forEach((s) => {
      const key = s.nom_exercice || s.exercice_id || "Inconnu";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }

  const todaySeances = seances.filter((s) => s.date === today);

  return (
    <div className="px-4 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-[#12121A] border border-[#1E1E2E]">
          <ChevronLeft size={18} className="text-[#7A7A9A]" />
        </Link>
        <h1 className="text-lg font-bold">Salle de sport</h1>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-[#12121A] border border-[#1E1E2E] rounded-xl p-1">
        {(["seances", "bibliotheque"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-[#00D4AA] text-[#0A0A0F]"
                : "text-[#7A7A9A] hover:text-[#F0F0F5]"
            }`}
          >
            {t === "seances" ? "Séances" : "Exercices"}
          </button>
        ))}
      </div>

      {tab === "seances" && (
        <>
          {/* Nouvelle séance aujourd'hui */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F0F0F5]">Aujourd&apos;hui</h2>
            {todaySeances.length === 0 ? (
              <button
                onClick={creerSeance}
                disabled={creatingSeance}
                className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-3 rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {creatingSeance ? "Création..." : "Nouvelle séance"}
              </button>
            ) : (
              <div className="space-y-2">
                {todaySeances.map((s) => (
                  <div key={s.id} className="border border-[#00D4AA]/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#F0F0F5]">{s.nom}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#7A7A9A]">{s.series.length} séries</span>
                        <button
                          onClick={() => setActiveSeanceId(activeSeanceId === s.id ? null : s.id)}
                          className="text-xs text-[#00D4AA] font-medium"
                        >
                          {activeSeanceId === s.id ? "Fermer" : "Modifier"}
                        </button>
                      </div>
                    </div>
                    {activeSeanceId === s.id && (
                      <form onSubmit={handleAddSerie} className="space-y-2 pt-2 border-t border-[#1E1E2E]">
                        <select
                          value={selectedExercice}
                          onChange={(e) => setSelectedExercice(e.target.value)}
                          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA]"
                        >
                          <option value="">— Exercice libre —</option>
                          {exercices.map((ex) => (
                            <option key={ex.id} value={ex.id}>{ex.nom}</option>
                          ))}
                        </select>
                        {!selectedExercice && (
                          <input
                            type="text"
                            value={nomLibreExo}
                            onChange={(e) => setNomLibreExo(e.target.value)}
                            placeholder="Nom de l'exercice"
                            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
                          />
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            placeholder="Reps"
                            className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={poids}
                            onChange={(e) => setPoids(e.target.value)}
                            placeholder="Poids (kg)"
                            className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={addingSerie || (!selectedExercice && !nomLibreExo)}
                          className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-2 rounded-lg text-sm disabled:opacity-50"
                        >
                          {addingSerie ? "Ajout..." : "Ajouter série"}
                        </button>
                      </form>
                    )}
                  </div>
                ))}
                <button
                  onClick={creerSeance}
                  disabled={creatingSeance}
                  className="w-full border border-[#1E1E2E] text-[#7A7A9A] py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Nouvelle séance
                </button>
              </div>
            )}
          </div>

          {/* Historique séances */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">Historique</h2>
            {seances.filter((s) => s.date !== today).length === 0 ? (
              <p className="text-sm text-[#7A7A9A]">Aucune séance passée</p>
            ) : (
              seances
                .filter((s) => s.date !== today)
                .map((s) => {
                  const isExpanded = expandedSeance === s.id;
                  const groups = groupSeriesByExo(s.series);
                  return (
                    <div key={s.id} className="border border-[#1E1E2E] rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedSeance(isExpanded ? null : s.id)}
                        className="w-full flex items-center justify-between px-3 py-3 hover:bg-[#1E1E2E]/50 transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-[#F0F0F5]">
                            {format(parseISO(s.date), "EEEE d MMMM", { locale: fr })}
                          </p>
                          <p className="text-xs text-[#7A7A9A]">
                            {Object.keys(groups).length} exercices · {s.series.length} séries
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSeance(s.id); }}
                            className="p-1 rounded hover:bg-[#FF3B5C]/10 text-[#7A7A9A] hover:text-[#FF3B5C]"
                          >
                            <Trash2 size={13} />
                          </button>
                          {isExpanded ? <ChevronUp size={16} className="text-[#7A7A9A]" /> : <ChevronDown size={16} className="text-[#7A7A9A]" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-[#1E1E2E]">
                          {Object.entries(groups).map(([exo, series]) => (
                            <div key={exo} className="pt-2">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Dumbbell size={13} className="text-[#00D4AA]" />
                                <p className="text-xs font-semibold text-[#F0F0F5]">{exo}</p>
                              </div>
                              {series.map((serie) => (
                                <div key={serie.id} className="flex items-center justify-between py-1">
                                  <span className="text-xs text-[#7A7A9A]">
                                    Série {serie.serie_numero} · {serie.reps || "—"} reps · {serie.poids_kg || "—"} kg
                                  </span>
                                  <button
                                    onClick={() => handleDeleteSerie(serie.id)}
                                    className="p-1 text-[#7A7A9A] hover:text-[#FF3B5C]"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </>
      )}

      {tab === "bibliotheque" && (
        <>
          {/* Ajouter exercice */}
          <form onSubmit={handleAddExo} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F0F0F5]">Ajouter un exercice</h2>
            <input
              type="text"
              value={newExoNom}
              onChange={(e) => setNewExoNom(e.target.value)}
              placeholder="Ex: Développé couché"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
            />
            <button
              type="submit"
              disabled={savingExo || !newExoNom}
              className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {savingExo ? "Ajout..." : "Ajouter"}
            </button>
          </form>

          {/* Liste exercices */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-1">
            <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">
              Bibliothèque ({exercices.length})
            </h2>
            {exercices.length === 0 ? (
              <p className="text-sm text-[#7A7A9A]">Aucun exercice enregistré</p>
            ) : (
              exercices.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between py-2.5 border-b border-[#1E1E2E] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Dumbbell size={14} className="text-[#7A7A9A]" />
                    <p className="text-sm text-[#F0F0F5]">{ex.nom}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteExo(ex.id)}
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
