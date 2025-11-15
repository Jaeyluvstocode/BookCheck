const mongoose = require('mongoose');

// ✅ Review Sub-Schema
const ReviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

// ✅ Main Book Schema
const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Book title is required'] },
    // Support multiple authors as an array of strings
    authors: { type: [String], default: [] },
    genre: { type: String, default: '' },
    description: { type: String, default: 'No description provided.' },
    coverUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' }, // local or uploaded
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviews: [ReviewSchema],
  },
  { timestamps: true }
);

// ✅ Virtual: Average rating calculated from reviews
BookSchema.virtual('avgRating').get(function () {
  if (!this.reviews || this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((total, r) => total + r.rating, 0);
  return Math.round((sum / this.reviews.length) * 10) / 10;
});

// ✅ Include virtuals in JSON/object responses
BookSchema.set('toJSON', { virtuals: true });
BookSchema.set('toObject', { virtuals: true });

// ✅ Optional: log when a book is deleted
BookSchema.pre('deleteOne', { document: true }, async function () {
  console.log(`Deleting book: ${this.title}`);
});

module.exports = mongoose.model('Book', BookSchema);
