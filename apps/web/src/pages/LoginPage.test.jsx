import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../auth/AuthContext.jsx';
import { LoginPage } from './LoginPage.jsx';

const json = (status, body) => ({ ok: status < 400, status, json: async () => body });

function setup(registerResponse) {
  globalThis.fetch = vi.fn(async (url) =>
    url.startsWith('/api/auth/register') ? registerResponse : json(401, { error: 'Please log in' }),
  );
  render(
    <MantineProvider>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>,
  );
  return userEvent.setup();
}

async function openCreateProfile(user) {
  await user.click(screen.getByRole('button', { name: 'Create an HR profile' }));
}

const field = (label) => screen.getByLabelText(label, { selector: 'input' });

describe('Creating an HR profile from the login page', () => {
  it('validates the email, password length and confirmation before calling the API', async () => {
    const user = setup(json(201, {}));
    await openCreateProfile(user);

    await user.type(field(/work email/i), 'nope');
    await user.type(field(/^password/i), 'short');
    await user.type(field(/confirm password/i), 'other');
    await user.click(screen.getByRole('button', { name: 'Create profile' }));

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalledWith('/api/auth/register', expect.anything());
  });

  it('submits a valid profile', async () => {
    const user = setup(json(201, { email: 'new@acme.test' }));
    await openCreateProfile(user);

    await user.type(field(/work email/i), 'New@Acme.test');
    await user.type(field(/^password/i), 'long enough pw');
    await user.type(field(/confirm password/i), 'long enough pw');
    await user.click(screen.getByRole('button', { name: 'Create profile' }));

    const call = globalThis.fetch.mock.calls.find(([url]) => url === '/api/auth/register');
    expect(JSON.parse(call[1].body)).toEqual({
      email: 'new@acme.test',
      password: 'long enough pw',
    });
  });

  it('shows a taken email next to the email field', async () => {
    const user = setup(json(409, { error: 'An HR profile with this email already exists' }));
    await openCreateProfile(user);

    await user.type(field(/work email/i), 'hr@acme.test');
    await user.type(field(/^password/i), 'long enough pw');
    await user.type(field(/confirm password/i), 'long enough pw');
    await user.click(screen.getByRole('button', { name: 'Create profile' }));

    expect(
      await screen.findByText('An HR profile with this email already exists'),
    ).toBeInTheDocument();
  });
});
