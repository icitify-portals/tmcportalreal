import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProgramme } from './programmes'
import { db } from '@/lib/db'
import { getServerSession } from '@/lib/session'
import { getYearPlannerSettings } from '@/lib/actions/settings'
import { revalidatePath } from 'next/cache'

// Mock dependencies
const mockSelect = vi.fn()
vi.mock('@/lib/db', () => ({
    db: {
        query: {
            organizations: { findFirst: vi.fn() }
        },
        select: vi.fn(),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                $returningId: vi.fn().mockResolvedValue([{ id: 'new-prog-id' }])
            }))
        }))
    },
    programmes: { id: 'prog-id' },
    organizations: { id: 'org-id', level: 'level', state: 'state' }
}))

vi.mock('@/lib/session', () => ({
    getServerSession: vi.fn()
}))

vi.mock('@/lib/actions/settings', () => ({
    getYearPlannerSettings: vi.fn()
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

describe('Programme Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        
        // Default Mock for Year Settings
        ;(getYearPlannerSettings as any).mockResolvedValue({
            programYearStart: new Date('2026-01-01'),
            programYearEnd: new Date('2026-12-31'),
            submissionDeadline: new Date('2026-12-31')
        })
    })

    describe('createProgramme', () => {
        const validData = {
            title: 'Annual Conference',
            description: 'A very detailed description of the conference.',
            venue: 'Main Hall',
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-06-03'),
            time: '09:00 AM',
            targetAudience: 'PUBLIC' as any,
            paymentRequired: false,
            amount: 0,
            hasCertificate: false
        }

        function mockOrgResponse(org: any) {
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([org])
            })
        }

        it('should correctly set status to PENDING_STATE for Branch level', async () => {
            // Mock Session
            ;(getServerSession as any).mockResolvedValue({
                user: { id: 'user-1', officialLevel: 'STATE' }
            })

            // Mock Organization via db.select
            mockOrgResponse({
                id: 'org-1',
                level: 'BRANCH',
                state: 'Lagos'
            })

            const result = await createProgramme(validData, 'org-1')

            if (!result.success) console.log('Test failed with error:', result.error)
            expect(result.success).toBe(true)
            const insertCall = (db.insert as any).mock.results[0].value.values.mock.calls[0][0]
            expect(insertCall.status).toBe('PENDING_STATE')
        })

        it('should correctly set status to PENDING_NATIONAL for State level', async () => {
            ;(getServerSession as any).mockResolvedValue({
                user: { id: 'user-1', officialLevel: 'STATE' }
            })

            mockOrgResponse({
                id: 'org-1',
                level: 'STATE',
                state: 'Lagos'
            })

            const result = await createProgramme(validData, 'org-1')

            expect(result.success).toBe(true)
            const insertCall = (db.insert as any).mock.results[0].value.values.mock.calls[0][0]
            expect(insertCall.status).toBe('PENDING_NATIONAL')
        })

        it('should mark as late if past deadline', async () => {
            ;(getYearPlannerSettings as any).mockResolvedValue({
                programYearStart: new Date('2026-01-01'),
                programYearEnd: new Date('2026-12-31'),
                submissionDeadline: new Date('2000-01-01') 
            })

            ;(getServerSession as any).mockResolvedValue({
                user: { id: 'user-1', officialLevel: 'STATE' }
            })

            mockOrgResponse({
                id: 'org-1',
                level: 'STATE',
                state: 'Lagos'
            })

            const result = await createProgramme(validData, 'org-1')

            expect(result.success).toBe(true)
            const insertCall = (db.insert as any).mock.results[0].value.values.mock.calls[0][0]
            expect(insertCall.isLateSubmission).toBe(true)
        })

        it('should throw error if session is missing', async () => {
            ;(getServerSession as any).mockResolvedValue(null)

            const result = await createProgramme(validData, 'org-1')
            expect(result.success).toBe(false)
            expect(result.error).toBe('Unauthorized')
        })

        it('should reject creation for a different state than the admin', async () => {
            // Admin is Lagos State Admin
            ;(getServerSession as any).mockResolvedValue({
                user: { 
                    id: 'user-1', 
                    officialLevel: 'STATE',
                    state: 'Lagos'
                }
            })

            // Mocking the check for Lagos State ID
            ;(db.query.organizations.findFirst as any)
                .mockResolvedValueOnce({ id: 'lagos-org', level: 'STATE', state: 'Lagos' }) // Admin's org
                .mockResolvedValueOnce({ id: 'oyo-org', level: 'STATE', state: 'Oyo' })     // Target org
            mockOrgResponse({ id: 'oyo-org', level: 'STATE', state: 'Oyo' })

            const result = await createProgramme(validData, 'oyo-org')

            expect(result.success).toBe(false)
            expect(result.error).toContain('only create programmes for your state')
        })
    })
})
