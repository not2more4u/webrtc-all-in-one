const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const REMINDERS_FILE = path.join(DATA_DIR, "reminders.json");

// ---- ensure data dir/files ----
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(REMINDERS_FILE)) fs.writeFileSync(REMINDERS_FILE, JSON.stringify([], null, 2));

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---- in-memory state ----
const users = readJSON(USERS_FILE);          // { id, username, socketId, online }
const reminders = readJSON(REMINDERS_FILE);  // { id, userId, title, time, ringtone, fired, createdAt }
const sockets = {}; // socketId -> { userId, username }

// ---- REST: users ----
app.get("/api/users", (req, res) => res.json(users));
app.post("/api/users", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "username required" });
  const existing = users.find(u => u.username === username);
  if (existing) return res.json(existing);
  const user = { id: uuidv4(), username, online: false };
  users.push(user);
  writeJSON(USERS_FILE, users);
  res.json(user);
});

// ---- REST: reminders ----
app.get("/api/reminders/:userId", (req, res) => {
  res.json(reminders.filter(r => r.userId === req.params.userId));
});
app.post("/api/reminders", (req, res) => {
  const { userId, title, time, ringtone = "default" } = req.body;
  if (!userId || !title || !time) return res.status(400).json({ error: "userId, title, time required" });
  const reminder = {
    id: uuidv4(),
    userId,
    title,
    time,           // ISO string
    ringtone,
    fired: false,
    createdAt: new Date().toISOString(),
  };
  reminders.push(reminder);
  writeJSON(REMINDERS_FILE, reminders);
  scheduleReminder(reminder);
  res.json(reminder);
});
app.post("/api/reminders/:id/fire", (req, res) => {
  const idx = reminders.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  reminders[idx].fired = true;
  writeJSON(REMINDERS_FILE, reminders);
  res.json({ ok: true });
});

// ---- Socket.io signaling ----
io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("register", ({ userId, username }) => {
    sockets[socket.id] = { userId, username };
    const u = users.find(u => u.id === userId);
    if (u) { u.online = true; u.socketId = socket.id; writeJSON(USERS_FILE, users); }
    io.emit("users", users.filter(u => u.online));
  });

  socket.on("disconnect", () => {
    const info = sockets[socket.id];
    if (info) {
      const u = users.find(u => u.id === info.userId);
      if (u) { u.online = false; u.socketId = null; writeJSON(USERS_FILE, users); }
      io.emit("users", users.filter(u => u.online));
    }
    delete sockets[socket.id];
  });

  // join a private room (pair of userIds sorted)
  socket.on("join-room", ({ room }) => {
    socket.join(room);
  });

  // signaling: offer/answer/candidate -> send to specific socket id
  socket.on("signal", ({ toSocketId, signal, from, room }) => {
    io.to(toSocketId).emit("signal", { fromSocketId: socket.id, from, signal, room });
  });

  // call events
  socket.on("incoming-call", ({ toUserId, from, room, type }) => {
    const target = Object.entries(sockets).find(([, s]) => s.userId === toUserId);
    if (target) {
      io.to(target[0]).emit("incoming-call", { from, room, type });
    }
  });

  socket.on("call-accepted", ({ toSocketId, room }) => {
    io.to(toSocketId).emit("call-accepted", { room });
  });
  socket.on("call-declined", ({ toSocketId, room }) => {
    io.to(toSocketId).emit("call-declined", { room });
  });
  socket.on("call-ended", ({ toSocketId, room }) => {
    io.to(toSocketId).emit("call-ended", { room });
  });
});

// ---- Reminder scheduler (client-side is primary; server keeps a backup check) ----
function scheduleReminder(reminder) {
  const delay = new Date(reminder.time).getTime() - Date.now();
  if (delay <= 0) return;
  setTimeout(() => {
    // mark fired
    const idx = reminders.findIndex(r => r.id === reminder.id);
    if (idx !== -1) reminders[idx].fired = true;
    writeJSON(REMINDERS_FILE, reminders);
    // notify the user if online
    const target = Object.entries(sockets).find(([, s]) => s.userId === reminder.userId);
    if (target) {
      io.to(target[0]).emit("reminder-fire", {
        id: reminder.id,
        title: reminder.title,
        ringtone: reminder.ringtone,
      });
    }
  }, delay);
}

// resume reminders on restart
reminders.filter(r => !r.fired).forEach(scheduleReminder);

server.listen(PORT, () => console.log(`🚀 Signaling server running on http://localhost:${PORT}`));
