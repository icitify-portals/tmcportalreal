"use client";

import { useState, useEffect } from "react";

import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { joinMeeting, leaveMeeting } from "@/lib/actions/meetings";
import { Track } from "livekit-client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Zap, Loader2 } from "lucide-react";

interface VideoRoomProps {
    roomName: string;
    meetingId: string;
}

export default function VideoRoom({ roomName, meetingId }: VideoRoomProps) {
    const [token, setToken] = useState("");
    const [wsUrl, setWsUrl] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [dataSaver, setDataSaver] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const resp = await fetch(`/api/livekit?room=${roomName}`);
                const data = await resp.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    setToken(data.token);
                    setWsUrl(data.wsUrl);
                }
            } catch (e) {
                console.error(e);
                setError("Failed to fetch access token");
            }
        })();
    }, [roomName]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg bg-red-50 border border-red-200">
                <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Access Denied</h3>
                <p className="text-red-600 max-w-md">{error}</p>
            </div>
        );
    }

    if (token === "") {
        return <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            Connecting to secure meeting server...
        </div>;
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                    <Zap className={`h-5 w-5 ${dataSaver ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                        <p className="text-sm font-medium text-blue-900 leading-none">Data Saver Mode</p>
                        <p className="text-xs text-blue-700 mt-1">Optimizes bandwidth by reducing video quality and using adaptive streaming.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="data-saver"
                        checked={dataSaver}
                        onCheckedChange={setDataSaver}
                    />
                    <Label htmlFor="data-saver" className="cursor-pointer">Toggle</Label>
                </div>
            </div>

            <LiveKitRoom
                video={!dataSaver} // Join with video off if data saver is on
                audio={true}
                token={token}
                serverUrl={wsUrl}
                onConnected={async () => {
                    await joinMeeting(meetingId);
                }}
                onDisconnected={async () => {
                    await leaveMeeting(meetingId);
                }}
                // Bandwidth Optimization settings
                options={{
                    adaptiveStream: true,
                    videoCaptureDefaults: {
                        resolution: dataSaver ? { width: 320, height: 180 } : { width: 1280, height: 720 },
                    },
                    publishDefaults: {
                        videoEncoding: dataSaver ? {
                            maxBitrate: 150_000,
                            maxFramerate: 15,
                        } : {
                            maxBitrate: 800_000,
                            maxFramerate: 30,
                        },
                        screenShareEncoding: dataSaver ? {
                            maxBitrate: 500_000,
                            maxFramerate: 10,
                        } : {
                            maxBitrate: 1_500_000,
                            maxFramerate: 15,
                        },
                    },
                }}
                connectOptions={{
                    autoSubscribe: true,
                }}
                data-lk-theme="default"
                className="flex-grow rounded-lg overflow-hidden border border-gray-200 shadow-xl"
            >
                <VideoConference />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
}

