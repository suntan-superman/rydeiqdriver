# AnyRyde Driver Bid Pricing System

## 🧭 Overview

This document outlines the initial design for AnyRyde's dynamic driver bidding system. The goal is to generate suggested bids for drivers based on:
- Pickup distance
- Ride distance
- Time-of-day pricing windows
- Scheduled ride time
- Current vs. scheduled location (if already on a ride)

## 🧠 Pricing Logic

### Rate Schedule Structure (Per Driver)

```json
{
  "defaultRate": {
    "pickup": 1.00,
    "destination": 2.00
  },
  "timeBlocks": [
    {
      "start": "06:00",
      "end": "09:00",
      "pickup": 1.25,
      "destination": 2.50
    },
    {
      "start": "11:30",
      "end": "13:00",
      "pickup": 1.10,
      "destination": 2.25
    },
    {
      "start": "16:00",
      "end": "18:00",
      "pickup": 1.30,
      "destination": 2.75
    },
    {
      "start": "01:00",
      "end": "03:00",
      "pickup": 1.50,
      "destination": 3.00
    }
  ]
}
```

### Suggested Bid Formula

```
Suggested Bid = (pickup_miles × pickup_rate) + (ride_miles × destination_rate)
```

### Time Block Selection

- Uses **scheduled ride time** (not current time)
- Falls back to `defaultRate` if no block matches

### In-Ride Logic

If driver is already on a ride:
- Use drop-off location of current ride as new origin
- Reject rides where scheduled pickup is earlier than estimated drop-off

---

## 🧪 Roadmap

| Phase | Feature |
|-------|---------|
| ✅ Now | Time-based rate windows (4 blocks) per driver |
| 🔜 Next | Use scheduled time for lookup, not current time |
| 🔜 Next | Adjust for in-progress rides (drop-off → pickup) |
| Later | Day-of-week modifiers, surge logic, or AI guidance |

---

## 🎨 UI Ideas (Driver App)

### A. Rate Settings Screen

- **Sectioned by Time Block**
  - Editable start/end time
  - Two fields: price per mile to pickup and to destination
- "Default Rate" block at the bottom

### B. Suggested Bid Preview

- When a ride is offered:
  - Show total distance to pickup and ride distance
  - Show time block applied
  - Display calculated base bid with an "edit" button

### C. In-Ride Warning

- If a driver is mid-ride and the new ride request conflicts with drop-off time:
  - Show alert: "Ride overlaps with current trip"
  - Disable auto-bid

### D. Auto-Bid Toggle

- Optional toggle: "Automatically bid based on my rates"

---

## 🔐 Future Enhancements

- Learn from driver acceptance/rejection patterns
- Competitive pricing guidance (“your bid is X% higher than avg”)
- Advanced analytics by time block, area, and ride type