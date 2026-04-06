import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const CANTEEN_LOCATIONS = {
  central_canteen: 'Central Canteen',
  juice_center: 'Juice Center',
  food_court_2: 'Food Court 2',
}

const CATEGORIES = ['Main', 'Meals', 'Chinese', 'Breakfast', 'Soups', 'Salads', 'Sweets', 'Juices', 'Smoothies', 'Drinks', 'Snacks']

function CanteenHome() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [canteens, setCanteens] = useState([])
  const [myCanteen, setMyCanteen] = useState(null)
  const [tab, setTab] = useState('orders')
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: 'Main', prep_time_minutes: 10 })
  const [addingItem, setAddingItem] = useState(false)

  useEffect(() => {
    api.get('/menu/canteens').then(r => {
      setCanteens(r.data)
      const c = r.data.find(c => c.owner_id === user?.id) || r.data[0]
      setMyCanteen(c)
      if (c) {
        fetchOrders(c.id)
        api.get('/menu/items', { params: { canteen_id: c.id } }).then(res => setMenuItems(res.data))
      } else { setLoading(false) }
    }).catch(() => setLoading(false))
  }, [])

  const fetchOrders = async (canteenId) => {
    try {
      const res = await api.get('/orders/canteen-orders', { params: { canteen_id: canteenId } })
      setOrders(res.data)
    } catch {}
    setLoading(false)
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status?status=${status}`)
      toast.success(`Order ${status}`)
      fetchOrders(myCanteen.id)
    } catch { toast.error('Failed') }
  }

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) return toast.error('Fill name and price')
    setAddingItem(true)
    try {
      await api.post('/menu/items', {
        ...newItem, price: Number(newItem.price),
        prep_time_minutes: Number(newItem.prep_time_minutes),
        canteen_id: myCanteen.id,
      })
      toast.success('Menu item added!')
      const res = await api.get('/menu/items', { params: { canteen_id: myCanteen.id } })
      setMenuItems(res.data)
      setNewItem({ name: '', description: '', price: '', category: 'Main', prep_time_minutes: 10 })
    } catch { toast.error('Failed to add item') }
    setAddingItem(false)
  }

  const toggleAvailability = async (item) => {
    await api.patch(`/menu/items/${item.id}`, { is_available: !item.is_available })
    const res = await api.get('/menu/items', { params: { canteen_id: myCanteen.id } })
    setMenuItems(res.data)
  }

  // Batch orders by delivery location
  const batchedOrders = orders.reduce((acc, o) => {
    const loc = o.delivery_location || 'unknown'
    acc[loc] = acc[loc] || []
    acc[loc].push(o)
    return acc
  }, {})

  const STATUS_NEXT = { pending: 'preparing', preparing: 'ready', accepted: 'preparing' }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>

  return (
    <div className="fade-in">
      {myCanteen && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'var(--bg-card2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '2rem' }}>🍽️</span>
          <div>
            <h2 style={{ marginBottom: '2px' }}>{myCanteen.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{CANTEEN_LOCATIONS[myCanteen.location] || myCanteen.location}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <div className="stat-card">
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        {[['orders', '📦 Orders Queue'], ['menu', '📜 Menu Management'], ['batch', '🔄 Batch View']].map(([key, label]) => (
          <button key={key} className={`btn ${tab === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* Orders Queue */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No pending orders</div>}
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4>#{order.id.slice(-8).toUpperCase()}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>→ {order.delivery_location?.replace('_', ' ')}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {order.urgent && <span className="badge" style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--warning)' }}>⚡ URGENT</span>}
                  <span className={`badge badge-${order.status}`}>{order.status.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                {(order.items || []).map((item, i) => (
                  <div key={i} style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                    🍱 {item.name} <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span>
                    <span style={{ color: 'var(--primary)', marginLeft: 8, fontWeight: 700 }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              {STATUS_NEXT[order.status] && (
                <button className="btn btn-primary btn-sm"
                  onClick={() => updateOrderStatus(order.id, STATUS_NEXT[order.status])}>
                  ✅ Mark as {STATUS_NEXT[order.status].replace('_', ' ')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Batch View */}
      {tab === 'batch' && (
        <div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            🔄 Orders grouped by delivery location. Runner will batch-collect same-location orders.
          </p>
          {Object.entries(batchedOrders).map(([loc, bOrders]) => (
            <div key={loc} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4>📍 {loc.replace('_', ' ')}</h4>
                <span className="badge" style={{ background: 'rgba(255,107,53,0.15)', color: 'var(--primary)' }}>
                  {bOrders.length} order{bOrders.length > 1 ? 's' : ''} {bOrders.length > 1 ? '— BATCH' : ''}
                </span>
              </div>
              {bOrders.map(o => (
                <div key={o.id} style={{ padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 8, marginBottom: 6, fontSize: '0.85rem' }}>
                  #{o.id.slice(-6)} — {(o.items || []).map(i => i.name).join(', ')}
                  <span className={`badge badge-${o.status}`} style={{ marginLeft: 8 }}>{o.status}</span>
                </div>
              ))}
            </div>
          ))}
          {Object.keys(batchedOrders).length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No orders to batch</div>
          )}
        </div>
      )}

      {/* Menu Management */}
      {tab === 'menu' && (
        <div>
          {/* Add item form */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>➕ Add Menu Item</h3>
            <div className="grid-2" style={{ marginBottom: '1rem' }}>
              <div><label>Item Name *</label><input className="input" placeholder="e.g. Veg Biryani" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} /></div>
              <div><label>Price (₹) *</label><input className="input" type="number" placeholder="60" value={newItem.price} onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))} /></div>
              <div><label>Category</label>
                <select className="select" value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label>Prep Time (min)</label><input className="input" type="number" value={newItem.prep_time_minutes} onChange={e => setNewItem(n => ({ ...n, prep_time_minutes: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: '1rem' }}><label>Description</label><input className="input" placeholder="Describe the dish..." value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} /></div>
            <button className="btn btn-primary" onClick={addMenuItem} disabled={addingItem}>
              {addingItem ? '...' : '➕ Add to Menu'}
            </button>
          </div>

          {/* Menu grid */}
          <div className="menu-grid">
            {menuItems.map(item => (
              <div key={item.id} className="menu-item-card" style={{ opacity: item.is_available ? 1 : 0.5 }}>
                <div className="menu-item-img">🍽️</div>
                <div className="menu-item-body">
                  <div className="menu-item-name">{item.name}</div>
                  <div className="menu-item-desc">{item.category} • ⏱{item.prep_time_minutes}min</div>
                  <div className="menu-item-footer">
                    <span className="menu-item-price">₹{item.price}</span>
                    <button className={`btn btn-sm ${item.is_available ? 'btn-secondary' : 'btn-success'}`}
                      onClick={() => toggleAvailability(item)}>
                      {item.is_available ? '⛔ Disable' : '✅ Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CanteenDashboard() {
  return (
    <div className="main-content fade-in">
      <Routes>
        <Route index element={<CanteenHome />} />
        <Route path="menu" element={<CanteenHome />} />
        <Route path="analytics" element={<CanteenHome />} />
      </Routes>
    </div>
  )
}
