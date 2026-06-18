require('dotenv').config();
const pool = require('../config/database');

(async () => {
  const { rows: cols } = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
  );
  console.log('Colonnes users:', cols);

  const { rows: constraints } = await pool.query(
    "SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'users'"
  );
  console.log('Contraintes users:', constraints);

  const { rows: tables } = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('Tables existantes:', tables.map(t => t.table_name));

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
