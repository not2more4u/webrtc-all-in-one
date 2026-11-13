import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useWebRTC } from "./useWebRTC.js";

const gradientClasses = ["avatar-gradient-1", "avatar-gradient-2", "avatar-gradient-3", "avatar-gradient-4", "avatar-gradient-5"];
const getAvatarClass = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradientClasses[Math.abs(hash) % gradientClasses.length];
};

export default function Chat({ user, peer, onStartCall, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [reminderText, setReminderText] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [ringtone, setRingtone] = useState("default");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const { socket, sendMessage, isConnected, startLocalMedia } = useWebRTC({
    user,
    onSignal: ({ type, reminder }) => {
      if (type === "reminder-fire") {
        window.dispatchEvent(new CustomEvent("wrtc-reminder-fire", { detail: reminder }));
      }
    },
    onRemoteStream: () => {},
    onDataMessage: (msg) => {
      if (msg.type === "text") {
        setMessages((prev) => [...prev, {
          id: Date.now() + Math.random(),
          text: msg.text,
          from: "peer",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        }]);
      }
    },
  });

  const scrollBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollBottom(); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const msg = {
      id: Date.now(),
      text: input,
      from: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };
    setMessages((prev) => [...prev, msg]);
    sendMessage({ type: "text", text: input, from: "me" });
    setInput("");
  };

  const startCall = async () => {
    await startLocalMedia({ audio: true, video: true });
    const room = [user.id, peer.id].sort().join("-");
    socketRef.current.emit("join-room", { room });
    socketRef.current.emit("incoming-call", { toUserId: peer.id, from: user, room, type: "video" });
    onStartCall(peer);
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
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
      <div className="glass border-b border-slate-800/50 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
          <button className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
            ←
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${getAvatarClass(peer.username)}`}>
              {peer.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-sm">{peer.username}</div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
            📞
          </button>
          <button
            onClick={startCall}
            disabled={!isConnected}
            className={`w-auto px-4 py-2 rounded-xl font-medium text-sm transition ${isConnected ? "btn-gradient text-white" : "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60"}`}
          >
            📹 Video Call
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm">Start the conversation</p>
            </div>
          )}
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                  m.from === "me"
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none"
                    : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"
                } msg-bubble`}>
                  {m.text}
                </div>
                <div className={`text-[10px] mt-1 ${m.from === "me" ? "text-right text-blue-400/60" : "text-left text-slate-500"}`}>
                  {m.time} {m.from === "me" && <span className="ml-1">✓✓</span>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/50 bg-slate-950/80 backdrop-blur p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message..."
              className="input-field"
            />
            <button onClick={send} className="btn-gradient px-5 py-3 rounded-xl text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
              Send
            </button>
          </div>

          <div className="glass rounded-2xl p-4 border-t border-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">⏰ Set Reminder</span>
              <button
                onClick={setReminder}
                disabled={!reminderText.trim() || !reminderTime}
                className={`text-xs font-medium transition ${reminderText.trim() && reminderTime ? "text-blue-400 hover:text-blue-300" : "text-slate-500 cursor-not-allowed"}`}
              >
                Set
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                placeholder="e.g. Take medicine"
                className="input-field text-sm"
              />
              <input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Ringtone:</span>
              <select
                value={ringtone}
                onChange={(e) => setRingtone(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="default">Default</option>
                <option value="alert">Alert</option>
              </select>
              <span className="text-[10px] text-slate-500 flex-1 text-right">
                Auto-call screen • 5s dismiss
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



