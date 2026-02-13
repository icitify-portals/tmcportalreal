
async function main() {
    console.log("Testing /api/chat...");
    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "TEST_DEEPSEEK" }
                ]
            })
        });

        console.log("Status:", response.status);
        console.log("Headers:", [...response.headers.entries()]);
        if (!response.ok) {
            console.log("FAIL: " + response.status);
            console.log(await response.text());
            return;
        }

        console.log("SUCCESS: " + response.status);
        const text = await response.text();
        console.log("Response length:", text.length);

    } catch (error) {
        console.error("Test failed:", error);
    }
}

main();
