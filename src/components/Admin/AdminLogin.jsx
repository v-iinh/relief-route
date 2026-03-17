import { useState } from 'react';
import logo from '../../assets/logo.png';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage('Enter both email and password.');
      return;
    }

    setMessage('Login submitted. Connect this form to your admin auth endpoint.');
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-head">
          <div className="admin-logo-row">
            <img className="admin-logo" src={logo} alt="Relief Route logo" />
          </div>
          <div className="admin-head-copy">
            <div className="admin-title">Admin Login</div>
            <div className="admin-subtitle">Sign in to manage Relief Route.</div>
          </div>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="admin@example.org"
            autoComplete="email"
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />

          <button type="submit">Sign In</button>
        </form>

        {message && <div className="admin-message">{message}</div>}
      </div>
    </div>
  );
}
