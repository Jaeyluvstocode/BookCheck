const Book = require('../models/Book');
const path = require('path');
const fs = require('fs');
const api = require('../utils/api');

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
      // search title or any author (authors is an array)
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { authors: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre) query.genre = genre;

    const books = await Book.find(query).sort({ createdAt: -1 }).lean();

    const booksWithRating = books.map((b) => ({
      ...b,
      // include a derived `author` string for the client (join array or fallback)
      author: Array.isArray(b.authors) ? b.authors.join(', ') : (b.authors || b.author || ''),
      avgRating: calcAvgRating(b.reviews),
      coverUrl: getFullUrl(req, b.coverUrl),
      pdfUrl: getFullUrl(req, b.pdfUrl),
    }));

    return api.ok(res, { books: booksWithRating });
  } catch (err) {
    console.error('Get books error:', err);
    return api.fail(res, 500, 'Failed to fetch books');
  }
};

// GET /api/books/:id
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book) return api.fail(res, 404, 'Book not found');

    return api.ok(res, {
      book: {
        ...book,
        author: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || book.author || ''),
        avgRating: calcAvgRating(book.reviews),
        coverUrl: getFullUrl(req, book.coverUrl),
        pdfUrl: getFullUrl(req, book.pdfUrl),
      },
    });
  } catch (err) {
    console.error('Get book error:', err);
    return api.fail(res, 500, 'Failed to fetch book');
  }
};

// GET /api/books/:id/download
exports.downloadPdf = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book || !book.pdfUrl) return api.fail(res, 404, 'PDF not found');

    if (book.pdfUrl.startsWith('http')) return res.redirect(book.pdfUrl);

    const filePath = path.join(__dirname, '..', book.pdfUrl.replace(/^\//, ''));
    return res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        console.error('Download error', err);
        return api.fail(res, 500, 'Failed to download PDF');
      }
    });
  } catch (err) {
    console.error('Download PDF error:', err);
    return api.fail(res, 500, 'Failed to download PDF');
  }
};

// ---------------- PROTECTED CONTROLLERS ---------------- //

// POST /api/books
exports.createBook = async (req, res) => {
  try {
    // accept either `authors` (array or comma string) or `author` (single/comma string)
    const { title, authors, author, genre, description } = req.body;

    // normalize authors into an array
    let authorsArr = [];
    if (authors) {
      if (Array.isArray(authors)) authorsArr = authors;
      else if (typeof authors === 'string') authorsArr = authors.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (author && typeof author === 'string') {
      authorsArr = author.split(',').map((s) => s.trim()).filter(Boolean);
    }

    if (!title || authorsArr.length === 0) return api.fail(res, 400, 'Title and authors are required');
    if (!req.user || !req.user.id) return api.fail(res, 401, 'Unauthorized');

    const coverFile = req.files?.cover?.[0];
    const pdfFile = req.files?.pdf?.[0];

    const book = new Book({
      title,
      authors: authorsArr,
      genre,
      description,
      coverUrl: coverFile ? `/uploads/${coverFile.filename}` : undefined,
      pdfUrl: pdfFile ? `/uploads/${pdfFile.filename}` : undefined,
      owner: req.user.id,
    });

    await book.save();

    return api.ok(res, {
      book: {
        ...book.toObject(),
        author: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || ''),
        coverUrl: getFullUrl(req, book.coverUrl),
        pdfUrl: getFullUrl(req, book.pdfUrl),
        avgRating: 0,
      },
    });
  } catch (err) {
    console.error('Create book error:', err);
    return api.fail(res, 500, 'Failed to create book');
  }
};

// PUT /api/books/:id
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return api.fail(res, 404, 'Book not found');

    if (!req.user || !req.user.id) {
      return api.fail(res, 401, 'Unauthorized');
    }

    if (book.owner.toString() !== String(req.user.id))
      return api.fail(res, 403, 'Not authorized');

    const { title, authors, author, genre, description } = req.body;
    if (title) book.title = title;
    // accept `authors` (array or comma string) or `author` (string)
    if (authors) {
      book.authors = Array.isArray(authors) ? authors : String(authors).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (author) {
      book.authors = String(author).split(',').map((s) => s.trim()).filter(Boolean);
    }
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

    return api.ok(res, {
      book: {
        ...book.toObject(),
        author: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || ''),
        coverUrl: getFullUrl(req, book.coverUrl),
        pdfUrl: getFullUrl(req, book.pdfUrl),
        avgRating: calcAvgRating(book.reviews),
      },
    });
  } catch (err) {
    console.error('Update book error:', err);
    return api.fail(res, 500, 'Failed to update book');
  }
};

// DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return api.fail(res, 404, 'Book not found');

    if (!req.user || !req.user.id) {
      return api.fail(res, 401, 'Unauthorized');
    }

    if (book.owner.toString() !== String(req.user.id))
      return api.fail(res, 403, 'Not authorized');

    if (book.coverUrl && fs.existsSync(path.join(__dirname, '..', book.coverUrl.replace(/^\//, ''))))
      fs.unlinkSync(path.join(__dirname, '..', book.coverUrl.replace(/^\//, '')));
    if (book.pdfUrl && fs.existsSync(path.join(__dirname, '..', book.pdfUrl.replace(/^\//, ''))))
      fs.unlinkSync(path.join(__dirname, '..', book.pdfUrl.replace(/^\//, '')));

    await book.deleteOne();
    return api.ok(res, { message: 'Book deleted' });
  } catch (err) {
    console.error('Delete book error:', err);
    return api.fail(res, 500, 'Failed to delete book');
  }
};

// POST /api/books/:id/reviews
exports.postReview = async (req, res) => {
  try {
    let { rating, comment } = req.body;

    // coerce rating to a number
    rating = Number(rating);
    console.log('[postReview] rating=', rating, 'type=', typeof rating, 'comment=', comment);
    
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      console.error('[postReview] validation failed: rating=', rating);
      return api.fail(res, 400, 'Rating must be between 1 and 5');
    }

    if (!req.user || !req.user.id || !req.user.username) {
      console.error('[postReview] missing user info', req.user);
      return api.fail(res, 401, 'Unauthorized: login required');
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      console.error('[postReview] book not found:', req.params.id);
      return api.fail(res, 404, 'Book not found');
    }

    // Update existing review if user already reviewed
    let savedReview = null;
    const userIdStr = String(req.user.id);
    const existing = book.reviews.find((r) => String(r.userId) === userIdStr);
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      existing.updatedAt = new Date();
      savedReview = existing;
    } else {
      const newReview = {
        userId: req.user.id,
        username: req.user.username,
        rating,
        comment,
        createdAt: new Date(),
      };
      book.reviews.push(newReview);
      // After push, get the last element and ensure it's the saved subdoc
      savedReview = book.reviews[book.reviews.length - 1];
    }

    await book.save();

    // Convert savedReview to a plain object and normalize types for client
    const reviewObj = savedReview.toObject ? savedReview.toObject() : savedReview;
    reviewObj.userId = String(reviewObj.userId);

    return api.ok(res, {
      message: 'Review saved',
      review: reviewObj,
      reviews: book.reviews.map((r) => (r.toObject ? r.toObject() : r)),
      avgRating: calcAvgRating(book.reviews),
    });
  } catch (err) {
    console.error('Review save error:', err);
    return api.fail(res, 500, 'Failed to save review', [{ error: err.message }]);
  }
};
