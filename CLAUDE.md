# Monday Public Explorer

## Pourquoi ce projet existe

Invest Malin et Letahost utilisent Monday comme source de vérité pour ~6 boards opérationnels (clients, livraisons, ventes, prospects, etc.). Loïc (le boss) a mis en place une base Postgres Railway en lecture seule (`monday_public`) qui miroite ces boards chaque nuit. Cette infra est partagée pour tous les outils internes et n'est pas du ressort de ce projet.

Ce projet construit une **couche d'accès humaine et programmatique** au-dessus de cette base : une UI de recherche pour les collègues non-techs, et à terme une API pour les outils internes (Make, n8n, scripts).

L'enjeu réel : Monday est lent à interroger via son API, casse-pieds à matcher (typos, miroirs manuels), et inadapté au croisement multi-boards. Postgres résout tout ça en quelques millisecondes.

## Vision et périmètre

**Phase actuelle** : exploration personnelle. C'est un outil que Julien construit pour lui-même, en marge de ses projets prioritaires (Fiche Logement, Mon Équipe IA, Dashboard NPS, RDC Matching). Aucune deadline, aucun engagement de roadmap. Le projet sert aussi de terrain d'apprentissage technique (React, Vite, Vercel Functions, Postgres). C'est un terrain de jeu, un sandbox, un bac à sable, un terrain d'expérimentation. Donc pas de pression, pas d'urgence, pas de stress.

**Trajectoire envisagée, à itérer selon ce qui ressort** :
1. V1 (en cours) : outil perso de recherche transverse en local
2. V1.5 : ajout d'auth + déploiement, ouverture éventuelle à Victoria et Olga pour faire des recherches simples sans avoir à fouiller dans Monday
3. V2 hypothétique : exposition d'endpoints API pour les automatisations Make/n8n internes (résoudre les soucis de matching récurrents)

Pas de communication interne tant que le projet n'a pas trouvé sa valeur. Si ça intéresse les collègues quand ils le verront, tant mieux. Sinon, ça reste un outil perso utile.

## Doctrine

### Maintenance
Julien est seul sur ce projet. Loïc gère l'infra Postgres Railway (côté serveur, miroir, droits utilisateurs) mais ne contribue pas au code de cet outil.

### Sécurité
- Aucune connection string, aucun token, aucun credential dans le code committé
- Tout passe par variables d'environnement (`.env` en local, vars Vercel en prod le jour où on déploie)
- L'API ne sera **jamais déployée publiquement sans auth**. La règle est stricte : si déploiement, alors auth en place avant.
- La base étant en lecture seule côté serveur, le pire scénario d'une faille est une exfiltration de données métier internes. C'est déjà beaucoup, donc vigilance sur l'auth dès qu'on sort du localhost.

### Architecture
- Vite + React + TailwindCSS pour le front
- Vercel Functions (dossier `api/`) pour la couche serveur, lib `pg` pour Postgres
- Pas de framework lourd côté front, pas de state manager externe
- Pas de Next.js (Vite est suffisant pour le périmètre)
- Pool Postgres instancié au niveau module dans les fonctions serverless (un cold start = un pool)
- Parsing manuel de l'URL Postgres avec `new URL()` pour éviter que `pg-connection-string` réinjecte `sslmode=require → verify-full` et casse la connexion (le proxy Railway utilise un cert auto-signé, on doit forcer `rejectUnauthorized: false`)

### Données
- 6 vues matérialisées dans `monday_public` : `mv_clients_proprietaires`, `mv_creation_entreprise`, `mv_livraison_conciergeries`, `mv_ventes_conciergeries`, `mv_prospects_inactifs_prospecteurs`, `mv_chasse_de_biens`
- Refresh nocturne à 3h UTC. Donc latence J-1 sur les données.
- Toutes les colonnes Monday sont stockées en `text`. Cast défensif obligatoire avec `NULLIF(col, '')::type` avant tout cast date ou numeric.
- 5 colonnes communes typées nativement : `item_id`, `item_name`, `group_title`, `monday_updated_at`, `synced_at`
- Convention de nommage des colonnes : titre Monday slugifié en `snake_case` ASCII

### Limites côté Postgres (imposées par Loïc)
- Lecture seule (`SELECT` uniquement)
- `statement_timeout = 30s`
- Max 10 connexions simultanées par user
- Schéma `monday_public` uniquement visible

### Bonnes pratiques de dev
- Step-by-step strict : une étape, validation, étape suivante. Pas d'enchaînement non sollicité.
- Pas de quick fix, on anticipe les cas limites
- Pas de hallucination : si une info manque, on demande ou on vérifie
- Cadrer le scope avant de coder. Pas de fonctionnalité ajoutée sur un coup de tête.
- Le projet doit rester lisible et reprenable en 1h après 6 mois sans y toucher

## Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Front | Vite + React 18 + TailwindCSS | Léger, rapide, pas de surcouche inutile |
| Icônes | lucide-react | Standard, compatible avec les conventions de design |
| API | Vercel Functions (`api/*.js`) | Serverless gratuit (jusqu'aux limites du plan Hobby) |
| Postgres | lib `pg` | Éprouvée, simple, fait le job |
| Hébergement | Vercel Hobby (à terme) | Compte personnel uniquement, l'orga GitHub Invest Malin ne supporte pas Vercel Hobby |
| Repo Git | github.com/INVESTMALIN/monday-public-explorer | Privé, sous l'orga INVEST-MALIN |

## Ce qu'il y a aujourd'hui

- API : un endpoint `GET /api/search?q=<terme>` qui interroge les 6 vues en parallèle avec ILIKE sur `item_name`, retourne les hits groupés par board, max 20 par board, triés par `monday_updated_at DESC`
- UI : page unique avec searchbar, debounce 400ms, dark mode + light mode, états loading/empty/no-results/error, résultats organisés par board avec compteur
- Pas d'auth
- Pas de déploiement (uniquement local via `vercel dev`)

## Ce qui n'existe pas encore

À ne pas implémenter sans qu'on en ait reparlé ensemble :
- Auth (token, OAuth, magic link, peu importe le mécanisme)
- Recherche par autres colonnes que `item_name` (email, téléphone, numéro de bien)
- Page détail d'un item (toutes les colonnes d'une ligne Monday)
- Liens directs vers Monday depuis les résultats
- Filtres (par board, par groupe, par date)
- Endpoints API spécialisés pour usages externes (Make, n8n)
- Déploiement public

## Pour démarrer en local

```bash
npm install
vercel dev   # http://localhost:3000
```

Variable d'environnement requise dans `.env` :
```
MONDAY_PUBLIC_DB_URL=postgresql://reader_internal:<pwd>@maglev.proxy.rlwy.net:31175/railway?sslmode=require
```

(Récupérer le mot de passe auprès de Greg ou Loïc, ne jamais le committer.)