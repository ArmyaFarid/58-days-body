# Programme 58 jours

Application web **mobile-first** pour suivre un programme d'entraînement maison de 58 jours (barre de traction + bandes + poids du corps). Mono-utilisateur, en français, installable en PWA.

## Fonctionnalités

- **Tableau de bord** : Jour X/58 + phase calculée automatiquement, séance du jour, carte « À faire aujourd'hui » (pesée, créatine, habitudes), tendance du poids.
- **Séance du jour** : exercices du split (séries × reps, bande, notes), logging rapide pré-rempli avec la dernière perf, chronomètre de repos (60/90/120 s), bouton « Comment ? » (lexique + illustration + lien YouTube), techniques d'intensification en Bloc 2, complétion.
- **Suivi** : poids (graphique + moyenne hebdo + suggestions kcal), photos (upload compressé, galerie, comparaison jour 1 vs dernière), mensurations, historique des perfs par exercice avec jalon « tractions strictes ».
- **Habitudes** : checklist quotidienne + streaks (créatine, calories, protéines, sommeil).
- **Programme & Équipement** : nutrition, épicerie, suppléments, lexique complet, journée type.
- **Export JSON** de toutes les données.

## Stack technique

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** + shadcn/ui (thème sombre)
- **Drizzle ORM** + **Postgres** (Vercel Postgres / Neon)
- **Vercel Blob** pour les photos (compression côté client)
- Authentification mono-utilisateur : mot de passe hashé (bcrypt) en variable d'env, session JWT (jose) en cookie httpOnly, protection via `proxy.ts`

---

## Développement local

### 1. Installer

```bash
npm install
```

### 2. Base de données locale (Docker)

```bash
docker run -d --name sport58-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=sport58 -p 5433:5432 postgres:16-alpine
```

### 3. Variables d'environnement

Copie `.env.example` en `.env.local` et remplis-le :

```bash
cp .env.example .env.local
```

- Génère le hash du mot de passe :
  ```bash
  npm run hash-password "TonMotDePasse"
  ```
  Colle le résultat dans `AUTH_PASSWORD_HASH_B64`.
- Génère un secret de session :
  ```bash
  openssl rand -base64 32
  ```
  Colle-le dans `AUTH_SECRET`.
- Pour le Docker local : `DATABASE_URL=postgres://postgres:dev@localhost:5433/sport58`

### 4. Créer les tables et lancer

```bash
npm run db:push   # crée le schéma dans la base
npm run dev
```

Ouvre http://localhost:3000, connecte-toi, puis choisis ta date de début.

---

## Déploiement sur Vercel (plan gratuit)

### 1. Pousser le code sur GitHub

```bash
git remote add origin <ton-repo-github>
git push -u origin main   # ou la branche de ton choix
```

### 2. Importer le projet dans Vercel

Sur [vercel.com](https://vercel.com) → **Add New → Project** → importe ton repo GitHub. Framework détecté : Next.js. (Le premier build peut échouer tant que les variables ci-dessous ne sont pas posées — c'est normal, on redéploiera.)

### 3. Base de données Postgres

Dans le projet Vercel → onglet **Storage → Create Database → Postgres (Neon)** → connecte-la au projet. Vercel injecte automatiquement `DATABASE_URL` (et variantes) dans les variables d'environnement.

> Vérifie dans **Settings → Environment Variables** que `DATABASE_URL` existe bien. Si seule `POSTGRES_URL` est présente, ajoute `DATABASE_URL` avec la même valeur.

### 4. Stockage des photos (Blob)

**Storage → Create Database → Blob** → connecte-le au projet. Vercel injecte `BLOB_READ_WRITE_TOKEN` automatiquement.

### 5. Variables d'authentification

**Settings → Environment Variables** → ajoute (pour tous les environnements) :

| Variable | Valeur |
|---|---|
| `AUTH_USERNAME` | ton identifiant |
| `AUTH_PASSWORD_HASH_B64` | sortie de `npm run hash-password "..."` |
| `AUTH_SECRET` | sortie de `openssl rand -base64 32` |

### 6. Créer les tables sur la base de production

Depuis ton dossier local, récupère les variables de prod et pousse le schéma :

```bash
npm i -g vercel      # si pas déjà installé
vercel link          # relie le dossier au projet Vercel
vercel env pull .env.production.local
DATABASE_URL="$(grep '^DATABASE_URL=' .env.production.local | cut -d= -f2- | tr -d '"')" npm run db:push
```

(Ou plus simplement : copie la valeur de `DATABASE_URL` de prod dans `.env.local` le temps de lancer `npm run db:push`, puis remets celle du Docker local.)

### 7. Redéployer

**Deployments → Redeploy** (ou `git push`). L'app est en ligne.

---

## Installer sur le téléphone (PWA)

- **iPhone (Safari)** : ouvre le site → bouton Partager → « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮ → « Installer l'application ».

## Sauvegarde

Page **Programme → Exporter mes données** (ou `GET /api/export`) télécharge tout l'historique en JSON. À faire de temps en temps pour ne rien perdre.

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` / `start` | build / serveur de production |
| `npm run hash-password "..."` | génère le hash du mot de passe |
| `npm run db:push` | applique le schéma à la base |
| `npm run db:studio` | interface Drizzle Studio |
