// Admin script to delete books with no owner (for cleanup)
const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('./server/models/Book');

async function cleanup() {
  console.log('🔧 Admin Cleanup Script\n');
  
  try {
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ Connected to MongoDB\n');

    // Find books with no owner
    console.log('Finding books with no owner...');
    const orphanBooks = await Book.find({ owner: { $exists: false } });
    console.log(`✓ Found ${orphanBooks.length} books with no owner\n`);

    if (orphanBooks.length === 0) {
      console.log('No orphan books to delete.');
      await mongoose.connection.close();
      return;
    }

    // List them
    console.log('Books to delete:\n');
    orphanBooks.forEach((b, i) => {
      console.log(`${i + 1}. ${b.title} (ID: ${b._id})`);
    });

    console.log(`\nDeleting ${orphanBooks.length} orphan books...`);
    const result = await Book.deleteMany({ owner: { $exists: false } });
    console.log(`✓ Deleted ${result.deletedCount} books\n`);

    // Show remaining books
    console.log('Checking remaining books...');
    const remaining = await Book.find({});
    console.log(`✓ ${remaining.length} books remaining in database\n`);

    if (remaining.length > 0) {
      console.log('Remaining books:\n');
      remaining.forEach((b, i) => {
        console.log(`${i + 1}. ${b.title}`);
        console.log(`   Owner: ${b.owner || 'N/A'}`);
      });
    }

    console.log('\n✅ Cleanup complete!');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

cleanup();
