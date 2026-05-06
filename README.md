# monday-public-explorer

App web pour rechercher dans les 6 boards Monday miroir d'Invest Malin (Postgres Railway, lecture seule, rafraîchi chaque nuit).

- **Front** : Vite + React 18 + TailwindCSS
- **API** : Vercel Functions (`api/search.js`) qui interrogent Postgres avec la lib `pg`
- **Sécurité** : aucun credential côté front, tout passe par la fonction serverless

## Setup local

```bash
npm install
cp .env.example .env       # puis remplis MONDAY_PUBLIC_DB_URL
```

Pour le dev local, on utilise `vercel dev` (et non `vite`) pour que le front et la fonction `api/search.js` tournent ensemble :

```bash
npm install -g vercel      # une seule fois si pas déjà installé
vercel dev
```

`vercel dev` charge automatiquement les variables du `.env` local.

## Build

```bash
npm run build              # bundle de prod dans dist/
npm run preview            # preview du bundle (front seul, sans /api)
```

## Variables d'environnement Vercel

Avant le déploiement, configure dans le dashboard Vercel (Settings → Environment Variables) :

| Variable | Valeur |
| --- | --- |
| `MONDAY_PUBLIC_DB_URL` | `postgresql://USER:PASSWORD@maglev.proxy.rlwy.net:31175/railway` |

À renseigner pour les environnements **Production**, **Preview** et **Development** selon les besoins.

## Endpoint API

`GET /api/search?q=<terme>` (terme : 2 caractères minimum)

Retourne :

```json
{
  "query": "cardin",
  "results": [
    {
      "view": "mv_clients_proprietaires",
      "label": "Clients propriétaires",
      "count": 3,
      "items": [
        { "item_id": "...", "item_name": "...", "group_title": "...", "monday_updated_at": "..." }
      ]
    }
  ]
}
```

Recherche avec `ILIKE %term%` sur `item_name`, max 20 résultats par vue, triés par `monday_updated_at` desc.

## Vues exposées

- `mv_clients_proprietaires` → Clients propriétaires
- `mv_creation_entreprise` → Création entreprise
- `mv_livraison_conciergeries` → Livraison conciergeries
- `mv_ventes_conciergeries` → Ventes conciergeries
- `mv_prospects_inactifs_prospecteurs` → Prospects inactifs
- `mv_chasse_de_biens` → Chasse de biens

## Structure

```
api/search.js              Vercel Function (Postgres)
src/
  components/
    SearchBar.jsx          input + debounce 400ms
    ResultsList.jsx        groupage par board
    ResultCard.jsx         carte d'un item
  App.jsx                  state + fetch
  main.jsx                 entrée React
  index.css                directives Tailwind
index.html
vite.config.js
tailwind.config.js
postcss.config.js
vercel.json
```
