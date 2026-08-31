"use client";

import { useState, useEffect } from "react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Loader2, ShieldAlert, Zap } from "lucide-react";

export function ContestLiveRoom({ room, height = 420 }: { room: string; height?: number }) {
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dataSaver, setDataSaver] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`/api/contests/livekit?room=${room}`);
        const data = await resp.json();
        if (data.error) setError(data.error);
        else { setToken(data.token); setWsUrl(data.wsUrl); }
      } catch { setError("Failed to fetch access token"); }
    })();
  }, [room]);

  if (error) return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg bg-red-50 border border-red-200" style={{ height }}>
      <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-700">Room Unavailable</h3>
      <p className="text-red-600 max-w-md">{error}</p>
    </div>
  );

  if (!token) return (
    <div className="flex flex-col items-center justify-center text-gray-500" style={{ height }}>
      <Loader2 className="h-8 w-8 animate-spin mb-2" /> Connecting to contest room...
    </div>
  );

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2">
          <Zap className={`h-5 w-5 ${dataSaver ? "text-blue-600" : "text-gray-400"}`} />
          <p className="text-sm font-medium text-blue-900">Data Saver Mode</p>
        </div>
        <button className="text-xs font-semibold bg-white px-3 py-1 rounded border" onClick={() => setDataSaver(v => !v)}>{dataSaver ? "On" : "Off"}</button>
      </div>
      <LiveKitRoom
        video={!dataSaver} audio={true} token={token} serverUrl={wsUrl}
        options={{ adaptiveStream: true,
          audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          videoCaptureDefaults: { resolution: dataSaver ? { width: 320, height: 180 } : { width: 1280, height: 720 } },
          publishDefaults: { videoEncoding: dataSaver ? { maxBitrate: 100_000, maxFramerate: 10 } : { maxBitrate: 800_000, maxFramerate: 30 } },
        }}
        connectOptions={{ autoSubscribe: true }}
        className="flex-grow rounded-lg overflow-hidden border border-gray-200 shadow-xl"
        style={{ height }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
