const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');
const {
  getDocuments, uploadDocument, deleteDocument,
  getDocumentLogs,
  checkPin, createPin, verifyPin, requestPinReset, confirmPinReset,
  requestDocAccess, verifyDocAccess,
} = require('../controllers/documentsController');

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];

const ALLOWED_TYPES = [
  'releve_notes', 'releves',
  'diplome',
  'passeport',
  'lettre_motivation', 'motivation',
  'lettre_recommandation', 'recommandation',
  'cv',
  'justificatif_domicile',
  'langue',
  'autre',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = ALLOWED_MIMES.includes(file.mimetype);
    const extOk = ALLOWED_EXTS.includes(ext);
    if (mimeOk && extOk) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Acceptés : PDF, JPG, PNG, DOC, DOCX'));
    }
  },
});

function validateDocType(req, res, next) {
  if (!req.body.type || !ALLOWED_TYPES.includes(req.body.type)) {
    return res.status(400).json({ message: 'Type de document invalide' });
  }
  next();
}

router.get('/', auth, getDocuments);
router.post('/upload', auth, upload.single('file'), validateDocType, uploadDocument);
router.delete('/:id', auth, deleteDocument);

// Journal d'activité
router.get('/logs', auth, getDocumentLogs);

// Système de PIN
router.get('/pin/check',           auth, checkPin);
router.post('/pin/create',         auth, createPin);
router.post('/pin/verify',         auth, verifyPin);
router.post('/pin/reset/request',  auth, requestPinReset);
router.post('/pin/reset/confirm',  auth, confirmPinReset);

// Portail OTP email (legacy)
router.post('/request-access', auth, requestDocAccess);
router.post('/verify-access',  auth, verifyDocAccess);

module.exports = router;
