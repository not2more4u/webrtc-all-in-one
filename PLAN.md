# 🎯 WebRTC All-in-One App — Plan & Build Guide

## What this app does
- **1-to-1 messaging** (text) over WebRTC data channels + Socket.io signaling
- **Audio/video calling** over WebRTC
- **Reminders**: set a reminder → at trigger time it pops a **full-screen incoming-call UI**
  - Shows your reminder text **instead of a caller name**
  - **No answer / decline buttons** — you just wait **5 seconds**, then it auto-dismisses
  - Custom **ringtone** plays during the reminder call
- **Ringtones & settings** (select ringtone, volume, etc.)
- **One codebase** → runs as a **website** AND as an **APK** (Android) via Capacitor
- Everything pushed to **GitHub**

---

## 📂 Project structure (single repo)

```
webrtc-app/
├── PLAN.md                      # this file
├── server/                      # Node.js + Express + Socket.io signaling server
│   ├── package.json
│   ├── index.js                 # signaling + auth + rooms + reminder scheduler
│   └── data/                    # reminders & users JSON store (dev)
├── client/                      # React + Vite web app (shared by website & APK)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # router: Login / Chat / Call / ReminderCall / Settings
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Chat.jsx         # messaging + call button
│   │   │   ├── CallScreen.jsx   # real WebRTC call (answer/decline)
│   │   │   ├── ReminderCall.jsx # reminder auto-call (5s auto-dismiss, no buttons)
│   │   │   ├── Settings.jsx     # ringtones, volume, profile
│   │   │   ├── RingtonePicker.jsx
│   │   │   └── useWebRTC.js     # WebRTC hook (offer/answer/ice)
│   │   └── assets/
│   │       ├── ringtone-default.mp3
│   │       └── ringtone-alert.mp3
│   ├── capacitor.config.js      # Capacitor -> APK config
│   └── tailwind.config.js
├── .gitignore
└── README.md
```

---

## 🛠 Tech stack (confirmed available on your machine)

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Node.js v22 + npm v10 | already installed |
| Backend | Express + Socket.io | WebRTC signaling, rooms, reminder scheduler |
| Frontend | React + Vite | fast, works on web & Capacitor WebView |
| Styling | Tailwind CSS | quick UI, dark mode friendly |
| Mobile wrapper | Capacitor | turns the same web code into an APK |
| Real-time comms | WebRTC (RTCPeerConnection + data channel) | p2p messaging & media |
| Database | JSON files (dev) → swap for MongoDB later | no extra install needed |

---

## 🧩 Key features & how they work

### WebRTC signaling
The server does **not** relay media. It only exchanges SDP offers/answers and ICE candidates via Socket.io so two browsers can connect peer-to-peer.

### Reminder → Incoming Call (auto, 5 seconds)
1. User sets a reminder (title + date/time + ringtone).
2. At trigger time, the client shows `ReminderCall.jsx` full screen.
3. It plays the selected ringtone and shows the reminder text where the caller name would go.
4. There is **no** answer/decline button.
5. After **5 seconds**, the call screen auto-dismisses and the reminder is marked "fired".

### Ringtones
- `Settings.jsx` lets the user pick a ringtone + volume.
- Selection saved to `localStorage` (and synced to server when you add a DB).

---

## 🚀 Getting started (run locally)

### 1. Install dependencies
```bash
cd /home/not2more4u/webrtc-app/server
npm install

cd /home/not2more4u/webrtc-app/client
npm install
```

### 2. Start the signaling server
```bash
cd /home/not2more4u/webrtc-app/server
node index.js
# runs on http://localhost:5000
```

### 3. Start the web client
```bash
cd /home/not2more4u/webrtc-app/client
npm run dev
# runs on http://localhost:5173
```

Open two browser tabs, log in as different users, and you can message + call.

---

## 📱 Build the APK (Android)

Prerequisites: Android Studio + Android SDK + Java JDK installed.

```bash
cd /home/not2more4u/webrtc-app/client
npm run build                # Vite build -> dist/
npx cap add android          # add Android platform (first time only)
npx cap copy                 # copy web assets into android
npx cap open android         # open in Android Studio -> build APK / run on device
```

The same `client/` code is the website **and** the APK — no separate mobile codebase.

---

## ☁️ Deploy & push to GitHub

1. Create an empty repo on GitHub (e.g. `webrtc-all-in-one`).
2. Install git on your Chromebook if missing: `sudo apt install git`
3. Push:
```bash
cd /home/not2more4u/webrtc-app
git init
git add .
git commit -m "Initial commit: WebRTC messaging + calling + reminders"
git branch -M main
git remote add origin https://github.com/YOURUSER/webrtc-all-in-one.git
git push -u origin main
```

4. Deploy the `server/` to a VPS (Render, Railway, DigitalOcean, etc.) and update the Socket.io URL in `client/src/components/useWebRTC.js` to your server domain.

---

## ⚠️ Known limitations & next steps

- **WebRTC p2p** works on the same network or with a public signaling server. Behind strict NATs you may need a TURN server (add `iceServers` in `useWebRTC.js`).
- **Reminders** currently run in-browser (client-side timer). For reminders to fire when the app is closed, move the scheduler to the server + push notifications (Firebase FCM / OneSignal).
- **APK** requires Android Studio to build the final `.apk`/`aab`.
- **Auth** is a simple username login (no passwords) for the starter. Swap in Firebase Auth / JWT later.
