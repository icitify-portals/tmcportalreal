import "dotenv/config";
import axios from "axios";

async function run() {
    try {
        const response = await axios.get("https://api.paystack.co/transaction?perPage=5", {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });
        
        console.log("Recent Paystack Transactions:");
        for (const tx of response.data.data) {
            console.log(`- Ref: ${tx.reference} | Amount: ${tx.amount / 100} NGN | Status: ${tx.status} | Date: ${tx.created_at}`);
            console.log(`  Metadata: ${JSON.stringify(tx.metadata)}`);
        }
    } catch(e: any) {
        console.error(e.response?.data || e.message);
    }
}
run();
