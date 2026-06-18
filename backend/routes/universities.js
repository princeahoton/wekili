const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/universitiesController');

router.get('/public', ctrl.getUniversitiesPublic);

router.use(auth);

router.get('/', ctrl.getUniversities);
router.get('/candidatures', ctrl.getCandidatures);
router.get('/:id', ctrl.getUniversityDetail);
router.post('/:id/candidature', ctrl.upsertCandidature);
router.delete('/:id/candidature', ctrl.deleteCandidature);

module.exports = router;
