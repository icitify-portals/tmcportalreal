import { z } from "zod"

export const OccasionTypeSchema = z.object({
    name: z.string().min(1),
    certificateFee: z.number().nonnegative(),
})

export const RequestSchema = z.object({
    typeId: z.string(),
    organizationId: z.string(),
    date: z.coerce.date(),
    time: z.string(),
    venue: z.string(),
    address: z.string(),
    role: z.enum(['COORDINATING', 'WITNESS']),
    certificateNeeded: z.boolean().default(false),
    details: z.any() // JSON
})
