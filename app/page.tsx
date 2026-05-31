"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, PoidsLog, PasLog, RepasLog, Seance } from "@/lib/supabase";
import { calculBMR, calculCaloriesBrulees, calculEffortRestant } from "@/lib/calculs";
import { todayLocal } from "@/lib/date";
import WeightChart from "@/components/WeightChart";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import { Settings } from "lucide-react";

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [poidsLogs, setPoidsLogs] = useState<PoidsLog[]>([]);
  const [pasLog, setPasLog] = useState<PasLog | null>(null);
  const [repasLogs, setRepasLogs] = useState<RepasLog[]>([]);
  const [seance, setSeance] = useState<Seance | null>(null);
  const [loading, setLoading] = useState(true);

  const today = todayLocal();

  useEffect(() => {
    async function load() {
      const [profileRes, poidsRes, pasRes, repasRes, seanceRes] = await Promise.all([
        supabase.from("profile").select("*").eq("id", 1).single(),
        supabase.from("poids_log").select("*").order("date", { ascending: true }),
        supabase.from("pas_log").select("*").eq("date", today).single(),
        supabase.from("repas_log").select("*").eq("date", today),
        supabase.from("seances").select("*").eq("date", today).single(),
      ]);

      setProfile(profileRes.data);
      setPoidsLogs(poidsRes.data || []);
      setPasLog(pasRes.data);
      setRepasLogs(repasRes.data || []);
      setSeance(seanceRes.data);
      setLoading(false);
    }
    load();
  }, [today]);

  const poidsActuel = poidsLogs.length > 0 ? poidsLogs[poidsLogs.length - 1].poids_kg : null;
  const poidsDepart = poidsLogs.length > 0 ? poidsLogs[0].poids_kg : null;

  const totalCaloriesConsommees = repasLogs.reduce((s, r) => s + r.calories, 0);
  const totalProteines = repasLogs.reduce((s, r) => s + r.proteines, 0);

  let caloriesBrulees = 0;
  if (profile?.age && profile?.taille_cm && poidsActuel && profile?.sexe) {
    const bmr = calculBMR(poidsActuel, profile.taille_cm, profile.age, profile.sexe);
    caloriesBrulees = calculCaloriesBrulees(
      bmr,
      pasLog?.type_journee || "bureau",
      pasLog?.nb_pas || 0,
      poidsActuel
    );
  }

  const caloriesNettes = totalCaloriesConsommees - caloriesBrulees;
  const effortRestant =
    poidsActuel && poidsDepart && profile?.poids_objectif_kg
      ? calculEffortRestant(poidsActuel, poidsDepart, profile.poids_objectif_kg)
      : 0;

  const ecartPoids =
    poidsActuel && profile?.poids_objectif_kg
      ? (poidsActuel - profile.poids_objectif_kg).toFixed(1)
      : null;

  const progressColor =
    effortRestant > 70 ? "#00D4AA" : effortRestant > 40 ? "#FF6B35" : "#FF3B5C";

  const caloriesColor: "green" | "orange" | "red" | "default" =
    caloriesNettes < -500
      ? "red"
      : caloriesNettes < 0
      ? "green"
      : caloriesNettes < 200
      ? "orange"
      : "red";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#7A7A9A] text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#F0F0F5]">FitTrack</h1>
          <p className="text-xs text-[#7A7A9A]">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Link
          href="/profil"
          className="p-2 rounded-xl bg-[#12121A] border border-[#1E1E2E]"
        >
          <Settings size={18} className="text-[#7A7A9A]" />
        </Link>
      </div>

      {/* Courbe de poids */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#F0F0F5]">Évolution du poids</h2>
          {poidsActuel && (
            <span className="text-sm font-bold text-[#00D4AA]">{poidsActuel} kg</span>
          )}
        </div>
        <WeightChart data={poidsLogs} objectif={profile?.poids_objectif_kg} />
      </div>

      {/* Objectif poids */}
      {profile?.poids_objectif_kg && poidsActuel && (
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F0F0F5]">Objectif poids</h2>
            <span className="text-xs text-[#7A7A9A]">{effortRestant}% accompli</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-2xl font-bold text-[#F0F0F5]">{poidsActuel}</span>
              <span className="text-[#7A7A9A] ml-1">kg</span>
            </div>
            <div className="text-right">
              <span className="text-[#7A7A9A] text-xs">Cible</span>
              <div className="font-semibold text-[#F0F0F5]">{profile.poids_objectif_kg} kg</div>
            </div>
          </div>
          <ProgressBar value={effortRestant} color={progressColor} />
          {ecartPoids !== null && (
            <p className="text-xs text-[#7A7A9A]">
              {Number(ecartPoids) > 0 ? "+" : ""}
              {ecartPoids} kg de l&apos;objectif (
              {Math.abs((Number(ecartPoids) / profile.poids_objectif_kg) * 100).toFixed(1)}%)
            </p>
          )}
        </div>
      )}

      {/* Récap du jour */}
      <div>
        <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">Aujourd&apos;hui</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="🔥"
            label="Calories nettes"
            value={`${caloriesNettes >= 0 ? "+" : ""}${Math.round(caloriesNettes)} kcal`}
            sub={`${Math.round(totalCaloriesConsommees)} consommées`}
            color={caloriesColor}
          />
          <StatCard
            icon="💪"
            label="Protéines"
            value={`${Math.round(totalProteines)} g`}
            sub="du jour"
            color={totalProteines >= 100 ? "green" : "default"}
          />
          <StatCard
            icon="👣"
            label="Pas"
            value={pasLog?.nb_pas?.toLocaleString("fr-FR") || "0"}
            sub={`/ ${profile?.objectif_pas_quotidien?.toLocaleString("fr-FR") || "8 000"}`}
            color={
              pasLog?.nb_pas
                ? pasLog.nb_pas >= (profile?.objectif_pas_quotidien || 8000)
                  ? "green"
                  : "orange"
                : "default"
            }
          />
          <StatCard
            icon="🏋️"
            label="Séance"
            value={seance ? "✓ Fait" : "—"}
            sub={seance?.nom || (seance ? "Séance enregistrée" : "Pas encore")}
            color={seance ? "green" : "default"}
          />
        </div>
      </div>

      {/* Liens rapides */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">Enregistrer</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: "/poids", label: "Poids", icon: "⚖️" },
            { href: "/pas", label: "Pas", icon: "👣" },
            { href: "/bouffe", label: "Repas", icon: "🍽️" },
            { href: "/salle", label: "Séance", icon: "💪" },
            { href: "/objectifs", label: "Objectifs", icon: "🎯" },
            { href: "/profil", label: "Profil", icon: "👤" },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] hover:border-[#00D4AA] transition-colors"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs text-[#7A7A9A]">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
