const mongoose = require('mongoose');
const Book = require('../models/Book');

// Simple description generator
const makeDescription = (book) => {
  const title = book.title || 'Untitled';
  const authors = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown author');
  const genre = book.genre || 'book';
  return `Discover "${title}" by ${authors}. A compelling ${genre} that readers will enjoy.`;
};

const uriArg = process.argv.find((a) => a.startsWith('--uri='));
const uri = uriArg ? uriArg.split('=')[1] : process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookcheck';

const run = async () => {
  try {
    console.log('[describe] Connecting to', uri.replace(/:[^:]+@/, ':***@'));
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Find books without a meaningful description
    const books = await Book.find({ $or: [ { description: { $exists: false } }, { description: null }, { description: '' }, { description: 'No description provided.' } ] });
    console.log(`[describe] Found ${books.length} book(s) missing descriptions`);

    let updated = 0;
    for (const b of books) {
      b.description = makeDescription(b);
      await b.save();
      console.log(`[describe] Updated ${b._id} -> ${b.title}`);
      updated += 1;
    }

    console.log(`[describe] Completed. Updated ${updated} book(s).`);
    process.exit(0);
  } catch (err) {
    console.error('[describe] Error', err);
    process.exit(2);
  }
};

run();
