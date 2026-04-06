import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ROLE_NAVS = {
  student: [
    { to: '/student', label: 'Order Food', icon: '🍱', end: true },
    { to: '/student/orders', label: 'My Orders', icon: '📦' },
    { to: '/student/wallet', label: 'Wallet', icon: '💳' },
    { to: '/student/track', label: 'Track Delivery', icon: '📍' },
  ],
  runner: [
    { to: '/runner', label: 'Dashboard', icon: '🏃', end: true },
    { to: '/runner/orders', label: 'Active Orders', icon: '📦' },
    { to: '/runner/map', label: 'Campus Map', icon: '🗺️' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
    { to: '/admin/runners', label: 'Runners', icon: '🏃' },
    { to: '/admin/orders', label: 'All Orders', icon: '📦' },
    { to: '/admin/map', label: 'Campus Map', icon: '🗺️' },
  ],
  canteen_owner: [
    { to: '/canteen', label: 'Orders Queue', icon: '🍽️', end: true },
    { to: '/canteen/menu', label: 'Menu', icon: '📜' },
    { to: '/canteen/analytics', label: 'Analytics', icon: '📊' },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navs = user ? (ROLE_NAVS[user.role] || []) : []

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <a href="/" className="navbar-brand">
        <span className="navbar-logo">🍽️</span>
        <span>Last Meal Mile</span>
        <span style={{ fontSize: '0.65rem', background: 'rgba(255,107,53,0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 99, marginLeft: 6 }}>
          SR University
        </span>
      </a>

      <div className="navbar-links">
        {navs.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>{n.icon}</span>
            <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>{n.label}</span>
          </NavLink>
        ))}

        {user && (
          <>
            <div className="nav-wallet">
              💳 ₹{(user.wallet_balance || 0).toFixed(0)}
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  )
}
