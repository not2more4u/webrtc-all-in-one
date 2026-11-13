import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useWebRTC } from "./useWebRTC.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export default function Chat({ user, onStartCall }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [reminderText, setReminderText] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [ringtone, setRingtone] = useState("default");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const { socket, sendMessage, isConnected, startLocalMedia } = useWebRTC({
    user,
    onSignal: ({ type, users: uList, reminder }) => {
      if (type === "users") setUsers(uList.filter((u) => u.id !== user.id));
      if (type === "reminder-fire") {
        window.dispatchEvent(new CustomEvent("wrtc-reminder-fire", { detail: reminder }));
      }
    },
    onRemoteStream: () => {},
    onDataMessage: (msg) => {
      if (msg.type === "text") {
        setMessages((prev) => [...prev, { text: msg.text, from: "peer", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      }
    },
  });

  useEffect(() => {
    if (socket) socketRef.current = socket;
    fetch("http://localhost:5000/api/users")
      .then((r) => r.json())
      .then((list) => setUsers(list.filter((u) => u.id !== user.id)));
  }, [socket, user]);

  const scrollBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollBottom(); }, [messages]);

  const pickUser = (u) => { setSelectedUser(u); setMessages([]); };

  const send = async () => {
    if (!input.trim()) return;
    const msg = { type: "text", text: input, from: "me", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, msg]);
    sendMessage({ type: "text", text: input, from: "me" });
    setInput("");
  };

  const startCall = async () => {
    if (!selectedUser) return;
    await startLocalMedia({ audio: true, video: true });
    const room = [user.id, selectedUser.id].sort().join("-");
    socketRef.current.emit("join-room", { room });
    socketRef.current.emit("incoming-call", { toUserId: selectedUser.id, from: user, room, type: "video" });
    onStartCall(selectedUser);
  };

  const setReminder = async () => {
    if (!reminderText.trim() || !reminderTime) return;
    await fetch("http://localhost:5000/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, title: reminderText, time: reminderTime, ringtone }),
    });
    setReminderText("");
    setReminderTime("");
    alert("Reminder set! At the time, you'll get a full-screen call that auto-dismisses after 5s.");
  };
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-blue-900/10 blur-[100px] -z-10 rounded-full" style={{ width: "600px", height: "600px", top: "-100px", left: "50%", transform: "translateX(-50%)" }} />

      <div className="w-80 bg-slate-800/60 border-r border-slate-700 flex flex-col backdrop-blur">
        <div className="p-4 border-b border-slate-700">
          <h3 className="font-bold text-slate-100 text-sm">Contacts</h3>
          <p className="text-xs text-slate-400">{users.length} online</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {users.map((u) => (
            <button key={u.id} onClick={() => pickUser(u)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${selectedUser?.id === u.id ? "bg-blue-600/20 border border-blue-500/30 text-blue-100" : "text-slate-300 hover:bg-slate-700"}`}>
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">{u.username.charAt(0).toUpperCase()}</div>
              <span className="truncate">{u.username}</span>
            </button>
          ))}
          {users.length === 0 && <p className="px-4 py-2 text-xs text-slate-500">No contacts online</p>}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500"><div className="text-4xl mb-2">💬</div><p className="text-lg">Select a contact to start messaging</p></div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-200">{selectedUser.username.charAt(0).toUpperCase()}</div>
                <div><div className="font-medium text-slate-100">{selectedUser.username}</div><div className="text-xs text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>online</div></div>
              </div>
              <button onClick={startCall} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition shadow-lg shadow-green-900/20">📹 Call {selectedUser.username}</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[80%] ${m.from === "me" ? "ml-auto text-right" : "mr-auto text-left"}`}>
                  <div className={`inline-block px-3 py-2 rounded-2xl ${m.from === "me" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"}`}>{m.text}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{m.time}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur">
              <div className="flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..." className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                <button onClick={send} className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition">Send</button>
              </div>
            </div>
          </>
        )}
        <div className="border-t border-slate-800 bg-slate-900 p-4 backdrop-blur">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Set Reminder (auto-call screen)</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input type="text" value={reminderText} onChange={(e) => setReminderText(e.target.value)} placeholder="e.g. Take medicine" className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="datetime-local" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2"><span>Ringtone:</span>
            <select value={ringtone} onChange={(e) => setRingtone(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none">
              <option value="default">Default</option>
              <option value="alert">Alert</option>
            </select>
          </div>
          <button onClick={setReminder} className="w-full py-2.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-medium transition">🔔 Set Reminder</button>
          <p className="text-[10px] text-slate-500 mt-2">When it fires, you'll see a full-screen call with your reminder text. No answer button — it auto-dismisses after 5 seconds.</p>
        </div>
      </div>
    </div>
  );
}


