import { useState, useEffect } from "react";
import Login from "./components/Login.jsx";
import Chat from "./components/Chat.jsx";
import CallScreen from "./components/CallScreen.jsx";
import ReminderCall from "./components/ReminderCall.jsx";
import Settings from "./components/Settings.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login"); // login | chat | call | reminder | settings
  const [remoteUser, setRemoteUser] = useState(null);
  const [activeReminder, setActiveReminder] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("wrtc_user");
    if (u) setUser(JSON.parse(u));

    const onReminderFire = (e) => {
      setActiveReminder(e.detail);
      setPage("reminder");
    };
    window.addEventListener("wrtc-reminder-fire", onReminderFire);
    return () => window.removeEventListener("wrtc-reminder-fire", onReminderFire);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {user ? (
        <>
          <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-slate-100">WebRTC All-in-One</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage("settings")}
                className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
              >
                Settings
              </button>
              <button
                onClick={() => { localStorage.removeItem("wrtc_user"); setUser(null); setPage("login"); }}
                className="text-xs px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white transition"
              >
                Logout
              </button>
            </div>
          </nav>

          {page === "chat" && <Chat user={user} onStartCall={(u) => { setRemoteUser(u); setPage("call"); }} />}
          {page === "call" && <CallScreen user={user} peer={remoteUser} onEnd={() => { setPage("chat"); setRemoteUser(null); }} />}
          {page === "reminder" && <ReminderCall user={user} reminder={activeReminder} onDismiss={() => { setPage("chat"); setActiveReminder(null); }} />}
          {page === "settings" && <Settings user={user} />}
          {!page && <Chat user={user} onStartCall={(u) => { setRemoteUser(u); setPage("call"); }} />}
        </>
      ) : (
        <Login onLogin={(u) => { setUser(u); localStorage.setItem("wrtc_user", JSON.stringify(u)); setPage("chat"); }} />
      )}
    </div>
  );
}
