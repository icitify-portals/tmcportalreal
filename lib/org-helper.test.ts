import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getOrganizationTree } from './org-helper'
import { db } from './db'

// Mock the database
vi.mock('./db', () => ({
    db: {
        query: {
            organizations: {
                findMany: vi.fn()
            }
        }
    }
}))

describe('Organization Helper', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getOrganizationTree', () => {
        it('should correctly build a flat list into a hierarchy', async () => {
            const mockOrgs = [
                { id: '1', name: 'National Body', level: 'NATIONAL', code: 'NAT', parentId: null },
                { id: '2', name: 'Lagos State', level: 'STATE', code: 'LAG', parentId: '1' },
                { id: '3', name: 'Ikeja LGA', level: 'LOCAL_GOVERNMENT', code: 'IKJ', parentId: '2' },
                { id: '4', name: 'Ogba Branch', level: 'BRANCH', code: 'OGB', parentId: '3' },
            ];

            (db.query.organizations.findMany as any).mockResolvedValue(mockOrgs)

            const tree = await getOrganizationTree()

            expect(tree).toHaveLength(1)
            expect(tree[0].name).toBe('National Body')
            expect(tree[0].states).toHaveLength(1)
            expect(tree[0].states[0].name).toBe('Lagos State')
            expect(tree[0].states[0].lgas).toHaveLength(1)
            expect(tree[0].states[0].lgas[0].name).toBe('Ikeja LGA')
            expect(tree[0].states[0].lgas[0].branches).toHaveLength(1)
            expect(tree[0].states[0].lgas[0].branches[0].name).toBe('Ogba Branch')
        })

        it('should handle multiple states and LGAs', async () => {
            const mockOrgs = [
                { id: '1', name: 'National', level: 'NATIONAL', code: 'N', parentId: null },
                { id: '2', name: 'Lagos', level: 'STATE', code: 'L', parentId: '1' },
                { id: '3', name: 'Oyo', level: 'STATE', code: 'O', parentId: '1' },
                { id: '4', name: 'LGA 1', level: 'LOCAL_GOVERNMENT', code: 'L1', parentId: '2' },
                { id: '5', name: 'LGA 2', level: 'LOCAL_GOVERNMENT', code: 'L2', parentId: '2' },
            ];

            (db.query.organizations.findMany as any).mockResolvedValue(mockOrgs)

            const tree = await getOrganizationTree()

            expect(tree[0].states).toHaveLength(2)
            const lagos = tree[0].states.find(s => s.name === 'Lagos')
            expect(lagos?.lgas).toHaveLength(2)
        })

        it('should return empty array if no organizations exist', async () => {
            (db.query.organizations.findMany as any).mockResolvedValue([])
            const tree = await getOrganizationTree()
            expect(tree).toEqual([])
        })
    })
})
