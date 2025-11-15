const mongoose = require('mongoose');
const Book = require('../models/Book');
const User = require('../models/User');

// Usage: node delete_test_reviews.js [--dry-run] [--delete-books] [--uri=<mongo uri>]
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const deleteBooks = args.includes('--delete-books');
const uriArg = args.find(a => a.startsWith('--uri='));
const MONGO = (uriArg && uriArg.split('=')[1]) || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookcheck';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('[cleanup] Connected to MongoDB');

  // Patterns that look like test data (case-insensitive)
  const commentRegex = /(test|good book|great book|test book)/i;
  const usernameRegex = /^test/i;

  // 1) Find and optionally remove reviews matching patterns
  const books = await Book.find({ 'reviews.0': { $exists: true } }).lean();
  console.log(`[cleanup] Scanning ${books.length} books for test reviews...`);

  let totalRemoved = 0;
  for (const b of books) {
    const reviews = b.reviews || [];
    const matches = reviews.filter(r => {
      if (!r) return false;
      if (r.username && usernameRegex.test(r.username)) return true;
      if (r.comment && commentRegex.test(r.comment)) return true;
      return false;
    });
    if (matches.length === 0) continue;

    if (dryRun) {
      console.log(`[dry-run] Book ${b._id} (${b.title}) - would remove ${matches.length} review(s)`);
      matches.forEach(r => console.log(`  - reviewId:${r._id} username:${r.username} comment:${(r.comment||'').slice(0,80)}`));
      totalRemoved += matches.length;
      continue;
    }

    const keep = reviews.filter(r => !matches.includes(r));
    await Book.updateOne({ _id: b._id }, { $set: { reviews: keep } });
    console.log(`[cleanup] Book ${b._id} - removed ${matches.length} review(s)`);
    totalRemoved += matches.length;
  }

  // 2) Optionally delete entire books owned by users with username starting with 'test'
  let booksDeleted = 0;
  if (deleteBooks) {
    const testUsers = await User.find({ username: { $regex: '^test', $options: 'i' } }).lean();
    console.log(`[cleanup] Found ${testUsers.length} test user(s)`);
    if (testUsers.length > 0) {
      const userIds = testUsers.map(u => u._id);
      const booksToDelete = await Book.find({ owner: { $in: userIds } }).lean();
      console.log(`[cleanup] Found ${booksToDelete.length} book(s) owned by test users`);
      if (dryRun) {
        booksToDelete.forEach(b => console.log(`[dry-run] Would delete book ${b._id} (${b.title}) owned by user`));
        booksDeleted = booksToDelete.length;
      } else {
        for (const b of booksToDelete) {
          await Book.deleteOne({ _id: b._id });
          console.log(`[cleanup] Deleted book ${b._id} (${b.title})`);
          booksDeleted++;
        }
      }
    }
  }

  console.log(`[cleanup] Completed. Total reviews removed: ${totalRemoved}. Books deleted: ${booksDeleted}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('[cleanup] Error:', err);
  process.exit(1);
});
