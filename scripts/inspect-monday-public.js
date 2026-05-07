
import pg from 'pg'

const url = new URL(process.env.MONDAY_PUBLIC_DB_URL)
const pool = new pg.Pool({
    host: url.hostname,
    port: url.port,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
    max: 2
})

console.log('🔍 Inspection du schéma monday_public\n')

// 1. Liste toutes les tables/vues du schéma
const { rows: tables } = await pool.query(`
  SELECT table_name, table_type
  FROM information_schema.tables
  WHERE table_schema = 'monday_public'
  ORDER BY table_name;
`)

console.log(`📋 Tables/vues trouvées (${tables.length}) :`)
console.table(tables)

// 2. Si on trouve une vue avec "update" dans le nom, on inspecte ses colonnes
const updateViews = tables.filter(t => t.table_name.toLowerCase().includes('update'))

if (updateViews.length > 0) {
    console.log(`\n🆕 Vue(s) updates détectée(s) : ${updateViews.map(v => v.table_name).join(', ')}`)

    for (const view of updateViews) {
        const { rows: columns } = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'monday_public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [view.table_name])

        console.log(`\n📊 Colonnes de ${view.table_name} :`)
        console.table(columns)

        const { rows: count } = await pool.query(`SELECT COUNT(*) FROM monday_public.${view.table_name};`)
        console.log(`📈 Nombre de lignes : ${count[0].count}`)

        const { rows: sample } = await pool.query(`SELECT * FROM monday_public.${view.table_name} LIMIT 2;`)
        console.log(`\n🔬 Échantillon (2 premières lignes) :`)
        console.dir(sample, { depth: 3 })
    }
} else {
    console.log('\n⚠️  Aucune vue avec "update" dans le nom trouvée.')
    console.log('Loïc a peut-être nommé la vue différemment. Vérifie la liste ci-dessus.')
}

await pool.end()
console.log('\n✅ Done.')