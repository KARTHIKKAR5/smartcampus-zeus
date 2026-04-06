import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import api from '../../api/client'
import CampusMap from '../../components/CampusMap'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94A3B8', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } }
  }
}

function AdminHome() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runners, setRunners] = useState([])

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
    api.get('/analytics/runners').then(r => setRunners(r.data)).catch(() => {})
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>
  if (!data) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Failed to load analytics</div>

  const { summary, orders_by_status, orders_by_location, campus_graph, recent_orders } = data

  const statusColors = {
    pending: '#F59E0B', accepted: '#3B82F6', preparing: '#8B5CF6',
    ready: '#10B981', picked_up: '#FF6B35', delivered: '#059669', cancelled: '#EF4444'
  }

  const statusChart = {
    labels: Object.keys(orders_by_status),
    datasets: [{
      data: Object.values(orders_by_status),
      backgroundColor: Object.keys(orders_by_status).map(k => statusColors[k] || '#64748B'),
      borderWidth: 0,
    }]
  }

  const locationChart = {
    labels: Object.keys(orders_by_location).map(k => k.replace('_', ' ')),
    datasets: [{
      label: 'Orders',
      data: Object.values(orders_by_location),
      backgroundColor: 'rgba(255,107,53,0.7)',
      borderColor: '#FF6B35',
      borderRadius: 8,
    }]
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>📊 Admin Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SR University Campus Food Delivery Analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{summary.total_orders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>₹{summary.total_revenue.toFixed(0)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.delivered}</div>
          <div className="stat-label">Delivered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.total_runners}</div>
          <div className="stat-label">Active Runners</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.avg_food_rating}⭐</div>
          <div className="stat-label">Avg Food Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.avg_speed_rating}⭐</div>
          <div className="stat-label">Avg Speed Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.total_students}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{summary.avg_delivery_fee.toFixed(0)}</div>
          <div className="stat-label">Avg Delivery Fee</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>🥧 Orders by Status</h3>
          <div style={{ height: 280 }}>
            <Doughnut data={statusChart} options={{ ...chartDefaults, scales: undefined }} />
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>📍 Orders by Location</h3>
          <div style={{ height: 280 }}>
            <Bar data={locationChart} options={chartDefaults} />
          </div>
        </div>
      </div>

      {/* Campus Map */}
      {campus_graph && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🗺️ Campus Graph — SR University (OpenStreetMap)</h3>
          <CampusMap graphData={campus_graph} />
        </div>
      )}

      {/* Runners Table */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🏃 Runner Performance</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Runner', 'Deliveries', 'Earnings (₹)', 'Distance (km)', 'Rating'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runners.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>🏃 {r.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{r.total_deliveries || 0}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--success)', fontWeight: 700 }}>₹{(r.total_earnings || 0).toFixed(0)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{r.total_distance_km || 0} km</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: '#FFD700' }}>{'★'.repeat(Math.round(r.rating || 0))}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 4 }}>({r.rating?.toFixed(1) || 0})</span>
                  </td>
                </tr>
              ))}
              {runners.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No runners yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>📋 Recent Orders</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(recent_orders || []).map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>#{o.id?.slice(-8).toUpperCase()}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{o.delivery_location?.replace('_', ' ')}</span>
              <span className={`badge badge-${o.status}`}>{o.status?.replace('_', ' ')}</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{o.total_amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="main-content fade-in">
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="runners" element={<AdminHome />} />
        <Route path="orders" element={<AdminHome />} />
        <Route path="map" element={<AdminHome />} />
      </Routes>
    </div>
  )
}
