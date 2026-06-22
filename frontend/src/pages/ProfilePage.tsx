import { useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PHOTOGRAPHY_STYLES = ['Casual', 'Professional', 'Instagram', 'Traditional', 'Fashion'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [height, setHeight] = useState(user?.height_cm?.toString() ?? '');
  const [style, setStyle] = useState(user?.photography_style ?? '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await updateUser({
        full_name: fullName || undefined,
        gender: gender || undefined,
        height_cm: height ? parseFloat(height) : undefined,
        photography_style: style || undefined,
      });
      setMessage('Profile updated successfully!');
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Manage your account and photography preferences</p>

      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Account</p>
          <p style={{ fontWeight: 600 }}>@{user?.username}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user?.email}</p>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Height (cm)</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" min={100} max={250} />
          </div>
          <div className="form-group">
            <label>Photography Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="">Select style</option>
              {PHOTOGRAPHY_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {message && (
            <p className={message.includes('success') ? 'success-msg' : 'error-msg'}>{message}</p>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
