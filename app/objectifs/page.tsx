"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";

export default function ObjectifsPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
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

    const { error } = await supabase
      .from("profile")
      .upsert({
        id: 1,
        poids_objectif_kg: profile.poids_objectif_kg ?? null,
        objectif_pas_quotidien: profile.objectif_pas_quotidien ?? 8000,
        objectif_seances_semaine: profile.objectif_seances_semaine ?? 3,
        // preserve existing profile fields
        age: profile.age ?? null,
        sexe: profile.sexe ?? null,
        taille_cm: profile.taille_cm ?? null,
      });

    setSaving(false);
    if (!error) setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

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
        <h1 className="text-lg font-bold">Objectifs</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Objectif poids */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#F0F0F5]">🎯 Poids cible</h2>
          <div className="space-y-2">
            <label className="text-xs text-[#7A7A9A]">Poids objectif (kg)</label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={profile.poids_objectif_kg ?? ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  poids_objectif_kg: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="Ex: 75.0"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA] placeholder-[#7A7A9A]"
            />
          </div>
        </div>

        {/* Objectif activité */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#F0F0F5]">🏃 Activité quotidienne</h2>
          <div className="space-y-2">
            <label className="text-xs text-[#7A7A9A]">Objectif pas / jour</label>
            <input
              type="number"
              min="1000"
              max="50000"
              step="500"
              value={profile.objectif_pas_quotidien ?? 8000}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  objectif_pas_quotidien: Number(e.target.value),
                }))
              }
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#00D4AA]"
            />
            <p className="text-xs text-[#7A7A9A]">Recommandé : 8 000 à 10 000 pas</p>
          </div>
        </div>

        {/* Objectif séances */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#F0F0F5]">🏋️ Entraînement</h2>
          <div className="space-y-2">
            <label className="text-xs text-[#7A7A9A]">Séances / semaine</label>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setProfile((p) => ({ ...p, objectif_seances_semaine: n }))
                  }
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    profile.objectif_seances_semaine === n
                      ? "bg-[#00D4AA] text-[#0A0A0F]"
                      : "bg-[#0A0A0F] border border-[#1E1E2E] text-[#7A7A9A]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sauvegarde */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#00D4AA] text-[#0A0A0F] font-semibold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {saving ? "Sauvegarde..." : saved ? "Sauvegardé ✓" : "Sauvegarder"}
        </button>
      </form>

      {/* Infos */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-semibold text-[#F0F0F5]">ℹ️ Rappels</h2>
        <p className="text-xs text-[#7A7A9A] leading-relaxed">
          Les calories brûlées sont calculées à partir de votre profil (âge, taille, poids).
          Configurez votre profil pour des calculs précis.
        </p>
        <Link href="/profil" className="text-xs text-[#00D4AA]">
          → Configurer le profil
        </Link>
      </div>
    </div>
  );
}
