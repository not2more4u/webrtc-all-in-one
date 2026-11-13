import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useWebRTC } from "./useWebRTC.js";

const gradientClasses = ["avatar-gradient-1", "avatar-gradient-2", "avatar-gradient-3", "avatar-gradient-4", "avatar-gradient-5"];
const getAvatarClass = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradientClasses[Math.abs(hash) % gradientClasses.length];
};

export default function CallScreen({ user, peer, onEnd }) {
  const [callState, setCallState] = useState("ringing");
  const [remote, setRemote] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const roomRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const { socket, startLocalMedia, closePC } = useWebRTC({
    user,
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    },
    onCallEnd: (declined) => {
      if (declined || callState === "active") {
        audioRef.current?.pause();
        closePC();
        onEnd();
      }
    },
    onDataMessage: () => {},
  });

  useEffect(() => {
    if (socket) socketRef.current = socket;
    const room = [user.id, peer.id].sort().join("-");
    roomRef.current = room;
    socket.emit("join-room", { room });
    audioRef.current = new Audio("/assets/ringtone-default.mp3");
    audioRef.current.loop = true;
    audioRef.current.play().catch(() => {});
  }, [socket, peer]);

  const accept = async () => {
    setCallState("active");
    audioRef.current?.pause();
    await startLocalMedia({ audio: !muted, video: !videoOff });
    socketRef.current.emit("call-accepted", { toSocketId: null, room: roomRef.current });
  };

  const decline = async () => {
    setCallState("ended");
    audioRef.current?.pause();
    socketRef.current.emit("call-declined", { toSocketId: null, room: roomRef.current });
    closePC();
    onEnd();
  };

  const hangup = () => {
    setCallState("ended");
    audioRef.current?.pause();
    socketRef.current.emit("call-ended", { toSocketId: null, room: roomRef.current });
    closePC();
    onEnd();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 text-slate-100 relative overflow-hidden">
      <div className="call-bg-blur" />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl">
        {callState === "ringing" ? (
          <div className="text-center animate-fast-fade">
            <div className="relative inline-block mb-8">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-2xl mb-4 ${getAvatarClass(peer.username)} animate-ring-pulse`}>
                {peer.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -inset-1 rounded-full border-2 border-blue-500/30 animate-ping"></div>
            </div>

            <div className="text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">Incoming video call</div>
            <h1 className="text-3xl font-bold mb-1">{remote?.username || peer.username}</h1>
            <p className="text-slate-400 text-sm mb-8">is calling you...</p>

            <div className="flex gap-4 justify-center">
              <button onClick={decline} className="w-14 h-14 rounded-full btn-danger flex items-center justify-center text-white font-bold text-xl shadow-lg transition active:scale-95">
                ↓
              </button>
              <button onClick={accept} className="w-16 h-16 rounded-full btn-success flex items-center justify-center text-white font-bold text-xl shadow-lg transition active:scale-95">
                ↗
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-6">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {videoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-slate-400 text-2xl">📹 Video Off</div>
              </div>
            )}

            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-xs font-medium border border-white/20">
                <span className={`w-2 h-2 rounded-full ${callState === "active" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                {callState === "active" ? "Connected" : "Ringing..."}
              </div>
            </div>

            {localStream && (
              <div className="absolute -top-10 right-6 w-20 h-16 rounded-xl border-2 border-white/20 overflow-hidden shadow-lg z-20">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}
            {localStream && localVideoRef && (localVideoRef.current.srcObject = localStream)}

            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 p-4">
              <button
                onClick={() => setMuted(!muted)}
                className={`w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-700 transition ${muted ? "text-red-400" : ""}`}
              >
                {muted ? "🔇" : "🎤"}
              </button>
              <button
                onClick={() => setVideoOff(!videoOff)}
                className={`w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-700 transition ${videoOff ? "text-red-400" : ""}`}
              >
                {videoOff ? "📹" : "📹"}
              </button>
              <button onClick={hangup} className="w-14 h-14 rounded-full btn-danger flex items-center justify-center text-white font-bold text-xl shadow-lg transition active:scale-95">
                ↓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
