// BMR Mifflin-St Jeor
export function calculBMR(
  poids: number,
  taille: number,
  age: number,
  sexe: "homme" | "femme"
): number {
  const base = 10 * poids + 6.25 * taille - 5 * age;
  return sexe === "homme" ? base + 5 : base - 161;
}

// Calories brûlées totales dans la journée
export function calculCaloriesBrulees(
  bmr: number,
  typeJournee: "bureau" | "active",
  nbPas: number,
  poidsKg: number
): number {
  const facteur = typeJournee === "bureau" ? 1.2 : 1.4;
  const caloriesPas = nbPas * 0.0004 * poidsKg;
  return Math.round(bmr * facteur + caloriesPas);
}

// % d'effort restant vers l'objectif de poids (0-100)
export function calculEffortRestant(
  poidsActuel: number,
  poidsDepart: number,
  poidsObjectif: number
): number {
  if (poidsDepart === poidsObjectif) return 100;
  const total = Math.abs(poidsDepart - poidsObjectif);
  const fait = Math.abs(poidsDepart - poidsActuel);
  const pct = (fait / total) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}
