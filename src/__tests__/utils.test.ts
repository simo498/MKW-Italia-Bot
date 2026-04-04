jest.mock('../application');
jest.mock('../log');

import { standardDiscordTimeFormat, execAndLoop } from '../utils';

// ---------------------------------------------------------------------------
// standardDiscordTimeFormat
// ---------------------------------------------------------------------------

describe('standardDiscordTimeFormat', () => {
    it('wraps a Unix timestamp in Discord time format tags', () => {
        const date = new Date('2024-01-01T00:00:00.000Z'); // Unix 1704067200
        expect(standardDiscordTimeFormat(date)).toBe(`<t:${Math.floor(date.getTime() / 1000)}:f>`);
    });

    it('truncates sub-second precision (floor, not round)', () => {
        // 999 ms below the next second → should still floor down
        const date = new Date('2024-06-15T12:00:00.999Z');
        const expectedUnix = Math.floor(date.getTime() / 1000);
        expect(standardDiscordTimeFormat(date)).toBe(`<t:${expectedUnix}:f>`);
    });

    it('produces the correct tag for a well-known date', () => {
        // 2000-01-01 00:00:00 UTC → Unix 946684800
        const date = new Date('2000-01-01T00:00:00.000Z');
        expect(standardDiscordTimeFormat(date)).toBe('<t:946684800:f>');
    });

    it('always uses the ":f" (long date/short time) Discord format modifier', () => {
        const result = standardDiscordTimeFormat(new Date());
        expect(result).toMatch(/^<t:\d+:f>$/);
    });
});

// ---------------------------------------------------------------------------
// execAndLoop
// ---------------------------------------------------------------------------

describe('execAndLoop', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('calls the provided function immediately', async () => {
        const fn = jest.fn().mockResolvedValue(undefined);
        execAndLoop(fn, 5000);
        // Allow the initial async call to settle
        await Promise.resolve();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('calls the function again after the delay', async () => {
        const fn = jest.fn().mockResolvedValue(undefined);
        execAndLoop(fn, 1000);
        await Promise.resolve();
        expect(fn).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1000);
        await Promise.resolve();
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not throw when the function rejects (stopOnError omitted)', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('oops'));
        await expect(execAndLoop(fn, 1000)).resolves.not.toThrow();
    });

    it('propagates the error when stopOnError is true and the function rejects', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('critical failure'));
        await expect(execAndLoop(fn, 1000, true)).rejects.toThrow('critical failure');
    });
});
