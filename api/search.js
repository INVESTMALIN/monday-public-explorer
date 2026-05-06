import pg from 'pg';

const { Pool } = pg;

const SCHEMA = 'monday_public';

const VIEWS = [
  { name: 'mv_clients_proprietaires', label: 'Clients propriétaires' },
  { name: 'mv_creation_entreprise', label: 'Création entreprise' },
  { name: 'mv_livraison_conciergeries', label: 'Livraison conciergeries' },
  { name: 'mv_ventes_conciergeries', label: 'Ventes conciergeries' },
  { name: 'mv_prospects_inactifs_prospecteurs', label: 'Prospects inactifs' },
  { name: 'mv_chasse_de_biens', label: 'Chasse de biens' },
];

const PER_VIEW_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;

function buildPoolConfig(rawUrl) {
  // Parsing manuel de l'URL : sinon pg-connection-string interprète sslmode=require
  // comme verify-full et écrase notre rejectUnauthorized: false (cert auto-signé Railway).
  const url = new URL(rawUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    ssl: { rejectUnauthorized: false },
    max: 5,
  };
}

let pool;
function getPool() {
  if (!pool) {
    const url = process.env.MONDAY_PUBLIC_DB_URL;
    if (!url) throw new Error('MONDAY_PUBLIC_DB_URL is not set');
    pool = new Pool(buildPoolConfig(url));
  }
  return pool;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const q = (req.query?.q ?? '').toString().trim();
  if (q.length < MIN_QUERY_LENGTH) {
    return res
      .status(400)
      .json({ error: `Query parameter "q" must be at least ${MIN_QUERY_LENGTH} characters` });
  }

  try {
    const pool = getPool();
    const term = `%${q}%`;

    const queries = VIEWS.map(({ name, label }) =>
      pool
        .query(
          `SELECT item_id, item_name, group_title, monday_updated_at
           FROM ${SCHEMA}.${name}
           WHERE item_name ILIKE $1
           ORDER BY monday_updated_at DESC NULLS LAST
           LIMIT $2`,
          [term, PER_VIEW_LIMIT]
        )
        .then((result) => ({
          view: name,
          label,
          count: result.rows.length,
          items: result.rows,
        }))
    );

    const results = await Promise.all(queries);

    return res.status(200).json({ query: q, results });
  } catch (err) {
    console.error('[api/search] error:', err);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
}
