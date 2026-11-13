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
      setError("Could not connect to server. Is it running on http://localhost:5000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-500 mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
            W
          </div>
          <h2 className="text-2xl font-bold text-slate-100">WebRTC All-in-One</h2>
          <p className="text-slate-400 text-sm mt-2">Messaging • Calling • Reminders</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold transition shadow-lg shadow-blue-900/20"
          >
            {loading ? "Signing in..." : "Enter App"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Make sure the backend server is running: <br />
          <code className="text-blue-400">cd server && node index.js</code>
        </p>
      </div>
    </div>
  );
}
