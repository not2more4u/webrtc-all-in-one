import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const user = await res.json();
      onLogin(user);
    } catch {
      setError("Could not connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const gradientClasses = ["avatar-gradient-1", "avatar-gradient-2", "avatar-gradient-3", "avatar-gradient-4", "avatar-gradient-5"];
  const avatarClass = gradientClasses[Math.floor(Math.random() * gradientClasses.length)];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-blue-900/10 blur-[120px] rounded-full" style={{ width: "600px", height: "600px", top: "-150px", left: "10%", transform: "translateX(-50%)" }} />
      <div className="absolute inset-0 -z-10 bg-purple-900/10 blur-[120px] rounded-full" style={{ width: "500px", height: "500px", bottom: "-100px", right: "10%", transform: "translateX(50%)" }} />
      <div className="absolute inset-0 -z-10 bg-pink-900/10 blur-[100px] rounded-full" style={{ width: "400px", height: "400px", top: "30%", left: "50%", transform: "translateX(-50%)" }} />

      <div className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className={`w-18 h-18 rounded-3xl ${avatarClass} mx-auto mb-6 flex items-center justify-center text-3xl font-bold shadow-lg animate-float`}>
            W
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">WebRTC<span className="text-slate-400">One</span></h2>
          <p className="text-slate-400 text-sm">Messaging • Calling • Reminders</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className={`
                input-field
                ${loading ? "opacity-70" : ""}
              `}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition ${loading ? "opacity-70 cursor-not-allowed" : "btn-gradient"}`}
          >
            {loading ? "Signing in..." : "Enter App"}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-500 mt-8">
          Backend: <span className="text-blue-400 text-xs">http://localhost:5000</span>
        </p>
      </div>
    </div>
  );
}

