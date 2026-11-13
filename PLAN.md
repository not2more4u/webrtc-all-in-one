# 🎯 WebRTC All-in-One App — Plan & Build Guide

## What this app does
- **1-to-1 messaging** (text) over WebRTC data channels + Socket.io signaling
- **Audio/video calling** over WebRTC with immersive call UI
- **Reminders**: set a reminder → at trigger time it pops a **full-screen incoming-call UI**
  - Shows your reminder text **instead of a caller name**
  - **No answer / decline buttons** — you just wait **5 seconds**, then it auto-dismisses
  - Custom **ringtone** plays during the reminder call
- **Ringtones & settings** (select ringtone, volume, notifications)
- **Modern glassmorphism UI** with gradient accents, smooth animations, dark theme
- **One codebase** → runs as a **website** AND as an **APK** (Android) via Capacitor
- Everything pushed to **GitHub**

---

## 📂 Project structure

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
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── capacitor.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── index.css            # design system (glassmorphism, gradients, animations)
│   │   ├── App.jsx              # router: Login / Dashboard / Chat / Call / Reminder / Settings / Reminders
│   │   ├── components/
│   │   │   ├── Login.jsx        # beautiful gradient login screen
│   │   │   ├── Dashboard.jsx    # home with stats, contacts, quick actions
│   │   │   ├── Chat.jsx         # modern messaging + reminder composer
│   │   │   ├── CallScreen.jsx   # immersive WebRTC call (ringing/active UI, mute/video)
│   │   │   ├── ReminderCall.jsx # full-screen auto-dismiss reminder (5s, no buttons)
│   │   │   ├── Settings.jsx     # profile, ringtones, volume, notifications
│   │   │   └── RemindersList.jsx # manage all reminders
│   │   └── assets/
│   │       ├── ringtone-default.mp3
│   │       └── ringtone-alert.mp3
│   └── dist/                    # production build
├── .gitignore
└── README.md
```

---

## 🎨 New UI Design System

- **Theme**: Dark slate-950 with blue/purple/pink gradient glows
- **Components**: Glassmorphism panels (backdrop-blur, semi-transparent borders)
- **Buttons**: Gradient buttons with hover lift + shadow effects
- **Typography**: Inter font, gradient text for headings
- **Animations**: float, pulse-glow, ring-pulse, slide-up, fade-in, countdown-pulse
- **Avatars**: Gradient circles with user initials
- **Responsive**: Works on desktop and mobile (Capacitor WebView)

---

## 🛠 Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js v22 + npm v10 |
| Backend | Express + Socket.io |
| Frontend | React + Vite |
| Styling | Tailwind CSS + custom CSS design system |
| Mobile | Capacitor (same code → APK) |
| Comms | WebRTC (RTCPeerConnection + data channel) |
| Database | JSON files (dev) |

---

## 🚀 Getting started

### 1. Install dependencies
```bash
cd /home/not2more4u/webrtc-app/server && npm install
cd /home/not2more4u/webrtc-app/client && npm install
```

### 2. Start the server
```bash
cd /home/not2more4u/webrtc-app/server
node index.js     # http://localhost:5000
```

### 3. Start the client
```bash
cd /home/not2more4u/webrtc-app/client
npm run dev       # http://localhost:5173
```

Open two browser tabs, log in as different users, and test messaging + calling + reminders.

---

## 📱 Build APK (Android)
```bash
cd /home/not2more4u/webrtc-app/client
npm run build
npx cap add android      # first time only
npx cap copy
npx cap open android     # build APK in Android Studio
```

---

## ☁️ Push to GitHub
```bash
cd /home/not2more4u/webrtc-app
git init
git add .
git commit -m "Full new UI: glassmorphism design, immersive calls, reminder auto-call"
git branch -M main
git remote add origin https://github.com/not2more4u/webrtc-all-in-one.git
git push -u origin main
```

---

## ⚠️ Notes
- WebRTC p2p uses STUN; behind strict NATs add TURN servers in `useWebRTC.js`
- Reminders fire in-browser; for closed-app reminders add push notifications (FCM)
- APK requires Android Studio + SDK
