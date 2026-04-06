# Limitations & Future Scope
## SmartCampus Zeus — SC-02

---

## Current Limitations

### 1. Static Campus Map
The routing graph is hand-coded as a static set of nodes and edges. In a real deployment, this would need to integrate with a live floor plan or GIS system. Adding or modifying campus corridors requires code changes.

### 2. No Real Indoor Navigation
The current route optimizer works on 2D coordinate distance. It does not account for:
- Staircases and elevators (floor changes)
- Doors that may be locked at certain times
- Temporary construction or blocked corridors

### 3. Simulation Only — No Live UI
The dispatch engine and route optimizer run as command-line simulations. There is no live frontend or mobile app in this submission. A real deployment would need a runner app (React Native / Flutter) and a student-facing PWA.

### 4. No Payment Gateway Integration
The e-wallet is a ledger simulation. Actual money movement (UPI top-up, vendor payouts) requires integration with a payment processor (Razorpay, etc.), which was excluded to meet the no-paid-API constraint.

### 5. Single-Campus Only
The system assumes one central kitchen/vendor. Multi-vendor support (several food stalls dispatching simultaneously) requires a more complex queue arbitration layer.

### 6. No Machine Learning
The dispatch scoring is rule-based. Predicting surge times, optimal batch windows, and runner fatigue patterns would benefit from an ML layer that is not yet implemented.

---

## Future Scope

| Feature | Description | Priority |
|---|---|---|
| Multi-vendor dispatch | Parallel queues for multiple kitchens, cross-vendor batching | High |
| Indoor positioning | BLE beacon integration for real-time runner location inside buildings | High |
| Runner mobile app | React Native app with turn-by-turn indoor navigation | High |
| ML demand forecasting | Predict peak hours and pre-position runners near kitchens | Medium |
| Carbon tracking | Track plastic usage saved vs external delivery apps | Medium |
| Gamification | Runner leaderboards, badges, bonus credits for top performers | Low |
| Multi-campus support | Federated dispatch across multiple university campuses | Low |

---

## Scalability Notes

The current architecture can scale with these changes:
- Replace SQLite with PostgreSQL + connection pooling for concurrent users
- Replace WebSocket single-server with Redis Pub/Sub for horizontal scaling
- Containerize with Docker + deploy on a university-managed VM (no cloud costs)
- Rate-limit the dispatch engine to handle lunch-rush surge (1000+ simultaneous orders)

---

*Limitations & Future Scope | SmartCampus Zeus | SRU Hackathon SC-02*
