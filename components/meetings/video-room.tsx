"use client";

import { useState, useEffect } from "react";

import {
    LiveKitRoom,
    PreJoin,
    VideoConference,
    RoomAudioRenderer,
    useParticipants,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { joinMeeting, leaveMeeting } from "@/lib/actions/meetings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldAlert, Zap, Loader2, Video, MicOff, UserX, Volume2, SkipForward } from "lucide-react";

type UserChoices = {
    audioEnabled: boolean;
    videoEnabled: boolean;
    audioDeviceId: string;
    videoDeviceId: string;
    username: string;
};

interface VideoRoomProps {
    roomName: string;
    meetingId: string;
}

function HostModerationPanel({ roomName }: { roomName: string }) {
    const participants = useParticipants();
    const [isModerator, setIsModerator] = useState(false);
    const [muted, setMuted] = useState<Record<string, boolean>>({});
    const [busyIdentity, setBusyIdentity] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        fetch(`/api/livekit/moderate?room=${encodeURIComponent(roomName)}`)
            .then(async (response) => {
                if (!response.ok) return;
                const data = await response.json();
                if (active) setIsModerator(Boolean(data.isModerator));
            })
            .catch(() => undefined);

        return () => {
            active = false;
        };
    }, [roomName]);

    if (!isModerator) return null;

    const remoteParticipants = participants.filter((participant) => !participant.isLocal);

    async function moderate(identity: string, action: "mute" | "unmute" | "remove") {
        setBusyIdentity(identity);
        try {
            const response = await fetch("/api/livekit/moderate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ room: roomName, identity, action }),
            });
            if (!response.ok) return;
            if (action === "remove") {
                setMuted((current) => {
                    const next = { ...current };
                    delete next[identity];
                    return next;
                });
            } else {
                setMuted((current) => ({ ...current, [identity]: action === "mute" }));
            }
        } finally {
            setBusyIdentity(null);
        }
    }

    return (
        <aside className="absolute right-4 top-4 z-10 w-72 rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-white shadow-xl">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold">Host controls</p>
                    <p className="text-xs text-slate-400">{remoteParticipants.length} participant{remoteParticipants.length === 1 ? "" : "s"}</p>
                </div>
            </div>
            {remoteParticipants.length === 0 ? (
                <p className="text-xs text-slate-400">No other participants are connected.</p>
            ) : (
                <div className="space-y-2">
                    {remoteParticipants.map((participant) => {
                        const isMuted = Boolean(muted[participant.identity]);
                        const isBusy = busyIdentity === participant.identity;
                        return (
                            <div key={participant.identity} className="flex items-center justify-between gap-2 rounded-md bg-slate-900 px-2 py-2">
                                <span className="min-w-0 truncate text-sm">{participant.name || participant.identity}</span>
                                <div className="flex shrink-0 gap-1">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        title={isMuted ? "Allow participant to publish" : "Mute participant"}
                                        disabled={isBusy}
                                        onClick={() => moderate(participant.identity, isMuted ? "unmute" : "mute")}
                                        className="h-7 w-7 text-slate-200 hover:bg-slate-700 hover:text-white"
                                    >
                                        {isMuted ? <Volume2 className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        title="Remove participant"
                                        disabled={isBusy}
                                        onClick={() => moderate(participant.identity, "remove")}
                                        className="h-7 w-7 text-red-300 hover:bg-red-950 hover:text-red-200"
                                    >
                                        <UserX className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </aside>
    );
}

export default function VideoRoom({ roomName, meetingId }: VideoRoomProps) {
    const [token, setToken] = useState("");
    const [wsUrl, setWsUrl] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [dataSaver, setDataSaver] = useState(false);
    const [userChoices, setUserChoices] = useState<UserChoices | null>(null);

    function handleSkipSetup() {
        // Join straight into the room with mic/cam off — devices can be enabled in-room
        setUserChoices({ audioEnabled: false, videoEnabled: false, audioDeviceId: "", videoDeviceId: "", username: "" });
    }

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
        const isNotStarted = /not been started|not started/i.test(error)
        const isLocked = /locked/i.test(error)
        const isUnauthorized = /not invited|unauthorized|denied/i.test(error)

        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg bg-red-50 border border-red-200">
                <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">
                    {isNotStarted ? "Meeting Not Started" : isLocked ? "Meeting Locked" : isUnauthorized ? "Access Denied" : "Unable to Join"}
                </h3>
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

    const roomVideoEnabled = Boolean(userChoices?.videoEnabled) && !dataSaver;

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

            {!userChoices ? (
                <div className="flex-grow rounded-lg border border-gray-200 bg-slate-950 p-4 shadow-xl">
                    <div className="mx-auto flex h-full max-w-4xl flex-col justify-center gap-4">
                        <div className="flex items-center gap-3 text-white">
                            <Video className="h-5 w-5 text-blue-300" />
                            <div>
                                <h2 className="font-semibold">Check your setup before joining</h2>
                                <p className="text-sm text-slate-300">Choose your camera and microphone, then enter when you are ready.</p>
                            </div>
                        </div>
                        <PreJoin
                            defaults={{
                                audioEnabled: true,
                                videoEnabled: !dataSaver,
                            }}
                            onSubmit={setUserChoices}
                            onError={(deviceError) => {
                                // Non-blocking: device failures must never prevent joining
                                toast.error(`Camera/microphone unavailable (${deviceError.message}). You can still join using Skip setup.`);
                            }}
                            joinLabel="Enter meeting"
                            persistUserChoices
                            className="rounded-lg bg-white p-4"
                        />
                        <div className="flex flex-col items-center gap-1">
                            <Button type="button" variant="secondary" onClick={handleSkipSetup}>
                                <SkipForward className="mr-2 h-4 w-4" />
                                Skip setup — join directly
                            </Button>
                            <p className="text-xs text-slate-400">Optional. You can turn on your camera and microphone inside the meeting.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <LiveKitRoom
                    video={roomVideoEnabled}
                    audio={userChoices.audioEnabled}
                    token={token}
                    serverUrl={wsUrl}
                    onConnected={async () => {
                        await joinMeeting(meetingId);
                    }}
                    onDisconnected={async () => {
                        await leaveMeeting(meetingId);
                    }}
                    options={{
                        adaptiveStream: true,
                        audioCaptureDefaults: {
                            deviceId: userChoices.audioDeviceId,
                            autoGainControl: true,
                            echoCancellation: true,
                            noiseSuppression: true,
                        },
                        videoCaptureDefaults: {
                            deviceId: userChoices.videoDeviceId,
                            resolution: dataSaver ? { width: 320, height: 180 } : { width: 1280, height: 720 },
                        },
                        publishDefaults: {
                            videoEncoding: dataSaver ? {
                                maxBitrate: 100_000,
                                maxFramerate: 10,
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
                    <HostModerationPanel roomName={roomName} />
                    <VideoConference />
                    <RoomAudioRenderer />
                </LiveKitRoom>
            )}
        </div>
    );
}

