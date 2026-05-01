import "dotenv/config"
import { Resend } from "resend"

async function testResend() {
    const key = process.env.RESEND_API_KEY
    console.log(`[Test Resend] Testing Resend API key: ${key?.substring(0, 6)}...`)
    if (!key) {
        console.error("No RESEND_API_KEY found in process.env")
        return
    }

    const resend = new Resend(key)
    try {
        const result = await resend.emails.send({
            from: "TMC Connect <info@information.tmcng.net>",
            to: "aa.adelopo2@gmail.com",
            subject: "Resend Direct Test",
            html: "<p>This is a direct test of the Resend API key from the server.</p>"
        })

        if (result.data) {
            console.log("[Test Resend] Email sent successfully!", result.data)
        } else {
            console.error("[Test Resend] Email failed to send:", result.error)
        }
    } catch (e) {
        console.error("[Test Resend] Error during send:", e)
    }
}

testResend().then(() => process.exit(0))
