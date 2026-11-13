import { useState, useEffect } from "react";

export default function Settings({ user, onBack }) {
  const [ringtone, setRingtone] = useState(localStorage.getItem("wrtc_ringtone") || "default");
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem("wrtc_volume") || "0.7"));
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(localStorage.getItem("wrtc_notifications") !== "false");

  const audioRef = useRef(null);

  const RINGTONES = [
    { value: "default", label: "Default Chime", desc: "Gentle notification tone", src: "/assets/ringtone-default.mp3" },
    { value: "alert", label: "Alert Tone", desc: "Urgent attention sound", src: "/assets/ringtone-alert.mp3" },
  ];

  useEffect(() => {
    localStorage.setItem("wrtc_ringtone", ringtone);
    localStorage.setItem("wrtc_volume", volume);
    localStorage.setItem("wrtc_notifications", notifications);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }, [ringtone, volume, notifications]);

  const testTone = () => {
    const r = RINGTONES.find((x) => x.value === ringtone);
    if (!r) return;
    audioRef.current = new Audio(r.src);
    audioRef.current.volume = volume;
    audioRef.current.play().catch(() => {});
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
      <div className="glass border-b border-slate-800/50 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
          <button className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
            ←
          </button>
          <div className="flex flex-col">
            <div className="font-semibold text-sm">Settings</div>
            <div className="text-xs text-slate-500">Preferences & ringtones</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-2xl mx-auto">
        <div className="space-y-8">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg avatar-gradient-1">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-sm">{user.username}</div>
                <div className="text-xs text-slate-500">WebRTC All-in-One</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Ringtone</h2>
              <span className="text-xs text-slate-500">Plays during reminders</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {RINGTONES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRingtone(r.value)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition ${ringtone === r.value ? "border-blue-500 bg-blue-500/10" : "border-slate-800 hover:border-slate-600"}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-xl border border-slate-700">
                    🔔
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{r.label}</div>
                    <div className="text-[10px] text-slate-500">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <button onClick={testTone} className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white font-medium transition">
                🔊 Test ringtone
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Volume</h2>
              <span className="text-xs font-mono text-slate-400">{Math.round(volume * 100)}%</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Ringtone volume</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Reminder Notifications</h2>
                <p className="text-xs text-slate-500 mt-1">Receive full-screen reminder calls</p>
              </div>
              <div className="toggle">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="check-custom"
                />
                <div className="toggle-slider"></div>
              </div>
            </div>
          </div>

          {saved && (
            <div className="animate-fast-fade">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <span>✓</span>
                <span>Saved!</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-500">WebRTC All-in-One • v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
