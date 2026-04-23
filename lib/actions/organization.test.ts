import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrganization, deleteOrganization, updateOrganization } from './organization'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Mock dependencies
vi.mock('@/lib/db', () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue({})
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue({})
            }))
        })),
        delete: vi.fn(() => ({
            where: vi.fn().mockResolvedValue({})
        })),
        query: {
            organizations: {
                findFirst: vi.fn()
            }
        }
    },
    organizations: { id: 'org-id', parentId: 'parent-id' }
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

describe('Organization Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createOrganization', () => {
        it('should return error if required fields are missing', async () => {
            const formData = new FormData()
            formData.append('name', '') // Missing name

            const result = await createOrganization(formData)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Missing required fields')
        })

        it('should successfully insert organization and revalidate path', async () => {
            const formData = new FormData()
            formData.append('name', 'New Org')
            formData.append('level', 'BRANCH')
            formData.append('code', 'NORG1')

            const result = await createOrganization(formData)

            expect(result.success).toBe(true)
            expect(db.insert).toHaveBeenCalled()
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard/admin/organizations')
        })

        it('should handle duplicate entry errors', async () => {
            const formData = new FormData()
            formData.append('name', 'Existing Org')
            formData.append('level', 'STATE')
            formData.append('code', 'EXISTING')

            ;(db.insert as any).mockReturnValue({
                values: vi.fn().mockRejectedValue({ code: 'ER_DUP_ENTRY' })
            })

            const result = await createOrganization(formData)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Organization code already exists')
        })
    })

    describe('deleteOrganization', () => {
        it('should return error if organization has children', async () => {
            // Mock finding a child
            ;(db.query.organizations.findFirst as any).mockResolvedValue({ id: 'child-org' })

            const result = await deleteOrganization('parent-id')

            expect(result.success).toBe(false)
            expect(result.error).toContain('delete children first')
            expect(db.delete).not.toHaveBeenCalled()
        })

        it('should delete organization if no children exist', async () => {
            // Mock no children
            ;(db.query.organizations.findFirst as any).mockResolvedValue(null)

            const result = await deleteOrganization('target-id')

            expect(result.success).toBe(true)
            expect(db.delete).toHaveBeenCalled()
        })
    })

    describe('updateOrganization', () => {
        it('should successfully update organization details', async () => {
            const formData = new FormData()
            formData.append('name', 'Updated Org')
            formData.append('level', 'LOCAL_GOVERNMENT')
            formData.append('code', 'UPDATED')

            const result = await updateOrganization('org-1', formData)

            expect(result.success).toBe(true)
            expect(db.update).toHaveBeenCalled()
        })
    })
})
