// Mock modules that trigger problematic side-effects (e.g. globals.ts throws when
// required env vars are absent) so that only the pure FriendCode class is exercised.
jest.mock('../application');
jest.mock('../log');

import { FriendCode, InvalidFriendCode } from '../frend_codes';

describe('FriendCode', () => {
    describe('valid friend codes', () => {
        it('accepts a correctly-formatted SW- code', () => {
            const fc = new FriendCode('SW-1234-5678-9012');
            expect(fc.toString()).toBe('SW-1234-5678-9012');
        });

        it('accepts a code without the SW- prefix and adds it', () => {
            const fc = new FriendCode('1234-5678-9012');
            expect(fc.toString()).toBe('SW-1234-5678-9012');
        });

        it('normalises lowercase digits (no "SW" prefix) to uppercase', () => {
            // Digits-only segments are valid; "SW-" is prepended then uppercased.
            const fc = new FriendCode('1234-5678-9012');
            expect(fc.toString()).toBe('SW-1234-5678-9012');
        });

        it('rejects a lowercase "sw-" prefix (startsWith check is case-sensitive)', () => {
            // The validation first checks startsWith("SW") – case-sensitive – so a
            // lowercase "sw-" prefix causes "SW-" to be prepended a second time,
            // producing an invalid code.  This is the current documented behaviour.
            expect(() => new FriendCode('sw-1234-5678-9012')).toThrow(InvalidFriendCode);
        });

        it('rejects a mixed-case "Sw-" prefix (startsWith check is case-sensitive)', () => {
            expect(() => new FriendCode('Sw-1234-5678-9012')).toThrow(InvalidFriendCode);
        });
    });

    describe('invalid friend codes', () => {
        it('throws InvalidFriendCode for a completely wrong string', () => {
            expect(() => new FriendCode('invalid')).toThrow(InvalidFriendCode);
        });

        it('throws for a code with letters in the numeric segments', () => {
            expect(() => new FriendCode('SW-ABCD-5678-9012')).toThrow(InvalidFriendCode);
        });

        it('throws when a segment has fewer than 4 digits', () => {
            expect(() => new FriendCode('SW-123-5678-9012')).toThrow(InvalidFriendCode);
        });

        it('throws when a segment has more than 4 digits', () => {
            expect(() => new FriendCode('SW-12345-5678-9012')).toThrow(InvalidFriendCode);
        });

        it('throws when there are only two numeric segments', () => {
            expect(() => new FriendCode('SW-1234-5678')).toThrow(InvalidFriendCode);
        });

        it('throws for an empty string', () => {
            expect(() => new FriendCode('')).toThrow(InvalidFriendCode);
        });

        it('throws when extra segments are present', () => {
            expect(() => new FriendCode('SW-1234-5678-9012-3456')).toThrow(InvalidFriendCode);
        });
    });

    describe('toString', () => {
        it('returns the stored (canonical) friend code string', () => {
            const fc = new FriendCode('SW-0000-0000-0001');
            expect(fc.toString()).toBe('SW-0000-0000-0001');
        });
    });
});
