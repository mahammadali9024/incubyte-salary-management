import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';

const employee = {
  id: 1,
  fullName: 'Asha Rao',
  email: 'asha@acme.test',
  jobTitle: 'Designer',
  department: 'Design',
  country: 'India',
  currency: 'INR',
  employmentType: 'Full-time',
  joiningDate: '2023-04-01',
  annualSalary: 1800000,
  annualSalaryUsd: 21600,
};

function mockApi() {
  let loggedIn = false;
  const calls = [];
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    calls.push(`${init.method ?? 'GET'} ${url}`);
    const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
    if (url.startsWith('/api/auth/me'))
      return loggedIn
        ? json(200, { email: 'hr@acme.test' })
        : json(401, { error: 'Please log in' });
    if (url.startsWith('/api/auth/login')) {
      loggedIn = true;
      return json(200, { email: 'hr@acme.test' });
    }
    if (url.startsWith('/api/employees'))
      return json(200, { items: [employee], total: 1, page: 1, pageSize: 25 });
    return json(404, {});
  });
  return calls;
}

describe('App', () => {
  it('logs in and shows the employee list, fetching it only once or twice', async () => {
    const calls = mockApi();
    const user = userEvent.setup();
    render(
      <MantineProvider>
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={['/']}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </MantineProvider>,
    );

    await user.type(await screen.findByLabelText(/email/i), 'hr@acme.test');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'pw');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Asha Rao', {}, { timeout: 3000 })).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 500));
    expect(calls.filter((c) => c.includes('/api/employees')).length).toBeLessThan(5);
  });
});
