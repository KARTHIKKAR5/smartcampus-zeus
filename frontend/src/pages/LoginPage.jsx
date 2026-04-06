import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const DEMO_ACCOUNTS = [
    { role: 'student', email: 'student@sruniversity.edu', password: 'Student@123', icon: '🎓' },
    { role: 'runner', email: 'runner@sruniversity.edu', password: 'Runner@123', icon: '🏃' },
    { role: 'admin', email: 'admin@sruniversity.edu', password: 'Admin@123', icon: '⚙️' },
    { role: 'canteen_owner', email: 'canteen@sruniversity.edu', password: 'Canteen@123', icon: '🍽️' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}! 👋`)
      navigate(roleRoute(user.role))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (acc) => {
    setLoading(true)
    try {
      const user = await login(acc.email, acc.password)
      toast.success(`Logged in as ${user.name}`)
      navigate(roleRoute(user.role))
    } catch {
      toast.error('Demo account not set up yet — please create via signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <span className="auth-logo-icon">🍽️</span>
          <h1 className="auth-title">The Last Meal Mile</h1>
          <p className="auth-subtitle">SR University • Campus Food Delivery</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Email</label>
            <input className="input" type="email" placeholder="you@sruniversity.edu"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label>Password</label>
            <input className="input" type="password" placeholder="Your password"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }} disabled={loading}>
            {loading ? <span className="spinner" style={{width:20,height:20,borderWidth:2}} /> : '🔑 Sign In'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', position: 'relative', textAlign: 'center' }}>
          <div style={{ height: 1, background: 'var(--border)', position: 'absolute', top: '50%', left: 0, right: 0 }} />
          <span style={{ background: 'var(--bg-card)', padding: '0 1rem', position: 'relative', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Demo Accounts
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {DEMO_ACCOUNTS.map(acc => (
            <button key={acc.role} onClick={() => quickLogin(acc)} className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}>
              {acc.icon} {acc.role.charAt(0).toUpperCase() + acc.role.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          New here?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create Account</Link>
        </p>
      </div>
    </div>
  )
}

function roleRoute(role) {
  const map = { student: '/student', runner: '/runner', admin: '/admin', canteen_owner: '/canteen' }
  return map[role] || '/'
}
