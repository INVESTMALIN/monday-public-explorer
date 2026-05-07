# Accès Postgres en lecture seule — `monday_public`

Notice destinée aux développeurs externes (équipe Invest Malin, prestataires) et aux agents IA (Claude & co) qui doivent connecter une application en **lecture seule** à un sous-ensemble miroir des boards Monday, exposé via Postgres Railway.

> Cette notice est auto-suffisante : elle peut être copiée-collée telle quelle à un développeur ou à un agent IA pour qu'il code son intégration sans contexte additionnel.

---

## 1. TL;DR

- Une base **Postgres Railway** expose un schéma `monday_public` contenant **6 vues matérialisées** miroir des boards Monday d'Invest Malin.
- Accès **read-only** via une paire user/password fournie par Loïc (1 paire par application).
- Connexion standard Postgres + SSL requis : `postgresql://<user>:<pwd>@maglev.proxy.rlwy.net:31175/railway?sslmode=require`.
- Données rafraîchies **automatiquement chaque nuit à 3h UTC**. Aucune action manuelle requise côté client.
- Toutes les colonnes Monday sont stockées en `text`. Pour filtrer/trier sur date ou nombre, **caster explicitement** (`::date`, `::numeric`) avec `NULLIF(col, '')` pour gérer les lignes vides.
- Limites : `statement_timeout = 30s`, max 10 connexions simultanées par user, schéma `monday_public` uniquement (le reste de la DB est invisible).

---

## 2. Connexion

| Paramètre  | Valeur                              |
|------------|-------------------------------------|
| Host       | `maglev.proxy.rlwy.net`             |
| Port       | `31175`                             |
| Database   | `railway`                           |
| SSL        | requis (`sslmode=require`)          |
| Schema     | `monday_public`                     |
| User / Pwd | fournis par Loïc (1 paire par app)  |

**Connection string template** :

```
postgresql://<user>:<password>@maglev.proxy.rlwy.net:31175/railway?sslmode=require
```

**Note SSL importante (lib `pg` Node ≥ 8)** : le proxy public Railway utilise un certificat auto-signé. Si vous utilisez la lib `pg` Node, il faut désactiver la vérification du certificat dans la config du Pool/Client :

```javascript
new pg.Pool({
  connectionString: process.env.MONDAY_PUBLIC_DB_URL,
  ssl: { rejectUnauthorized: false },  // <- requis avec le proxy Railway
});
```

Pour `psycopg2` Python ou `psql`, `?sslmode=require` suffit. Pour la lib JDBC, `sslmode=require&sslfactory=org.postgresql.ssl.NonValidatingFactory`.

**Obtenir des credentials** :

- **Apps internes Invest Malin** : un user partagé `reader_internal` est mis à disposition. Loïc fournit la connection string complète une seule fois — elle peut être utilisée par toutes les apps internes.
- **Prestataire externe ou besoin d'isolation** (révocation ciblée, env de test, debugging d'une app spécifique) : Loïc peut créer un user dédié `reader_<nom_app>` à la demande, avec son propre mot de passe. Voir `npm run monday-public:create-reader -- --name=app_xxx`.

---

## 3. Schéma & vues disponibles

Toutes les vues sont dans le schéma `monday_public`. Elles sont matérialisées (rapides en lecture, pas de calcul à la requête).

| Vue                                           | Board Monday source              | Lignes (~) | Colonnes (~) |
|-----------------------------------------------|----------------------------------|-----------:|-------------:|
| `mv_clients_proprietaires`                    | Clients propriétaires            |       2000 |          219 |
| `mv_creation_entreprise`                      | Création entreprise              |        700 |           94 |
| `mv_livraison_conciergeries`                  | Livraison Conciergeries          |        600 |          192 |
| `mv_ventes_conciergeries`                     | Ventes Conciergeries             |       4500 |           58 |
| `mv_prospects_inactifs_prospecteurs`          | Prospects Inactifs — Prospecteurs|      46000 |           25 |
| `mv_chasse_de_biens`                          | Chasse de biens                  |       7000 |           81 |

Pour lister les colonnes d'une vue donnée :

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'monday_public'
  AND table_name = 'mv_clients_proprietaires'
ORDER BY ordinal_position;
```

---

## 4. Colonnes communes à toutes les vues

| Colonne             | Type          | Description                                          |
|---------------------|---------------|------------------------------------------------------|
| `item_id`           | `bigint` (PK) | Id Monday de la ligne (stable).                      |
| `item_name`         | `text`        | Nom de la ligne (nom client / prospect).             |
| `group_title`       | `text`        | Groupe Monday (ex "Fin d'accompagnement", "Perdus"). |
| `monday_updated_at` | `timestamptz` | Dernière modification côté Monday.                   |
| `synced_at`         | `timestamptz` | Date du dernier mirroring vers Postgres.             |

Ces 5 colonnes sont **typées nativement** (pas de cast nécessaire).

---

## 5. Colonnes spécifiques Monday

### Convention de nommage

Chaque colonne Monday devient une colonne Postgres dont le nom est le **titre Monday slugifié en `snake_case` ASCII** :

| Titre Monday               | Colonne Postgres            |
|----------------------------|-----------------------------|
| `Date Signature Promesse`  | `date_signature_promesse`   |
| `Numéro de bien`           | `numero_de_bien`            |
| `Téléphone (mobile)`       | `telephone_mobile`          |
| `Email pro`                | `email_pro`                 |
| `Statut RDV`               | `statut_rdv`                |

Règles : tout en minuscules, accents retirés, espaces et ponctuation remplacés par `_`, underscores consécutifs collapsés.

### Typage

**Toutes les colonnes Monday sont stockées en `text`**, y compris les dates, nombres et statuts. C'est volontaire : Monday est faiblement typé et les valeurs vides sont fréquentes.

Pour filtrer/trier sur un type natif, **caster** :

```sql
-- Date : NULLIF pour traiter '' comme NULL avant le cast
WHERE NULLIF(date_signature_promesse, '')::date >= '2026-04-01'

-- Nombre
WHERE NULLIF(numero_bien, '')::numeric > 1500

-- Booléen-like (cases à cocher Monday → 'v' ou '')
WHERE coche_validation = 'v'
```

Sans `NULLIF`, un cast `''::date` lève une erreur Postgres (`invalid input syntax for type date`). **Toujours envelopper** dans `NULLIF(col, '')` avant un cast.

---

## 6. Exemples de requêtes

### 6.1 Recherche par nom (ILIKE)

```sql
SELECT item_id, item_name, group_title
FROM monday_public.mv_clients_proprietaires
WHERE item_name ILIKE '%dupont%'
LIMIT 50;
```

### 6.2 Filtre par date (avec cast)

```sql
SELECT item_id, item_name, date_signature_promesse
FROM monday_public.mv_clients_proprietaires
WHERE NULLIF(date_signature_promesse, '')::date >= '2026-04-01'
ORDER BY date_signature_promesse::date DESC;
```

### 6.3 Agrégation par groupe Monday

```sql
SELECT group_title, COUNT(*) AS nb
FROM monday_public.mv_prospects_inactifs_prospecteurs
GROUP BY group_title
ORDER BY nb DESC;
```

### 6.4 JOIN entre deux boards sur `item_name`

```sql
SELECT c.item_name,
       c.group_title  AS groupe_client,
       l.group_title  AS groupe_livraison
FROM monday_public.mv_clients_proprietaires c
JOIN monday_public.mv_livraison_conciergeries l
  ON LOWER(TRIM(l.item_name)) = LOWER(TRIM(c.item_name));
```

### 6.5 Filtre statut + tri par fraîcheur Monday

```sql
SELECT item_id, item_name, monday_updated_at
FROM monday_public.mv_ventes_conciergeries
WHERE group_title = 'RDV Positionné'
ORDER BY monday_updated_at DESC
LIMIT 100;
```

### 6.6 Comptage des lignes modifiées récemment

```sql
SELECT COUNT(*)
FROM monday_public.mv_creation_entreprise
WHERE monday_updated_at >= NOW() - INTERVAL '7 days';
```

### 6.7 Filtre numérique avec garde

```sql
SELECT item_name, NULLIF(prix_de_vente, '')::numeric AS prix
FROM monday_public.mv_chasse_de_biens
WHERE NULLIF(prix_de_vente, '')::numeric BETWEEN 200000 AND 500000
ORDER BY prix DESC;
```

---

## 7. Fraîcheur de la donnée

- Le cron Monday → `monday_items_current` tourne **chaque nuit**.
- Les 6 vues matérialisées sont rafraîchies **juste après**, vers **3h UTC**.
- En conséquence : ce que vous lisez à 10h CET reflète l'état Monday d'hier soir (J-1 / J-0 selon le fuseau).
- **Aucune action manuelle requise** côté consommateur. Le rôle reader n'a d'ailleurs pas le droit d'exécuter `REFRESH MATERIALIZED VIEW`.
- Pour vérifier la fraîcheur : interroger `MAX(synced_at)` sur la vue.

```sql
SELECT MAX(synced_at) AS derniere_sync
FROM monday_public.mv_clients_proprietaires;
```

---

## 8. Sécurité & limites

| Limite                                   | Valeur            | Comportement                          |
|------------------------------------------|-------------------|---------------------------------------|
| Privilèges                               | `SELECT` uniquement | Aucun `INSERT/UPDATE/DELETE/DDL` possible |
| `statement_timeout`                      | 30 s              | Requête > 30s tuée par Postgres       |
| `idle_in_transaction_session_timeout`    | 60 s              | Transaction inactive > 60s coupée     |
| Connexions simultanées (`CONNECTION LIMIT`) | 10             | 11e connexion refusée                 |
| Schémas visibles                         | `monday_public`   | Le reste de la DB est invisible       |

**Conséquences pratiques** :
- Toujours `LIMIT` les requêtes exploratoires.
- Pour des exports volumineux, paginer via `ORDER BY item_id LIMIT N OFFSET M` ou keyset pagination (`WHERE item_id > :last`).
- Côté pool applicatif : configurer `max: 5` pour laisser de la marge.
- Aucune écriture possible : si vous avez besoin de modifier Monday, passer par l'API Monday officielle, pas par cette base.

---

## 9. Pour Claude / agents IA

Si tu es un agent IA (Claude, GPT, etc.) qui aide un dev à coder son intégration, voici ce que tu dois retenir :

1. **Source de vérité** : les 6 vues `monday_public.mv_*` sont rafraîchies chaque nuit. Structure stable (les colonnes ne changent que si Monday change, ce qui est rare).
2. **Convention de nommage** : titre Monday → slug `snake_case` ASCII (minuscules, accents retirés, ponctuation → `_`). Si l'utilisateur te donne un nom de colonne Monday, applique cette transformation pour deviner la colonne Postgres.
3. **Tout est `text`** sauf les 5 colonnes communes (`item_id`, `item_name`, `group_title`, `monday_updated_at`, `synced_at`).
4. **Casts défensifs** : toujours `NULLIF(col, '')::type` avant un cast. Sinon erreur sur lignes vides.
5. **Read-only strict** : ne génère JAMAIS de `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `REFRESH`, etc. Ils échoueront.
6. **`statement_timeout = 30s`** : si une requête est lente, propose des index logiques (filtres sur `item_id`, `monday_updated_at`, `group_title`) plutôt qu'un cron côté client.
7. **Pas de schéma autre que `monday_public`** : ne tente pas `pg_catalog`-only stuff sur d'autres tables, elles sont invisibles.

### Exemple Node.js (`pg`)

```javascript
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.MONDAY_PUBLIC_DB_URL,
  // postgresql://<user>:<pwd>@maglev.proxy.rlwy.net:31175/railway?sslmode=require
  ssl: { rejectUnauthorized: false },
  max: 5,
});

export async function getClientsRecents(days = 7) {
  const { rows } = await pool.query(
    `SELECT item_id, item_name, group_title, monday_updated_at
     FROM monday_public.mv_clients_proprietaires
     WHERE monday_updated_at >= NOW() - ($1 || ' days')::interval
     ORDER BY monday_updated_at DESC
     LIMIT 500`,
    [days]
  );
  return rows;
}
```

### Exemple Python (`psycopg2`)

```python
import os
import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(
    os.environ["MONDAY_PUBLIC_DB_URL"],  # ...?sslmode=require
)

def prospects_par_groupe():
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT group_title, COUNT(*) AS nb
            FROM monday_public.mv_prospects_inactifs_prospecteurs
            GROUP BY group_title
            ORDER BY nb DESC
        """)
        return cur.fetchall()
```

---

## 10. Troubleshooting

| Symptôme                                                | Cause probable                                         | Solution                                                            |
|---------------------------------------------------------|--------------------------------------------------------|---------------------------------------------------------------------|
| `connection refused` / `timeout` à la connexion         | SSL manquant ou IP bloquée                             | Ajouter `?sslmode=require`. Vérifier proxy/VPN.                     |
| `self-signed certificate in certificate chain` (Node)   | Lib `pg` v8+ vérifie le cert par défaut, le proxy Railway est auto-signé | Passer `ssl: { rejectUnauthorized: false }` dans la config du Pool/Client. |
| `password authentication failed for user "..."`         | Credentials erronés ou révoqués                        | Recontacter Loïc.                                                   |
| `role "..." does not exist`                             | User pas encore créé / mauvaise base                   | Vérifier `database=railway`, recontacter Loïc.                      |
| `permission denied for schema public`                   | Tentative d'accès hors `monday_public`                 | Préfixer toutes les tables par `monday_public.`                     |
| `permission denied for materialized view ...`           | Tentative `REFRESH` ou table non exposée               | Lecture seule uniquement. Pas de refresh manuel.                    |
| `canceling statement due to statement timeout`          | Requête > 30s                                          | Ajouter `WHERE` plus sélectif, `LIMIT`, paginer.                    |
| `invalid input syntax for type date: ""`                | Cast direct sur colonne text vide                      | `NULLIF(col, '')::date`                                             |
| `too many connections for role "..."`                   | > 10 connexions simultanées                            | Réduire `max` du pool, fermer les connexions oisives.               |
| Données qui semblent "vieilles" en pleine journée       | Refresh nocturne 3h UTC, normal                        | Comparer `MAX(synced_at)` ; pas d'action client.                    |

---

## 11. Contact

- **Création / révocation d'accès, questions** : Loïc — cardin.pro@gmail.com
- Préciser à la demande : nom de l'app, contact technique, usage (lecture ponctuelle vs app en prod), volumétrie estimée.

---

*Document maintenu dans le repo `airtable-bank-system` à `docs/MONDAY-PUBLIC-ACCESS.md`. Convertible en PDF via `pandoc docs/MONDAY-PUBLIC-ACCESS.md -o monday-public-access.pdf` ou via "Export PDF" de VS Code.*
