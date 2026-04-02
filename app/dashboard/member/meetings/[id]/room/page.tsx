import { getMeeting } from "@/lib/actions/meetings";
import { notFound, redirect } from "next/navigation";
import VideoRoom from "@/components/meetings/video-room";
import { getServerSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function VirtualMeetingRoomPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession();
    if (!session?.user) {
        redirect("/login");
    }

    const meeting = await getMeeting(params.id);

    if (!meeting) {
        return notFound();
    }

    if (!meeting.isOnline || !meeting.virtualRoomId) {
        return (
            <div className="p-8 text-center text-red-500">
                This meeting is not configured as a native virtual meeting.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{meeting.title} - Virtual Room</h1>
                    <p className="text-muted-foreground text-sm">You are joining as {session.user.name}</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/dashboard/member/meetings/${meeting.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Meeting Details
                    </Link>
                </Button>
            </div>

            <div className="flex-grow">
                <VideoRoom roomName={meeting.virtualRoomId} meetingId={meeting.id} />
            </div>
        </div>
    );
}
