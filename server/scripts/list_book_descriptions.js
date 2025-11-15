const mongoose = require('mongoose');
const Book = require('../models/Book');

const uriArg = process.argv.find((a) => a.startsWith('--uri='));
const uri = uriArg ? uriArg.split('=')[1] : process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookcheck';

const run = async () => {
  try {
    console.log('[list] Connecting to', uri.replace(/:[^:]+@/, ':***@'));
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const books = await Book.find({}).select('title description owner').lean();
    console.log(`[list] Found ${books.length} book(s)`);
    for (const b of books) {
      const desc = b.description ? String(b.description).replace(/\s+/g, ' ').trim() : '<empty>';
      console.log(`- ${b._id} | ${b.title || '<no title>'} | owner=${String(b.owner)} | desc=${desc.slice(0,200)}${desc.length>200? '...':''}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[list] Error', err);
    process.exit(2);
  }
};

run();
