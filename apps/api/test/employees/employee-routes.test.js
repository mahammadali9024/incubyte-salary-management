import { beforeEach, describe, expect, it } from 'vitest';
import { anEmployee, fixedClock } from '../fixtures.js';
import { loggedInApi } from '../http.js';

describe('/api/employees', () => {
  let api;

  beforeEach(async () => {
    api = await loggedInApi({ clock: fixedClock('2026-10-15') });
  });

  const create = (overrides) => api.post('/api/employees').send(anEmployee(overrides));

  it('creates an employee and returns it with its location', async () => {
    const res = await create();

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/employees/${res.body.id}`);
    expect(res.body).toMatchObject({
      fullName: 'Asha Rao',
      currency: 'INR',
      annualSalaryUsd: 21_600,
    });
  });

  it('returns field-level errors for invalid input', async () => {
    const res = await create({ email: 'nope', annualSalary: -1 });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.details)).toEqual(
      expect.arrayContaining(['email', 'annualSalary']),
    );
  });

  it('returns 409 for a duplicate email', async () => {
    await create();

    expect((await create()).status).toBe(409);
  });

  it('lists employees with paging and filters from the query string', async () => {
    await create({ email: 'a@acme.test', country: 'India' });
    await create({ email: 'b@acme.test', country: 'Germany' });

    const res = await api.get('/api/employees').query({ country: 'Germany', pageSize: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, pageSize: 10 });
    expect(res.body.items[0].email).toBe('b@acme.test');
  });

  it('rejects an unknown filter value', async () => {
    expect((await api.get('/api/employees').query({ country: 'Atlantis' })).status).toBe(400);
  });

  it('updates an employee and exposes the salary history', async () => {
    const { body: created } = await create();

    const updated = await api
      .put(`/api/employees/${created.id}`)
      .send({ ...anEmployee({ annualSalary: 2_000_000 }), salaryEffectiveDate: '2026-11-01' });
    const history = await api.get(`/api/employees/${created.id}/salary-history`);

    expect(updated.status).toBe(200);
    expect(history.body.map((c) => [c.annualSalary, c.effectiveDate])).toEqual([
      [2_000_000, '2026-11-01'],
      [1_800_000, '2023-04-01'],
    ]);
  });

  it('deletes an employee', async () => {
    const { body: created } = await create();

    expect((await api.delete(`/api/employees/${created.id}`)).status).toBe(204);
    expect((await api.get(`/api/employees/${created.id}`)).status).toBe(404);
  });

  it.each([
    ['GET', 'get'],
    ['PUT', 'put'],
    ['DELETE', 'delete'],
  ])('returns 404 for %s on an unknown employee', async (_label, method) => {
    const res = await api[method]('/api/employees/999').send(anEmployee());

    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-numeric id', async () => {
    expect((await api.get('/api/employees/abc')).status).toBe(400);
  });
});
