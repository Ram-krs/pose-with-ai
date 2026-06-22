import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';
import './Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [error, setError] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await authApi.forgotPassword(email);
      setMessage(data.message);
      if (data.reset_token) {
        setResetToken(data.reset_token);
        setStep('reset');
      }
    } catch {
      setError('Something went wrong');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await authApi.resetPassword(resetToken, newPassword);
      setMessage('Password updated! You can now sign in.');
    } catch {
      setError('Invalid or expired token');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Forgot Password</h1>
        {step === 'request' ? (
          <form onSubmit={handleRequest}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && <p className="error-msg">{error}</p>}
            {message && <p className="success-msg">{message}</p>}
            <button type="submit" className="btn btn-primary auth-btn">Send Reset Link</button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>Reset Token</label>
              <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            {message && <p className="success-msg">{message}</p>}
            <button type="submit" className="btn btn-primary auth-btn">Reset Password</button>
          </form>
        )}
        <div className="auth-links">
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
