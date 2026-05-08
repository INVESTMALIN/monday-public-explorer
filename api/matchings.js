import pg from 'pg';

const { Pool } = pg;

// Board "Ventes Conciergeries" : c'est sur ce board que l'Assistant IA poste
// ses suggestions de matching RDC. Hardcodé volontairement (pas de user input ici).
const VENTES_BOARD_ID = 1315764420;

// Préfixe d'extraction. Tout ce qui précède est l'analyse CRM (Justification,
// Résumé, etc.) qu'on n'envoie pas au client.
const MATCHING_MARKER = 'Suggestion de contenu:';

const ALLOWED_PERIODS = {
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days',
};

const RESULT_LIMIT = 50;

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

function extractMatchingText(bodyText) {
  if (!bodyText) return '';
  // Case-insensitive pour rester aligné avec le filtre SQL (ILIKE).
  // Sinon une update avec une casse exotique du marker (ex: SUGGESTION DE
  // CONTENU:) passe le filtre SQL mais rate l'extraction, et on renvoie
  // l'analyse CRM complète au lieu du seul matching.
  const match = bodyText.match(/Suggestion de contenu:/i);
  if (!match) return bodyText;
  return bodyText.slice(match.index);
}

function buildMondayUrl(itemId) {
  return `https://invest-malin.monday.com/boards/${VENTES_BOARD_ID}/pulses/${itemId}`;
}

// Échappe les wildcards ILIKE (\, %, _) pour que la recherche utilisateur soit
// traitée comme du texte littéral. À utiliser avec ESCAPE '\' côté SQL.
function escapeIlikePattern(input) {
  return input.replace(/[\\%_]/g, '\\$&');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const period = (req.query?.period ?? '7d').toString();
  const intervalStr = ALLOWED_PERIODS[period];
  if (!intervalStr) {
    return res.status(400).json({
      error: `Invalid "period". Allowed: ${Object.keys(ALLOWED_PERIODS).join(', ')}.`,
    });
  }

  const q = (req.query?.q ?? '').toString().trim();
  // ILIKE '%%' matches everything, donc pas besoin d'une branche conditionnelle
  // côté SQL : on passe '%%' quand pas de recherche. Le filtre 'Suggestion de
  // contenu:' garantit déjà qu'on ne renvoie que des matchings. Quand q est
  // fourni, on échappe les wildcards pour que '100%' ou 'foo_bar' soit traité
  // littéralement (couplé à ESCAPE '\' dans la requête).
  const searchPattern = q ? `%${escapeIlikePattern(q)}%` : '%%';

  try {
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT u.update_id,
              u.item_id,
              u.body_text,
              u.monday_created_at,
              u.creator_name,
              v.item_name AS prospect_name,
              v.group_title
       FROM monday_public.updates u
       LEFT JOIN monday_public.mv_ventes_conciergeries v ON v.item_id = u.item_id
       WHERE u.board_id = $1
         AND u.body_text ILIKE $2
         AND u.monday_created_at >= NOW() - $3::interval
         AND u.body_text ILIKE $4 ESCAPE '\'
       ORDER BY u.monday_created_at DESC
       LIMIT ${RESULT_LIMIT}`,
      [VENTES_BOARD_ID, `%${MATCHING_MARKER}%`, intervalStr, searchPattern]
    );

    const matchings = rows.map((row) => ({
      update_id: row.update_id,
      item_id: row.item_id,
      prospect_name: row.prospect_name,
      group_title: row.group_title,
      creator_name: row.creator_name,
      monday_created_at: row.monday_created_at,
      matching_text: extractMatchingText(row.body_text),
      monday_url: buildMondayUrl(row.item_id),
    }));

    return res.status(200).json({ matchings, count: matchings.length });
  } catch (err) {
    console.error('[api/matchings] error:', err);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
}
