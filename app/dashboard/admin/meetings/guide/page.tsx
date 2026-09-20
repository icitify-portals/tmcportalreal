import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function MeetingsGuidePage() {
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard/admin/meetings">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Meetings Guide</h2>
                        <p className="text-muted-foreground">Learn how to manage online meetings, guest access, and recordings.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Scheduling an Online Meeting</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p>When creating a new meeting from the Admin Dashboard, you can choose to make it a virtual (online) meeting.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Navigate to <strong>Dashboard &rarr; Meetings</strong> and click <strong>New Meeting</strong>.</li>
                                <li>Fill in the Title, Date, and Description.</li>
                                <li>Toggle the <strong>"Is Online Meeting"</strong> switch to ON.</li>
                                <li>Add members to the invite list and click <strong>Save</strong>.</li>
                            </ul>
                            <p className="text-sm text-muted-foreground mt-2">Upon saving, the system automatically provisions a secure LiveKit virtual room, generates a unique Share Code, and dispatches email invitations to all invited members.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. The Email Invitation & Guest Access</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p>The invitation email sent to participants now contains <strong>two</strong> access methods for online meetings:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>View Meeting Dashboard:</strong> This link is for registered portal members. It prompts them to log in and takes them to the meeting details page, where they can view attachments (e.g., previous minutes) and join the room.</li>
                                <li><strong>Join Live Room Directly (Guest Link):</strong> This link allows anyone to join the meeting <strong>without</strong> logging in or creating an account. They simply type their Name and click "Join as Guest".</li>
                            </ul>
                            <p className="text-sm text-muted-foreground mt-2">Tip: You can also manually copy the Guest Link from the Meeting Details page by clicking the "Copy Live Link" button.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>3. Starting the Meeting</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p>Participants (both members and guests) cannot enter the video room until an Admin officially starts the meeting.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>As an admin, go to the Meeting Details page.</li>
                                <li>Click the green <strong>"Start Meeting"</strong> button.</li>
                                <li>Once started, the room opens and participants will successfully connect.</li>
                                <li>Click <strong>"Join Room"</strong> to enter the video interface yourself.</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>4. Recording the Meeting to S3</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p>During an ongoing online meeting, admins have the ability to record the session directly to your Wasabi/S3 cloud storage bucket.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>While the meeting is running, return to the Meeting Details page.</li>
                                <li>Click the orange <strong>"Record to S3"</strong> button.</li>
                                <li>The button will pulse, indicating that the LiveKit Egress service is capturing the meeting.</li>
                                <li>When you are finished, click <strong>"Recording..."</strong> to stop the recording job.</li>
                            </ul>
                            <p className="text-sm text-muted-foreground mt-2">Note: The recording will take a few minutes to process and upload to your S3 bucket after it is stopped.</p>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>5. Generating Playback Links</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p>After the meeting has concluded and the recording has successfully uploaded, you can securely share the playback with members.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>On the Meeting Details page, locate the <strong>Recording &amp; Playback</strong> card.</li>
                                <li>Click <strong>"Generate Secure Playback Link"</strong>.</li>
                                <li>This will generate a unique share code and a link.</li>
                                <li>You can copy this link and send it to your members.</li>
                                <li>When users visit the playback link, they will use the code to generate a temporary, expiring URL to stream the video securely from your S3 bucket.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
