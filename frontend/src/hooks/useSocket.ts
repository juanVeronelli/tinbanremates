import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const WS_URL = import.meta.env.VITE_WS_URL || (typeof window !== "undefined" ? window.location.origin : "");

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!WS_URL) return;
    const socket = io(WS_URL, {
      auth: { token: token ?? undefined },
      path: "/socket.io",
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => {
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const joinAuction = (auctionId: string) => {
    socketRef.current?.emit("join_auction", auctionId);
  };

  const leaveAuction = (auctionId: string) => {
    socketRef.current?.emit("leave_auction", auctionId);
  };

  const onNewBid = (cb: (data: { bid: any; auction: any }) => void) => {
    socketRef.current?.on("new_bid", cb);
    return () => socketRef.current?.off("new_bid");
  };

  const onAuctionUpdate = (cb: (data: { endsAt: string; currentPrice: number; status?: string }) => void) => {
    socketRef.current?.on("auction_update", cb);
    return () => socketRef.current?.off("auction_update");
  };

  return { socket: socketRef.current, connected, joinAuction, leaveAuction, onNewBid, onAuctionUpdate };
}
