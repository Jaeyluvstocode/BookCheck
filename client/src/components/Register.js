import React, { useState } from 'react';

export default function Register({ onLogin, apiBase }) {
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
      if (!res.ok) return setMsg(data.message || 'Registration failed');
      setMsg('Registered! You can now log in.');
    } catch (err) {
      setMsg('Network error');
    }
  };

  return (
    <div className="main">
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
    </div>
  );
}
