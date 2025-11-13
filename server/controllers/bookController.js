const Book = require('../models/Book');
const path = require('path');
const fs = require('fs');

// ---------------- HELPERS ---------------- //

// Calculate average rating
const calcAvgRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

// Convert file path to full URL
const getFullUrl = (req, filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  return `${req.protocol}://${req.get('host')}/${filePath}`;
};

// ---------------- PUBLIC CONTROLLERS ---------------- //

// GET /api/books?search=&genre=
exports.getBooks = async (req, res) => {
  try {
    const { search, genre } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre) query.genre = genre;

    const books = await Book.find(query).sort({ createdAt: -1 }).lean();

    const booksWithRating = books.map((b) => ({
      ...b,
      avgRating: calcAvgRating(b.reviews),
      coverUrl: getFullUrl(req, b.coverUrl),
      pdfUrl: getFullUrl(req, b.pdfUrl),
    }));

    res.json(booksWithRating);
  } catch (err) {
    console.error('Get books error:', err);
    res.status(500).json({ message: 'Failed to fetch books' });
  }
};

// GET /api/books/:id
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book) return res.status(404).json({ message: 'Book not found' });

    res.json({
      ...book,
      avgRating: calcAvgRating(book.reviews),
      coverUrl: getFullUrl(req, book.coverUrl),
      pdfUrl: getFullUrl(req, book.pdfUrl),
    });
  } catch (err) {
    console.error('Get book error:', err);
    res.status(500).json({ message: 'Failed to fetch book' });
  }
};

// GET /api/books/:id/download
exports.downloadPdf = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book || !book.pdfUrl) return res.status(404).json({ message: 'PDF not found' });

    if (book.pdfUrl.startsWith('http')) return res.redirect(book.pdfUrl);

    const filePath = path.join(__dirname, '..', book.pdfUrl.replace(/^\//, ''));
    return res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        console.error('Download error', err);
        return res.status(500).json({ message: 'Failed to download PDF' });
      }
    });
  } catch (err) {
    console.error('Download PDF error:', err);
    res.status(500).json({ message: 'Failed to download PDF' });
  }
};

// ---------------- PROTECTED CONTROLLERS ---------------- //

// POST /api/books
exports.createBook = async (req, res) => {
  try {
    const { title, author, genre, description } = req.body;
    if (!title || !author) return res.status(400).json({ message: 'Title and author are required' });
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'Unauthorized' });

    const coverFile = req.files?.cover?.[0];
    const pdfFile = req.files?.pdf?.[0];

    const book = new Book({
      title,
      author,
      genre,
      description,
      coverUrl: coverFile ? `/uploads/${coverFile.filename}` : undefined,
      pdfUrl: pdfFile ? `/uploads/${pdfFile.filename}` : undefined,
      owner: req.user.id,
    });

    await book.save();

    res.status(201).json({
      ...book.toObject(),
      coverUrl: getFullUrl(req, book.coverUrl),
      pdfUrl: getFullUrl(req, book.pdfUrl),
      avgRating: 0,
    });
  } catch (err) {
    console.error('Create book error:', err);
    res.status(500).json({ message: 'Failed to create book' });
  }
};

// PUT /api/books/:id
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (book.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const { title, author, genre, description } = req.body;
    if (title) book.title = title;
    if (author) book.author = author;
    if (genre) book.genre = genre;
    if (description) book.description = description;

    const coverFile = req.files?.cover?.[0];
    const pdfFile = req.files?.pdf?.[0];

    if (coverFile) {
      if (book.coverUrl && fs.existsSync(path.join(__dirname, '..', book.coverUrl.replace(/^\//, ''))))
        fs.unlinkSync(path.join(__dirname, '..', book.coverUrl.replace(/^\//, '')));
      book.coverUrl = `/uploads/${coverFile.filename}`;
    }

    if (pdfFile) {
      if (book.pdfUrl && fs.existsSync(path.join(__dirname, '..', book.pdfUrl.replace(/^\//, ''))))
        fs.unlinkSync(path.join(__dirname, '..', book.pdfUrl.replace(/^\//, '')));
      book.pdfUrl = `/uploads/${pdfFile.filename}`;
    }

    await book.save();

    res.json({
      ...book.toObject(),
      coverUrl: getFullUrl(req, book.coverUrl),
      pdfUrl: getFullUrl(req, book.pdfUrl),
      avgRating: calcAvgRating(book.reviews),
    });
  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({ message: 'Failed to update book' });
  }
};

// DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (book.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    if (book.coverUrl && fs.existsSync(path.join(__dirname, '..', book.coverUrl.replace(/^\//, ''))))
      fs.unlinkSync(path.join(__dirname, '..', book.coverUrl.replace(/^\//, '')));
    if (book.pdfUrl && fs.existsSync(path.join(__dirname, '..', book.pdfUrl.replace(/^\//, ''))))
      fs.unlinkSync(path.join(__dirname, '..', book.pdfUrl.replace(/^\//, '')));

    await book.deleteOne();
    res.json({ message: 'Book deleted' });
  } catch (err) {
    console.error('Delete book error:', err);
    res.status(500).json({ message: 'Failed to delete book' });
  }
};

// POST /api/books/:id/reviews
exports.postReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    if (!req.user || !req.user.id || !req.user.username)
      return res.status(401).json({ message: 'Unauthorized: login required' });

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Update existing review if user already reviewed
    const existing = book.reviews.find((r) => r.userId.toString() === req.user.id);
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      existing.updatedAt = new Date();
    } else {
      book.reviews.push({
        userId: req.user.id,
        username: req.user.username,
        rating,
        comment,
        createdAt: new Date(),
      });
    }

    await book.save();

    res.json({
      message: 'Review saved',
      reviews: book.reviews,
      avgRating: calcAvgRating(book.reviews),
    });
  } catch (err) {
    console.error('Review save error:', err);
    res.status(500).json({ message: 'Failed to save review', error: err.message });
  }
};
