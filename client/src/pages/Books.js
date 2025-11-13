import React, { useEffect, useState } from 'react';
import './Books.css';

export default function Books({ token, setView, apiBase }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: '', comment: '' });

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: 'Bearer ' + token }),
  };

  // Load books from backend or dummy if empty
  const loadBooks = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (genre) params.append('genre', genre);

      const res = await fetch(`${apiBase}/books?${params.toString()}`, { headers });
      let data = await res.json();

      // Add dummy reviews for testing if none
      if (Array.isArray(data)) {
        data = data.map((b) => ({
          ...b,
          reviews: b.reviews?.length
            ? b.reviews
            : [
                { _id: 'r1', username: 'Alice', rating: 5, comment: 'Amazing book!', createdAt: new Date() },
                { _id: 'r2', username: 'Bob', rating: 4, comment: 'Really enjoyed it', createdAt: new Date() },
                { _id: 'r3', username: 'Charlie', rating: 3, comment: 'It was okay', createdAt: new Date() },
              ],
        }));
      }

      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert('Failed to load books');
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const viewDetails = async (id) => {
    try {
      const res = await fetch(`${apiBase}/books/${id}`, { headers });
      const data = await res.json();

      if (!data.reviews || data.reviews.length === 0) {
        data.reviews = [
          { _id: 'r1', username: 'Alice', rating: 5, comment: 'Amazing book!', createdAt: new Date() },
          { _id: 'r2', username: 'Bob', rating: 4, comment: 'Really enjoyed it', createdAt: new Date() },
          { _id: 'r3', username: 'Charlie', rating: 3, comment: 'It was okay', createdAt: new Date() },
        ];
      }

      setSelected(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load book details');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!token) return alert('You must be logged in to submit a review.');

    try {
      const res = await fetch(`${apiBase}/books/${selected._id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(reviewForm),
      });

      const data = await res.json();
      if (res.ok) {
        // Add review locally
        setSelected((prev) => ({
          ...prev,
          reviews: [...(prev.reviews || []), { ...data, username: data.username || 'You', createdAt: new Date() }],
        }));
        alert('Review saved!');
        setReviewForm({ rating: '', comment: '' });
      } else {
        alert(data.message || 'Failed to save review');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save review');
    }
  };

  const downloadPdf = (book) => {
    if (book.pdfUrl) {
      window.open(book.pdfUrl, '_blank'); // Open the actual PDF if available
    } else {
      const query = encodeURIComponent(`${book.title} ${book.author || ''}`);
      const url = `https://www.pdfdrive.com/search?q=${query}`; // Search PDF Drive if none
      window.open(url, '_blank');
    }
  };

  const renderStars = (rating) => {
    const filled = '★'.repeat(Math.round(rating || 0));
    const empty = '☆'.repeat(5 - Math.round(rating || 0));
    return filled + empty;
  };

  const getDescription = (book) => {
    if (book.description && book.description.trim() !== '') return book.description;
    return `Discover "${book.title}" by ${book.author || 'an unknown author'}. A fascinating ${book.genre || 'book'} to dive into.`;
  };

  return (
    <div className="books-container">
      <button className="back-btn" onClick={() => setView('dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="search-filter">
        <input
          placeholder="Search by title or author"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          placeholder="Filter by genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
        <button className="search-btn" onClick={loadBooks}>Search</button>
      </div>

      <div className="books-content">
        <div className="book-list">
          {books.map((book) => (
            <div key={book._id} className="book-card">
              <img src={book.coverUrl || 'https://via.placeholder.com/100x140'} alt={book.title} />
              <div className="book-info">
                <h3>{book.title}</h3>
                <p className="author">Author: {book.author}</p>
                <p className="genre">Genre: {book.genre || 'N/A'}</p>
                <p className="desc">{getDescription(book).slice(0, 120)}{getDescription(book).length > 120 ? '...' : ''}</p>
                <div className="book-actions">
                  <button className="view-btn" onClick={() => viewDetails(book._id)}>View</button>
                  <button className="pdf-btn" onClick={() => downloadPdf(book)}>Download PDF</button>
                  <span className="rating">{renderStars(book.avgRating)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="selected-book">
          <div className="selected-card">
            <h4>Selected Book</h4>
            {!selected ? (
              <div>Click "View" to see details & reviews</div>
            ) : (
              <>
                <img src={selected.coverUrl || 'https://via.placeholder.com/100x140'} alt={selected.title} />
                <h3>{selected.title}</h3>
                <p className="author">{selected.author} • {selected.genre}</p>
                <p>{getDescription(selected)}</p>
                <div className="avg-rating">Average rating: {renderStars(selected.avgRating)}</div>

                <div className="reviews-section">
                  <h5>Reviews</h5>
                  <div className="reviews-list">
                    {selected.reviews?.length > 0 ? (
                      selected.reviews.map((r) => (
                        <div key={r._id} className="review-card">
                          <div className="username">{r.username} <span>{renderStars(r.rating)}</span></div>
                          <div className="comment">{r.comment}</div>
                          <div className="date">{new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    ) : (
                      <div>No reviews yet.</div>
                    )}
                  </div>
                </div>

                <form className="review-form" onSubmit={submitReview}>
                  <h6>Leave a review</h6>
                  <div className="review-inputs">
                    <select
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                      required
                    >
                      <option value="">Rate</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Very good</option>
                      <option value="3">3 - Good</option>
                      <option value="2">2 - Fair</option>
                      <option value="1">1 - Poor</option>
                    </select>
                    <button type="submit">Submit</button>
                  </div>
                  <textarea
                    name="comment"
                    placeholder="Optional comment"
                    rows="3"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
