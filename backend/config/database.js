const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Erreur connexion PostgreSQL :', err.message);
  } else {
    console.log('✅ PostgreSQL connecté !');
  }
});

module.exports = pool;