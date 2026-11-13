import { useState, useEffect } from "react";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Chat from "./components/Chat.jsx";
import CallScreen from "./components/CallScreen.jsx";
import ReminderCall from "./components/ReminderCall.jsx";
import Settings from "./components/Settings.jsx";
import RemindersList from "./components/RemindersList.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login"); // login | dashboard | chat | call | reminder | settings | reminders
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

  const handleLogout = () => {
    localStorage.removeItem("wrtc_user");
    setUser(null);
    setPage("login");
    setRemoteUser(null);
    setActiveReminder(null);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      {user ? (
        <>
          {/* Top nav (hidden on login) */}
          <nav className="glass sticky top-0 z-40 border-b border-slate-800/50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPage("dashboard")}>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                  W
                </div>
                <span className="font-bold text-xl tracking-tight text-gradient">WebRTC<span className="text-slate-400">One</span></span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPage("settings")}
                  className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-100 transition glass-hover"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-slate-950" />
            <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none" style={{
              background: "radial-gradient(circle at 10% 20%, rgba(59,130,246,0.12) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(139,92,246,0.12) 0%, transparent 40%)"
            }} />

            {page === "dashboard" && <Dashboard user={user} onStartChat={(u) => { setRemoteUser(u); setPage("chat"); }} onStartCall={(u) => { setRemoteUser(u); setPage("call"); }} />}
            {page === "chat" && <Chat user={user} peer={remoteUser} onStartCall={(u) => { setRemoteUser(u); setPage("call"); }} onBack={() => setPage("dashboard")} />}
            {page === "call" && <CallScreen user={user} peer={remoteUser} onEnd={() => { setPage("dashboard"); setRemoteUser(null); }} />}
            {page === "reminder" && <ReminderCall user={user} reminder={activeReminder} onDismiss={() => { setPage("dashboard"); setActiveReminder(null); }} />}
            {page === "settings" && <Settings user={user} onBack={() => setPage("dashboard")} />}
            {page === "reminders" && <RemindersList user={user} onBack={() => setPage("dashboard")} onStartChat={(u) => { setRemoteUser(u); setPage("chat"); }} />}
          </div>
        </>
      ) : (
        <Login onLogin={(u) => { setUser(u); localStorage.setItem("wrtc_user", JSON.stringify(u)); setPage("dashboard"); }} />
      )}
    </div>
  );
}

