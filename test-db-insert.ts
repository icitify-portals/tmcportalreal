import { db } from "./lib/db";
import { messages } from "./lib/db/schema";
import { v4 as uuidv4 } from "uuid";

async function run() {
    try {
        console.log("Attempting insert...");
        await db.insert(messages).values({
            id: uuidv4(),
            chatId: "dummy-chat-id", 
            senderId: "dummy-sender-id",
            content: "dummy-content",
            readBy: ["dummy-sender-id"],
            encryptedKeys: { "dummy-user": "dummy-key" }
        });
        console.log("Insert successful!");
    } catch (e: any) {
        console.error("DB Error:", e);
    }
    process.exit(0);
}
run();
