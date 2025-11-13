import React, { useState, useEffect } from 'react';
import './Dashboard.css'; // Import the CSS we rewrote

export default function Dashboard({ token, apiBase, user }) {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({
    title: '',
    author: '',
    genre: '',
    description: '',
    cover: null,
    pdf: null,
  });
  const [editing, setEditing] = useState(null);
  const [reviewForms, setReviewForms] = useState({}); // per-book review form

  useEffect(() => { loadBooks(); }, []);

  // Load all books
  const loadBooks = async () => {
    try {
      const res = await fetch(`${apiBase}/books`);
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert('Failed to load books');
    }
  };

  // Add or update book
  const submitBook = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('author', form.author);
      formData.append('genre', form.genre);
      formData.append('description', form.description);
      if (form.cover) formData.append('cover', form.cover);
      if (form.pdf) formData.append('pdf', form.pdf);

      const url = editing ? `${apiBase}/books/${editing}` : `${apiBase}/books`;
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || 'Failed');

      setForm({ title: '', author: '', genre: '', description: '', cover: null, pdf: null });
      setEditing(null);
      loadBooks();
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  // Start editing a book
  const startEdit = (b) => {
    setEditing(b._id);
    setForm({
      title: b.title,
      author: b.author,
      genre: b.genre || '',
      description: b.description || '',
      cover: null,
      pdf: null,
    });
  };

  // Delete book
  const deleteBook = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      const res = await fetch(`${apiBase}/books/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      if (res.ok) loadBooks();
      else {
        const data = await res.json();
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  // Submit review
  const submitReview = async (bookId) => {
    if (!token) return alert('You must be logged in to review');
    const reviewForm = reviewForms[bookId];
    if (!reviewForm) return;

    try {
      const res = await fetch(`${apiBase}/books/${bookId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || 'Failed to submit review');

      setReviewForms({ ...reviewForms, [bookId]: { rating: 5, comment: '' } });
      loadBooks();
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  // Helper: render stars
  const renderStars = (rating) => {
    const filled = '★'.repeat(Math.round(rating || 0));
    const empty = '☆'.repeat(5 - Math.round(rating || 0));
    return filled + empty;
  };

  return (
    <div className="books-container">
      {/* Add/Edit Book Form */}
      <form onSubmit={submitBook}>
        <h2>{editing ? 'Edit Book' : 'Add New Book'}</h2>
        <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} required />
        <input placeholder="Genre" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <input type="file" accept="image/*" onChange={e => setForm({ ...form, cover: e.target.files[0] })} />
        <input type="file" accept="application/pdf" onChange={e => setForm({ ...form, pdf: e.target.files[0] })} />
        <button type="submit">{editing ? 'Update Book' : 'Add Book'}</button>
      </form>

      {/* Books List */}
      <div className="books-content">
        {books.map(b => (
          <div key={b._id} className="book-card">
            <img src={b.coverUrl || 'https://via.placeholder.com/110x160'} alt={b.title} />
            <div className="book-info">
              <h3>{b.title}</h3>
              <p className="author">{b.author}</p>
              <p className="genre">{b.genre || 'Unknown Genre'}</p>
              <p className="desc">{b.description || 'No description available.'}</p>
              <div className="book-actions">
                <span className="rating">{renderStars(b.avgRating)}</span>
                {token && <button className="edit" onClick={() => startEdit(b)}>Edit</button>}
                {token && <button className="delete" onClick={() => deleteBook(b._id)}>Delete</button>}
                {b.pdfUrl && <a className="pdf" href={b.pdfUrl} target="_blank" rel="noopener noreferrer">Download PDF</a>}
              </div>

              {/* Review Section */}
              {token && (
                <div className="review-form">
                  <h6>Add/Update Review</h6>
                  <div className="review-inputs">
                    <select
                      value={reviewForms[b._id]?.rating || 5}
                      onChange={e => setReviewForms({ ...reviewForms, [b._id]: { ...reviewForms[b._id], rating: parseInt(e.target.value) } })}
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
                    </select>
                    <button type="button" onClick={() => submitReview(b._id)}>Submit Review</button>
                  </div>
                  <textarea
                    placeholder="Comment"
                    value={reviewForms[b._id]?.comment || ''}
                    onChange={e => setReviewForms({ ...reviewForms, [b._id]: { ...reviewForms[b._id], comment: e.target.value } })}
                  />
                </div>
              )}

              {/* Display Reviews */}
              {b.reviews && b.reviews.length > 0 && (
                <div className="reviews-list">
                  {b.reviews.map(r => (
                    <div key={r._id} className="review-card">
                      <div className="username">{r.username} - {renderStars(r.rating)}</div>
                      <div className="comment">{r.comment}</div>
                      <div className="date">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
