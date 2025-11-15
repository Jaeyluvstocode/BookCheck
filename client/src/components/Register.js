import React, { useState } from 'react';

export default function Register({ onLogin, apiBase, notify }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.message || 'Registration failed';
        setMsg(message);
        if (notify) notify(message, 'error');
        return;
      }
      setMsg('Registered! You can now log in.');
      if (notify) notify('Registered! You can now log in.', 'success');
    } catch (err) {
      setMsg('Network error');
      if (notify) notify('Network error', 'error');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
      <form onSubmit={submit}>
        <h2>Register</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {msg && (
          <div
            style={{
              color: msg.startsWith('Registered') ? 'green' : 'red',
              marginBottom: '10px',
              textAlign: 'center'
            }}
          >
            {msg}
          </div>
        )}
        <button type="submit" className="btn btn-primary">Register</button>
        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Have an account?{' '}
          <button
            type="button"
            className="btn"
            onClick={onLogin}
            style={{ background: 'transparent', color: '#6c63ff', fontWeight: '600' }}
          >
            Login
          </button>
        </p>
      </form>
      <div className="auth-note">Secure sign up — start adding your reviews today.</div>
      </div>
    </div>
  );
}
