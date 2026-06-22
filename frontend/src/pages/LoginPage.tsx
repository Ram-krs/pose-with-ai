import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usernameOrEmail, password);
      navigate('/camera');
    } catch {
      setError('Invalid username/email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <Camera size={48} />
          <h1>Pose With AI</h1>
          <p>Dress Smart. Pose Smart. Capture Perfect.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username or Email</label>
            <input
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Enter username or email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot Password?</Link>
          <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
