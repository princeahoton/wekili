const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');
const { getDocuments, uploadDocument, deleteDocument } = require('../controllers/documentsController');

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
  'releve_notes', 'diplome', 'passeport', 'lettre_motivation',
  'lettre_recommandation', 'cv', 'justificatif_domicile', 'autre',
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

module.exports = router;
