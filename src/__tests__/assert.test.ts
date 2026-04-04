import { assertCond, AssertError } from '../assert';

describe('AssertError', () => {
    it('is an instance of Error', () => {
        const err = new AssertError('test');
        expect(err).toBeInstanceOf(Error);
    });

    it('has name "AssertError"', () => {
        const err = new AssertError('test');
        expect(err.name).toBe('AssertError');
    });

    it('carries the provided message', () => {
        const err = new AssertError('something went wrong');
        expect(err.message).toBe('something went wrong');
    });
});

describe('assertCond', () => {
    it('does not throw when condition is true', () => {
        expect(() => assertCond(true)).not.toThrow();
    });

    it('throws AssertError when condition is false', () => {
        expect(() => assertCond(false)).toThrow(AssertError);
    });

    it('throws with default message when no message is provided', () => {
        expect(() => assertCond(false)).toThrow('Assertion failed');
    });

    it('includes the custom message when condition is false', () => {
        expect(() => assertCond(false, 'custom message')).toThrow('custom message');
    });

    it('does not include extra text when message is an empty string', () => {
        let thrownError: AssertError | undefined;
        try {
            assertCond(false, '');
        } catch (e) {
            thrownError = e as AssertError;
        }
        expect(thrownError).toBeDefined();
        expect(thrownError!.message).toBe('Assertion failed');
    });

    it('throws AssertError (not a plain Error) when condition is false', () => {
        let thrownError: unknown;
        try {
            assertCond(false, 'check type');
        } catch (e) {
            thrownError = e;
        }
        expect(thrownError).toBeInstanceOf(AssertError);
    });
});
