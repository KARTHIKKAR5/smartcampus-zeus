# Solution Approach
## SmartCampus Zeus — Dispatch & Logistics Engine

---

## Architecture Overview

We chose a **Centralized Dispatch with Decentralized Execution** model:
- A central server holds the order queue, runner availability, and routing graph
- Runners operate independently using instructions dispatched to their device
- Vendors see a live kitchen queue and mark orders ready

This avoids the complexity of a fully decentralized P2P system while still giving runners autonomy in execution.

---

## Core Components

### 1. Order Queue Manager (Vendor Side)
- Vendors receive incoming orders on a live dashboard
- Orders are sorted by prep time + distance to ensure FIFO fairness
- Kitchen marks order as "Ready for Pickup" — triggers runner assignment

### 2. Dispatch Engine
The central algorithm that assigns orders to runners.

**Scoring formula per runner:**
```
score = (1 / distance_to_vendor) * availability_weight * load_factor
```
- `distance_to_vendor`: graph distance from runner's current position to kitchen
- `availability_weight`: 1.0 if idle, 0.6 if carrying 1 order, 0 if at capacity
- `load_factor`: penalizes runners already carrying maximum batch size

The runner with the **highest score** gets assigned the order.

### 3. Batch Optimizer
Before dispatching, the engine checks if any pending orders share the same destination building. If yes, they are grouped into a single batch for one runner.

**Batching rule:** Up to 3 orders per runner if all destinations are within 150m of each other (configurable threshold).

### 4. Route Optimizer
Built on **NetworkX** (open-source Python graph library).
- Campus map modeled as a weighted graph (nodes = corridors/junctions, edges = walking paths with distance weights)
- Dijkstra's algorithm finds the shortest path from kitchen → drop zone
- Indoor nodes have higher weights than outdoor paths to account for navigation complexity

### 5. Dynamic Fee Calculator
```
base_fee = 5  # INR
distance_fee = distance_in_meters * 0.02
urgency_multiplier = 1.5 if express else 1.0
final_fee = (base_fee + distance_fee) * urgency_multiplier
```

### 6. Drop Zone Verification
- Each Drop Zone has a unique QR code linked to GPS coordinates
- Runner scans QR on delivery → system validates match with order's destination
- If mismatch: delivery flagged, runner notified to correct location

### 7. Internal E-Wallet
- Students top up wallet via UPI/card (one-time)
- All transactions are internal ledger entries (no payment gateway per order)
- Vendor payouts calculated daily from ledger totals

---

## Tech Stack Justification

| Choice | Reason |
|---|---|
| Python | Fast prototyping, rich algorithm libraries (NetworkX, heapq) |
| NetworkX | Best open-source graph library for routing — no API key needed |
| SQLite | Zero-config database for demo; swap to PostgreSQL for scale |
| WebSockets | Real-time order status without polling — lightweight |
| OpenStreetMap | Free campus map data — no Google Maps billing |

---

## Edge Cases Handled

| Edge Case | Handling |
|---|---|
| Runner cancels mid-delivery | Order re-dispatched to next available runner |
| Vendor closes early | Orders auto-refunded to wallet, student notified |
| Two runners score equally | Tie-broken by lower current load |
| QR scan fails | Manual GPS coordinate fallback with admin review flag |
| Student unreachable at drop zone | Runner waits 5 min → returns order → partial refund |

---

*Solution Approach Document | SmartCampus Zeus | SRU Hackathon SC-02*
