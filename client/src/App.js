import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Books from './pages/Books';
import Home from './pages/Home'; // ✅ Import new Home page
import Toast from './components/Toast';

const API = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {
      return null;
    }
  });
  const [view, setView] = useState('home'); // ✅ Show Home first

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setView('home');
    localStorage.removeItem('user');
  };

  // Toast notifications
  const [toast, setToast] = React.useState(null);
  const notify = (message, type = 'info', duration = 3500) => {
    setToast({ message, type, duration });
  };
  const clearToast = () => setToast(null);

  return (
    <div className="app">
      {/* === Navbar === */}
      <nav className="nav">
        <h1 style={{ cursor: 'pointer' }} onClick={() => setView('home')}>
          BookCheck
        </h1>
        {user && (
          <div className="nav-buttons">
            <span>
              Welcome, <strong>{user.username}</strong>
            </span>
            <button onClick={() => setView('dashboard')} className="btn btn-primary">
              Dashboard
            </button>
            <button onClick={() => setView('books')} className="btn btn-primary">
              Books
            </button>
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* === Main Content === */}
      <main className="main">
        {view === 'home' && <Home setView={setView} />} {/* ✅ New Home Page */}

        {view === 'login' && (
          <Login
            onRegister={() => setView('register')}
            onSuccess={(t, u) => {
              setToken(t);
              setUser(u);
              localStorage.setItem('user', JSON.stringify(u));
              setView('dashboard');
            }}
            apiBase={API}
            notify={notify}
          />
        )}

        {view === 'register' && <Register onLogin={() => setView('login')} apiBase={API} notify={notify} />}

        {view === 'dashboard' && <Dashboard token={token} apiBase={API} user={user} setView={setView} notify={notify} />}

        {view === 'books' && <Books token={token} setView={setView} apiBase={API} notify={notify} />}
      </main>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
