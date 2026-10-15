import { beforeEach, describe, expect, it } from 'vitest';
import { anEmployee } from '../fixtures.js';
import { loggedInApi } from '../http.js';

describe('/api/insights', () => {
  let api;

  beforeEach(async () => {
    api = await loggedInApi();
    await api.post('/api/employees').send(anEmployee({ email: 'a@acme.test', annualSalary: 1_000_000 }));
    await api.post('/api/employees').send(anEmployee({ email: 'b@acme.test', annualSalary: 3_000_000 }));
  });

  it.each(['overview', 'by-country', 'by-department'])('serves %s', async (path) => {
    const res = await api.get(`/api/insights/${path}`);

    expect(res.status).toBe(200);
  });

  it('serves job-title averages for a country', async () => {
    const res = await api.get('/api/insights/by-job-title').query({ country: 'India' });

    expect(res.body).toEqual([expect.objectContaining({ jobTitle: 'Software Engineer', average: 2_000_000 })]);
  });

  it('serves a distribution with the requested number of bins', async () => {
    const res = await api.get('/api/insights/distribution').query({ country: 'India', bins: 4 });

    expect(res.body).toHaveLength(4);
  });

  it('requires a valid country where one is needed', async () => {
    expect((await api.get('/api/insights/by-job-title')).status).toBe(400);
    expect((await api.get('/api/insights/distribution').query({ country: 'Atlantis' })).status).toBe(400);
  });
});
