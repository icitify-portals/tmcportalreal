import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasPermission, canAccessOrganization, requirePermission } from './rbac-v2'
import * as dbMod from './db'

// Mock the entire DB module
vi.mock('./db', () => {
    const mockDb = {
        select: vi.fn(),
        query: {
            organizations: { findFirst: vi.fn() },
            userRoles: { findMany: vi.fn() }
        }
    }
    return { db: mockDb }
})

// Helper to mock the fluent DB selection
function mockSelectResponse(rows: any[]) {
    const mockReturn = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(rows)
    }
    ;(dbMod.db.select as any).mockReturnValue(mockReturn)
}

describe('RBAC v2 Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('hasPermission', () => {
        it('should return true for SuperAdmin (SYSTEM level) regardless of specific permission', async () => {
            mockSelectResponse([
                {
                    userRole: { id: 'ur1', userId: 'u1', organizationId: null },
                    role: { id: 'r1', name: 'Super Admin', code: 'SUPER', jurisdictionLevel: 'SYSTEM' },
                    permission: { code: 'some:perm' }
                }
            ])

            const result = await hasPermission('u1', 'any:permission')
            expect(result).toBe(true)
        })

        it('should return true if user has the specific permission', async () => {
            mockSelectResponse([
                {
                    userRole: { id: 'ur2', userId: 'u2', organizationId: 'org1' },
                    role: { id: 'r2', name: 'Admin', code: 'ADMIN', jurisdictionLevel: 'NATIONAL' },
                    permission: { code: 'users:read' }
                }
            ])

            const result = await hasPermission('u2', 'users:read')
            expect(result).toBe(true)
        })

        it('should return false if user lacks the specific permission', async () => {
            mockSelectResponse([
                {
                    userRole: { id: 'ur2', userId: 'u2', organizationId: 'org1' },
                    role: { id: 'r2', name: 'Admin', code: 'ADMIN', jurisdictionLevel: 'NATIONAL' },
                    permission: { code: 'something:else' }
                }
            ])

            const result = await hasPermission('u2', 'users:read')
            expect(result).toBe(false)
        })
    })

    describe('requirePermission', () => {
        it('should throw Unauthorized if no session', () => {
            expect(() => requirePermission(null, 'test')).toThrow('Unauthorized')
        })

        it('should throw Forbidden if user lacks permission', () => {
            const mockSession: any = {
                user: { id: 'u1', permissions: ['other:perm'] }
            }
            expect(() => requirePermission(mockSession, 'test:perm')).toThrow('Forbidden: test:perm permission required')
        })

        it('should return session if user has permission', () => {
            const mockSession: any = {
                user: { id: 'u1', permissions: ['test:perm'] }
            }
            const result = requirePermission(mockSession, 'test:perm')
            expect(result).toBe(mockSession)
        })

        it('should return session if user is SuperAdmin', () => {
            const mockSession: any = {
                user: { 
                    id: 'u1', 
                    permissions: [], 
                    roles: [{ jurisdictionLevel: 'SYSTEM' }] 
                }
            }
            const result = requirePermission(mockSession, 'any:perm')
            expect(result).toBe(mockSession)
        })
    })
})
