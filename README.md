# EliteFit

Site web de la salle de sport **EliteFit**, ouverte 24 h/24 et 7 j/7 : présentation de la salle, formules en FCFA, coachs, programmes, galerie, réservation d'une séance d'essai gratuite, formulaire de contact et espace d'administration.

| Dossier | Contenu | Stack |
| --- | --- | --- |
| `client/` | Site public et espace admin | Angular 22, TypeScript, SCSS |
| `server/` | API REST | Node.js 24, Express 5, TypeScript, MySQL 8 |

## Démarrage en local

Prérequis : Node.js 24 (ou 22.22.3+), npm, et MySQL 8 ou MariaDB 10.4+ (XAMPP / WAMP conviennent).

### 1. API

```bash
cd server
npm install
cp .env.example .env          # renseigner DB_USER, DB_PASSWORD, JWT_SECRET…
npm run db:schema             # crée la base et les tables
npm run db:seed               # formules, coachs, programmes, galerie, créneaux
npm run create-admin          # demande l'e-mail et le mot de passe de l'admin
npm run dev                   # http://localhost:3000/api/health
```

La base `elitefit` et ses tables sont créées par `npm run db:schema` : rien à faire dans phpMyAdmin. Avec XAMPP ou WAMP, mettre `DB_USER=root` et laisser `DB_PASSWORD=` vide. Autre possibilité : créer la base `elitefit` dans phpMyAdmin, puis importer `server/database/schema.sql` et `server/database/seed.sql` (onglet Importer).

Sans `SMTP_HOST`, les e-mails de confirmation sont affichés dans la console de l'API.

### 2. Site

```bash
cd client
npm install
npm start                     # http://localhost:4200
```

L'espace admin est sur http://localhost:4200/admin.

Les scripts npm du client utilisent le compilateur Sass en JavaScript (`NG_BUILD_SASS_EMBEDDED=0`), car le compilateur natif exige macOS 14. Lancez donc le site avec `npm start` et `npm run build`, pas avec `ng serve` ou `ng build` directement.

## Scripts

| Dossier | Commande | Effet |
| --- | --- | --- |
| server | `npm run dev` | API avec rechargement automatique |
| server | `npm test` | Tests (Vitest + Supertest, sans base réelle) |
| server | `npm run build` / `npm start` | Compilation puis démarrage en production |
| server | `npm run db:schema` / `npm run db:seed` | Création des tables / données de démonstration |
| server | `npm run create-admin` | Crée ou met à jour un administrateur |
| client | `npm start` | Serveur de développement |
| client | `npm test` | Tests unitaires |
| client | `npm run build` | Build de production dans `client/dist/client/browser` |

## API

Toutes les routes sont préfixées par `/api`. Les routes `/api/admin/*` exigent `Authorization: Bearer <jwt>`.

| Méthode | Route | Accès |
| --- | --- | --- |
| GET | `/health` | Public |
| GET | `/plans`, `/trainers`, `/programs?featured=true`, `/testimonials?limit=3`, `/gallery?category=events` | Public |
| GET | `/bookings/availability?date=AAAA-MM-JJ` | Public |
| POST | `/bookings`, `/messages` | Public (5 envois / 15 min / IP) |
| POST | `/auth/login` | Public |
| GET / PATCH | `/admin/bookings`, `/admin/bookings/:id` | Admin |
| GET / PATCH | `/admin/messages`, `/admin/messages/:id` | Admin |

Règles de réservation : date entre demain et J+30, créneaux d'une heure (24 h/24), 3 places par créneau, un seul essai en cours par e-mail.

## Déploiement

1. **Base MySQL** (Railway ou Aiven) : renseigner les `DB_*` dans `server/.env`, puis `npm run db:schema`, `npm run db:seed` et `npm run create-admin`.
2. **API** (Render ou Railway) : Root Directory `server`, build `npm ci && npm run build`, start `npm start`. Reporter toutes les variables de `.env.example` avec `NODE_ENV=production`.
3. **Site** (Vercel) : Root Directory `client`, build `npm run build`, dossier de sortie `dist/client/browser`. Mettre l'URL publique de l'API dans `client/src/environments/environment.ts`.
4. Mettre l'URL Vercel dans `CORS_ORIGIN` côté API.

## Modifier les informations de la salle

Les informations actuelles sont provisoires. Pour les changer :

| Quoi | Fichier |
| --- | --- |
| Adresse, téléphone, WhatsApp, e-mail, réseaux sociaux | `client/src/app/core/gym-info.ts` |
| Prix et avantages des formules, coachs, programmes, témoignages, photos de la galerie | `server/database/seed.sql` (puis `npm run db:schema && npm run db:seed`) |
| Photos de l'accueil (bannière et présentation) | `client/src/app/pages/home/home.scss` et `home.html` |

Les photos viennent d'Unsplash (libres de droits). Pour utiliser vos propres photos, placez-les dans `client/public/images/` et remplacez les URL par `/images/nom-du-fichier.webp`. Une image introuvable est remplacée automatiquement par un visuel EliteFit.
