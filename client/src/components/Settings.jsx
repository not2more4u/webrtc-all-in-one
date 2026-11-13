import { useState, useEffect } from "react";

export default function Settings({ user }) {
  const [ringtone, setRingtone] = useState(localStorage.getItem("wrtc_ringtone") || "default");
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem("wrtc_volume") || "0.7"));
  const [saved, setSaved] = useState(false);

  const RINGTONES = [
    { value: "default", label: "Default Chime", src: "/assets/ringtone-default.mp3" },
    { value: "alert", label: "Alert Tone", src: "/assets/ringtone-alert.mp3" },
  ];

  const audioRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("wrtc_ringtone", ringtone);
    localStorage.setItem("wrtc_volume", volume);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }, [ringtone, volume]);

  const testTone = () => {
    const r = RINGTONES.find((x) => x.value === ringtone);
    if (!r) return;
    audioRef.current = new Audio(r.src);
    audioRef.current.volume = volume;
    audioRef.current.play().catch(() => {});
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Settings</h2>
        <p className="text-slate-400">Customize ringtones and preferences.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 backdrop-blur">
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300 text-sm font-medium">Ringtone</span>
              <span className="text-xs text-blue-400 font-medium">plays during reminders</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {RINGTONES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRingtone(r.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${ringtone === r.value ? "border-blue-500 bg-blue-500/10 text-blue-300" : "border-slate-700 hover:border-slate-500 text-slate-400"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-lg border border-slate-700">🔔</div>
                  <span className="text-xs font-medium">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm font-medium">Volume</span>
              <span className="text-xs text-slate-400 font-medium">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-700">
            <button
              onClick={testTone}
              disabled={!ringtone}
              className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition disabled:opacity-50"
            >
              🔊 Test ringtone
            </button>
          </div>

          {saved && (
            <p className="text-xs text-green-400 font-medium mt-2">Saved!</p>
          )}
        </div>
      </div>

      <div className="mt-auto text-xs text-slate-500 text-center">
        WebRTC All-in-One • Messaging, Calling, Reminders
      </div>
    </div>
  );
}
