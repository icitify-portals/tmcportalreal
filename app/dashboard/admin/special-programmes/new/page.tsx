import { SpecialProgrammeForm } from "@/components/admin/special-programmes/special-programme-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default function NewSpecialProgrammePage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-green-700">New Media Archive</h2>
                    <p className="text-sm text-muted-foreground">
                        Upload and categorize reports, audio recordings, and videos for special series.
                    </p>
                </div>
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/admin/special-programmes text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Archive
                    </Link>
                </Button>
            </div>

            <div className="max-w-4xl mx-auto">
                <Card className="border-green-100 shadow-sm">
                    <CardHeader className="bg-green-50/50">
                        <CardTitle>Programme Details & Media</CardTitle>
                        <CardDescription>
                            Enter the programme information and attach all relevant media files (Word, Audio, Video).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <SpecialProgrammeForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
