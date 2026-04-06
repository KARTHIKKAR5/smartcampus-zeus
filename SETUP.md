# 🚀 The Last Meal Mile — Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Supabase](https://supabase.com) account

---

## Step 1: Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and paste the contents of `backend/supabase_schema.sql`
3. Click **Run** — this creates all tables + seeds canteen data
4. Copy your **Project URL**, **anon key**, and **service role key** from Settings → API

---

## Step 2: Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create your `.env` file:
```bash
copy .env.example .env
```
Edit `.env`:
```
SUPABASE_URL=https://apvedmflazqvhgcybjes.supabase.co
SUPABASE_KEY=sb_publishable_DyIQ3xJwjnO0oHLbRhoVYQ_OA96XmrD
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdmVkbWZsYXpxdmhnY3liamVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ2MzMyMCwiZXhwIjoyMDkxMDM5MzIwfQ.70CPjQEtQVRPADkjGo8HBJF8LVoK86flUBiburpiSwQ
SECRET_KEY=sb_secret_qFywOZ842uItXtAyCQt54Q_Coa-3pJf
```

Start the backend:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

---

## Step 3: Frontend Setup

```bash
cd frontend
npm install
```

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

Start frontend:
```bash
npm run dev
```

Frontend available at: http://localhost:5173

---

## Roles & Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sruniversity.edu | Admin@123 |
| Student | student@sruniversity.edu | Student@123 |
| Runner | runner@sruniversity.edu | Runner@123 |
| Canteen Owner | canteen@sruniversity.edu | Canteen@123 |

> **Note**: These demo accounts need to be created first via the signup page or API.

---

## Features Matrix

| Feature | Status | Details |
|---------|--------|---------|
| Auth (4 roles) | ✅ | JWT + Supabase + bcrypt |
| Student ordering | ✅ | Menu, cart, canteen selection |
| Dijkstra routing | ✅ | NetworkX graph of SR University |
| Batch engine | ✅ | Groups orders by delivery location |
| E-Wallet payment | ✅ | Balance, top-up, deduction |
| QR generation | ✅ | Auto per-order QR code (base64) |
| QR scanning | ✅ | html5-qrcode in-browser camera |
| Real-time chat | ✅ | WebSocket per order, auto-disables |
| Runner dashboard | ✅ | Accept, route map, QR scan |
| Admin analytics | ✅ | Charts, runner perf, campus graph |
| Canteen dashboard | ✅ | Orders queue, batch view, menu mgmt |
| OpenStreetMap | ✅ | Leaflet + OSM tiles (SR University) |
| Ratings | ✅ | Food + Speed 1-5 stars |
| Urgent delivery | ✅ | +₹10 surcharge |

---

## Architecture

```
Frontend (React + Vite + Leaflet)
        ↓ REST API (axios)
Backend (FastAPI)
  ├── Auth (JWT + bcrypt, 4 roles)
  ├── Menu & Canteens
  ├── Orders + Dijkstra (NetworkX)
  ├── Batch Engine (location grouping)
  ├── QR (qrcode lib)
  ├── Chat (WebSocket per order)
  ├── Wallet (internal ledger)
  └── Analytics (Pandas + Chart.js)
        ↓
Supabase (PostgreSQL)
  ├── users
  ├── canteens
  ├── menu_items
  ├── orders
  ├── ratings
  ├── messages
  └── wallet_transactions
```

---

## Dijkstra Route Optimization

The campus graph has **14 nodes** and **23 edges** representing SR University buildings.
Each edge has a weight in meters. When a student places an order:

1. FastAPI calls `dijkstra_shortest_path(canteen_location, delivery_location)`
2. NetworkX computes the shortest path
3. Delivery fee = `₹5 base + ₹1 per 100m + ₹10 if urgent`
4. Route is returned to frontend as ordered lat/lon waypoints
5. Leaflet draws the orange dashed polyline on the map

## Batch Engine

When multiple orders have the same `delivery_location`:
- Backend detects pending orders going to same node
- Runner is notified via batch_info in the response
- Canteen **Batch View** shows grouped orders
- Runner collects all batched orders in one pickup

---

## Campus Graph (SR University nodes)
- Main Gate → Admin Block → Central Canteen → Juice Center → Block A/B
- Block A → Library → Hostels → Sports Complex
- Food Court 2 → Lab Block → Auditorium
- 23 connecting edges with real walking distances
