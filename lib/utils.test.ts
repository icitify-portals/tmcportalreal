import { describe, it, expect } from 'vitest'
import { generateMemberId, slugify, formatDate } from './utils'

describe('Utility Functions', () => {
    describe('generateMemberId', () => {
        it('should format sequence with leading zeros', () => {
            expect(generateMemberId('LAG', 1)).toBe('LAG-000001')
            expect(generateMemberId('Oyo', 1234)).toBe('Oyo-001234')
        })

        it('should handle large sequences', () => {
            expect(generateMemberId('ABC', 1234567)).toBe('ABC-1234567')
        })
    })

    describe('slugify', () => {
        it('should convert text to lowercase and replace spaces with hyphens', () => {
            expect(slugify('Hello World')).toBe('hello-world')
        })

        it('should remove special characters', () => {
            expect(slugify('TMC Portal @ 2024!')).toBe('tmc-portal-2024')
        })

        it('should handle multiple spaces and hyphens', () => {
            expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
            expect(slugify('Hyphen--Separated')).toBe('hyphen-separated')
        })
    })

    describe('formatDate', () => {
        it('should format date strings correctly', () => {
            const date = new Date('2024-03-31')
            // Using regex because toLocaleDateString can vary by environment locale, 
            // but we expect March 31, 2024 or similar patterns
            const formatted = formatDate(date)
            expect(formatted).toContain('2024')
            expect(formatted).toContain('March')
        })
    })
})
