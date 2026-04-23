import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFee, assignFee, recordFeePayment } from './fees'
import { db } from '@/lib/db'
import { getServerSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// Mock dependencies
vi.mock('@/lib/db', () => {
    const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
    })

    return {
        db: {
            insert: vi.fn(() => ({
                values: vi.fn(() => ({
                    $returningId: vi.fn().mockResolvedValue([{ id: 'new-id' }])
                }))
            })),
            select: mockSelect,
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue({})
                }))
            })),
            transaction: vi.fn(),
            query: {
                users: { findFirst: vi.fn() },
                organizations: { findFirst: vi.fn() }
            }
        },
        fees: { id: 'fee-id', amount: 'amount', organizationId: 'org-id' },
        feeAssignments: { id: 'assign-id', feeId: 'fee-id', userId: 'user-id' },
        organizations: { id: 'org-id', name: 'org-name', level: 'level', parentId: 'parent-id' },
        members: { userId: 'user-id', organizationId: 'org-id' },
        officials: { userId: 'user-id', organizationId: 'org-id' },
        users: { id: 'user-id', email: 'email', name: 'name' },
        payments: { id: 'pay-id' }
    }
})

vi.mock('@/lib/session', () => ({
    getServerSession: vi.fn()
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

vi.mock('@/lib/invoice-generator', () => ({
    generateInvoicePDF: vi.fn().mockResolvedValue(Buffer.from('pdf')),
    generateReceiptPDF: vi.fn().mockResolvedValue(Buffer.from('pdf'))
}))

vi.mock('@/lib/email', () => ({
    sendEmail: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('uuid', () => ({
    v4: vi.fn().mockReturnValue('mock-uuid')
}))

describe('Fees Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(db.select as any).mockReset()
    })

    function mockSelectChain(rows: any[]) {
        const mock = {
            from: vi.fn().mockReturnThis(),
            innerJoin: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(rows),
            orderBy: vi.fn().mockResolvedValue(rows),
            limit: vi.fn().mockReturnThis(),
            offset: vi.fn().mockReturnThis(),
        }
        return mock
    }

    describe('createFee', () => {
        it('should successfully create a fee and trigger assignment', async () => {
             ;(getServerSession as any).mockResolvedValue({
                user: { id: 'user-1' }
            })

            // assignFee sequence:
            // 1. Fetch fee
            // 2. Fetch org
            // 3. Fetch members
            // 4. Fetch users
            ;(db.select as any)
                .mockReturnValueOnce(mockSelectChain([{ id: 'uuid-1', organizationId: 'org-1', targetType: 'ALL_MEMBERS', amount: '1000' }]))
                .mockReturnValueOnce(mockSelectChain([{ id: 'org-1', level: 'NATIONAL', name: 'National Body' }]))
                .mockReturnValueOnce(mockSelectChain([{ userId: 'u1' }]))
                .mockReturnValueOnce(mockSelectChain([{ id: 'u1', name: 'User 1', email: 'u1@test.com' }]))

            const feeData = {
                title: 'Annual Levy',
                amount: 1000,
                targetType: 'ALL_MEMBERS' as any
            }

            const result = await createFee(feeData, 'org-1')

            if (!result.success) console.error('createFee failed:', result.error)
            expect(result.success, result.error).toBe(true)
            expect(db.insert).toHaveBeenCalled()
        })
    })

    describe('recordFeePayment', () => {
        it('should reject payment if amount is less than stipulated', async () => {
            ;(getServerSession as any).mockResolvedValue({
                user: { id: 'user-1' }
            })

            ;(db.select as any).mockReturnValue(mockSelectChain([{ 
                assignment: { id: 'a1' }, 
                fee: { amount: '1000', title: 'Test Fee', organizationId: 'org-1' } 
            }]))

            const result = await recordFeePayment('a1', 500, 'ref-123')

            expect(result.success).toBe(false)
            expect(result.error).toContain('Minimum payment amount is NGN 1000')
        })

        it('should record payment and update assignment via transaction', async () => {
            ;(getServerSession as any).mockResolvedValue({
                user: { id: 'user-1' }
            })

            // recordFeePayment sequence:
            // 1. Fetch assignment
            // 2. Fetch org
            ;(db.select as any)
                .mockReturnValueOnce(mockSelectChain([{ 
                    assignment: { id: 'a1' }, 
                    fee: { amount: '1000', title: 'Test Fee', organizationId: 'org-1' } 
                }]))
                .mockReturnValueOnce(mockSelectChain([{ id: 'org-1', name: 'Org 1' }]))

            const mockTx = {
                insert: vi.fn(() => ({
                    values: vi.fn(() => ({
                        $returningId: vi.fn().mockResolvedValue([{ id: 'p1' }])
                    }))
                })),
                update: vi.fn(() => ({
                    set: vi.fn(() => ({
                        where: vi.fn().mockResolvedValue({})
                    }))
                }))
            }
            ;(db.transaction as any).mockImplementation(async (cb: any) => await cb(mockTx))

            // Mock user lookup for receipt
            ;(db.query.users.findFirst as any).mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test' })

            const result = await recordFeePayment('a1', 1000, 'ref-123')

            if (!result.success) console.error('recordFeePayment failed:', result.error)
            expect(result.success, result.error).toBe(true)
            expect(mockTx.insert).toHaveBeenCalled()
            expect(mockTx.update).toHaveBeenCalled()
        })
    })
})
