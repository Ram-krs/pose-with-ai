import { NavLink, useNavigate } from 'react-router-dom';
import { Camera, Image, History, User, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="top-header">
        <div className="brand" onClick={() => navigate('/')}>
          <Camera size={24} />
          <span>Pose With AI</span>
        </div>
        <p className="tagline">Dress Smart. Pose Smart. Capture Perfect.</p>
      </header>

      <main className="main-content">{children}</main>

      <nav className="bottom-nav">
        <NavLink to="/camera" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Camera size={22} />
          <span>Camera</span>
        </NavLink>
        <NavLink to="/gallery" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Image size={22} />
          <span>Gallery</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <History size={22} />
          <span>History</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <User size={22} />
          <span>Profile</span>
        </NavLink>
        {user?.is_admin && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Shield size={22} />
            <span>Admin</span>
          </NavLink>
        )}
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
