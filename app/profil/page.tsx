"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { calculBMR } from "@/lib/calculs";
import { ChevronLeft, Save, User } from "lucide-react";
import Link from "next/link";

export default function ProfilPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({
    objectif_pas_quotidien: 8000,
    objectif_seances_semaine: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("profile")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const { error } = await supabase.from("profile").upsert({
      id: 1,
      age: profile.age ?? null,
      sexe: profile.sexe ?? null,
      taille_cm: profile.taille_cm ?? null,
      poids_objectif_kg: profile.poids_objectif_kg ?? null,
      objectif_pas_quotidien: profile.objectif_pas_quotidien ?? 8000,
      objectif_seances_semaine: profile.objectif_seances_semaine ?? 3,
    });

    setSaving(false);
    if (!error) setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // BMR temps réel (on utilise poids objectif comme approximation)
  const bmrCalc =
    profile.age && profile.taille_cm && profile.poids_objectif_kg && profile.sexe
      ? calculBMR(
          profile.poids_objectif_kg,
          profile.taille_cm,
          profile.age,
          profile.sexe
        )
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#7A7A9A] text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-[#12121A] border border-[#1E1E2E]">
          <ChevronLeft size={18} className="text-[#7A7A9A]" />
        </Link>
        <h1 className="text-lg font-bold">Mon profil</h1>
      </div>

      {/* Avatar */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-[#12121A] border-2 border-[#00D4AA] flex items-center justify-center">
          <User size={32} className="text-[#00D4AA]" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Infos de base */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#F0F0F5]">Informations</h2>

          <div className="space-y-2">
            <label className="text-xs text-[#7A7A9A]">Âge</label>
            <input
              type="number"
              min="10"
              max="100"
              value={profile.age ?? ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  age: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="Ex: 30"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#7A7A9A]">Sexe</label>
            <div className="grid grid-cols-2 gap-2">
              {(["homme", "femme"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, sexe: s }))}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    profile.sexe === s
                      ? "bg-[#00D4AA] text-[#0A0A0F]"
                      : "bg-[#0A0A0F] border border-[#1E1E2E] text-[#7A7A9A]"
                  }`}
                >
                  {s === "homme" ? "👨 Homme" : "👩 Femme"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#7A7A9A]">Taille (cm)</label>
            <input
              type="number"
              min="100"
              max="250"
              value={profile.taille_cm ?? ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  taille_cm: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="Ex: 175"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
            />
          </div>
        </div>

        {/* BMR en temps réel */}
        {bmrCalc !== null && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
            <p className="text-xs text-[#7A7A9A] mb-1">Métabolisme de base (BMR)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#00D4AA]">{Math.round(bmrCalc)}</span>
              <span className="text-sm text-[#7A7A9A]">kcal / jour au repos</span>
            </div>
            <p className="text-xs text-[#7A7A9A] mt-2">
              Calculé avec la formule Mifflin-St Jeor · Basé sur le poids objectif
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {saving ? "Sauvegarde..." : saved ? "Sauvegardé ✓" : "Sauvegarder le profil"}
        </button>
      </form>

      <Link
        href="/objectifs"
        className="block text-center text-sm text-[#7A7A9A] pb-4"
      >
        → Configurer les objectifs
      </Link>
    </div>
  );
}
