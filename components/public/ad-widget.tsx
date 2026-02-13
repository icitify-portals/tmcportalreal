import { db } from "@/lib/db"
import { promotions, promotionPlans } from "@/lib/db/schema"
import { and, eq, lte, gte } from "drizzle-orm"
import Link from "next/link"
import Image from "next/image"

export async function PromotionWidget() {
    const now = new Date()

    // Fetch active promotions
    const activePromos = await db.query.promotions.findMany({
        where: and(
            eq(promotions.status, 'ACTIVE'),
            eq(promotions.paymentStatus, 'SUCCESS'),
            lte(promotions.startDate, now),
            gte(promotions.endDate, now)
        ),
        limit: 5 // Get a few to rotate or pick one
    })

    if (activePromos.length === 0) return null

    // Pick the first one for deterministic rendering (avoids hydration mismatch)
    const promo = activePromos[0]

    return (
        <div className="w-full bg-card border rounded-lg overflow-hidden shadow-sm my-4">
            <div className="p-2 text-xs text-muted-foreground uppercase font-semibold tracking-wider text-center bg-muted/50">
                Sponsored
            </div>
            <a href={promo.link || "#"} target="_blank" rel="noopener noreferrer" className="block relative aspect-[4/3] w-full hover:opacity-95 transition-opacity">
                <Image
                    src={promo.imageUrl}
                    alt={promo.title}
                    fill
                    className="object-cover"
                />
            </a>
            <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-1">{promo.title}</h3>
                {promo.link && (
                    <p className="text-xs text-blue-500 line-clamp-1 mt-1">{promo.link.replace(/^https?:\/\//, '')}</p>
                )}
            </div>
        </div>
    )
}
