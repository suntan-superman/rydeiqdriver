# AnyRyde Driver Video Recording Kit  
*(Pilot Program Overview — Rider-Requested Recording)*

## 🎯 Objective
Provide AnyRyde drivers with a **low-cost, privacy-compliant in-vehicle camera kit** that can record both exterior and interior video **only when requested by a rider**.  

The goal is to:
- Improve rider and driver safety  
- Support dispute resolution  
- Maintain rider privacy and consent compliance  

---

## 📦 Recommended Kit Components

| Component | Model / Notes | Approx. Cost |
|------------|----------------|---------------|
| **Dual Dash Cam (Front + Cabin)** | **Vantrue N2 Pro** – reliable, infrared night vision, easy toggle for cabin cam | ~$150–180 |
| **Optional Upgrade** | **VIOFO A129 Duo IR** – better image quality, optional Bluetooth remote for “Record” button | ~$170–220 |
| **Premium Option** | **Garmin Dash Cam Tandem** – compact, voice control (“OK Garmin, save video”), Wi-Fi app | ~$250–300 |
| **Memory Card** | High-endurance microSD 128 GB (SanDisk High Endurance / Samsung Pro Endurance) | ~$25–35 |
| **Mounting** | Standard suction or adhesive windshield mount (included with most cams) | — |
| **Power** | 12 V adapter or USB-C cable with fuse tap if hardwired | ~$10–20 |
| **Privacy Notice Sticker** | “Video recording in progress – activated on rider request” | ~$5 (pack) |

---

## ⚙️ Installation & Setup

1. **Mounting**
   - Place camera behind the rear-view mirror for forward view.  
   - Angle the interior camera toward the center of the cabin.  
   - Route the power cable neatly along the windshield trim.

2. **Initial Configuration**
   - Set **loop recording** (1–3 min segments).  
   - Set **G-sensor** sensitivity to *low* (prevents false locks).  
   - Turn **audio recording OFF** by default.  
   - Enable **date/time stamp** overlay.  
   - Verify both front and cabin channels function.

3. **Default State**
   - Interior camera and audio **disabled** (privacy mode).  
   - Front (road-facing) camera may run continuously if desired for safety.  

---

## 🧭 Rider-Requested Recording Workflow

| Step | Action | Driver | Rider |
|------|---------|--------|--------|
| 1 | Rider toggles “Record this trip” in AnyRyde app | Notification appears: “Rider consented to recording.” | Confirms consent |
| 2 | Driver activates cabin camera (and optionally audio) | Press “Cam/IR” toggle or Bluetooth remote | — |
| 3 | Camera records during trip | Local SD storage only | — |
| 4 | Trip ends | Driver disables interior camera | — |
| 5 | Upload if report filed | Driver or support uploads locked clip via portal | Rider notified |

---

## ⚖️ Privacy & Legal Compliance (U.S. / California Focus)

- **Video:** Interior video allowed with **clear disclosure** (e.g., dashboard sticker).  
- **Audio:** California and many other states require **two-party consent**; record audio **only when both rider and driver agree**.  
- **Retention:** Unflagged video auto-overwrites via loop recording (≈ 72 h).  
- **Flagged incidents:** Drivers lock the clip; upload through AnyRyde support portal for secure review.  
- **No continuous surveillance:** Interior footage only on request or safety trigger.

---

## 🪄 Optional Upgrades

- **Bluetooth event remote** (VIOFO accessory) — one-tap to lock clip.  
- **Dual-USB hardwire kit** — keeps power stable without using the 12 V socket.  
- **Cloud add-on** (later phase) — optional automatic upload for verified safety incidents.

---

## 🧰 Operational Checklist (Driver)

| Before Ride | During Ride | After Ride |
|--------------|--------------|-------------|
| ✅ Verify dash cam powers on | 🎥 Enable interior cam only if rider requested | 🛑 Stop interior recording after drop-off |
| ✅ Ensure privacy sticker visible | 🔒 Press event-lock button if incident occurs | 🧾 Retain SD card until 72 h passed |
| ✅ Confirm date/time correct | 📍 Confirm rider notified of active recording | ☁️ Upload if requested by support |

---

## 📧 Data Handling Policy (Summary)

- Files remain on the driver’s SD card.  
- Any upload uses **encrypted HTTPS** to AnyRyde’s incident endpoint.  
- Each upload is linked to **ride ID + timestamp**, not stored indefinitely.  
- Drivers cannot view other riders’ footage; riders cannot view driver footage directly.  

---

## 🧩 Suggested Next Steps

1. **Procure 5–10 kits** (Vantrue N2 Pro + 128 GB card + sticker set).  
2. **Issue SOP + consent signage** to pilot drivers.  
3. **Add “Record this trip” toggle** in rider app UI.  
4. **Backend:** create lightweight upload API (`POST /rides/{id}/video`).  
5. **Pilot review (30 days):** evaluate clarity, driver usability, rider trust.  

---

## 📎 Summary

| Feature | Requirement |
|----------|--------------|
| Camera Type | Dual-channel (front + interior) with manual/voice toggle |
| Default State | Privacy (interior cam + audio OFF) |
| Trigger | Rider opt-in or safety event |
| Storage | Local microSD, loop recording |
| Retention | ~72 h unless incident locked |
| Upload Path | Manual (AnyRyde Support Portal / API) |
| Legal | Visible notice + two-party audio consent |
| Cost per Kit | ≈ $175 – $225 all-in |
