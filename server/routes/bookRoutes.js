const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');

// ---------------- MULTER CONFIG ---------------- //
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + Date.now() + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

// ---------------- PUBLIC ROUTES ---------------- //
// Get all books (with optional search & genre filters)
router.get('/', bookController.getBooks);

// Get single book by ID (includes reviews & avgRating)
router.get('/:id', bookController.getBook);

// Download PDF (local or external)
router.get('/:id/download', bookController.downloadPdf);

// ---------------- PROTECTED ROUTES ---------------- //
// Create a new book (cover & PDF optional)
router.post(
  '/',
  auth,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  bookController.createBook
);

// Update book by ID (cover & PDF optional)
router.put(
  '/:id',
  auth,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  bookController.updateBook
);

// Delete book by ID
router.delete('/:id', auth, bookController.deleteBook);

// Add or update a review
router.post('/:id/reviews', auth, bookController.postReview);

module.exports = router;
