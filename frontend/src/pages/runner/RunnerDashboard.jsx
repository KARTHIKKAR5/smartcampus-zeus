import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import CampusMap from '../../components/CampusMap'
import QRScanner from '../../components/QRScanner'
import ChatBox from '../../components/ChatBox'
import toast from 'react-hot-toast'

function RunnerHome() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [graphData, setGraphData] = useState(null)
  const [activeOrder, setActiveOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
    api.get('/analytics/campus-graph').then(r => setGraphData(r.data)).catch(() => {})
    const interval = setInterval(fetchOrders, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/runner-orders')
      setOrders(res.data)
      setLoading(false)
    } catch { setLoading(false) }
  }

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status?status=${status}`)
      toast.success(`Status updated: ${status}`)
      fetchOrders()
    } catch { toast.error('Failed to update status') }
  }

  const STATUS_ACTIONS = {
    pending:   { next: 'accepted',   label: '✅ Accept Order', cls: 'btn-success' },
    accepted:  { next: 'picked_up',  label: '📦 Mark Picked Up', cls: 'btn-primary' },
    picked_up: { next: 'delivered',  label: '🏁 Delivered (Scan QR)', cls: 'btn-success', requiresQR: true },
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>

  return (
    <div className="fade-in">
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Active Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{orders.filter(o => o.status === 'pending').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{user?.rating || 0}⭐</div>
          <div className="stat-label">Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user?.rating_count || 0}</div>
          <div className="stat-label">Deliveries</div>
        </div>
      </div>

      {/* Active Orders */}
      <h2 style={{ marginBottom: '1rem' }}>🏃 My Active Orders</h2>
      {orders.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No active orders — standby for delivery requests 🚀
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {orders.map(order => {
          const action = STATUS_ACTIONS[order.status]
          const route = order.route_path || []
          return (
            <div key={order.id} className="order-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4>#{order.id.slice(-8).toUpperCase()}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {order.urgent && <span style={{ color: 'var(--warning)', fontWeight: 700, marginRight: 6 }}>⚡ URGENT</span>}
                    {order.delivery_location?.replace('_', ' ')} • {order.route_distance ? `${Math.round(order.route_distance)}m` : '—'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge badge-${order.status}`}>{order.status.replace('_', ' ').toUpperCase()}</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{order.delivery_fee}</span>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '1rem', padding: '10px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)' }}>
                {(order.items || []).map((item, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                    • {item.name} ×{item.quantity}
                  </div>
                ))}
              </div>

              {/* Route */}
              {route.length > 0 && graphData && (
                <div style={{ marginBottom: '1rem' }}>
                  <CampusMap graphData={graphData} routePath={route}
                    highlightNodes={[order.canteen_location, order.delivery_location]} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {action && !action.requiresQR && (
                  <button className={`btn ${action.cls}`}
                    onClick={() => updateStatus(order.id, action.next)}>
                    {action.label}
                  </button>
                )}
                {action?.requiresQR && (
                  <QRScanner orderId={order.id} onVerified={fetchOrders} />
                )}
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setActiveOrder(activeOrder?.id === order.id ? null : order)}>
                  💬 Chat Student
                </button>
              </div>

              {activeOrder?.id === order.id && (
                <div style={{ marginTop: '1rem' }}>
                  <ChatBox orderId={order.id} disabled={order.status === 'delivered'} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Campus Map */}
      {graphData && (
        <div style={{ marginTop: '1rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>🗺️ Campus Map</h2>
          <CampusMap graphData={graphData} />
        </div>
      )}
    </div>
  )
}

export default function RunnerDashboard() {
  return (
    <div className="main-content fade-in">
      <Routes>
        <Route index element={<RunnerHome />} />
        <Route path="orders" element={<RunnerHome />} />
        <Route path="map" element={<RunnerHome />} />
      </Routes>
    </div>
  )
}
