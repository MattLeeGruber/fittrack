# Déploiement FitTrack

## 1. Configurer Supabase

1. Ouvrir [Supabase](https://supabase.com) → votre projet `ezzlpvrvlmjsesbxobea`
2. Aller dans **SQL Editor** → **New Query**
3. Coller le contenu de `supabase/schema.sql` et exécuter
4. Aller dans **Settings** → **API** → copier :
   - `URL` = `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` = `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Variables d'environnement locales

Modifier `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://ezzlpvrvlmjsesbxobea.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre_clé_anon>
```

## 3. Déployer sur Vercel

1. Pousser le code sur GitHub :
```bash
git add .
git commit -m "Initial FitTrack app"
git push origin main
```

2. Aller sur [Vercel](https://vercel.com) → **Add New Project**
3. Importer le repo `MattLeeGruber/fittrack`
4. Dans **Environment Variables**, ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Cliquer **Deploy**

## 4. Ajouter à l'écran d'accueil Android

1. Ouvrir l'URL Vercel dans Chrome sur Android
2. Menu (3 points) → **Ajouter à l'écran d'accueil**
3. FitTrack apparaît comme une app native

## Structure des pages

| URL | Description |
|-----|-------------|
| `/` | Dashboard avec courbe poids, objectifs, récap du jour |
| `/poids` | Log poids quotidien + historique + graphique |
| `/pas` | Log pas quotidien + estimation calories |
| `/bouffe` | Log repas + bibliothèque aliments |
| `/salle` | Séances sport + exercices |
| `/objectifs` | Poids cible, pas quotidiens, séances/semaine |
| `/profil` | Âge, sexe, taille + BMR calculé |
