
async function main() {
    try {
        const response = await fetch("http://localhost:3000/api/fix-db");
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text);
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}
main();
