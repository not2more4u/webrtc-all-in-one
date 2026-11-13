import { useState, useEffect } from "react";

export default function RemindersList({ user, onBack, onStartChat }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/reminders/${user.id}`)
      .then((r) => r.json())
      .then((list) => {
        setReminders(list.sort((a, b) => new Date(a.time) - new Date(b.time)));
        setLoading(false);
      });
  }, [user]);

  const fireReminder = async (id) => {
    await fetch(`http://localhost:5000/api/reminders/${id}/fire`, { method: "POST" });
    setReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
      <div className="glass border-b border-slate-800/50 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
          <button className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
            ←
          </button>
          <div className="flex flex-col">
            <div className="font-semibold text-sm">Reminders</div>
            <div className="text-xs text-slate-500">Your scheduled reminders</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse mb-3" />
              <p className="text-sm">Loading reminders...</p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">No reminders yet</p>
              <p className="text-xs text-slate-600 mt-1">Set one from any chat screen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((r) => {
                const isPast = new Date(r.time) < new Date();
                return (
                  <div key={r.id} className="glass rounded-2xl p-4 flex items-center justify-between group hover:border-slate-600 transition">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${isPast ? "bg-slate-600" : "bg-blue-500/20 text-blue-400"}`}>
                        {isPast ? "✓" : "⏰"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${isPast ? "text-slate-400 line-through" : "text-slate-100"}`}>{r.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(r.time).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 mt-1">
                          {r.ringtone || "default"} • {isPast ? "Fired" : "Pending"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isPast && (
                        <button
                          onClick={() => fireReminder(r.id)}
                          className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition"
                        >
                          ✕
                        </button>
                      )}
                      {isPast && (
                        <span className="text-xs text-green-400 font-medium">Fired</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-500">Reminders trigger full-screen call screens that auto-dismiss after 5s</p>
        </div>
      </div>
    </div>
  );
}
