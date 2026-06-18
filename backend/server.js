require('dotenv').config();  // doit être en premier

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Sécurité : headers HTTP ──────────────────────────────────────────
app.use(helmet());

// ── CORS restreint à l'origine frontend ─────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqué : ${origin}`));
    }
  },
  credentials: true,
}));

// ── Rate limiting global ─────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes, réessayez dans 15 minutes.' },
}));

app.use(express.json({ limit: '2mb' }));

// ── Routes ───────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/profile',      require('./routes/profile'));
app.use('/api/documents',    require('./routes/documents'));
app.use('/api/analysis',     require('./routes/analysis'));
app.use('/api/bourses',      require('./routes/bourses'));
app.use('/api/universities', require('./routes/universities'));
app.use('/api/logement',    require('./routes/logement'));

app.get('/', (req, res) => {
  res.json({ message: 'Wekili API' });
});

const { runAll } = require('./database/setup_all');

const PORT = process.env.PORT || 5000;

runAll()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur Wekili démarré sur le port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Échec des migrations — serveur non démarré:', err.message);
    process.exit(1);
  });
