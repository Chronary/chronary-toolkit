import { describe, it, expect } from 'vitest';
import { safeFunc } from '../src/safe';
import { ChronaryError, NotFoundError, ValidationError, PlanRequiredError, QuotaExceededError } from '@chronary/sdk';

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

  it('wraps ChronaryError as a structured payload', async () => {
    const fn = safeFunc(async () => { throw new NotFoundError('Calendar not found'); });
    const result = await fn({});
    expect(result.isError).toBe(true);
    expect(result.result).toEqual({ error: 'not_found', message: 'Calendar not found' });
  });

  it('wraps ValidationError', async () => {
    const fn = safeFunc(async () => { throw new ValidationError('Invalid input', 422); });
    const result = await fn({});
    expect(result.isError).toBe(true);
    expect(result.result).toEqual({ error: 'validation_error', message: 'Invalid input' });
  });

  it('falls back to the class name when there is no error type', async () => {
    const fn = safeFunc(async () => { throw new ChronaryError('boom', 500); });
    const result = await fn({});
    expect(result.result).toEqual({ error: 'ChronaryError', message: 'boom' });
  });

  it('keeps upgrade_url and plan fields on plan_required errors', async () => {
    const fn = safeFunc(async () => {
      throw new PlanRequiredError('Pro required', 'req_1', undefined, {
        required_plan: 'pro', feature: 'temporal_hold',
        upgrade_url: 'https://console.test/settings/billing', docs_url: 'https://docs.test/plans',
      });
    });
    const result = await fn({});
    expect(result.isError).toBe(true);
    expect(result.result).toEqual({
      error: 'plan_required',
      message: 'Pro required',
      upgrade_url: 'https://console.test/settings/billing',
      docs_url: 'https://docs.test/plans',
      required_plan: 'pro',
      feature: 'temporal_hold',
    });
  });

  it('keeps metric, limit and upgrade_url on quota_exceeded errors', async () => {
    const fn = safeFunc(async () => {
      throw new QuotaExceededError('Quota hit', 'req_2', undefined, {
        metric: 'api_calls', limit: 50000, upgrade_url: 'https://console.test/settings/billing',
      });
    });
    const result = await fn({});
    expect(result.result).toEqual({
      error: 'quota_exceeded',
      message: 'Quota hit',
      upgrade_url: 'https://console.test/settings/billing',
      metric: 'api_calls',
      limit: 50000,
    });
  });

  it('wraps generic Error', async () => {
    const fn = safeFunc(async () => { throw new Error('network down'); });
    const result = await fn({});
    expect(result.isError).toBe(true);
    expect(result.result).toEqual({ error: 'error', message: 'network down' });
  });

  it('wraps non-Error throws', async () => {
    const fn = safeFunc(async () => { throw 'string error'; });
    const result = await fn({});
    expect(result.isError).toBe(true);
    expect(result.result).toEqual({ error: 'error', message: 'string error' });
  });
});
