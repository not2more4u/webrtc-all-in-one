import { useState, useEffect, useRef } from "react";

export default function ReminderCall({ user, onDismiss, reminder }) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [ringtone, setRingtone] = useState(reminder?.ringtone || "default");
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const RINGTONES = {
    default: "/assets/ringtone-default.mp3",
    alert: "/assets/ringtone-alert.mp3",
  };

  useEffect(() => {
    const src = RINGTONES[ringtone] || RINGTONES.default;
    audioRef.current = new Audio(src);
    audioRef.current.loop = true;
    audioRef.current.play().catch((e) => console.log("autoplay blocked", e));

    setSecondsLeft(5);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
          fetch(`http://localhost:5000/api/reminders/${reminder?.id}/fire`, { method: "POST" }).catch(() => {});
          onDismiss();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    };
  }, [reminder, ringtone, onDismiss]);

  const tapToDismiss = () => {
    clearInterval(timerRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    fetch(`http://localhost:5000/api/reminders/${reminder?.id}/fire`, { method: "POST" }).catch(() => {});
    onDismiss();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-blue-900/20 rounded-full blur-[120px]" style={{ width: "500px", height: "500px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
      <div className="absolute inset-0 -z-10 bg-purple-900/20 rounded-full blur-[100px]" style={{ width: "340px", height: "340px", top: "60%", left: "40%", transform: "translate(-50%, -50%)" }} />

      <div className="z-10 flex flex-col items-center justify-center text-center space-y-6 animate-fast-fade">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-blue-500/40 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.4)] animate-ring-pulse">
            <div className="w-24 h-24 rounded-full bg-slate-950 flex items-center justify-center text-5xl font-bold text-white border border-white/10">
              ⏰
            </div>
          </div>
          <div className="absolute -inset-1 rounded-full border-2 border-blue-500/30 animate-ping"></div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">REMINDER</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gradient leading-tight">{reminder?.title || "You have a reminder"}</h1>
          <p className="text-lg text-slate-300 max-w-md mx-auto">
            No answer button — this screen disappears automatically in {secondsLeft} second{secondsLeft !== 1 ? "s" : ""}.
          </p>
        </div>

        <div className={`text-4xl md:text-5xl font-mono text-blue-400 font-bold tracking-wider ${secondsLeft <= 2 ? "animate-countdown text-red-400" : ""}`}>
          {secondsLeft}
        </div>

        <button
          onClick={tapToDismiss}
          className="mt-6 w-full max-w-xs py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-lg font-semibold transition backdrop-blur-sm active:scale-95"
        >
          Dismiss now
        </button>
        <p className="text-xs text-slate-500 mt-3">Or wait {secondsLeft}s for auto-dismiss</p>
      </div>
    </div>
  );
}

