
import "dotenv/config";

async function main() {
    console.log("Testing DeepSeek Direct Connection (Fetch)...");
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) { console.error("No Key"); return; }

    const endpoints = [
        'https://api.deepseek.com/v1/chat/completions',
    ];

    for (const url of endpoints) {
        console.log(`\nTrying ${url}...`);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: 'Ping' }],
                    stream: false
                })
            });
            console.log(`Status: ${response.status}`);
            if (response.ok) {
                console.log("SUCCESS! Response:", await response.text());
                break;
            } else {
                console.log("Failed:", await response.text());
            }
        } catch (e) {
            console.error("Error:", e);
        }
    }
}

main();
