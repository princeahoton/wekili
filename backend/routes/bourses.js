const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getBoursesPublic, getBourses, getBourseDetail } = require('../controllers/boursesController');

// Route publique — aucun token requis
router.get('/public', getBoursesPublic);

// Routes protégées
router.get('/', auth, getBourses);
router.get('/:id', auth, getBourseDetail);

module.exports = router;
