import { describe, it, expect } from 'vitest';
import { safeFunc } from '../src/safe';
import { ChronaryError, NotFoundError, ValidationError } from '@chronary/sdk';

describe('safeFunc', () => {
  it('wraps successful result', async () => {
    const fn = safeFunc(async () => ({ id: 'cal_123' }));
    const result = await fn({});
    expect(result).toEqual({ result: { id: 'cal_123' }, isError: false });
  });

  it('normalizes undefined/void to { success: true }', async () => {
    const fn = safeFunc(async () => undefined);
    const result = await fn({});
    expect(result).toEqual({ result: { success: true }, isError: false });
  });

  it('wraps ChronaryError with name and message', async () => {
    const fn = safeFunc(async () => { throw new NotFoundError('Calendar not found'); });
    const result = await fn({});
    expect(result.isError).toBe(true);
    expect(result.result).toBe('NotFoundError: Calendar not found');
  });

  it('wraps ValidationError', async () => {
    const fn = safeFunc(async () => { throw new ValidationError('Invalid input', 422); });
    const result = await fn({});
    expect(result.isError).toBe(true);
    expect(result.result).toContain('ValidationError');
  });

  it('wraps generic Error', async () => {
    const fn = safeFunc(async () => { throw new Error('network down'); });
    const result = await fn({});
    expect(result.isError).toBe(true);
    expect(result.result).toBe('Error: network down');
  });

  it('wraps non-Error throws', async () => {
    const fn = safeFunc(async () => { throw 'string error'; });
    const result = await fn({});
    expect(result.isError).toBe(true);
    expect(result.result).toBe('Error: string error');
  });
});
