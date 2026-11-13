import { useState, useEffect } from "react";

const gradientClasses = ["avatar-gradient-1", "avatar-gradient-2", "avatar-gradient-3", "avatar-gradient-4", "avatar-gradient-5"];
const getAvatarClass = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradientClasses[Math.abs(hash) % gradientClasses.length];
};

export default function Dashboard({ user, onStartChat, onStartCall }) {
  const [users, setUsers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("http://localhost:5000/api/users").then((r) => r.json()),
      fetch(`http://localhost:5000/api/reminders/${user.id}`).then((r) => r.json()),
    ])
      .then(([userList, reminderList]) => {
        if (!mounted) return;
        setUsers(userList.filter((u) => u.id !== user.id));
        setReminders(reminderList.filter((r) => !r.fired).sort((a, b) => new Date(a.time) - new Date(b.time)));
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [user]);

  const now = new Date().toISOString();
  const upcoming = reminders.filter((r) => r.time > now).slice(0, 3);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 -z-10 bg-blue-900/10 blur-[100px] rounded-full" style={{ width: "500px", height: "500px", top: "-100px", left: "10%", transform: "translateX(-50%)" }} />
      <div className="absolute inset-0 -z-10 bg-purple-900/10 blur-[100px] rounded-full" style={{ width: "400px", height: "400px", bottom: "-100px", right: "10%", transform: "translateX(50%)" }} />

      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back, <span className="text-gradient">{user.username}</span>!</h1>
            <p className="text-slate-400 text-sm">Here's what's happening today</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold">Contacts</h2>
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse mb-3" />
                <p className="text-sm">Loading contacts...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-500">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-sm">No contacts online yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onStartChat(u)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 hover:bg-slate-800/30 transition glass-hover group"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shrink-0 ${getAvatarClass(u.username)}`}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{u.username}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      </div>
                      <p className="text-xs text-slate-400">Tap to start messaging</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-xs text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition">
                      💬
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-5">
              <h2 className="text-lg font-bold mb-4">Quick actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => users[0] && onStartCall(users[0])}
                  disabled={!users[0]}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition ${users[0] ? "bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-100" : "bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed"}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                    📹
                  </div>
                  <div>
                    <div className="font-medium text-sm">{users[0] ? `Call ${users[0].username}` : "No contacts"}</div>
                    <div className="text-xs text-slate-500">Start video call</div>
                  </div>
                </button>
                <button
                  onClick={() => {}}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900/50 text-left transition hover:bg-slate-800 text-slate-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    💬
                  </div>
                  <div>
                    <div className="font-medium text-sm">New message</div>
                    <div className="text-xs text-slate-500">Start a conversation</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <h2 className="text-lg font-bold mb-4">Upcoming reminders</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming reminders</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-300">
                        ⏰
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{r.title}</div>
                        <div className="text-xs text-slate-400">{new Date(r.time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {r.ringtone || "default"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
