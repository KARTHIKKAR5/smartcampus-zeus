# 🚀 SmartCampus Zeus
### SC-02: The Last-Mile Meal — Campus Delivery & Logistics Engine
**SRU Coding Club Hackathon**

---

## 📌 Problem Statement
A university campus of 15,000 students lacks a smart internal food delivery system. Students in distant labs and libraries skip meals or rely on external delivery apps (causing security and waste issues). The existing "canteen takeaway" system has no tracking, messy payments, and runners often deliver cold food because there is no dispatch logic or indoor navigation.

## 🎯 Our Solution
A **Peer-to-Peer Campus Delivery & Logistics Engine** that connects Students (Buyers), Runners (Deliverers), and Vendors (Kitchens) through a centralized dispatch system with:
- Smart route optimization within campus boundaries
- Real-time order queue management
- Batch delivery logic (one runner, multiple orders, same building)
- QR-based Drop Zone verification
- Internal e-wallet & credit system

---

## 🗂 Repository Structure

| Folder | Contents |
|---|---|
| `architecture/` | System design diagram + component interaction map |
| `documentation/` | Problem understanding doc + solution approach doc |
| `slides/` | Final pitch deck (max 10 slides) |
| `source-code/` | Core logic: dispatch, routing, batching algorithms |
| `limitations/` | Limitations & future scope document |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend Logic | Python 3.x |
| Route Optimization | NetworkX (open-source graph library) |
| Maps / Indoor Navigation | OpenStreetMap + Leaflet.js |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT Tokens |
| Payments | Internal credit ledger (no external APIs) |
| Real-time Queue | WebSockets (no paid service) |

> All tools used are **100% open-source** — no paid APIs or subscriptions.

---

## 👥 Team Members

| Name | Role |
|---|---|
| Member 1 | System Architecture + Backend Logic |
| Member 2 | Algorithm & Optimization Engineer |
| Member 3 | Frontend / Demo + Slides |
| Member 4| Documentation + Integration + QA Engineer |


---

## 🚀 How to Run the Core Logic

```bash
# Clone the repo
git clone https://github.com/KARTHIKKAR5/smartcampus-zeus.git
cd smartcampus-zeus/source-code

# Install dependencies
pip install -r requirements.txt

# Run dispatch simulation
python dispatch_logic.py
```
WEBSITE ACCESS LINK https://smartcampus-run.netlify.app/

---

## 📊 Key Algorithms
1. **Dispatch Engine** — assigns orders to nearest available runner using weighted scoring
2. **Batch Optimizer** — groups orders going to the same building to reduce trips
3. **Dynamic Fee Calculator** — calculates delivery fee based on distance + urgency
4. **Drop Zone Verifier** — validates delivery location via QR code / GPS coordinate match

---

*Built for SRU Coding Club Hackathon | Problem SC-02*
