const mongoose = require('mongoose');
const Book = require('../models/Book');

const uriArg = process.argv.find((a) => a.startsWith('--uri='));
const uri = uriArg ? uriArg.split('=')[1] : process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookcheck';

const makeDescription = (book) => {
  const title = book.title || 'Untitled';
  const authors = Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown author');
  const genre = book.genre || 'book';
  return `Discover "${title}" by ${authors}. A compelling ${genre} that readers will enjoy.`;
};

const run = async () => {
  try {
    console.log('[fill] Connecting to', uri.replace(/:[^:]+@/, ':***@'));
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Match empty, null, or placeholder descriptions (case-insensitive)
    const placeholderRegex = /^\s*(no description( provided)?\.*)?\s*$/i;
    const books = await Book.find({ $or: [ { description: { $exists: false } }, { description: null }, { description: '' }, { description: { $regex: placeholderRegex } } ] });

    console.log(`[fill] Found ${books.length} book(s) to update`);
    let updated = 0;
    for (const b of books) {
      const newDesc = makeDescription(b);
      await Book.updateOne({ _id: b._id }, { $set: { description: newDesc } });
      console.log(`[fill] Updated ${b._id} -> ${b.title}`);
      updated += 1;
    }

    console.log(`[fill] Completed. Updated ${updated} book(s).`);
    process.exit(0);
  } catch (err) {
    console.error('[fill] Error', err);
    process.exit(2);
  }
};

run();
