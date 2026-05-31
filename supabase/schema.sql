-- Profil utilisateur (une seule ligne)
create table profile (
  id integer primary key default 1,
  age integer,
  sexe text check (sexe in ('homme', 'femme')),
  taille_cm integer,
  poids_objectif_kg numeric(5,1),
  objectif_pas_quotidien integer default 8000,
  objectif_seances_semaine integer default 3
);

-- Log poids quotidien
create table poids_log (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  poids_kg numeric(5,1) not null,
  created_at timestamptz default now()
);

-- Log pas quotidien
create table pas_log (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  nb_pas integer not null,
  type_journee text check (type_journee in ('bureau', 'active')) default 'bureau',
  created_at timestamptz default now()
);

-- Bibliothèque d'aliments
create table aliments (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  calories_par_portion numeric(6,1) not null,
  proteines_par_portion numeric(5,1) not null,
  created_at timestamptz default now()
);

-- Log repas quotidien
create table repas_log (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  aliment_id uuid references aliments(id) on delete set null,
  nom_libre text,
  quantite_g numeric(6,1) default 100,
  calories numeric(6,1) not null,
  proteines numeric(5,1) not null,
  created_at timestamptz default now()
);

-- Bibliothèque d'exercices
create table exercices (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_at timestamptz default now()
);

-- Séances sport
create table seances (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  nom text,
  created_at timestamptz default now()
);

-- Séries dans une séance
create table series_log (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid references seances(id) on delete cascade,
  exercice_id uuid references exercices(id) on delete set null,
  nom_exercice text,
  serie_numero integer,
  reps integer,
  poids_kg numeric(5,1),
  created_at timestamptz default now()
);
