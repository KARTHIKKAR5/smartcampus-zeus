# Problem Understanding Document
## SmartCampus Zeus — SC-02: The Last-Mile Meal

---

## The Core Problem

A university campus of 15,000 students is geographically split. The central food court cannot serve everyone efficiently. Students in distant labs and libraries face three bad choices: walk far and lose study time, skip meals, or order from external delivery apps.

External delivery apps introduce two serious problems:
- **Security risk**: outside drivers entering campus without verification
- **Environmental cost**: excessive single-use plastic packaging per order

---

## Pain Points We Are Solving

### 1. No Dispatch Logic
The current "call-in advance" system assigns orders manually with no intelligence. Runners are allocated arbitrarily, causing uneven workload and longer wait times.

### 2. No Real-Time Tracking
Neither the student nor the vendor knows where the order is after it leaves the kitchen. There is no status update, no ETA, no accountability.

### 3. Payment Chaos
Cash-based or informal payment systems cause disputes, incorrect change, and no record-keeping. There is no digital trail for vendor revenue reporting.

### 4. Cold Food & Lost Runners
Campus indoor corridors are complex. Runners unfamiliar with the layout deliver late or to the wrong location. Cold food = poor experience = system distrust.

### 5. No Batching
Multiple orders going to the same building are fulfilled by separate runners. This wastes runner capacity and increases delivery time per order.

### 6. No Runner Accountability
There is no rating system, shift management, or performance record for student runners. This creates inconsistency and no incentive for quality.

---

## Stakeholders

| Stakeholder | Current Pain | What They Need |
|---|---|---|
| Student (Buyer) | Long waits, cold food, no tracking | Real-time status, fair pricing |
| Runner | No navigation, unfair load | Route guidance, fair order batching |
| Vendor (Kitchen) | Order chaos, unclear queue | Digital order queue, prep time signals |
| Admin | No visibility into delivery traffic | Dashboard with metrics |

---

## Scope of This Solution

This system addresses the **dispatch layer and logistics engine** — the intelligence that coordinates who picks up what, when, and how. A fully deployed production app is not the goal. The goal is to demonstrate that smart logic can turn a broken manual process into an efficient automated one.

---

*1-page summary | SmartCampus Zeus | SRU Hackathon SC-02*
