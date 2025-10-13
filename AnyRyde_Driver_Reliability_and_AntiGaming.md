# AnyRyde Driver Reliability & Anti-Gaming System

## 🎯 Goals
- **Reliability Score** separate from rider star ratings, based on **bid behavior**, **acceptance**, **cancellations**, and **on-time pickup**.
- **Transparent:** visible to drivers, riders (summary), and admins (full detail).
- **Anti-gaming:** cooldowns + lockouts that reduce “bid → win → cancel → re-bid” manipulation.
- **Configurable:** thresholds, decay, exemptions, and cooldown durations can be tuned per market.

---

## ⚙️ Core Events & Definitions
We already have `ride` and `bid` concepts. Standardized events include:

- `bid_submitted(bid_id, ride_id, driver_id, amount, ts)`
- `bid_withdrawn(bid_id, reason, ts)`
- `bid_awarded(ride_id, driver_id, ts)`
- `ride_driver_accept(ride_id, driver_id, ts)`
- `ride_driver_cancel(ride_id, driver_id, reason_code, ts)`
- `ride_started(ride_id, ts)`
- `ride_completed(ride_id, ts)`
- `driver_arrival(ride_id, ts)` with `pickup_eta_delta_minutes`

**Reason codes:** `VEHICLE_ISSUE`, `RIDER_NO_SHOW`, `EMERGENCY`, `DOUBLE_BOOKED`, `PRICE_MANIPULATION_SUSPECTED`, etc.

---

## 🧮 Reliability Score (Separate from 5-Star Ratings)

### Inputs (Rolling Window, Default 90 Days)
- **Acceptance Rate (AR)** = awarded rides accepted / awarded rides
- **Cancellation Rate (CR)** = driver-initiated cancels / accepted rides
- **On-time Arrival (OTA)** = pickups within threshold (≤3 min late)
- **Bid Honoring (BH)** = % of awarded bids not canceled before pickup

### Formula (Configurable Weights)
```
ReliabilityScore = 100
  * ( w1 * clamp01(AR)
    + w2 * clamp01(1 - CR)
    + w3 * clamp01(OTA)
    + w4 * clamp01(BH) )
```
Default weights: `w1=0.30, w2=0.30, w3=0.25, w4=0.15`

| Range | Label | Meaning |
|--------|--------|----------|
| 90–100 | Excellent | Highly dependable |
| 75–89 | Good | Reliable |
| 60–74 | Watch | Needs improvement |
| <60 | At Risk | Subject to review/coaching |

### Decay & Minimums
- Use last **50 awarded rides** or **90 days**, whichever yields more data.
- Exempt verified cancellations (see Exemptions).

### Visibility
| User | View |
|------|------|
| **Driver** | Full score breakdown and trends |
| **Rider** | Summary badge (e.g., "Reliability: 92/100") |
| **Admin** | Full event log, scores, and overrides |

---

## 🚫 Anti-Gaming Controls

### 1. Per-Ride Re-Bid Lock
If a driver cancels after being awarded, they **cannot bid again** on that ride.

```
driver_eligibility[driver_id][ride_id] = LOCKED_AFTER_CANCEL
```

- Duration: permanent for that ride.

### 2. Global Cooldown After Awarded Cancel
If a driver cancels an awarded ride:
- Lock new bid submissions for a **global cooldown** (default **120 seconds**).
- Skip if cancel reason is on the **exempt** list.

### 3. Rapid Bid-Churn Throttling (Optional)
Limit repeated bid edits before award:
- Max **3 bid changes** on same ride in 2 minutes.

### 4. Price-Manipulation Heuristics (Optional)
Detect patterns like “bid high → cancel → re-bid higher.”  
Flag for admin review; no auto-ban.

---

## 🧭 UX Behavior (Driver)

### On Cancel (Awarded Ride)
> "Heads up: canceling an awarded ride adds a short bidding cooldown (2 min) and affects your Reliability Score."

If reason is **potentially exempt** (e.g., "Rider no-show"), prompt for selection.

### During Cooldown
> "Bidding locked for 1:47 due to recent cancellation."

### Reliability Card
> "Your Reliability: 86/100 (Good) — 95% on-time pickups, 3% cancellations."

---

## ⚖️ Fairness & Exemptions

### Automatically Exempt
- Rider no-show (validated by GPS + wait logs)
- Platform fault (system outage)
- Emergency (admin-approved)

### Temporarily Counted Then Reversed
Provisional penalties are reversed after validation (e.g., no-show proof).

---

## 🧱 Data Model

### `driver_metrics_daily`
| driver_id | date | awarded | accepted | cancels | ontime_pickups | honored_bids |
|------------|------|----------|-----------|----------|----------------|---------------|

### `driver_reliability_scores`
| driver_id | score | window_start | window_end | ar | cr | ota | bh | updated_at |
|------------|--------|---------------|-------------|----|----|----|----|-------------|

### `driver_cooldowns`
| driver_id | until_ts | reason |
|------------|-----------|--------|

### `bid_eligibility`
| ride_id | driver_id | status | note |
|----------|------------|--------|------|

### `ride_driver_cancel_events`
| ride_id | driver_id | ts | reason_code | provisional | validated |
|----------|------------|----|--------------|-------------|------------|

---

## 🧩 APIs

### POST `/bids`
Checks cooldowns/locks before accepting bids.  
**Response if blocked:**
```json
{
  "error": "BID_COOLDOWN",
  "retrySec": 73
}
```

### POST `/rides/{id}/cancel` (driver)
Handles reason codes and provisional penalties.

### GET `/drivers/{id}/reliability`
Returns reliability components and tips.

### GET `/rides/{id}/driver-eligibility`
Determines if driver can bid and why not.

---

## 🕒 Scoring Engine (Stream + Batch)
Recomputes score on major events or nightly rollup.

**Pseudocode:**
```pseudo
on Event(e):
  u = counters[driver_id]
  if e == bid_awarded: u.awarded++
  if e == ride_driver_accept: u.accepted++
  if e == ride_driver_cancel and !exempt(e): u.driver_cancels++
  if e == driver_arrival: u.ontime += (e.eta_delta <= 3min)
  if e == bid_awarded: u.honored_candidates++
  if e == ride_started and last_award_by_driver: u.honored++
  score = calc(u)
  upsert driver_reliability_scores
```

---

## 🧮 Admin Dashboard
- **Driver Profile Panel:** Reliability trend, breakdown, and history.
- **Heatmap:** Average score by region/time.
- **Flags:** Top drivers by post-award cancels.
- **Controls:** Validate exemptions, adjust score, send coaching message.

---

## 💻 Front-End Hooks

### Driver App
- `Place Bid` checks `/driver-eligibility` before enabling.
- Cooldown countdown visible on lock.
- Reliability Card + "Improve" link.

### Rider App
- Reliability badge on driver profile.

### Admin Web
- Full visibility and overrides.

---

## 🚀 Rollout Plan

| Phase | Feature | Description |
|--------|-----------|-------------|
| 0 | Shadow Mode | Compute scores silently, collect data |
| 1 | Soft Launch | Enable per-ride lock + 60s cooldown, visible to drivers only |
| 2 | Full Launch | Public badge, extend cooldown to 120s |
| 3 | Review | Tune weights & thresholds |

**KPIs:** cancel-after-award rate, bid-to-start conversion, rider wait times, driver earnings variance.

---

## 🗣️ Copy & Strings

**Cancel Modal:**  
> Canceling an awarded ride starts a short cooldown and may reduce your Reliability Score. Choose a reason:

**Cooldown Toast:**  
> Bidding locked for **{mm:ss}** due to recent cancellation.

**Reliability Card:**  
> Reliability 86/100 (Good) — Based on honoring awarded rides, low cancellations, and on-time pickups.

**Rider Tooltip:**  
> Reliability reflects a driver’s punctuality and consistency accepting and honoring rides.

---

## ⚙️ Config Flags

```
DRIVER_SCORE_WINDOW_DAYS=90
DRIVER_SCORE_MIN_AWARDED=20
DRIVER_SCORE_WEIGHTS=AR:0.30,CR:0.30,OTA:0.25,BH:0.15
DRIVER_CANCEL_GLOBAL_COOLDOWN_SEC=120
BID_EDIT_LIMIT_PER_RIDE=3
BID_EDIT_LIMIT_WINDOW_SEC=120
ON_TIME_THRESHOLD_MIN=3
EXEMPT_CANCEL_CODES=RIDER_NO_SHOW,PLATFORM_FAULT,EMERGENCY_APPROVED
```

---

## 💡 Extras / Ideas

### Soft Guarantees
Slightly boost bid ranking for high-reliability drivers (e.g., +2% weight in selection logic).

### Coaching System
After repeated cancels or low score, send micro-tips:
> “Accept only rides you can start within 15 minutes.”

### Appeals Flow
Drivers can request review of penalties; admins toggle exemption.

### Future Enhancements
- Gamify reliability with badges or bonuses.
- Integrate reliability score into driver incentive payouts.
- Machine-learning flagging for abnormal cancel clusters.
- Weekly driver summary emails with metrics and trends.

---

## ✅ Summary

| Feature | Description |
|----------|--------------|
| Reliability Score | Internal metric for driver consistency |
| Visible To | Drivers, riders (summary), admins |
| Cooldowns | 2 min global after awarded cancel |
| Re-bid Lock | Prevents re-bidding same ride |
| Exemptions | No-show, emergencies, system faults |
| Data Retention | Rolling 90-day window |
| Fairness | Validations, appeals, configurable weights |
| Purpose | Reduce manipulation, improve reliability & trust |
