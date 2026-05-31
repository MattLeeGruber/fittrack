import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: number;
  age: number | null;
  sexe: "homme" | "femme" | null;
  taille_cm: number | null;
  poids_objectif_kg: number | null;
  objectif_pas_quotidien: number;
  objectif_seances_semaine: number;
};

export type PoidsLog = {
  id: string;
  date: string;
  poids_kg: number;
  created_at: string;
};

export type PasLog = {
  id: string;
  date: string;
  nb_pas: number;
  type_journee: "bureau" | "active";
  created_at: string;
};

export type Aliment = {
  id: string;
  nom: string;
  calories_par_portion: number;
  proteines_par_portion: number;
  created_at: string;
};

export type RepasLog = {
  id: string;
  date: string;
  aliment_id: string | null;
  nom_libre: string | null;
  quantite_g: number;
  calories: number;
  proteines: number;
  created_at: string;
};

export type Exercice = {
  id: string;
  nom: string;
  created_at: string;
};

export type Seance = {
  id: string;
  date: string;
  nom: string | null;
  created_at: string;
};

export type SerieLog = {
  id: string;
  seance_id: string;
  exercice_id: string | null;
  nom_exercice: string | null;
  serie_numero: number | null;
  reps: number | null;
  poids_kg: number | null;
  created_at: string;
};
