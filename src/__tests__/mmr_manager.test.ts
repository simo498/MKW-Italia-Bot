// Mock modules that pull in globals.ts (which throws when env vars are absent)
// or make network/Discord requests.
jest.mock('axios');
jest.mock('../globals');
jest.mock('../log');
jest.mock('../application');
jest.mock('../emoijs_manager');

import { MMR, Rank } from '../player_details/MMRManager';

// ---------------------------------------------------------------------------
// getRankFromMMR
// ---------------------------------------------------------------------------

describe('MMR.getRankFromMMR – p12 thresholds', () => {
    // p12 thresholds: [0, 1999, 3999, 5999, 7499, 8999, 10499, 11999, 13499, 14499]
    // Index:            Iron(0) Bronze(1) Silver(2) Gold(3) Plat(4) Saph(5) Ruby(6) Diamond(7) Master(8) GM(9)

    const p12Cases: [number, Rank, string][] = [
        [0,     Rank.Iron,        'MMR 0 → Iron'],
        [1,     Rank.Iron,        'MMR 1 → Iron'],
        [1998,  Rank.Iron,        'MMR 1998 → Iron'],
        [1999,  Rank.Bronze,      'MMR 1999 → Bronze (exact boundary)'],
        [2000,  Rank.Bronze,      'MMR 2000 → Bronze'],
        [3998,  Rank.Bronze,      'MMR 3998 → Bronze'],
        [3999,  Rank.Silver,      'MMR 3999 → Silver (exact boundary)'],
        [4000,  Rank.Silver,      'MMR 4000 → Silver'],
        [5999,  Rank.Gold,        'MMR 5999 → Gold (exact boundary)'],
        [6000,  Rank.Gold,        'MMR 6000 → Gold'],
        [7499,  Rank.Platinum,    'MMR 7499 → Platinum (exact boundary)'],
        [7500,  Rank.Platinum,    'MMR 7500 → Platinum'],
        [8999,  Rank.Sapphire,    'MMR 8999 → Sapphire (exact boundary)'],
        [9000,  Rank.Sapphire,    'MMR 9000 → Sapphire'],
        [10499, Rank.Ruby,        'MMR 10499 → Ruby (exact boundary)'],
        [10500, Rank.Ruby,        'MMR 10500 → Ruby'],
        [11999, Rank.Diamond,     'MMR 11999 → Diamond (exact boundary)'],
        [12000, Rank.Diamond,     'MMR 12000 → Diamond'],
        [13499, Rank.Master,      'MMR 13499 → Master (exact boundary)'],
        [13500, Rank.Master,      'MMR 13500 → Master'],
        [14499, Rank.Grandmaster, 'MMR 14499 → Grandmaster (exact boundary)'],
        [14500, Rank.Grandmaster, 'MMR 14500 → Grandmaster'],
        [20000, Rank.Grandmaster, 'very high MMR → Grandmaster'],
    ];

    it.each(p12Cases)('%s', (mmr, expected) => {
        // @ts-ignore – MogiType is private; use the numeric value directly
        expect(MMR.getRankFromMMR(mmr, 12)).toBe(expected);
    });
});

describe('MMR.getRankFromMMR – p24 thresholds', () => {
    // p24 thresholds: [0, 1999, 3999, 5999, 7999, 9999, 11499, 12999, 14499, 15499]

    const p24Cases: [number, Rank, string][] = [
        [0,     Rank.Iron,        'MMR 0 → Iron'],
        [1999,  Rank.Bronze,      'MMR 1999 → Bronze (exact boundary)'],
        [3999,  Rank.Silver,      'MMR 3999 → Silver (exact boundary)'],
        [5999,  Rank.Gold,        'MMR 5999 → Gold (exact boundary)'],
        [7999,  Rank.Platinum,    'MMR 7999 → Platinum (exact boundary)'],
        [9999,  Rank.Sapphire,    'MMR 9999 → Sapphire (exact boundary)'],
        [11499, Rank.Ruby,        'MMR 11499 → Ruby (exact boundary)'],
        [12999, Rank.Diamond,     'MMR 12999 → Diamond (exact boundary)'],
        [14499, Rank.Master,      'MMR 14499 → Master (exact boundary)'],
        [15499, Rank.Grandmaster, 'MMR 15499 → Grandmaster (exact boundary)'],
        [20000, Rank.Grandmaster, 'very high MMR → Grandmaster'],
    ];

    it.each(p24Cases)('%s', (mmr, expected) => {
        // @ts-ignore – MogiType is private; use the numeric value directly
        expect(MMR.getRankFromMMR(mmr, 24)).toBe(expected);
    });
});

describe('MMR.getRankFromMMR – invalid mogi type', () => {
    it('throws for an unrecognised mogi type', () => {
        // @ts-ignore
        expect(() => MMR.getRankFromMMR(5000, 99)).toThrow('Invalid mogi type');
    });
});

// ---------------------------------------------------------------------------
// getPlayerIdFromUrl
// ---------------------------------------------------------------------------

describe('MMR.getPlayerIdFromUrl', () => {
    describe('valid URLs', () => {
        it('extracts ID from a full lounge URL', () => {
            expect(MMR.getPlayerIdFromUrl('https://lounge.mkcentral.com/mkworld/PlayerDetails/12345')).toBe('12345');
        });

        it('extracts ID with query parameters', () => {
            expect(MMR.getPlayerIdFromUrl(
                'https://lounge.mkcentral.com/mkworld/PlayerDetails/98765?season=2&p=12'
            )).toBe('98765');
        });

        it('is case-insensitive for PlayerDetails segment', () => {
            expect(MMR.getPlayerIdFromUrl('/playerdetails/42')).toBe('42');
        });

        it('handles leading and trailing whitespace', () => {
            expect(MMR.getPlayerIdFromUrl('  https://lounge.mkcentral.com/mkworld/PlayerDetails/777  ')).toBe('777');
        });

        it('handles PlayerDetails: colon separator (second pattern)', () => {
            expect(MMR.getPlayerIdFromUrl('PlayerDetails:999')).toBe('999');
        });

        it('handles player-details/ID (third pattern, hyphen separator)', () => {
            expect(MMR.getPlayerIdFromUrl('player-details/54321')).toBe('54321');
        });

        it('handles player_details/ID (third pattern, underscore separator)', () => {
            expect(MMR.getPlayerIdFromUrl('player_details/11111')).toBe('11111');
        });
    });

    describe('invalid URLs', () => {
        it('throws for a URL with no recognisable player ID', () => {
            expect(() => MMR.getPlayerIdFromUrl('https://example.com/unknown')).toThrow();
        });

        it('throws for an empty string', () => {
            expect(() => MMR.getPlayerIdFromUrl('')).toThrow();
        });

        it('throws for a plain numeric string (no recognised pattern)', () => {
            expect(() => MMR.getPlayerIdFromUrl('12345')).toThrow();
        });
    });
});

// ---------------------------------------------------------------------------
// MMR constructor and getMMRValue
// ---------------------------------------------------------------------------

describe('MMR instance', () => {
    it('stores and returns the MMR value', () => {
        // @ts-ignore – use numeric MogiType value
        const mmr = new MMR('player1', 5000, 12, Rank.Gold);
        expect(mmr.getMMRValue()).toBe(5000);
    });

    it('stores the MKCLoungeId', () => {
        // @ts-ignore
        const mmr = new MMR('abc123', 3000, 12, Rank.Silver);
        expect(mmr.MKCLoungeId).toBe('abc123');
    });
});
