import React, { useState } from 'react';

export default function Login({ onRegister, onSuccess, apiBase }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault();
    setErr('');
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) return setErr(data.message || 'Login failed');
      onSuccess(data.token, data.user);
    } catch (err) {
      setErr('Network error');
    }
  };

  return (
    <div className="main">
      <form onSubmit={submit}>
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {err && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{err}</div>}
        <button type="submit" className="btn btn-primary">Login</button>
        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Don't have an account?{' '}
          <button type="button" className="btn" onClick={onRegister} style={{ background: 'transparent', color: '#6c63ff', fontWeight: '600' }}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}
