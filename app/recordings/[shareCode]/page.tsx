import { db } from "@/lib/db"
import { meetings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { getStorageSettings, getLiveKitSettings } from "@/lib/actions/settings"
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video } from "lucide-react"
import { ClientDate } from "@/components/ui/client-date"

export default async function SecureRecordingPage({ params }: { params: Promise<{ shareCode: string }> }) {
    const { shareCode } = await params
    const meeting = await db.query.meetings.findFirst({
        where: eq(meetings.recordingShareCode, shareCode)
    })

    if (!meeting) {
        return notFound()
    }

    const storage = await getStorageSettings()
    const livekit = await getLiveKitSettings()

    const bucket = livekit.s3Bucket || storage.s3Bucket;
    const accessKey = livekit.s3AccessKey || storage.s3AccessKey;
    const secretKey = livekit.s3SecretKey || storage.s3SecretKey;
    const region = livekit.s3Region || storage.s3Region || "us-east-1";
    const endpoint = livekit.s3Endpoint || storage.s3Endpoint;

    if (!bucket || !accessKey) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="max-w-lg w-full">
                    <CardHeader>
                        <CardTitle className="text-red-600">Storage Configuration Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        The server is not configured to serve recordings at this time.
                    </CardContent>
                </Card>
            </div>
        )
    }

    let presignedUrl = null
    let errorMsg = null

    try {
        const client = new S3Client({
            region: region,
            endpoint: endpoint ? `https://${endpoint}` : undefined,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
            },
            // Wasabi usually requires path style if endpoint is specified
            forcePathStyle: true, 
        })

        // Find the MP4 file
        const listCmd = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `recordings/${meeting.id}/`
        })

        const listRes = await client.send(listCmd)
        const mp4Obj = listRes.Contents?.find(obj => obj.Key?.endsWith(".mp4"))

        if (!mp4Obj || !mp4Obj.Key) {
            errorMsg = "The recording file is still processing or could not be found."
        } else {
            const getCmd = new GetObjectCommand({
                Bucket: bucket,
                Key: mp4Obj.Key
            })
            // Generate a 1-hour presigned URL
            presignedUrl = await getSignedUrl(client, getCmd, { expiresIn: 3600 })
        }
    } catch (err: any) {
        console.error("Failed to fetch recording from S3:", err)
        errorMsg = "Failed to communicate with storage server."
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center p-4 sm:p-8">
            <div className="max-w-4xl w-full space-y-6">
                <div className="flex items-center gap-4 text-white">
                    <div className="bg-primary/20 p-3 rounded-full">
                        <Video className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{meeting.title} - Recording</h1>
                        <p className="text-zinc-400">
                            Recorded on <ClientDate date={meeting.scheduledAt} formatString="PPP" />
                        </p>
                    </div>
                </div>

                <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <CardContent className="p-0 overflow-hidden rounded-lg">
                        {presignedUrl ? (
                            <div className="aspect-video bg-black flex items-center justify-center">
                                <video 
                                    src={presignedUrl} 
                                    controls 
                                    controlsList="nodownload"
                                    className="w-full h-full object-contain"
                                    autoPlay
                                />
                            </div>
                        ) : (
                            <div className="aspect-video bg-zinc-900 flex flex-col items-center justify-center p-8 text-center border border-zinc-800 rounded-lg">
                                <Video className="h-12 w-12 text-zinc-700 mb-4" />
                                <h3 className="text-lg font-semibold text-zinc-300">Recording Unavailable</h3>
                                <p className="text-zinc-500 mt-2 max-w-md">
                                    {errorMsg || "The recording is not ready yet."}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {presignedUrl && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex gap-4 text-sm text-zinc-400">
                        <p><strong>Note:</strong> This secure playback link is time-sensitive and will expire in 1 hour. Do not share the direct video URL.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
