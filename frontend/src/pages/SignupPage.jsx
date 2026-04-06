import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ROLES = [
  { key: 'student', icon: '🎓', label: 'Student' },
  { key: 'runner', icon: '🏃', label: 'Runner' },
  { key: 'canteen_owner', icon: '🍽️', label: 'Canteen Owner' },
  { key: 'admin', icon: '⚙️', label: 'Admin' },
]

const LOCATIONS = [
  { id: 'block_a', label: 'Block A – Engineering' },
  { id: 'block_b', label: 'Block B – Sciences' },
  { id: 'block_c', label: 'Block C – Management' },
  { id: 'library', label: 'Central Library' },
  { id: 'hostel_boys', label: 'Boys Hostel' },
  { id: 'hostel_girls', label: 'Girls Hostel' },
  { id: 'lab_block', label: 'Lab Block' },
  { id: 'auditorium', label: 'Auditorium' },
  { id: 'sports_complex', label: 'Sports Complex' },
]

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', location: 'block_a' })

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields')
    setLoading(true)
    try {
      const user = await signup({ ...form, role })
      toast.success(`Welcome, ${user.name}! 🎉`)
      navigate(roleRoute(user.role))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed')
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
          <p className="auth-subtitle">SR University Campus Delivery</p>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign:'center' }}>
          Create your account
        </p>

        {/* Role selector */}
        <div className="role-selector">
          {ROLES.map(r => (
            <button key={r.key} className={`role-btn ${role === r.key ? 'active' : ''}`}
              onClick={() => setRole(r.key)} type="button">
              <span className="role-icon">{r.icon}</span>
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Full Name *</label>
            <input className="input" placeholder="Your name" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label>Email *</label>
            <input className="input" type="email" placeholder="you@sruniversity.edu" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label>Password *</label>
            <input className="input" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label>Phone</label>
            <input className="input" placeholder="+91 9999999999" value={form.phone} onChange={set('phone')} />
          </div>
          {(role === 'student' || role === 'runner') && (
            <div>
              <label>Campus Location</label>
              <select className="select" value={form.location} onChange={set('location')}>
                {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }} disabled={loading}>
            {loading ? <span className="spinner" style={{width:20,height:20,borderWidth:2}} /> : '🚀 Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}

function roleRoute(role) {
  const map = { student: '/student', runner: '/runner', admin: '/admin', canteen_owner: '/canteen' }
  return map[role] || '/'
}
