import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import CampusMap from '../../components/CampusMap'
import ChatBox from '../../components/ChatBox'
import toast from 'react-hot-toast'

const CAMPUS_NODES = [
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

// ─── Order Food (Menu) ───────────────────
function OrderFood() {
  const { user, refreshUser } = useAuth()
  const [canteens, setCanteens] = useState([])
  const [selectedCanteen, setSelectedCanteen] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [deliverTo, setDeliverTo] = useState(user?.location || 'block_a')
  const [urgent, setUrgent] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [graphData, setGraphData] = useState(null)
  const [category, setCategory] = useState('All')

  useEffect(() => {
    api.get('/menu/canteens').then(r => {
      setCanteens(r.data)
      if (r.data.length) selectCanteen(r.data[0])
    })
    api.get('/analytics/campus-graph').then(r => setGraphData(r.data)).catch(() => {})
  }, [])

  const selectCanteen = async (c) => {
    setSelectedCanteen(c)
    setCart([])
    const res = await api.get('/menu/items', { params: { canteen_id: c.id } })
    setMenuItems(res.data)
  }

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.menu_item_id === item.id)
      if (ex) return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
    toast.success(`${item.name} added!`, { duration: 1200 })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.menu_item_id !== id))

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryFee = Math.round(5 + (150 / 100)) + (urgent ? 10 : 0)
  const grandTotal = cartTotal + deliveryFee

  const placeOrder = async () => {
    if (!cart.length) return toast.error('Cart is empty')
    if (!selectedCanteen) return toast.error('No canteen selected')
    setPlacing(true)
    try {
      const res = await api.post('/orders/place', {
        canteen_id: selectedCanteen.id,
        canteen_location: selectedCanteen.location,
        delivery_location: deliverTo,
        items: cart,
        urgent,
      })
      setLastOrder(res.data)
      setCart([])
      refreshUser()
      toast.success('🎉 Order placed!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  const categories = ['All', ...new Set(menuItems.map(i => i.category))]
  const filtered = category === 'All' ? menuItems : menuItems.filter(i => i.category === category)

  if (lastOrder) {
    return (
      <div className="fade-in">
        <div className="card" style={{ textAlign: 'center', padding: '3rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: 'var(--success)', marginBottom: '8px' }}>Order Placed!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Your food is being prepared. Runner will deliver to{' '}
            <strong>{CAMPUS_NODES.find(n => n.id === deliverTo)?.label}</strong>
          </p>
          {lastOrder.batch_info && (
            <div style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1rem' }}>
              🔄 {lastOrder.batch_info.message}
            </div>
          )}
          <div className="grid-2" style={{ maxWidth: 400, margin: '0 auto 1.5rem' }}>
            <div className="stat-card">
              <div className="stat-value">₹{lastOrder.order?.total_amount?.toFixed(0)}</div>
              <div className="stat-label">Total Paid</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round(lastOrder.route?.distance_meters || 0)}m</div>
              <div className="stat-label">Delivery Distance</div>
            </div>
          </div>
          {/* QR Code */}
          {lastOrder.order?.qr_code && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>🔐 Your Delivery QR</h3>
              <img src={lastOrder.order.qr_code} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12, border: '2px solid var(--border)' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Show this to the runner at delivery</p>
            </div>
          )}
          {/* Route map */}
          {lastOrder.route?.path?.length > 0 && graphData && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>🗺️ Delivery Route</h3>
              <CampusMap graphData={graphData} routePath={lastOrder.route.path} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setLastOrder(null)}>🍱 Order Again</button>
            <a href="/student/orders" className="btn btn-secondary">📦 My Orders</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Canteen selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>🍽️ Choose a Canteen</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canteens.map(c => (
            <button key={c.id}
              className={`btn ${selectedCanteen?.id === c.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => selectCanteen(c)}>
              {canteenIcon(c.name)} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Menu */}
        <div>
          {/* Categories */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategory(cat)}>{cat}</button>
            ))}
          </div>
          <div className="menu-grid">
            {filtered.map(item => (
              <div key={item.id} className="menu-item-card" onClick={() => addToCart(item)}>
                <div className="menu-item-img">{foodEmoji(item.category)}</div>
                <div className="menu-item-body">
                  <div className="menu-item-name">{item.name}</div>
                  <div className="menu-item-desc">{item.description}</div>
                  <div className="menu-item-footer">
                    <span className="menu-item-price">₹{item.price}</span>
                    <div>
                      <span className="menu-item-prep">⏱ {item.prep_time_minutes}min</span>
                      <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}
                        onClick={e => { e.stopPropagation(); addToCart(item) }}>+ Add</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
              No items available
            </div>
          )}
        </div>

        {/* Cart */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <h3 style={{ marginBottom: '1rem' }}>🛒 Your Cart</h3>
            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>Empty cart</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
                {cart.map(item => (
                  <div key={item.menu_item_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>×{item.quantity}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>₹{item.price * item.quantity}</span>
                      <button onClick={() => removeFromCart(item.menu_item_id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Delivery config */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <label>📍 Deliver to</label>
              <select className="select" value={deliverTo} onChange={e => setDeliverTo(e.target.value)} style={{ marginBottom: '10px' }}>
                {CAMPUS_NODES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: 0 }}>
                <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
                <div>
                  <span style={{ color: 'var(--warning)', fontWeight: 700 }}>⚡ Urgent Delivery (+₹10)</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivered faster — priority runner</div>
                </div>
              </label>
            </div>

            {/* Totals */}
            {cart.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>Items Total</span><span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>Delivery Fee {urgent && <span style={{ color: 'var(--warning)' }}>⚡</span>}</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <span>Total</span><span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={placeOrder} disabled={placing || cart.length === 0}>
              {placing ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : '💳 Pay & Place Order'}
            </button>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
              Paid from e-Wallet • PhonePe / GPay style
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── My Orders ───────────────────
function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [chatOrder, setChatOrder] = useState(null)
  const [ratingOrder, setRatingOrder] = useState(null)
  const [rating, setRating] = useState({ food_rating: 5, speed_rating: 5, comment: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/my-orders').then(r => { setOrders(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const submitRating = async () => {
    try {
      await api.post('/orders/rate', { order_id: ratingOrder.id, ...rating })
      toast.success('Rating submitted! ⭐')
      setRatingOrder(null)
    } catch { toast.error('Failed to rate') }
  }

  const STATUS_ORDER = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered']

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: '1.5rem' }}>📦 My Orders</h2>
      {orders.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No orders yet — go order some food! 🍱</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.map(order => {
          const done = order.status === 'delivered' || order.status === 'cancelled'
          const statusIdx = STATUS_ORDER.indexOf(order.status)
          return (
            <div key={order.id} className="order-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4>Order #{order.id.slice(-8).toUpperCase()}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge badge-${order.status}`}>{order.status.replace('_', ' ').toUpperCase()}</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{order.total_amount}</span>
                </div>
              </div>

              {/* Status tracker */}
              <div className="status-tracker" style={{ marginBottom: '1rem' }}>
                {STATUS_ORDER.slice(0, 6).map((s, i) => (
                  <div key={s} style={{ display: 'flex', flex: 1, alignItems: 'center', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      {i > 0 && <div style={{ flex: 1, height: 2, background: i <= statusIdx ? 'var(--success)' : 'var(--border)' }} />}
                      <div className={`status-dot ${i < statusIdx ? 'done' : i === statusIdx ? 'active' : ''}`}>
                        {i < statusIdx ? '✓' : i + 1}
                      </div>
                      {i < 5 && <div style={{ flex: 1, height: 2, background: i < statusIdx ? 'var(--success)' : 'var(--border)' }} />}
                    </div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
                      {s.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div style={{ marginBottom: '1rem' }}>
                {(order.items || []).map((item, i) => (
                  <span key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: 12 }}>
                    {item.name} ×{item.quantity}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* QR */}
                {order.qr_code && (
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    const w = window.open()
                    w.document.write(`<img src="${order.qr_code}" style="width:300px" />`)
                  }}>
                    🔐 Show QR
                  </button>
                )}
                {!done && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setChatOrder(order)}>
                    💬 Chat Runner
                  </button>
                )}
                {order.status === 'delivered' && (
                  <button className="btn btn-primary btn-sm" onClick={() => setRatingOrder(order)}>
                    ⭐ Rate Order
                  </button>
                )}
              </div>

              {chatOrder?.id === order.id && (
                <div style={{ marginTop: '1rem' }}>
                  <ChatBox orderId={order.id} disabled={done} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Rating modal */}
      {ratingOrder && (
        <div className="qr-modal-overlay" onClick={() => setRatingOrder(null)}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem' }}>⭐ Rate Your Order</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label>Food Quality</label>
              <div className="star-rating">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className="star" onClick={() => setRating(r => ({ ...r, food_rating: s }))}
                    style={{ color: s <= rating.food_rating ? '#FFD700' : 'var(--text-muted)' }}>★</span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Delivery Speed</label>
              <div className="star-rating">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className="star" onClick={() => setRating(r => ({ ...r, speed_rating: s }))}
                    style={{ color: s <= rating.speed_rating ? '#FFD700' : 'var(--text-muted)' }}>★</span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label>Comment (optional)</label>
              <textarea className="input" style={{ height: 80, resize: 'none' }}
                value={rating.comment} onChange={e => setRating(r => ({ ...r, comment: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitRating}>Submit Rating</button>
              <button className="btn btn-secondary" onClick={() => setRatingOrder(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Wallet ───────────────────
function Wallet() {
  const { user, refreshUser } = useAuth()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const UPI_AMOUNTS = [50, 100, 200, 500, 1000]

  const topup = async (amt) => {
    setLoading(true)
    try {
      await api.post(`/orders/wallet/topup?amount=${amt}`)
      toast.success(`₹${amt} added to wallet! 💳`)
      refreshUser()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Top-up failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: '1.5rem' }}>💳 E-Wallet</h2>
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #FF6B35, #c0392b)', border: 'none', textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px' }}>Available Balance</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
            ₹{(user?.wallet_balance || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '8px' }}>SR University Campus Wallet</div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>💡 Payment Info</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['📱 PhonePe Integration', '💰 Google Pay', '🏦 UPI Transfer', '💳 Campus Card'].map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)' }}>{p}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>💳 Top Up Wallet</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {UPI_AMOUNTS.map(a => (
            <button key={a} className="btn btn-secondary" onClick={() => topup(a)} disabled={loading}>
              + ₹{a}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input className="input" type="number" placeholder="Custom amount (₹)"
            value={amount} onChange={e => setAmount(e.target.value)} style={{ maxWidth: 200 }} />
          <button className="btn btn-primary" disabled={loading || !amount}
            onClick={() => { topup(Number(amount)); setAmount('') }}>
            Add to Wallet
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Student Dashboard root ───────────────────
export default function StudentDashboard() {
  return (
    <div className="main-content fade-in">
      <Routes>
        <Route index element={<OrderFood />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="track" element={<OrderFood />} />
      </Routes>
    </div>
  )
}

function canteenIcon(name) {
  if (name.toLowerCase().includes('juice')) return '🧃'
  if (name.toLowerCase().includes('court')) return '🍱'
  return '🍽️'
}

function foodEmoji(category) {
  const map = {
    'Meals': '🍱', 'Chinese': '🥡', 'Main': '🍛', 'Salads': '🥗',
    'Soups': '🍜', 'Sweets': '🍮', 'Breakfast': '🥞',
    'Juices': '🧃', 'Smoothies': '🥤', 'Drinks': '🥛', 'Snacks': '🥨'
  }
  return map[category] || '🍽️'
}
