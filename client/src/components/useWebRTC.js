import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import io from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export function useWebRTC({ user, onSignal, onRemoteStream, onCallEnd, onDataMessage }) {
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const iceServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("register", { userId: user.id, username: user.username }));
    socket.on("signal", (p) => handleSignal(p));
    socket.on("call-accepted", () => onCallEnd?.(false));
    socket.on("call-declined", () => onCallEnd?.(true));
    socket.on("call-ended", () => { closePC(); onCallEnd?.(false); });
    socket.on("users", (users) => onSignal?.({ type: "users", users }));
    socket.on("reminder-fire", (reminder) => onSignal?.({ type: "reminder-fire", reminder }));
    return () => { socket.disconnect(); closePC(); };
  }, [user]);

  const createPC = useCallback((isInitiator) => {
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected") setIsConnected(true);
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") setIsConnected(false);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current?.emit("signal", { candidate: e.candidate });
    };
    pc.ontrack = (e) => { remoteStreamRef.current = e.streams[0]; onRemoteStream?.(e.streams[0]); };
    if (isInitiator) {
      const dc = pc.createDataChannel("chat");
      dcRef.current = dc; setupDC(dc);
    } else {
      pc.ondatachannel = (e) => { dcRef.current = e.channel; setupDC(e.channel); };
    }
    return pc;
  }, [onRemoteStream]);

  const setupDC = (dc) => {
    dc.onopen = () => setIsConnected(true);
    dc.onclose = () => setIsConnected(false);
    dc.onmessage = (e) => {
      try { onDataMessage?.(JSON.parse(e.data)); } catch { onDataMessage?.({ type: "text", text: e.data }); }
    };
  };

  const closePC = useCallback(() => {
    try { if (dcRef.current) dcRef.current.close(); if (pcRef.current) pcRef.current.close(); } catch {}
    dcRef.current = null; pcRef.current = null; remoteStreamRef.current = null; localStreamRef.current = null;
    setIsConnected(false);
  }, []);

  const startLocalMedia = useCallback(async ({ audio = true, video = true } = {}) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
    localStreamRef.current = stream;
    if (pcRef.current) stream.getTracks().forEach((t) => pcRef.current.addTrack(t, stream));
    return stream;
  }, []);

  const createOffer = useCallback(async (targetSocketId, room) => {
    const pc = createPC(true);
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("signal", { toSocketId: targetSocketId, signal: { type: "offer", sdp: pc.localDescription.sdp }, room });
  }, [createPC]);

  const createAnswer = useCallback(async (targetSocketId, room, remoteSdp) => {
    const pc = createPC(false);
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: remoteSdp }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current.emit("signal", { toSocketId: targetSocketId, signal: { type: "answer", sdp: pc.localDescription.sdp }, room });
  }, [createPC]);

  const handleSignal = useCallback(async (payload) => {
    const { signal } = payload;
    const pc = pcRef.current || createPC(false);
    if (signal.type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit("signal", { toSocketId: payload.fromSocketId, signal: { type: "answer", sdp: pc.localDescription.sdp }, room: payload.room });
    } else if (signal.type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
    } else if (signal.type === "candidate") {
      try { await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)); } catch {}
    }
  }, [createPC]);

  const sendMessage = useCallback((msg) => {
    if (dcRef.current && dcRef.current.readyState === "open") dcRef.current.send(JSON.stringify(msg));
  }, []);

  return {
    socket: socketRef.current, pc: pcRef.current, localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current, isConnected, startLocalMedia, createOffer,
    createAnswer, handleSignal, sendMessage, closePC,
  };
}
