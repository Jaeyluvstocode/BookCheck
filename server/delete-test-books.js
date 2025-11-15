// Delete only the test books created during testing
const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('./models/Book');

async function deleteTestBooks() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('Connected to MongoDB\n');

    // Find and delete books with titles containing "Test Book"
    const result = await Book.deleteMany({
      title: { $regex: /Test Book/, $options: 'i' }
    });

    console.log(`✅ Deleted ${result.deletedCount} test books`);
    console.log('Database cleaned up!');

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

deleteTestBooks();
