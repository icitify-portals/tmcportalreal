export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { VerifyEmailContent } from "@/components/auth/verify-email-content"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#166534] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#166534] border-green-700">
        <CardHeader>
          <CardTitle className="text-2xl text-white text-center">Email Verification</CardTitle>
        </CardHeader>
        <Suspense fallback={
          <CardContent className="flex justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          </CardContent>
        }>
          <VerifyEmailContent />
        </Suspense>
      </Card>
    </div>
  )
}
