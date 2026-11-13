import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useWebRTC } from "./useWebRTC.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export default function CallScreen({ user, peer, onEnd }) {
  const [callState, setCallState] = useState("ringing"); // ringing | active | ended
  const [remote, setRemote] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const roomRef = useRef(null);

  const { socket, pc, localStream, remoteStream, startLocalMedia, createOffer, createAnswer, closePC, handleSignal, sendMessage, isConnected } = useWebRTC({
    user,
    onSignal: ({ type, users, reminder }) => {
      if (type === "users") setRemote(users.find((u) => u.id === peer.id) || null);
    },
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
    await startLocalMedia({ audio: true, video: true });
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
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="w-full max-w-2xl">
        {/* remote video */}
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-6">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-sm font-medium border border-white/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {callState === "active" ? "Connected" : "Ringing..."}
            </div>
          </div>
          {callState === "ringing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="text-6xl mb-4">📞</div>
              <div className="text-2xl font-bold">{remote?.username || peer.username}</div>
              <div className="text-slate-300 text-sm mt-2">Incoming video call</div>
            </div>
          )}
        </div>

        {/* local video small pip */}
        {localStream && (
          <div className="absolute -top-10 right-6 w-24 h-18 rounded-xl border-2 border-white/20 overflow-hidden shadow-lg z-10" style={{ position: "fixed" }}>
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}

        {/* local video element hidden src */}
        {localStream && localVideoRef && (localVideoRef.current.srcObject = localStream)}

        {/* controls */}
        <div className="mt-8 flex gap-4">
          {callState === "ringing" ? (
            <>
              <button onClick={decline} className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg transition shadow-lg shadow-red-900/30">
                Decline
              </button>
              <button onClick={accept} className="flex-1 py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg transition shadow-lg shadow-green-900/30">
                Accept
              </button>
            </>
          ) : (
            <button onClick={hangup} className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg transition shadow-lg shadow-red-900/30">
              📞 Hang up
            </button>
          )}
        </div>
        {callState === "ringing" && (
          <p className="mt-3 text-sm text-slate-400">Ringing {remote?.username || peer.username}...</p>
        )}
      </div>
    </div>
  );
}
