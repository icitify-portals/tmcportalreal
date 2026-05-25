'use server'

export async function getPaystackPublicKey() {
    return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || "";
}
