import React, { useState } from 'react';

export default function Login({ onRegister, onSuccess, apiBase, notify }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!identifier || !password) {
      const message = 'Username/email and password are required';
      setErr(message);
      if (notify) notify(message, 'error');
      return;
    }

    try {
      const payload = { password };
      if (identifier.includes('@')) payload.email = identifier;
      else payload.username = identifier;

      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.message || 'Login failed';
        setErr(message);
        if (notify) notify(message, 'error');
        return;
      }

      // Successful login
      if (notify) notify('Logged in successfully', 'success');
      onSuccess(data.token, data.user);

    } catch (err) {
      console.error('[LOGIN ERROR]', err);
      const message = 'Network error. Please check your connection or API URL.';
      setErr(message);
      if (notify) notify(message, 'error');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <form onSubmit={submit}>
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {err && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{err}</div>}
          <button type="submit" className="btn btn-primary">Login</button>
          <p style={{ textAlign: 'center', marginTop: '15px' }}>
            Don't have an account?{' '}
            <button
              type="button"
              className="btn"
              onClick={onRegister}
              style={{ background: 'transparent', color: '#6c63ff', fontWeight: '600' }}
            >
              Register
            </button>
          </p>
        </form>
        <div className="auth-note">Join BookCheck to discover and review books.</div>
      </div>
    </div>
  );
}
