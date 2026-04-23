import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBudget, approveBudget, disburseRequest, getFinancialSummary } from './finance'
import { db } from '@/lib/db'
import { getServerSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// Mock dependencies
vi.mock('@/lib/db', () => ({
    db: {
        transaction: vi.fn(),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue({})
            }))
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                $returningId: vi.fn().mockResolvedValue([{ id: 'new-id' }])
            }))
        })),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([])
            }))
        })),
        query: {
            financeFundRequests: { findFirst: vi.fn() }
        }
    },
    financeBudgets: { id: 'budget-id' },
    financeBudgetItems: { id: 'item-id' },
    financeFundRequests: { id: 'request-id' },
    financeTransactions: { id: 'tx-id' }
}))

vi.mock('@/lib/session', () => ({
    getServerSession: vi.fn()
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

describe('Finance Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createBudget', () => {
        it('should handle complex transaction for budget creation', async () => {
            ;(getServerSession as any).mockResolvedValue({
                user: { id: 'user-1' }
            })

            const mockTx = {
                insert: vi.fn(() => ({
                    values: vi.fn(() => ({
                        $returningId: vi.fn().mockResolvedValue([{ id: 'new-budget-id' }])
                    }))
                }))
            }
            ;(db.transaction as any).mockImplementation(async (cb: any) => await cb(mockTx))

            const budgetData = {
                year: 2026,
                title: 'Annual Budget',
                items: [
                    { category: 'Events', description: 'Annual Conf', amount: 500000 },
                    { category: 'Admin', description: 'Office', amount: 100000 }
                ]
            }

            const result = await createBudget(budgetData as any, 'org-1')

            expect(result.success).toBe(true)
            expect(db.transaction).toHaveBeenCalled()
            expect(mockTx.insert).toHaveBeenCalledTimes(3) // 1 for budget, 2 for items
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard/admin/finance/budgets')
        })
    })

    describe('disburseRequest', () => {
        it('should perform status update and transaction insert', async () => {
             ;(getServerSession as any).mockResolvedValue({
                user: { id: 'user-1' }
            })

            // Mock fetching the request
            ;(db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ id: 'req-1', status: 'APPROVED', amount: '1000', organizationId: 'org-1', title: 'Test Request' }])
            })

            const mockTx = {
                update: vi.fn(() => ({
                    set: vi.fn(() => ({
                        where: vi.fn().mockResolvedValue({})
                    }))
                })),
                insert: vi.fn(() => ({
                    values: vi.fn().mockResolvedValue({})
                }))
            }
            ;(db.transaction as any).mockImplementation(async (cb: any) => await cb(mockTx))

            const result = await disburseRequest('req-1')

            expect(result.success).toBe(true)
            expect(mockTx.update).toHaveBeenCalled()
            expect(mockTx.insert).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard/admin/finance/requests')
        })

        it('should fail if request is not approved', async () => {
            ;(getServerSession as any).mockResolvedValue({
                user: { id: 'user-1' }
            })

            ;(db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ id: 'req-1', status: 'PENDING', amount: '1000' }])
            })

            const result = await disburseRequest('req-1')

            expect(result.success).toBe(false)
            expect(result.error).toContain('approved first')
        })
    })

    describe('getFinancialSummary', () => {
        it('should correctly calculate balance from inflows and outflows', async () => {
            const mockTxs = [
                { type: 'INFLOW', amount: '1000.50' },
                { type: 'INFLOW', amount: '500.00' },
                { type: 'OUTFLOW', amount: '300.25' }
            ]

            ;(db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue(mockTxs)
            })

            const summary = await getFinancialSummary('org-1')

            expect(summary.totalInflow).toBe(1500.50)
            expect(summary.totalOutflow).toBe(300.25)
            expect(summary.balance).toBe(1200.25)
        })
    })
})
